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

interface BrokenLinkRow {
  source_path: string
  link_href: string
  target_path: string
  link_type: "internal_route" | "internal_anchor"
  status: number
  reason: string
}

interface LinkRef {
  sourcePath: string
  href: string
  targetPath: string
  linkType: "internal_route" | "internal_anchor"
  anchorId?: string
}

function extractHrefs(html: string): string[] {
  const hrefs: string[] = []
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1].trim())
  }
  return hrefs
}

function extractIds(html: string): Set<string> {
  const ids = new Set<string>()
  const regex = /\sid=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1].trim())
  }
  return ids
}

function isInternalHref(href: string): boolean {
  if (!href) return false
  if (href.startsWith("#")) return true
  if (href.startsWith("/")) return true
  if (href.startsWith(SITE_URL)) return true
  return false
}

function hrefToPath(href: string): string {
  if (href.startsWith(SITE_URL)) return normalizePath(href.replace(SITE_URL, ""))
  if (href.startsWith("/")) return normalizePath(href)
  return href
}

async function main(): Promise<void> {
  console.log("[audit-links] Building route inventory...")
  const routes = await buildRouteInventory()
  const pagesToCrawl = routes.filter((r) => r.indexableExpected && r.expectedContent === "html")
  console.log(`[audit-links] Crawling ${pagesToCrawl.length} pages for internal links...`)

  const crawled = await mapLimit(pagesToCrawl, 8, async (route) => {
    const snapshot = await fetchSnapshot(route.url)
    const ids = extractIds(snapshot.body || "")
    const hrefs = extractHrefs(snapshot.body || "")
    return { route, snapshot, ids, hrefs }
  })

  const linkRefs: LinkRef[] = []
  const brokenRows: BrokenLinkRow[] = []

  for (const { route, snapshot, ids, hrefs } of crawled) {
    if (snapshot.status !== 200 || !/text\/html|application\/xhtml\+xml/i.test(snapshot.contentType)) continue

    for (const href of hrefs) {
      if (!isInternalHref(href)) continue
      if (href.startsWith("javascript:")) continue
      if (href.startsWith("mailto:") || href.startsWith("tel:")) continue

      if (href.startsWith("#")) {
        const anchorId = href.slice(1)
        if (!anchorId) continue
        const anchorOk = ids.has(anchorId)
        if (!anchorOk) {
          brokenRows.push({
            source_path: route.path,
            link_href: href,
            target_path: route.path,
            link_type: "internal_anchor",
            status: 0,
            reason: `Missing anchor target id="${anchorId}"`,
          })
        }
        linkRefs.push({
          sourcePath: route.path,
          href,
          targetPath: route.path,
          linkType: "internal_anchor",
          anchorId,
        })
        continue
      }

      const pathValue = hrefToPath(href)
      linkRefs.push({
        sourcePath: route.path,
        href,
        targetPath: pathValue,
        linkType: "internal_route",
      })
    }
  }

  const uniqueTargets = Array.from(
    new Set(
      linkRefs
        .filter((l) => l.linkType === "internal_route")
        .map((l) => removeTrailingSlash(l.targetPath.split("#")[0] || "/"))
    )
  )

  console.log(`[audit-links] Validating ${uniqueTargets.length} unique internal link targets...`)
  const targetStatus = new Map<string, { status: number; error?: string }>()

  await mapLimit(uniqueTargets, 12, async (targetPath) => {
    const absolute = `${SITE_URL}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`
    const snapshot = await fetchSnapshot(absolute)
    targetStatus.set(targetPath, {
      status: snapshot.status,
      error: snapshot.error,
    })
  })

  for (const link of linkRefs.filter((l) => l.linkType === "internal_route")) {
    const targetNormalized = removeTrailingSlash((link.targetPath.split("#")[0] || "/").trim()) || "/"
    const status = targetStatus.get(targetNormalized)
    if (!status) continue
    if (status.status === 0 || status.status >= 400) {
      brokenRows.push({
        source_path: link.sourcePath,
        link_href: link.href,
        target_path: targetNormalized,
        link_type: "internal_route",
        status: status.status,
        reason: status.error || `HTTP ${status.status}`,
      })
    }
  }

  const summary = {
    generated_at: new Date().toISOString(),
    site_url: SITE_URL,
    pages_crawled: pagesToCrawl.length,
    internal_links_found: linkRefs.length,
    unique_internal_targets_checked: uniqueTargets.length,
    broken_links_count: brokenRows.length,
    broken_anchor_count: brokenRows.filter((r) => r.link_type === "internal_anchor").length,
    broken_route_count: brokenRows.filter((r) => r.link_type === "internal_route").length,
    examples: brokenRows.slice(0, 80),
  }

  const csvPath = path.resolve(LOGS_DIR, "seo_broken_links.csv")
  const jsonPath = path.resolve(LOGS_DIR, "seo_broken_links_summary.json")
  const txtPath = path.resolve(LOGS_DIR, "seo_broken_links_summary.txt")

  await writeTextFile(
    csvPath,
    toCsv(
      ["source_path", "link_href", "target_path", "link_type", "status", "reason"],
      brokenRows as unknown as Record<string, unknown>[]
    )
  )
  await writeTextFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  await writeTextFile(
    txtPath,
    [
      "LINK AUDIT SUMMARY",
      `Generated: ${summary.generated_at}`,
      `Pages crawled: ${summary.pages_crawled}`,
      `Internal links found: ${summary.internal_links_found}`,
      `Unique targets checked: ${summary.unique_internal_targets_checked}`,
      `Broken links: ${summary.broken_links_count}`,
      `Broken route links: ${summary.broken_route_count}`,
      `Broken anchor links: ${summary.broken_anchor_count}`,
    ].join("\n") + "\n"
  )

  console.log(`[audit-links] Wrote ${csvPath}`)
  console.log(`[audit-links] Wrote ${jsonPath}`)
  console.log(`[audit-links] Wrote ${txtPath}`)
}

main().catch((error) => {
  console.error("[audit-links] Failed:", error)
  process.exitCode = 1
})

