import path from "node:path"
import {
  LOGS_DIR,
  SITE_URL,
  buildRouteInventory,
  fetchSnapshot,
  mapLimit,
  normalizePath,
  removeTrailingSlash,
  toCsv,
  writeTextFile,
} from "./_auditCommon"

interface SeoRow {
  path: string
  url: string
  status: number
  contentType: string
  title: string
  titleLength: number
  metaDescription: string
  descriptionLength: number
  canonical: string
  h1Count: number
  ogTitle: string
  ogDescription: string
  ogUrl: string
  twitterCard: string
  twitterTitle: string
  twitterDescription: string
  robotsMeta: string
  hasNoindex: boolean
  hasNofollow: boolean
  jsonLdCount: number
  htmlLength: number
  missingFields: string[]
  canonicalMismatch: boolean
  canonicalInvalidDomain: boolean
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
}

function extractTagContent(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const match = html.match(regex)
  return match ? decodeHtml(match[1]) : ""
}

function extractMetaContent(html: string, key: string, mode: "name" | "property" = "name"): string {
  const regex = new RegExp(
    `<meta[^>]*${mode}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  )
  const altRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${mode}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i"
  )
  const match = html.match(regex) || html.match(altRegex)
  return match ? decodeHtml(match[1]) : ""
}

function extractCanonical(html: string): string {
  const regex = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
  const altRegex = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i
  const match = html.match(regex) || html.match(altRegex)
  return match ? match[1].trim() : ""
}

function countTag(html: string, tagPattern: RegExp): number {
  const matches = html.match(tagPattern)
  return matches ? matches.length : 0
}

function buildSeoRow(pathname: string, url: string, status: number, contentType: string, html: string): SeoRow {
  const title = extractTagContent(html, "title")
  const metaDescription = extractMetaContent(html, "description")
  const canonical = extractCanonical(html)
  const ogTitle = extractMetaContent(html, "og:title", "property")
  const ogDescription = extractMetaContent(html, "og:description", "property")
  const ogUrl = extractMetaContent(html, "og:url", "property")
  const twitterCard = extractMetaContent(html, "twitter:card")
  const twitterTitle = extractMetaContent(html, "twitter:title")
  const twitterDescription = extractMetaContent(html, "twitter:description")
  const robotsMeta = extractMetaContent(html, "robots")
  const h1Count = countTag(html, /<h1\b[^>]*>/gi)
  const jsonLdCount = countTag(
    html,
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
  )

  const hasNoindex = /\bnoindex\b/i.test(robotsMeta)
  const hasNofollow = /\bnofollow\b/i.test(robotsMeta)
  const canonicalInvalidDomain = canonical ? !canonical.startsWith(SITE_URL) : false
  const expectedCanonical = removeTrailingSlash(url)
  const actualCanonical = removeTrailingSlash(canonical || "")
  const canonicalMismatch =
    !!canonical &&
    !canonicalInvalidDomain &&
    removeTrailingSlash(normalizePath(actualCanonical.replace(SITE_URL, ""))) !==
      removeTrailingSlash(normalizePath(expectedCanonical.replace(SITE_URL, "")))

  const missingFields: string[] = []
  if (!title) missingFields.push("title")
  if (!metaDescription) missingFields.push("meta_description")
  if (!canonical) missingFields.push("canonical")
  if (h1Count === 0) missingFields.push("h1")
  if (!ogTitle) missingFields.push("og:title")
  if (!ogDescription) missingFields.push("og:description")
  if (!ogUrl) missingFields.push("og:url")
  if (!twitterCard) missingFields.push("twitter:card")
  if (!twitterTitle) missingFields.push("twitter:title")
  if (!twitterDescription) missingFields.push("twitter:description")
  if (jsonLdCount === 0) missingFields.push("jsonld")

  return {
    path: pathname,
    url,
    status,
    contentType,
    title,
    titleLength: title.length,
    metaDescription,
    descriptionLength: metaDescription.length,
    canonical,
    h1Count,
    ogTitle,
    ogDescription,
    ogUrl,
    twitterCard,
    twitterTitle,
    twitterDescription,
    robotsMeta,
    hasNoindex,
    hasNofollow,
    jsonLdCount,
    htmlLength: html.length,
    missingFields,
    canonicalMismatch,
    canonicalInvalidDomain,
  }
}

function duplicateRows(rows: SeoRow[], field: keyof SeoRow, type: string): Array<Record<string, unknown>> {
  const groups = new Map<string, SeoRow[]>()
  for (const row of rows) {
    const value = String(row[field] || "").trim()
    if (!value) continue
    if (!groups.has(value)) groups.set(value, [])
    groups.get(value)!.push(row)
  }
  return Array.from(groups.entries())
    .filter(([, list]) => list.length > 1)
    .map(([value, list]) => ({
      duplicate_type: type,
      value,
      count: list.length,
      routes: list.map((r) => r.path).join(" | "),
    }))
    .sort((a, b) => Number(b.count) - Number(a.count))
}

async function main(): Promise<void> {
  console.log("[audit-seo] Building route inventory...")
  const routes = await buildRouteInventory()
  const htmlRoutes = routes.filter((r) => r.indexableExpected && r.expectedContent === "html")
  console.log(`[audit-seo] Auditing ${htmlRoutes.length} indexable HTML routes...`)

  const snapshots = await mapLimit(htmlRoutes, 10, async (route) => {
    const snapshot = await fetchSnapshot(route.url)
    return { route, snapshot }
  })

  const rows: SeoRow[] = snapshots.map(({ route, snapshot }) =>
    buildSeoRow(route.path, route.url, snapshot.status, snapshot.contentType, snapshot.body || "")
  )

  const non200 = rows.filter((r) => r.status !== 200)
  const missingMetadataRows = rows.filter((r) => r.missingFields.length > 0 || r.status !== 200)
  const canonicalIssues = rows.filter((r) => r.canonicalMismatch || r.canonicalInvalidDomain || !r.canonical)
  const noindexIssues = rows.filter((r) => r.hasNoindex || r.hasNofollow)
  const blankLike = rows.filter((r) => r.htmlLength < 1500)
  const titleLengthIssues = rows.filter((r) => r.title && (r.titleLength < 20 || r.titleLength > 70))
  const descriptionLengthIssues = rows.filter(
    (r) => r.metaDescription && (r.descriptionLength < 70 || r.descriptionLength > 180)
  )

  const duplicateTitleRows = duplicateRows(rows, "title", "duplicate_title")
  const duplicateDescriptionRows = duplicateRows(rows, "metaDescription", "duplicate_description")
  const duplicateCanonicalRows = duplicateRows(rows, "canonical", "duplicate_canonical")
  const duplicateRowsAll = [...duplicateTitleRows, ...duplicateDescriptionRows, ...duplicateCanonicalRows]

  const missingCsvRows = missingMetadataRows.map((row) => ({
    path: row.path,
    url: row.url,
    status: row.status,
    missing_fields: row.missingFields.join("|"),
    title: row.title,
    meta_description: row.metaDescription,
    canonical: row.canonical,
    h1_count: row.h1Count,
    og_title: row.ogTitle,
    twitter_title: row.twitterTitle,
    jsonld_count: row.jsonLdCount,
    canonical_mismatch: row.canonicalMismatch,
    canonical_invalid_domain: row.canonicalInvalidDomain,
    has_noindex: row.hasNoindex,
  }))

  const summary = {
    generated_at: new Date().toISOString(),
    site_url: SITE_URL,
    routes_audited: htmlRoutes.length,
    status_non_200_count: non200.length,
    missing_metadata_count: missingMetadataRows.length,
    canonical_issue_count: canonicalIssues.length,
    noindex_or_nofollow_count: noindexIssues.length,
    likely_blank_html_count: blankLike.length,
    duplicate_title_count: duplicateTitleRows.length,
    duplicate_description_count: duplicateDescriptionRows.length,
    duplicate_canonical_count: duplicateCanonicalRows.length,
    title_length_issue_count: titleLengthIssues.length,
    description_length_issue_count: descriptionLengthIssues.length,
    critical_blockers: {
      non_200_routes: non200.slice(0, 30).map((r) => ({ path: r.path, status: r.status })),
      missing_title_or_description_or_canonical: missingMetadataRows
        .filter((r) => r.missingFields.some((f) => ["title", "meta_description", "canonical"].includes(f)))
        .slice(0, 50)
        .map((r) => ({ path: r.path, missing: r.missingFields })),
      canonical_invalid_or_mismatch: canonicalIssues.slice(0, 50).map((r) => ({
        path: r.path,
        canonical: r.canonical,
        mismatch: r.canonicalMismatch,
        invalid_domain: r.canonicalInvalidDomain,
      })),
    },
    high_priority: {
      noindex_or_nofollow: noindexIssues.slice(0, 30).map((r) => ({ path: r.path, robots: r.robotsMeta })),
      duplicate_title_examples: duplicateTitleRows.slice(0, 30),
      duplicate_description_examples: duplicateDescriptionRows.slice(0, 30),
    },
    medium_priority: {
      missing_og_or_twitter_or_h1_or_jsonld: missingMetadataRows
        .filter((r) =>
          r.missingFields.some((f) => ["h1", "og:title", "og:description", "og:url", "twitter:card", "twitter:title", "twitter:description", "jsonld"].includes(f))
        )
        .slice(0, 80)
        .map((r) => ({ path: r.path, missing: r.missingFields })),
      title_length_examples: titleLengthIssues.slice(0, 40).map((r) => ({ path: r.path, length: r.titleLength })),
      description_length_examples: descriptionLengthIssues
        .slice(0, 40)
        .map((r) => ({ path: r.path, length: r.descriptionLength })),
    },
  }

  const readiness =
    non200.length === 0 &&
    canonicalIssues.length === 0 &&
    noindexIssues.length === 0 &&
    missingMetadataRows.filter((r) =>
      r.missingFields.some((f) => ["title", "meta_description", "canonical"].includes(f))
    ).length === 0

  const summaryTxt = [
    "SEO AUDIT SUMMARY",
    `Generated: ${summary.generated_at}`,
    `Site: ${SITE_URL}`,
    "",
    `Routes audited (indexable HTML): ${summary.routes_audited}`,
    `Non-200 routes: ${summary.status_non_200_count}`,
    `Missing metadata rows: ${summary.missing_metadata_count}`,
    `Canonical issues: ${summary.canonical_issue_count}`,
    `Noindex/nofollow issues: ${summary.noindex_or_nofollow_count}`,
    `Duplicate title groups: ${summary.duplicate_title_count}`,
    `Duplicate description groups: ${summary.duplicate_description_count}`,
    `Duplicate canonical groups: ${summary.duplicate_canonical_count}`,
    "",
    `Readiness for backlink scaling: ${readiness ? "READY (technical baseline OK)" : "NOT READY (fix critical blockers first)"}`,
    "",
    "Top critical blockers:",
    ...summary.critical_blockers.non_200_routes.slice(0, 10).map((r) => `- ${r.path} -> ${r.status}`),
    ...summary.critical_blockers.missing_title_or_description_or_canonical
      .slice(0, 10)
      .map((r) => `- ${r.path} missing: ${r.missing.join(", ")}`),
  ].join("\n")

  const jsonPath = path.resolve(LOGS_DIR, "seo_audit_summary.json")
  const txtPath = path.resolve(LOGS_DIR, "seo_audit_summary.txt")
  const missingCsvPath = path.resolve(LOGS_DIR, "seo_missing_metadata.csv")
  const duplicatesCsvPath = path.resolve(LOGS_DIR, "seo_duplicate_metadata.csv")

  await writeTextFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  await writeTextFile(txtPath, `${summaryTxt}\n`)
  await writeTextFile(
    missingCsvPath,
    toCsv(
      [
        "path",
        "url",
        "status",
        "missing_fields",
        "title",
        "meta_description",
        "canonical",
        "h1_count",
        "og_title",
        "twitter_title",
        "jsonld_count",
        "canonical_mismatch",
        "canonical_invalid_domain",
        "has_noindex",
      ],
      missingCsvRows
    )
  )
  await writeTextFile(
    duplicatesCsvPath,
    toCsv(["duplicate_type", "value", "count", "routes"], duplicateRowsAll)
  )

  console.log(`[audit-seo] Wrote ${jsonPath}`)
  console.log(`[audit-seo] Wrote ${txtPath}`)
  console.log(`[audit-seo] Wrote ${missingCsvPath}`)
  console.log(`[audit-seo] Wrote ${duplicatesCsvPath}`)
}

main().catch((error) => {
  console.error("[audit-seo] Failed:", error)
  process.exitCode = 1
})

