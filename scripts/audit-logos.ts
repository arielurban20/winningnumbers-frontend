/**
 * Logo Audit Script - Lists all unique FAMILY logos needed
 * Run with: npx tsx scripts/audit-logos.ts
 */

const API_BASE = "https://winningnumbers.us/api"

// Session suffixes to strip for family-level logos
const SESSION_SUFFIXES = [
  "morning", "midday", "daytime", "day", "evening", "eve", "night", "mid",
  "late-night", "early-bird", "matinee", "drive-time", "primetime", "prime-time",
  "night-owl", "lunch-rush", "clock-out-cash", "midnight-money", "morning-buzz",
  "after-hours", "coffee-break", "lunch-break", "rush-hour", "brunch", "suppertime",
  "afternoon", "late-morning", "1pm", "6pm", "9am", "10pm", "11pm", "4pm", "7pm",
  "1-50pm", "7-50pm", "11-30pm"
]

// State abbreviations
const STATE_ABBREVS = [
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "dc", "fl", "ga", "hi", "id",
  "il", "in", "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo",
  "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa",
  "pr", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy"
]

function normalizeGameFamilySlug(gameSlug: string): string {
  let slug = gameSlug.toLowerCase()
  
  // Remove trailing state suffix
  for (const state of STATE_ABBREVS) {
    const statePattern = new RegExp(`-${state}$`, "i")
    if (statePattern.test(slug)) {
      slug = slug.replace(statePattern, "")
      break
    }
  }
  
  // Remove session suffixes (longest first)
  const sortedSuffixes = [...SESSION_SUFFIXES].sort((a, b) => b.length - a.length)
  for (const suffix of sortedSuffixes) {
    const sessionPattern = new RegExp(`-${suffix}$`, "i")
    if (sessionPattern.test(slug)) {
      slug = slug.replace(sessionPattern, "")
      break
    }
  }
  
  return slug
}

interface State { slug: string; name: string }
interface Game { slug: string; name: string }

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return response.json()
}

async function main() {
  console.log("Obteniendo todos los estados y juegos...\n")
  
  const statesData = await fetchJSON<{ items: State[] }>(`${API_BASE}/states`)
  const states = statesData.items || []
  
  const familyLogos = new Set<string>()
  
  for (const state of states) {
    try {
      const gamesData = await fetchJSON<{ items: Game[] }>(`${API_BASE}/states/${state.slug}/games`)
      const games = gamesData.items || []
      
      for (const game of games) {
        const familySlug = normalizeGameFamilySlug(game.slug)
        familyLogos.add(familySlug)
      }
      
      process.stdout.write(".")
    } catch {
      process.stdout.write("x")
    }
  }
  
  const sortedLogos = Array.from(familyLogos).sort()
  
  console.log("\n\n" + "=".repeat(60))
  console.log("LOGOS DE FAMILIA NECESARIOS")
  console.log("=".repeat(60))
  console.log(`Total: ${sortedLogos.length} logos unicos\n`)
  console.log("Sube estos archivos a: https://winningnumbers.us/assets/logos/\n")
  
  for (const logo of sortedLogos) {
    console.log(`${logo}.svg`)
  }
}

main().catch(console.error)
