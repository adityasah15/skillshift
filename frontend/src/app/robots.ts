import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/how-it-works", "/about", "/contact", "/privacy", "/terms"],
        disallow: [
          "/admin",
          "/dashboard",
          "/orders",
          "/messages",
          "/wallet",
          "/notifications",
          "/profile",
          "/services/mine",
          "/services/new",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
