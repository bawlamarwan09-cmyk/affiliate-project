import type { MetadataRoute } from "next";
import { publicApi } from "./lib/public-api";
import { siteUrl } from "./lib/seo";

type SitemapRecord = { slug: string; updatedAt: string; canonicalUrl?: string | null };
type SeoManifest = {
  settings?: { siteUrl?: string | null; homepageRobotsIndex?: boolean; updatedAt?: string };
  products: SitemapRecord[];
  categories: SitemapRecord[];
  stores: SitemapRecord[];
  brands: SitemapRecord[];
  guides: SitemapRecord[];
  posts: SitemapRecord[];
  comparisons: SitemapRecord[];
  pages: SitemapRecord[];
  authors: SitemapRecord[];
};

function localCanonical(record: SitemapRecord, path: string, origin: string) {
  if (!record.canonicalUrl) return `${origin}${path}`;
  try {
    const canonical = new URL(record.canonicalUrl, `${origin}/`);
    return canonical.origin === origin ? canonical.toString() : null;
  } catch {
    return `${origin}${path}`;
  }
}

function latestUpdate(records: SitemapRecord[] | undefined, fallback?: string) {
  const timestamps = (records || [])
    .map((record) => Date.parse(record.updatedAt))
    .filter(Number.isFinite);
  if (fallback && Number.isFinite(Date.parse(fallback))) timestamps.push(Date.parse(fallback));
  return timestamps.length ? new Date(Math.max(...timestamps)) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const manifest = await publicApi<SeoManifest>("/seo/manifest");
  const origin = siteUrl(manifest?.settings);
  const result: MetadataRoute.Sitemap = [];

  if (manifest?.settings?.homepageRobotsIndex !== false) {
    result.push({ url: `${origin}/`, lastModified: manifest?.settings?.updatedAt, changeFrequency: "daily", priority: 1 });
  }

  const listingPages: Array<[string, SitemapRecord[] | undefined]> = [
    ["/deals", manifest?.products],
    ["/categories", manifest?.categories],
    ["/stores", manifest?.stores],
    ["/brands", manifest?.brands],
    ["/guides", manifest?.guides],
    ["/compare", manifest?.comparisons],
    ["/blog", manifest?.posts],
  ];
  for (const [path, records] of listingPages) {
    result.push({ url: `${origin}${path}`, lastModified: latestUpdate(records, manifest?.settings?.updatedAt), changeFrequency: "daily", priority: .7 });
  }

  const groups: Array<[SitemapRecord[] | undefined, string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    [manifest?.products, "/product/", "weekly", .8],
    [manifest?.categories, "/category/", "weekly", .8],
    [manifest?.stores, "/store/", "weekly", .7],
    [manifest?.brands, "/brand/", "weekly", .7],
    [manifest?.guides, "/guides/", "weekly", .9],
    [manifest?.posts, "/blog/", "monthly", .7],
    [manifest?.comparisons, "/compare/", "monthly", .8],
    [manifest?.pages, "/", "monthly", .5],
    [manifest?.authors, "/authors/", "monthly", .5],
  ];

  for (const [records, prefix, changeFrequency, priority] of groups) {
    for (const record of records || []) {
      const url = localCanonical(record, `${prefix}${record.slug}`, origin);
      if (url) result.push({ url, lastModified: record.updatedAt, changeFrequency, priority });
    }
  }

  return result;
}
