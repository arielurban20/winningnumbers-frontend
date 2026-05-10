import { getStates, getStateGames } from "@/lib/api/states"
import { parseGameName, generateFamilySlug } from "@/lib/utils/groupGames"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const today = new Date().toISOString().split("T")[0]
  
  const urls: Array<{ url: string; lastmod: string; priority: string }> = []
  
  try {
    const states = await getStates()
    
    // Get games for all states using parallel fetching
    await Promise.all(states.map(async (state) => {
      try {
        const games = await getStateGames(state.slug)
        
        // Group games into families and create unique URLs
        const familySlugs = new Set<string>()
        
        for (const game of games) {
          // Parse the game name to get family name, then slugify
          const { familyName } = parseGameName(game.name)
          const familySlug = generateFamilySlug(familyName)
          familySlugs.add(familySlug)
        }
        
        for (const familySlug of familySlugs) {
          urls.push({
            url: `/states/${state.slug}/${familySlug}/stats`,
            lastmod: today,
            priority: "0.6",
          })
        }
      } catch (error) {
        console.error(`Failed to fetch games for ${state.slug}:`, error)
      }
    }))
  } catch (error) {
    console.error("Failed to fetch states for stats sitemap:", error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=7200, s-maxage=7200",
    },
  })
}
