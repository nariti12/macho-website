const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const FALLBACK_IMAGE = "/images/blog-placeholder.svg";
const DEFAULT_CATEGORY = "Blog";
const DEFAULT_SUMMARY = "詳細は本文でご確認ください。";

type MicroCMSImage = {
  url: string;
};

type MicroCMSBodyBlock = {
  text?: string;
};

type MicroCMSBlog = {
  id: string;
  title?: string;
  category?: { name?: string } | null;
  summary?: string;
  description?: string;
  metaDescription?: string;
  body?: string;
  content?: string;
  content2?: MicroCMSBodyBlock[] | null;
  richEditor?: string;
  publishedAt?: string;
  updatedAt?: string;
  thumbnail?: MicroCMSImage | null;
  eyecatch?: MicroCMSImage | null;
  mainvisual?: MicroCMSImage | null;
};

export type BlogCardData = {
  id: string;
  category: string;
  title: string;
  imageUrl: string;
  summary: string;
  metaDescription: string;
  publishedAt: string | null;
  updatedAt: string | null;
};

const hasText = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0;
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const truncate = (value: string, length = 160) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
const getBodyBlockText = (blocks?: MicroCMSBodyBlock[] | null) =>
  (blocks ?? [])
    .map((block) => (hasText(block.text) ? stripHtml(block.text) : ""))
    .filter(Boolean)
    .join(" ");

export async function fetchLatestBlogCards(limit = 6): Promise<BlogCardData[]> {
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!apiKey) {
    throw new Error("MICROCMS_API_KEY is not set.");
  }

  const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
  const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs`;
  const params = new URLSearchParams({
    limit: String(limit),
    status: "PUBLIC",
    orders: "-publishedAt",
  });
  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
      "X-API-KEY": apiKey,
    },
    next: {
      revalidate: 600,
      tags: ["blog-list"],
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch blogs from microCMS. ${response.status} ${response.statusText} ${errorText}`,
    );
  }

  const data = (await response.json()) as { contents?: MicroCMSBlog[] };
  return (data.contents ?? []).map((item) => {
    const rawSummary = hasText(item.summary)
      ? item.summary
      : !hasText(item.metaDescription) && hasText(item.description)
        ? item.description
        : getBodyBlockText(item.content2) || item.richEditor || item.content || item.body || "";
    const summary = rawSummary ? truncate(stripHtml(rawSummary)) : DEFAULT_SUMMARY;
    const metaDescription = truncate(
      stripHtml(
        hasText(item.metaDescription)
          ? item.metaDescription
          : hasText(item.description)
            ? item.description
            : summary,
      ),
    );

    return {
      id: item.id,
      title: item.title ?? "無題の記事",
      category: item.category?.name ?? DEFAULT_CATEGORY,
      summary: summary || DEFAULT_SUMMARY,
      metaDescription,
      imageUrl: item.thumbnail?.url ?? item.eyecatch?.url ?? item.mainvisual?.url ?? FALLBACK_IMAGE,
      publishedAt: item.publishedAt ?? item.updatedAt ?? null,
      updatedAt: item.updatedAt ?? item.publishedAt ?? null,
    };
  });
}
