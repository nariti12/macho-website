import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { buildUrl, toJsonLd } from "@/lib/seo";

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

interface RelatedBlogItem {
  id: string;
  title: string;
  updatedAt: string | null;
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
  const response = await fetch(`${endpoint}?status=PUBLIC`, {
    headers: {
      "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
      "X-API-KEY": MICROCMS_API_KEY,
    },
    cache: "no-store",
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

async function fetchRelatedBlogs(currentId: string): Promise<RelatedBlogItem[]> {
  if (!MICROCMS_API_KEY) {
    return [];
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs`;
  const searchParams = new URLSearchParams({
    limit: "3",
    orders: "-publishedAt",
    status: "PUBLIC",
    filters: `id[not_equals]${currentId}`,
  });
  const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
    headers: {
      "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
      "X-API-KEY": MICROCMS_API_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Failed to fetch related blogs", response.status, response.statusText);
    return [];
  }

  const data = (await response.json()) as { contents?: MicroCMSBlogDetail[] };
  return (data.contents ?? [])
    .filter((item) => item.id && item.id !== currentId)
    .map((item) => ({
      id: item.id!,
      title: item.title ?? "無題の記事",
      updatedAt: item.updatedAt ?? item.publishedAt ?? null,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const blog = await fetchBlogDetail(id);

  if (!blog) {
    return {
      title: "記事が見つかりません",
      description: "指定された記事が存在しません。",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageUrl = buildUrl(`/blog/${blog.id}`);

  return {
    title: `${blog.title}｜マチョ田の部屋`,
    description: blog.summary || undefined,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${blog.title}｜マチョ田の部屋`,
      description: blog.summary || undefined,
      url: pageUrl,
      type: "article",
      images: blog.imageUrl
        ? [
            {
              url: blog.imageUrl,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${blog.title}｜マチョ田の部屋`,
      description: blog.summary || undefined,
      images: blog.imageUrl ? [blog.imageUrl] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blog = await fetchBlogDetail(id);
  if (!blog) {
    notFound();
  }

  const relatedBlogs = await fetchRelatedBlogs(blog.id);

  const profileImageSrc = "/picture/ore.png";
  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : null;

  const articleStructuredData = toJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.summary,
    datePublished: blog.publishedAt ?? blog.updatedAt ?? undefined,
    dateModified: blog.updatedAt ?? blog.publishedAt ?? undefined,
    author: {
      "@type": "Person",
      name: "マチョ田",
      url: buildUrl("/profile"),
    },
    publisher: {
      "@type": "Organization",
      name: "マチョ田の部屋",
      logo: {
        "@type": "ImageObject",
        url: buildUrl("/picture/ore.png"),
      },
    },
    image: blog.imageUrl ? [blog.imageUrl] : undefined,
    mainEntityOfPage: buildUrl(`/blog/${blog.id}`),
  });

  const breadcrumbStructuredData = toJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: buildUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: buildUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: buildUrl(`/blog/${blog.id}`),
      },
    ],
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-16 pt-20 text-gray-900 sm:px-6 md:pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[28px] bg-white/95 p-6 shadow-2xl sm:rounded-[32px] sm:p-8 md:p-12 xl:max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#FF8A23] transition-colors hover:text-[#f57200] sm:text-base"
          >
            ← TOPに戻る
          </Link>

          <nav aria-label="Breadcrumb" className="text-xs text-gray-500 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
              <li>
                <Link href="/" className="transition hover:text-[#FF8A23]">
                  ホーム
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/blog" className="transition hover:text-[#FF8A23]">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-600">{blog.title}</li>
            </ol>
          </nav>

          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">
              {blog.category}
            </span>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              {blog.title}
            </h1>
            {(blog.publishedAt || blog.updatedAt) && (
              <p className="text-xs text-gray-500 sm:text-sm md:text-base">
                {formatDate(blog.publishedAt) && <span>公開日: {formatDate(blog.publishedAt)}</span>}
                {formatDate(blog.updatedAt) && (
                  <span className="ml-2 sm:ml-3">最終更新日: {formatDate(blog.updatedAt)}</span>
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
            <p className="rounded-3xl bg-[#fff4eb] px-6 py-4 text-sm font-medium leading-relaxed text-gray-600 shadow-inner sm:text-base md:px-8 md:py-5 md:text-lg">
              {blog.summary}
            </p>
          )}

          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleStructuredData }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbStructuredData }} />
          <article className="blog-content">
            <div dangerouslySetInnerHTML={{ __html: blog.body }} />
          </article>

          {relatedBlogs.length > 0 && (
            <section className="mt-12 space-y-4">
              <h2 className="text-2xl font-bold text-[#7C2D12]">関連記事</h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {relatedBlogs.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-[#FFE7C2] bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <Link href={`/blog/${item.id}`} className="flex flex-col gap-1 text-gray-800 hover:text-[#FF8A23]">
                      <span className="font-semibold leading-snug">{item.title}</span>
                      {formatDate(item.updatedAt) && (
                        <span className="text-xs text-gray-500">更新日: {formatDate(item.updatedAt)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
