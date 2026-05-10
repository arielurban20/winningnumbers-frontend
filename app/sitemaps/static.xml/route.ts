const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const today = new Date().toISOString().split("T")[0]

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "hourly" },
    { url: "/states", priority: "0.9", changefreq: "daily" },
    { url: "/games", priority: "0.9", changefreq: "daily" },
    { url: "/games/powerball", priority: "0.9", changefreq: "daily" },
    { url: "/games/mega-millions", priority: "0.9", changefreq: "daily" },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
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
