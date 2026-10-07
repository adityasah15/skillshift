import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/how-it-works"],
        disallow: [
          "/admin",
          "/orders",
          "/wallet",
          "/notifications",
          "/services/mine",
          "/services/new",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
