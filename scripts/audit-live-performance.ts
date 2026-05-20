import path from "node:path"
import { LOGS_DIR, SITE_URL, writeTextFile } from "./_auditCommon"

interface RoutePerf {
  path: string
  url: string
  status: number
  ok: boolean
  totalMs: number
  responseBytes: number
  contentType: string
  error?: string
}

const LIVE_ROUTES = [
  "/",
  "/states",
  "/states/fl",
  "/states/ca",
  "/games/powerball",
  "/games/mega-millions",
] as const

async function measureRoute(routePath: string): Promise<RoutePerf> {
  const url = `${SITE_URL}${routePath}`
  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "winningnumbers-live-performance-audit/1.0",
      },
      redirect: "follow",
    })

    const text = await response.text()
    const totalMs = Date.now() - startedAt
    const responseBytes = Buffer.byteLength(text, "utf8")

    return {
      path: routePath,
      url,
      status: response.status,
      ok: response.ok,
      totalMs,
      responseBytes,
      contentType: response.headers.get("content-type") || "",
    }
  } catch (error) {
    return {
      path: routePath,
      url,
      status: 0,
      ok: false,
      totalMs: Date.now() - startedAt,
      responseBytes: 0,
      contentType: "",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function toMs(value: number): string {
  return `${value.toFixed(0)}ms`
}

function toKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)}KB`
}

async function run(): Promise<void> {
  const results = await Promise.all(LIVE_ROUTES.map((routePath) => measureRoute(routePath)))
  const slowest = [...results].sort((a, b) => b.totalMs - a.totalMs)
  const avgMs = results.length
    ? Math.round(results.reduce((acc, item) => acc + item.totalMs, 0) / results.length)
    : 0

  const lines = [
    "# Live Route Performance Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${SITE_URL}`,
    "",
    "## Route Metrics",
    ...results.map(
      (item) =>
        `- ${item.path} | status=${item.status} | time=${toMs(item.totalMs)} | size=${toKb(item.responseBytes)}${
          item.error ? ` | error=${item.error}` : ""
        }`
    ),
    "",
    "## Summary",
    `- routes_checked: ${results.length}`,
    `- successful: ${results.filter((r) => r.ok).length}`,
    `- failed: ${results.filter((r) => !r.ok).length}`,
    `- avg_time: ${toMs(avgMs)}`,
    `- slowest_route: ${slowest[0]?.path || "n/a"} (${slowest[0] ? toMs(slowest[0].totalMs) : "n/a"})`,
    "",
    "## Slowest Routes",
    ...slowest.map((item, index) => `${index + 1}. ${item.path} - ${toMs(item.totalMs)} - ${toKb(item.responseBytes)}`),
  ]

  const jsonPath = path.join(LOGS_DIR, "live_performance_audit.json")
  const textPath = path.join(LOGS_DIR, "live_performance_audit.txt")

  await writeTextFile(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: SITE_URL, results, slowest, avgMs }, null, 2))
  await writeTextFile(textPath, lines.join("\n"))

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"))
  // eslint-disable-next-line no-console
  console.log(`\nWrote ${jsonPath}`)
  // eslint-disable-next-line no-console
  console.log(`Wrote ${textPath}`)
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[audit-live-performance] failed", error)
  process.exitCode = 1
})
