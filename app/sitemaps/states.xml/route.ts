import { getStates } from "@/lib/api/states"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const today = new Date().toISOString().split("T")[0]
  
  let states: Array<{ slug: string }> = []
  
  try {
    states = await getStates()
  } catch (error) {
    console.error("Failed to fetch states for sitemap:", error)
  }

  const urls = states.map((state) => ({
    url: `/states/${state.slug}`,
    lastmod: today,
    changefreq: "daily",
    priority: "0.8",
  }))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
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
