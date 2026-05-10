const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  const sitemaps = [
    `${siteUrl}/sitemaps/static.xml`,
    `${siteUrl}/sitemaps/states.xml`,
    `${siteUrl}/sitemaps/games.xml`,
    `${siteUrl}/sitemaps/sessions.xml`,
    `${siteUrl}/sitemaps/stats.xml`,
    `${siteUrl}/sitemaps/historical.xml`,
    `${siteUrl}/sitemaps/legal.xml`,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((url) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
