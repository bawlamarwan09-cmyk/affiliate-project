import type { MetadataRoute } from "next";
import { api } from "./lib/api";
import { siteUrl } from "./lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await api.settings();
  const origin = siteUrl(settings);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/api/auth", "/login"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
