import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY ?? "";
const FALLBACK_IMAGE = "/images/blog-placeholder.svg";
const LIMIT = 9;

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
  publishedAt?: string;
  updatedAt?: string;
  thumbnail?: MicroCMSImage | null;
  eyecatch?: MicroCMSImage | null;
  mainvisual?: MicroCMSImage | null;
}

interface MicroCMSResponse {
  contents?: MicroCMSBlog[];
  totalCount?: number;
}

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

async function fetchBlogs(page: number) {
  if (!MICROCMS_API_KEY) {
    throw new Error("MICROCMS_API_KEY is not configured.");
  }
  const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs`;
  const offset = Math.max(page - 1, 0) * LIMIT;
  const response = await fetch(`${endpoint}?limit=${LIMIT}&offset=${offset}`, {
    headers: {
      "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
      "X-API-KEY": MICROCMS_API_KEY,
    },
    next: { revalidate: 600, tags: ["blog-list"] },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch blogs list. ${response.status} ${response.statusText} ${text}`);
  }

  const data = (await response.json()) as MicroCMSResponse;
  return {
    totalCount: data.totalCount ?? 0,
    items: (data.contents ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? "無題の記事",
      category: item.category?.name ?? "Blog",
      imageUrl: item.thumbnail?.url ?? item.eyecatch?.url ?? item.mainvisual?.url ?? FALLBACK_IMAGE,
      updatedAt: item.updatedAt ?? item.publishedAt ?? null,
    })),
  };
}

const buildPageHref = (page: number) => (page === 1 ? "/blog" : `/blog?page=${page}`);

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const profileImageSrc = "/picture/ore.png";
  const page = Math.max(Number(searchParams?.page ?? "1"), 1);
  const { items: blogs, totalCount } = await fetchBlogs(page);
  const totalPages = Math.max(Math.ceil(totalCount / LIMIT), 1);

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-16 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#FF8A23] shadow hover:bg-white"
            >
              ← TOPに戻る
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/95 shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  <Image
                    src={blog.imageUrl}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="flex flex-col gap-3 p-6">
                  <span className="inline-flex items-center self-start rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    {blog.category}
                  </span>
                  <h2 className="text-lg font-bold leading-tight text-gray-900 line-clamp-2">{blog.title}</h2>
                  {formatDate(blog.updatedAt) && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      更新日: {formatDate(blog.updatedAt)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                aria-disabled={!prevPage}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  prevPage ? "bg-white/80 text-[#FF8A23] hover:bg-white" : "bg-white/40 text-gray-400 cursor-not-allowed"
                }`}
                href={prevPage ? buildPageHref(prevPage) : "#"}
              >
                ← 前へ
              </Link>
              <span className="text-sm font-semibold text-white/80">
                {page} / {totalPages}
              </span>
              <Link
                aria-disabled={!nextPage}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  nextPage ? "bg-white/80 text-[#FF8A23] hover:bg-white" : "bg-white/40 text-gray-400 cursor-not-allowed"
                }`}
                href={nextPage ? buildPageHref(nextPage) : "#"}
              >
                次へ →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
