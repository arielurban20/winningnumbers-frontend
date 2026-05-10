import { getStates, getStateGames } from "@/lib/api/states"
import { groupGamesByFamily } from "@/lib/utils/groupGames"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const urls: Array<{ loc: string; lastmod: string }> = []
  const today = new Date().toISOString().split("T")[0]

  try {
    const states = await getStates()

    // For each state, get games and create session URLs using parallel fetching
    await Promise.all(states.map(async (state) => {
      try {
        const games = await getStateGames(state.slug)
        const groupedFamilies = groupGamesByFamily(games, undefined, state.slug, state.name)

        for (const family of groupedFamilies) {
          // Only include sessions for multi-session games
          if (family.sessions.length > 1) {
            for (const session of family.sessions) {
              if (session.sessionDisplaySlug) {
                urls.push({
                  loc: `${siteUrl}/states/${state.slug}/${family.familySlug}/${session.sessionDisplaySlug}`,
                  lastmod: today,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching games for state ${state.slug}:`, error)
      }
    }))
  } catch (error) {
    console.error("Error generating sessions sitemap:", error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
