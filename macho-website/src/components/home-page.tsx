'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { buildUrl, toJsonLd } from "@/lib/seo";

type BlogCardData = {
  id: string;
  category: string;
  title: string;
  imageUrl: string;
  summary: string;
  updatedAt: string | null;
};

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

export function HomePage() {
  const blogSectionRef = useRef<HTMLDivElement | null>(null);
  const animationTimeouts = useRef<number[]>([]);
  const [blogItems, setBlogItems] = useState<BlogCardData[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  const menuItems = [
    { label: "用途別\n最強筋トレメニュー", href: "/menu" },
    { label: "１日摂取カロリー/\nたんぱく質 計算機", href: "/intake-calculator" },
    { label: "高たんぱく質一覧", href: "/high-protein" },
    { label: "プロテイン/サプリ 最強TOP3", href: "/supplements-top3" },
    { label: "トレーニングウェア", href: "/training-wear" },
    { label: "トレーニングギア", href: "/training-gear" },
  ];

  useEffect(() => {
    let isCancelled = false;

    const loadBlogs = async () => {
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = window.setTimeout(() => setShowLoading(true), 400);
      try {
        const response = await fetch("/api/blogs");
        if (!response.ok) {
          throw new Error(`Failed to load blogs: ${response.status}`);
        }
        const data: { items?: BlogCardData[] } = await response.json();
        if (!isCancelled) {
          if (Array.isArray(data.items) && data.items.length > 0) {
            setBlogItems(data.items);
            setBlogError(null);
          } else {
            setBlogItems([]);
            setBlogError("現在表示できる記事がありません。");
          }
        }
      } catch (error) {
        console.error("Failed to load blog entries", error);
        if (!isCancelled) {
          setBlogItems([]);
          setBlogError("ブログ記事の読み込みに失敗しました。");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingBlogs(false);
          setShowLoading(false);
        }
      }
    };

    loadBlogs();

    return () => {
      isCancelled = true;
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setShowLoading(false);
    };
  }, []);

  useEffect(() => {
    const section = blogSectionRef.current;
    if (!section) return;

    const tiles = Array.from(section.querySelectorAll<HTMLElement>(".blog-item"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          animationTimeouts.current.forEach((id) => window.clearTimeout(id));
          animationTimeouts.current = [];

          if (entry.isIntersecting) {
            tiles.forEach((tile, index) => {
              const timeoutId = window.setTimeout(() => {
                tile.classList.add("animate-fade-in-up");
                tile.classList.remove("opacity-0", "translate-y-8");
              }, index * 150);
              animationTimeouts.current.push(timeoutId);
            });
          } else {
            tiles.forEach((tile) => {
              tile.classList.remove("animate-fade-in-up");
              tile.classList.add("opacity-0", "translate-y-8");
            });
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -15%",
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      animationTimeouts.current.forEach((id) => window.clearTimeout(id));
      animationTimeouts.current = [];
    };
  }, [blogItems]);

  const profileImageSrc = "/picture/ore.png";
  const characterImageSrc = "/picture/man.png";

  const structuredData = toJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "マチョ田の部屋",
      url: buildUrl(""),
      description:
        "筋トレの悩みを解決する統合プラットフォーム。用途別最強筋トレメニューやおすすめ情報をお届けします。",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "マチョ田の部屋",
      url: buildUrl(""),
      logo: buildUrl("/picture/ore.png"),
      sameAs: ["https://x.com/narita1_", "https://www.youtube.com/@ganmochan"],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: buildUrl("/contact"),
        },
      ],
    },
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      {/* Main Content */}
      <main className="px-4 sm:px-6 md:px-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        <section className="py-16 sm:py-20 md:py-28">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex w-full justify-center lg:w-auto lg:justify-end">
              <Image
                src={characterImageSrc}
                alt="マチョ田キャラクター"
                width={260}
                height={260}
                priority
                className="h-auto w-[180px] max-w-[200px] hover:scale-105 transition-transform duration-300 drop-shadow-2xl sm:w-[200px] lg:w-[240px] xl:w-[260px]"
              />
            </div>

            <div className="grid w-full max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-2 sm:gap-8">
              {menuItems.map((item, index) => {
                const lines = item.label.split('\n');
                const className =
                  "w-full rounded-3xl bg-[#FF8A23] py-6 px-6 text-lg font-bold leading-tight text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(255,138,35,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:text-xl md:py-8 md:px-10 md:text-2xl";
                const content = lines.map((line, lineIndex) => (
                  <div key={lineIndex}>{line}</div>
                ));

                if (item.href) {
                  return (
                    <Link key={index} href={item.href} className={className}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={index} type="button" className={className}>
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <div
          ref={blogSectionRef}
          className="relative mx-auto mt-20 mb-16 w-[98%] max-w-[1600px] rounded-[32px] border border-white/35 bg-[rgba(188,143,80,0.9)] px-4 py-12 shadow-[0_30px_140px_-70px_rgba(113,63,18,0.7)] sm:px-6 md:mt-32 md:rounded-[44px] md:px-16 md:py-16"
        >
          <div className="mb-10 flex flex-wrap items-center gap-2 sm:gap-3">
            <Image
              src="/picture/image.png"
              alt="Blog icon"
              width={48}
              height={48}
              className="h-10 w-10 rounded-xl object-cover shadow-lg sm:h-12 sm:w-12"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Blog</h2>
              <span className="text-sm font-medium text-white/80 sm:text-base">-筋トレとライフハック-</span>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {blogItems.slice(0, 6).map((item, index) => (
              <Link key={item.id} href={`/blog/${item.id}`} className="block">
                <div
                  className="blog-item group transform rounded-2xl bg-white opacity-0 shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-xl overflow-hidden translate-y-8"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, 100vw"
                    />
                  </div>
                  <div className="p-5 sm:p-6 md:p-8">
                    <span className="mb-4 inline-block rounded-xl bg-[#FF8A23] px-4 py-1 text-xs font-semibold text-white sm:mb-5 sm:text-sm">
                      {item.category}
                    </span>
                    <h3 className="text-base font-semibold leading-tight text-gray-900 sm:text-lg">
                      {item.title}
                    </h3>
                    {formatDate(item.updatedAt) && (
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                        更新日: {formatDate(item.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {!isLoadingBlogs && blogItems.length === 0 && (
              <div className="col-span-full rounded-3xl bg-white/90 p-8 text-center text-sm font-semibold text-gray-600 shadow-lg">
                {blogError ?? "現在表示できる記事がありません。"}
              </div>
            )}

            {showLoading && blogItems.length === 0 && (
              <div className="col-span-full rounded-3xl bg-white/80 p-8 text-center text-sm font-semibold text-gray-500 shadow">
                記事を読み込んでいます...
              </div>
            )}
          </div>

          <div className="text-right">
            {blogItems.length > 0 && (
              <Link
                href="/blog"
                className="inline-flex items-center rounded-2xl bg-[#FF8A23] px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 sm:text-base md:px-6 md:text-xl"
              >
                MORE →
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
