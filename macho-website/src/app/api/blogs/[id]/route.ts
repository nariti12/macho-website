import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY;

interface MicroCMSImage {
  url: string;
  height?: number;
  width?: number;
}

interface MicroCMSCategory {
  name?: string;
}

interface MicroCMSBlogDetail {
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

const normalize = (data: MicroCMSBlogDetail) => {
  const rawBody = data.richEditor ?? data.content ?? data.body ?? "";
  const fallbackSummary = data.summary ?? data.description ?? "";

  return {
    id: data.id,
    title: data.title ?? "無題の記事",
    category: data.category?.name ?? "Blog",
    publishedAt: data.publishedAt ?? null,
    updatedAt: data.updatedAt ?? null,
    body: rawBody,
    summary: fallbackSummary,
    imageUrl: data.thumbnail?.url ?? data.eyecatch?.url ?? data.mainvisual?.url ?? null,
  };
};

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!MICROCMS_API_KEY) {
    return NextResponse.json({ error: "MICROCMS_API_KEY is not set." }, { status: 500 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing blog id." }, { status: 400 });
  }

  try {
    const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs/${encodeURIComponent(id)}`;
    const response = await fetch(endpoint, {
      headers: {
        "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
        "X-API-KEY": MICROCMS_API_KEY,
      },
      next: { revalidate: 600 },
    });

    if (response.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch blog detail. ${response.status} ${response.statusText} ${text}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as MicroCMSBlogDetail;
    return NextResponse.json({ item: normalize(data) });
  } catch (error) {
    console.error(`Failed to fetch blog detail for id=${id}`, error);
    return NextResponse.json({ error: "Failed to fetch blog detail." }, { status: 500 });
  }
}
