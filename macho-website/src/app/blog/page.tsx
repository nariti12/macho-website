import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/blog");

export const metadata: Metadata = {
  title: "ブログ一覧｜マチョ田の部屋",
  description:
    "マチョ田の筋トレ日記をまとめたブログ一覧ページ。キーワード検索や月別アーカイブから記事を探せます。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "ブログ一覧｜マチョ田の部屋",
    description:
      "マチョ田の筋トレ日記をまとめたブログ一覧ページです。キーワード検索や月別アーカイブから記事を探せます。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ブログ一覧｜マチョ田の部屋",
    description:
      "マチョ田の筋トレ日記をまとめたブログ一覧ページです。",
  },
};

const DEFAULT_BASE_URL = "https://macho.microcms.io/api/v1";
const baseUrl = process.env.MICROCMS_BASE_URL ?? DEFAULT_BASE_URL;
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY ?? "";
const FALLBACK_IMAGE = "/images/blog-placeholder.svg";
const LIMIT = 9;
const FETCH_LIMIT = 100;

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

async function fetchBlogs() {
  if (!MICROCMS_API_KEY) {
    throw new Error("MICROCMS_API_KEY is not configured.");
  }
  const endpoint = `${baseUrl.replace(/\/$/, "")}/blogs`;
  const searchParams = new URLSearchParams({
    limit: String(FETCH_LIMIT),
    offset: "0",
    status: "PUBLIC",
    orders: "-publishedAt",
  });
  const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
    headers: {
      "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
      "X-API-KEY": MICROCMS_API_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch blogs list. ${response.status} ${response.statusText} ${text}`);
  }

  const data = (await response.json()) as MicroCMSResponse;
  const items = (data.contents ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? "無題の記事",
      category: item.category?.name ?? "Blog",
      imageUrl: item.thumbnail?.url ?? item.eyecatch?.url ?? item.mainvisual?.url ?? FALLBACK_IMAGE,
      publishedAt: item.publishedAt ?? item.updatedAt ?? null,
      updatedAt: item.updatedAt ?? item.publishedAt ?? null,
    }));

  return {
    totalCount: data.totalCount ?? items.length,
    items,
  };
}

type BlogListItem = Awaited<ReturnType<typeof fetchBlogs>>["items"][number];

const getMonthKey = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatArchiveLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
};

const getArchives = (blogs: BlogListItem[]) => {
  const counts = blogs.reduce<Record<string, number>>((acc, blog) => {
    const monthKey = getMonthKey(blog.publishedAt);
    if (!monthKey) return acc;
    acc[monthKey] = (acc[monthKey] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, count]) => ({ monthKey, count, label: formatArchiveLabel(monthKey) }));
};

const filterBlogs = (blogs: BlogListItem[], query: string, archive: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  return blogs.filter((blog) => {
    const matchesQuery =
      !normalizedQuery ||
      `${blog.title} ${blog.category}`.toLowerCase().includes(normalizedQuery);
    const matchesArchive = !archive || getMonthKey(blog.publishedAt) === archive;
    return matchesQuery && matchesArchive;
  });
};

const buildPageHref = (page: number, query: string, archive: string) => {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  if (archive) params.set("archive", archive);
  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; archive?: string }>;
}) {
  const profileImageSrc = "/picture/ore.png";
  const resolvedSearchParams = await searchParams;
  const page = Math.max(Number(resolvedSearchParams?.page ?? "1"), 1);
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const archive = resolvedSearchParams?.archive?.trim() ?? "";
  const { items: allBlogs } = await fetchBlogs();
  const archives = getArchives(allBlogs);
  const filteredBlogs = filterBlogs(allBlogs, query, archive);
  const totalCount = filteredBlogs.length;
  const totalPages = Math.max(Math.ceil(totalCount / LIMIT), 1);
  const currentPage = Math.min(page, totalPages);
  const blogs = filteredBlogs.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-16 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10">
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#FF8A23] shadow hover:bg-white"
            >
              ← TOPに戻る
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
            <p className="text-sm font-semibold text-white/90">筋トレ日記をキーワードや月別で探せます。</p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/60 px-4 py-3 text-sm font-bold text-[#7C2D12]">
                <span>{totalCount}件の記事</span>
                {(query || archive) && <span>絞り込み中</span>}
              </div>

              {blogs.length > 0 ? (
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
                        {formatDate(blog.publishedAt) && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            公開日: {formatDate(blog.publishedAt)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-white/90 p-8 text-center text-sm font-semibold text-gray-600 shadow">
                  条件に一致する記事がありません。
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-center gap-4">
                  <Link
                    aria-disabled={!prevPage}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      prevPage ? "bg-white/80 text-[#FF8A23] hover:bg-white" : "bg-white/40 text-gray-400 cursor-not-allowed"
                    }`}
                    href={prevPage ? buildPageHref(prevPage, query, archive) : "#"}
                  >
                    ← 前へ
                  </Link>
                  <span className="text-sm font-semibold text-white/80">
                    {currentPage} / {totalPages}
                  </span>
                  <Link
                    aria-disabled={!nextPage}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      nextPage ? "bg-white/80 text-[#FF8A23] hover:bg-white" : "bg-white/40 text-gray-400 cursor-not-allowed"
                    }`}
                    href={nextPage ? buildPageHref(nextPage, query, archive) : "#"}
                  >
                    次へ →
                  </Link>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-5 xl:sticky xl:top-24">
              <section className="rounded-3xl bg-white/90 p-5 shadow-lg">
                <h2 className="text-lg font-black text-[#7C2D12]">検索</h2>
                <form action="/blog" className="mt-4 flex flex-col gap-3">
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="記事タイトルで検索"
                    className="min-h-12 rounded-2xl border border-[#FCD27B] bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#FF8A23] focus:ring-4 focus:ring-[#FF8A23]/20"
                  />
                  {archive ? <input type="hidden" name="archive" value={archive} /> : null}
                  <button
                    type="submit"
                    className="min-h-12 rounded-2xl bg-[#FF8A23] px-6 text-sm font-bold text-white shadow transition hover:bg-[#f57200]"
                  >
                    検索
                  </button>
                  {(query || archive) && (
                    <Link
                      href="/blog"
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FFF3DF] px-5 text-sm font-bold text-[#9A3412] transition hover:bg-[#FFE7C2]"
                    >
                      リセット
                    </Link>
                  )}
                </form>
              </section>

              <section className="rounded-3xl bg-white/90 p-5 shadow-lg">
                <h2 className="text-lg font-black text-[#7C2D12]">アーカイブ</h2>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={buildPageHref(1, query, "")}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      archive ? "bg-[#FFF3DF] text-[#9A3412] hover:bg-[#FFE7C2]" : "bg-[#7C2D12] text-white"
                    }`}
                  >
                    すべて
                  </Link>
                  {archives.map((item) => (
                    <Link
                      key={item.monthKey}
                      href={buildPageHref(1, query, item.monthKey)}
                      className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                        archive === item.monthKey ? "bg-[#7C2D12] text-white" : "bg-[#FFF3DF] text-[#9A3412] hover:bg-[#FFE7C2]"
                      }`}
                    >
                      {item.label} ({item.count})
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
