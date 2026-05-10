const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export async function GET() {
  const today = new Date().toISOString().split("T")[0]

  const legalPages = [
    { url: "/about", priority: "0.5", changefreq: "monthly" },
    { url: "/privacy-policy", priority: "0.4", changefreq: "monthly" },
    { url: "/terms", priority: "0.4", changefreq: "monthly" },
    { url: "/cookie-policy", priority: "0.4", changefreq: "monthly" },
    { url: "/disclaimer", priority: "0.4", changefreq: "monthly" },
    { url: "/contact", priority: "0.5", changefreq: "monthly" },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${legalPages.map((page) => `  <url>
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
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
