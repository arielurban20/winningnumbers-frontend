import { promises as fs } from "node:fs"
import path from "node:path"
import {
  LOGS_DIR,
  writeTextFile,
} from "./_auditCommon"

interface LargeAsset {
  file: string
  bytes: number
  kb: number
}

interface SourceScan {
  clientComponents: number
  noStoreFetches: number
  imgTags: number
  nextImageUsages: number
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

async function walkFiles(dirPath: string, predicate: (p: string) => boolean): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string): Promise<void> {
    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (predicate(full)) {
        out.push(full)
      }
    }
  }
  await walk(dirPath)
  return out
}

async function getLargeAssets(nextDir: string): Promise<LargeAsset[]> {
  const assets = await walkFiles(
    nextDir,
    (p) => /\.(js|mjs|css)$/i.test(p) && !p.includes(`${path.sep}cache${path.sep}`),
  )

  const rows: LargeAsset[] = []
  for (const file of assets) {
    try {
      const stat = await fs.stat(file)
      rows.push({
        file: file.replace(process.cwd() + path.sep, ""),
        bytes: stat.size,
        kb: Number((stat.size / 1024).toFixed(2)),
      })
    } catch {
      // ignore transient file read failures
    }
  }

  rows.sort((a, b) => b.bytes - a.bytes)
  return rows
}

async function scanSource(sourceRoots: string[]): Promise<SourceScan> {
  const tsFiles: string[] = []
  for (const root of sourceRoots) {
    const files = await walkFiles(root, (p) => /\.(tsx?|jsx?)$/i.test(p))
    tsFiles.push(...files)
  }

  let clientComponents = 0
  let noStoreFetches = 0
  let imgTags = 0
  let nextImageUsages = 0

  for (const file of tsFiles) {
    let content = ""
    try {
      content = await fs.readFile(file, "utf8")
    } catch {
      continue
    }

    const trimmed = content.trimStart()
    if (trimmed.startsWith("\"use client\"") || trimmed.startsWith("'use client'")) {
      clientComponents += 1
    }

    noStoreFetches += (content.match(/cache\s*:\s*["']no-store["']/g) || []).length
    noStoreFetches += (content.match(/revalidate\s*:\s*0/g) || []).length

    imgTags += (content.match(/<img[\s>]/g) || []).length
    nextImageUsages += (content.match(/from\s+["']next\/image["']/g) || []).length
    nextImageUsages += (content.match(/<Image[\s>]/g) || []).length
  }

  return {
    clientComponents,
    noStoreFetches,
    imgTags,
    nextImageUsages,
  }
}

function severityLabel(value: number, high: number, medium: number): "high" | "medium" | "low" {
  if (value >= high) return "high"
  if (value >= medium) return "medium"
  return "low"
}

async function run(): Promise<void> {
  await ensureDir(LOGS_DIR)

  const nextDir = path.resolve(process.cwd(), ".next")
  const hasNextBuild = await fs
    .stat(nextDir)
    .then((s) => s.isDirectory())
    .catch(() => false)

  if (!hasNextBuild) {
    const missingMessage =
      "Performance audit skipped because .next build output was not found. Run `corepack pnpm run build` first."
    await writeTextFile(path.join(LOGS_DIR, "performance_audit_summary.txt"), missingMessage)
    // eslint-disable-next-line no-console
    console.log(missingMessage)
    return
  }

  const assets = await getLargeAssets(nextDir)
  const largest10 = assets.slice(0, 10)

  const sourceScan = await scanSource([
    path.resolve(process.cwd(), "app"),
    path.resolve(process.cwd(), "components"),
    path.resolve(process.cwd(), "lib"),
  ])

  const totalJs = assets
    .filter((a) => /\.(js|mjs)$/i.test(a.file))
    .reduce((acc, item) => acc + item.bytes, 0)
  const totalCss = assets
    .filter((a) => /\.css$/i.test(a.file))
    .reduce((acc, item) => acc + item.bytes, 0)

  const payloadLines = [
    "# Performance Audit Summary",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Build Artifacts",
    `- Total built JS size: ${(totalJs / 1024 / 1024).toFixed(2)} MB`,
    `- Total built CSS size: ${(totalCss / 1024 / 1024).toFixed(2)} MB`,
    `- Total JS/CSS assets scanned: ${assets.length}`,
    "",
    "## Largest Assets (Top 10)",
    ...largest10.map((item, idx) => `${idx + 1}. ${item.file} — ${item.kb} KB`),
    "",
    "## Source-Level Risk Signals",
    `- "use client" components: ${sourceScan.clientComponents} (${severityLabel(sourceScan.clientComponents, 160, 90)})`,
    `- no-store / revalidate:0 fetch signals: ${sourceScan.noStoreFetches} (${severityLabel(sourceScan.noStoreFetches, 30, 12)})`,
    `- raw <img> tag usages: ${sourceScan.imgTags} (${severityLabel(sourceScan.imgTags, 40, 15)})`,
    `- next/image usages: ${sourceScan.nextImageUsages}`,
    "",
    "## Findings",
    `- Large JS chunks: ${largest10.filter((a) => /\.m?js$/i.test(a.file) && a.kb > 250).length} assets above 250KB.`,
    `- Image optimization risk: ${sourceScan.imgTags > 0 ? "Raw <img> tags found (review these for optimization)." : "No raw <img> tags found in scanned TS/JS source."}`,
    `- Caching pressure risk: ${sourceScan.noStoreFetches > 0 ? "Found no-store/revalidate:0 fetch patterns; verify they are necessary." : "No no-store/revalidate:0 patterns detected in scanned TS/JS source."}`,
    "",
    "## Lighthouse",
    "- If Lighthouse CLI is available, run:",
    "  - `npx lighthouse https://winningnumbers.us --preset=desktop --output=html --output-path=logs/lighthouse-desktop.html`",
    "  - `npx lighthouse https://winningnumbers.us --preset=perf --emulated-form-factor=mobile --output=html --output-path=logs/lighthouse-mobile.html`",
  ]

  const summaryPath = path.join(LOGS_DIR, "performance_audit_summary.txt")
  await writeTextFile(summaryPath, payloadLines.join("\n"))
  // eslint-disable-next-line no-console
  console.log(`Wrote ${summaryPath}`)
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[audit-performance] failed", error)
  process.exitCode = 1
})

