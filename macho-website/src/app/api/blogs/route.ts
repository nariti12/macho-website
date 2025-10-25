import { NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_ENDPOINT = `${baseUrl.replace(/\/$/, "")}/blogs`;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY;

const FALLBACK_IMAGE = "/images/blog-placeholder.svg";
const DEFAULT_CATEGORY = "Blog";
const DEFAULT_SUMMARY = "詳細は本文でご確認ください。";

interface MicroCMSImage {
  url: string;
  height?: number;
  width?: number;
}

interface MicroCMSCategory {
  name?: string;
}

interface MicroCMSBlog {
  id: string;
  title?: string;
  category?: MicroCMSCategory | null;
  summary?: string;
  description?: string;
  body?: string;
  content?: string;
  richEditor?: string;
  publishedAt?: string;
  updatedAt?: string;
  thumbnail?: MicroCMSImage | null;
  eyecatch?: MicroCMSImage | null;
  mainvisual?: MicroCMSImage | null;
}

interface MicroCMSResponse {
  contents?: MicroCMSBlog[];
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export async function GET() {
  if (!MICROCMS_API_KEY) {
    return NextResponse.json({ error: "MICROCMS_API_KEY is not set." }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      limit: "6",
      status: "PUBLIC",
      orders: "-publishedAt",
    });

    const response = await fetch(`${MICROCMS_ENDPOINT}?${params.toString()}`, {
      headers: {
        "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
        "X-API-KEY": MICROCMS_API_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch blogs from microCMS. ${response.status} ${response.statusText} ${errorText}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as MicroCMSResponse;

    const items = (data.contents ?? []).map((item) => {
      const rawSummary = item.summary ?? item.description ?? item.richEditor ?? item.content ?? item.body ?? "";
      const summaryText = rawSummary ? stripHtml(rawSummary) : DEFAULT_SUMMARY;

      const imageUrl =
        item.thumbnail?.url ?? item.eyecatch?.url ?? item.mainvisual?.url ?? FALLBACK_IMAGE;

      const updatedAt = item.updatedAt ?? item.publishedAt ?? null;

      return {
        id: item.id,
        title: item.title ?? "無題の記事",
        category: item.category?.name ?? DEFAULT_CATEGORY,
        summary: summaryText || DEFAULT_SUMMARY,
        imageUrl,
        updatedAt,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch blogs from microCMS", error);
    return NextResponse.json({ error: "Failed to fetch blogs from microCMS." }, { status: 500 });
  }
}
