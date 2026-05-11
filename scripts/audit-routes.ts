import path from "node:path"
import {
  LOGS_DIR,
  SITE_URL,
  buildRouteInventory,
  fetchSnapshot,
  mapLimit,
  toCsv,
  writeTextFile,
} from "./_auditCommon"

interface RouteStatusRow {
  path: string
  url: string
  type: string
  expected_content: string
  indexable_expected: boolean
  status: number
  ok: boolean
  content_type: string
  html_like: boolean
  xml_like: boolean
  json_like: boolean
  body_length: number
  blank_like: boolean
  final_url: string
  error: string
}

function isHtmlLike(contentType: string): boolean {
  return /text\/html|application\/xhtml\+xml/i.test(contentType)
}

function isXmlLike(contentType: string): boolean {
  return /application\/xml|text\/xml/i.test(contentType)
}

function isJsonLike(contentType: string): boolean {
  return /application\/json|text\/json/i.test(contentType)
}

async function main(): Promise<void> {
  console.log("[audit-routes] Building full route inventory...")
  const routes = await buildRouteInventory()
  console.log(`[audit-routes] Checking ${routes.length} routes...`)

  const snapshots = await mapLimit(routes, 12, async (route) => {
    const snapshot = await fetchSnapshot(route.url)
    const contentType = snapshot.contentType || ""
    const htmlLike = isHtmlLike(contentType)
    const xmlLike = isXmlLike(contentType)
    const jsonLike = isJsonLike(contentType)
    const bodyLength = snapshot.body.length

    const row: RouteStatusRow = {
      path: route.path,
      url: route.url,
      type: route.type,
      expected_content: route.expectedContent,
      indexable_expected: route.indexableExpected,
      status: snapshot.status,
      ok: snapshot.ok,
      content_type: contentType,
      html_like: htmlLike,
      xml_like: xmlLike,
      json_like: jsonLike,
      body_length: bodyLength,
      blank_like: bodyLength < 500 && route.expectedContent === "html",
      final_url: snapshot.finalUrl,
      error: snapshot.error || "",
    }
    return row
  })

  const non200 = snapshots.filter((r) => r.status !== 200)
  const htmlExpectedButNonHtml = snapshots.filter(
    (r) => r.expected_content === "html" && r.status === 200 && !r.html_like
  )
  const blankLikePages = snapshots.filter((r) => r.blank_like)
  const apiInternalIndexabilityRisk = snapshots.filter(
    (r) => r.type === "api_internal" && r.status === 200 && r.indexable_expected
  )

  const summary = {
    generated_at: new Date().toISOString(),
    site_url: SITE_URL,
    total_routes_checked: snapshots.length,
    non_200_count: non200.length,
    html_expected_but_non_html_count: htmlExpectedButNonHtml.length,
    blank_like_html_count: blankLikePages.length,
    api_internal_indexability_risk_count: apiInternalIndexabilityRisk.length,
    examples: {
      non_200: non200.slice(0, 40).map((r) => ({ path: r.path, status: r.status, error: r.error })),
      html_expected_but_non_html: htmlExpectedButNonHtml
        .slice(0, 40)
        .map((r) => ({ path: r.path, content_type: r.content_type })),
      blank_like_html: blankLikePages.slice(0, 40).map((r) => ({ path: r.path, body_length: r.body_length })),
    },
  }

  const txt = [
    "ROUTE AUDIT SUMMARY",
    `Generated: ${summary.generated_at}`,
    `Site: ${SITE_URL}`,
    "",
    `Total routes checked: ${summary.total_routes_checked}`,
    `Non-200 routes: ${summary.non_200_count}`,
    `HTML expected but non-HTML: ${summary.html_expected_but_non_html_count}`,
    `Blank-like HTML pages: ${summary.blank_like_html_count}`,
    "",
    "Top non-200 examples:",
    ...summary.examples.non_200.slice(0, 15).map((r) => `- ${r.path} -> ${r.status} ${r.error ? `(${r.error})` : ""}`),
  ].join("\n")

  const csvPath = path.resolve(LOGS_DIR, "seo_route_status.csv")
  const jsonPath = path.resolve(LOGS_DIR, "seo_route_status_summary.json")
  const txtPath = path.resolve(LOGS_DIR, "seo_route_status_summary.txt")

  await writeTextFile(
    csvPath,
    toCsv(
      [
        "path",
        "url",
        "type",
        "expected_content",
        "indexable_expected",
        "status",
        "ok",
        "content_type",
        "html_like",
        "xml_like",
        "json_like",
        "body_length",
        "blank_like",
        "final_url",
        "error",
      ],
      snapshots as unknown as Record<string, unknown>[]
    )
  )
  await writeTextFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  await writeTextFile(txtPath, `${txt}\n`)

  console.log(`[audit-routes] Wrote ${csvPath}`)
  console.log(`[audit-routes] Wrote ${jsonPath}`)
  console.log(`[audit-routes] Wrote ${txtPath}`)
}

main().catch((error) => {
  console.error("[audit-routes] Failed:", error)
  process.exitCode = 1
})

