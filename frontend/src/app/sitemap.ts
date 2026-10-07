import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/services`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
