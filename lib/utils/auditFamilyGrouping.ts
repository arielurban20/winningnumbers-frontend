/**
 * Development-only audit helper to detect incorrectly split game families
 * 
 * This helps identify states where games that should be grouped together
 * are being rendered as separate cards.
 * 
 * IMPORTANT: Only runs in development mode. No production logging.
 */

import type { Game, GameFamily } from "@/types/api"
import { parseGameName, generateFamilySlug, groupGamesByFamily } from "./groupGames"

export interface SplitFamilyReport {
  stateSlug: string
  stateName: string
  familyName: string
  familySlug: string
  detectedVariants: string[]
  sessionCount: number
  isProperlyGrouped: boolean
  issue?: string
}

export interface StateAuditReport {
  stateSlug: string
  stateName: string
  totalGames: number
  totalFamilies: number
  issues: SplitFamilyReport[]
}

/**
 * Patterns that indicate games should be grouped together
 */
const EXPECTED_MULTI_SESSION_FAMILIES = [
  "pick-3",
  "pick-4", 
  "pick-5",
  "cash-3",
  "cash-4",
  "cash-5",
  "play-3",
  "play-4",
  "dc-3",
  "dc-4",
  "dc-5",
  "pega-3",
  "pega-4",
  "cash-pop",
  "quick-draw",
  "keno",
  "numbers",
  "win-4",
  "take-5",
  "lotto",
]

/**
 * Check if a family slug represents a game that commonly has multiple sessions
 */
function isExpectedMultiSessionFamily(familySlug: string): boolean {
  return EXPECTED_MULTI_SESSION_FAMILIES.some(pattern => 
    familySlug.includes(pattern)
  )
}

/**
 * Audit a single state's game grouping
 */
export function auditStateGrouping(
  stateSlug: string,
  stateName: string,
  games: Game[]
): StateAuditReport {
  const families = groupGamesByFamily(games, undefined, stateSlug, stateName)
  const issues: SplitFamilyReport[] = []
  
  // Check each family for potential issues
  for (const family of families) {
    const report: SplitFamilyReport = {
      stateSlug,
      stateName,
      familyName: family.familyName,
      familySlug: family.familySlug,
      detectedVariants: family.sessions.map(s => s.sessionName),
      sessionCount: family.sessions.length,
      isProperlyGrouped: true,
    }
    
    // Issue 1: Expected multi-session family has only one session
    // This might indicate that sessions are being split incorrectly
    if (isExpectedMultiSessionFamily(family.familySlug) && family.sessions.length === 1) {
      // Check if there are other families that might be variants
      const potentialVariants = families.filter(f => {
        if (f.familySlug === family.familySlug) return false
        // Check if family names are similar
        const similarity = calculateSimilarity(f.familyName, family.familyName)
        return similarity > 0.7
      })
      
      if (potentialVariants.length > 0) {
        report.isProperlyGrouped = false
        report.issue = `Expected multi-session family has only 1 session. Potential variants found: ${potentialVariants.map(v => v.familyName).join(", ")}`
        issues.push(report)
      }
    }
    
    // Issue 2: Family name contains session indicators but wasn't parsed
    const sessionIndicators = [
      "midday", "evening", "morning", "night", "day",
      "1:50pm", "7:50pm", "11:30pm", "2pm", "11pm",
      "early bird", "night owl"
    ]
    
    const nameContainsSession = sessionIndicators.some(ind => 
      family.familyName.toLowerCase().includes(ind)
    )
    
    if (nameContainsSession) {
      report.isProperlyGrouped = false
      report.issue = `Family name "${family.familyName}" contains session indicator but was not parsed correctly`
      issues.push(report)
    }
  }
  
  // Issue 3: Look for families that should be grouped
  // Group families by base name similarity
  const familyGroups = new Map<string, GameFamily[]>()
  for (const family of families) {
    // Extract base name (first 2-3 words)
    const baseName = family.familyName.split(/\s+/).slice(0, 2).join(" ").toLowerCase()
    const existing = familyGroups.get(baseName) || []
    existing.push(family)
    familyGroups.set(baseName, existing)
  }
  
  // Report groups with multiple entries that might need merging
  for (const [baseName, group] of familyGroups) {
    if (group.length > 1 && !baseName.includes("lotto")) { // Exclude generic "lotto" matches
      const report: SplitFamilyReport = {
        stateSlug,
        stateName,
        familyName: baseName,
        familySlug: generateFamilySlug(baseName),
        detectedVariants: group.map(g => g.familyName),
        sessionCount: group.reduce((sum, g) => sum + g.sessions.length, 0),
        isProperlyGrouped: false,
        issue: `Multiple families with similar base name "${baseName}": ${group.map(g => g.familyName).join(", ")}`
      }
      issues.push(report)
    }
  }
  
  return {
    stateSlug,
    stateName,
    totalGames: games.length,
    totalFamilies: families.length,
    issues,
  }
}

/**
 * Simple string similarity calculation (Jaccard index on character n-grams)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const ngrams1 = getNgrams(str1.toLowerCase(), 2)
  const ngrams2 = getNgrams(str2.toLowerCase(), 2)
  
  const intersection = ngrams1.filter(n => ngrams2.includes(n)).length
  const union = new Set([...ngrams1, ...ngrams2]).size
  
  return union === 0 ? 0 : intersection / union
}

function getNgrams(str: string, n: number): string[] {
  const ngrams: string[] = []
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n))
  }
  return ngrams
}

/**
 * Log audit results to console (development only)
 */
export function logAuditResults(reports: StateAuditReport[]): void {
  if (process.env.NODE_ENV !== "development") return
  
  const issueReports = reports.filter(r => r.issues.length > 0)
  
  if (issueReports.length === 0) {
    console.log("[Audit] No family grouping issues detected")
    return
  }
  
  console.log(`[Audit] Found ${issueReports.length} states with potential grouping issues:`)
  
  for (const report of issueReports) {
    console.log(`\n  ${report.stateName} (${report.stateSlug}):`)
    console.log(`    Total games: ${report.totalGames}, Families: ${report.totalFamilies}`)
    
    for (const issue of report.issues) {
      console.log(`    - ${issue.familyName}: ${issue.issue}`)
      console.log(`      Variants: ${issue.detectedVariants.join(", ")}`)
    }
  }
}

/**
 * Quick audit of grouping for a single game array
 * Returns human-readable issues only
 */
export function quickAuditGames(games: Game[], stateSlug: string, stateName: string): string[] {
  const report = auditStateGrouping(stateSlug, stateName, games)
  return report.issues.map(i => `${i.familyName}: ${i.issue}`)
}
