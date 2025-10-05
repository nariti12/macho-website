import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY ?? "";
const FALLBACK_IMAGE = "/images/blog-placeholder.svg";

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

const normalizeBlogDetail = (data: MicroCMSBlogDetail) => {
  const rawBody = data.richEditor ?? data.content ?? data.body ?? "";
  const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const summary = stripHtml(data.summary ?? data.description ?? "");

  return {
    id: data.id,
    title: data.title ?? "無題の記事",
    category: data.category?.name ?? "Blog",
    publishedAt: data.publishedAt ?? null,
    updatedAt: data.updatedAt ?? null,
    body: rawBody,
    summary,
    imageUrl: data.thumbnail?.url ?? data.eyecatch?.url ?? data.mainvisual?.url ?? FALLBACK_IMAGE,
  };
};

async function fetchBlogDetail(id: string) {
  if (!MICROCMS_API_KEY) {
    throw new Error("MICROCMS_API_KEY is not configured.");
  }
  const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    headers: {
      "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
      "X-API-KEY": MICROCMS_API_KEY,
    },
    next: { revalidate: 600 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch blog detail. ${response.status} ${response.statusText} ${text}`);
  }

  const data = (await response.json()) as MicroCMSBlogDetail;
  return normalizeBlogDetail(data);
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const blog = await fetchBlogDetail(params.id);
  if (!blog) {
    notFound();
  }

  const profileImageSrc = "/picture/ore.png";
  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-16 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[32px] bg-white/95 p-10 shadow-2xl xl:max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#FF8A23] transition-colors hover:text-[#f57200]"
          >
            ← TOPに戻る
        </Link>

        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {blog.category}
          </span>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">{blog.title}</h1>
          {(blog.publishedAt || blog.updatedAt) && (
            <p className="text-xs text-gray-500">
              {formatDate(blog.publishedAt) && <span>公開日: {formatDate(blog.publishedAt)}</span>}
              {formatDate(blog.updatedAt) && (
                <span className="ml-2">最終更新日: {formatDate(blog.updatedAt)}</span>
              )}
            </p>
          )}
        </div>

          {blog.imageUrl && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-lg">
              <Image
                src={blog.imageUrl}
                alt={blog.title}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 60vw, 100vw"
              />
            </div>
          )}

        {blog.summary && (
          <p className="rounded-3xl bg-[#fff4eb] px-6 py-4 text-sm font-medium leading-relaxed text-gray-600 shadow-inner">
            {blog.summary}
          </p>
        )}

        <article className="blog-content">
          <div dangerouslySetInnerHTML={{ __html: blog.body }} />
        </article>
        </div>
      </main>
    </div>
  );
}
