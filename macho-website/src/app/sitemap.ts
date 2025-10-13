import type { MetadataRoute } from "next";

import { buildUrl } from "@/lib/seo";

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY ?? "";

const staticRoutes = [
  "/",
  "/profile",
  "/menu",
  "/intake-calculator",
  "/high-protein",
  "/supplements-top3",
  "/training-wear",
  "/training-gear",
  "/blog",
  "/contact",
  "/privacy",
];

async function fetchBlogSlugs(): Promise<string[]> {
  if (!MICROCMS_API_KEY) {
    return [];
  }

  try {
    const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs`;
    const response = await fetch(`${endpoint}?limit=100`, {
      headers: {
        "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
        "X-API-KEY": MICROCMS_API_KEY,
      },
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error("Failed to fetch blogs for sitemap", response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as { contents?: { id: string; updatedAt?: string }[] };
    return (data.contents ?? []).map((item) => item.id);
  } catch (error) {
    console.error("Error generating sitemap", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await fetchBlogSlugs();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: buildUrl(route),
    lastModified: now,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((id) => ({
    url: buildUrl(`/blog/${id}`),
    lastModified: now,
  }));

  return [...staticEntries, ...blogEntries];
}
