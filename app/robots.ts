import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/login",
          "/dashboard",
          "/internal",
          "/internal/",
          "/api",
          "/api/",
          "/export",
          "/export/",
          "/*?*start_date=",
          "/*?*end_date=",
          "/*?*download=",
          "/*?*csv=",
          "/*?*sort=",
          "/*?*filter=",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
