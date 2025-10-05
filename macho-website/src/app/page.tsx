"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";

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

export default function Home() {
  const blogSectionRef = useRef<HTMLDivElement | null>(null);
  const animationTimeouts = useRef<number[]>([]);
  const [blogItems, setBlogItems] = useState<BlogCardData[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  const menuItems = [
    { label: "用途別\n最強筋トレメニュー", href: "/menu" },
    { label: "最新TOP3\nプロテインサプリ" },
    { label: "高たんぱく質一覧" },
    { label: "トレーニングギア" },
    { label: "トレーニングウェア" },
    { label: "消費カロリー/\nタンパク質計算機" },
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      {/* Main Content */}
      <main className="px-6 md:px-12">
        <section className="py-28">
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex justify-center lg:justify-end w-full lg:w-auto">
              <img
                src={characterImageSrc}
                alt="マチョ田キャラクター"
                className="w-[200px] sm:w-[220px] lg:w-[240px] xl:w-[260px] h-auto hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                loading="eager"
              />
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-10 text-center">
              {menuItems.map((item, index) => {
                const lines = item.label.split('\n');
                const className = "w-full text-white font-bold py-9 px-12 rounded-3xl shadow-lg transition-all duration-300 text-2xl leading-tight hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(255,138,35,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60";
                const content = lines.map((line, lineIndex) => (
                  <div key={lineIndex}>{line}</div>
                ));

                if (item.href) {
                  return (
                    <Link key={index} href={item.href} className={className} style={{ backgroundColor: "#FF8A23" }}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={index} type="button" className={className} style={{ backgroundColor: "#FF8A23" }}>
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
          className="relative mx-auto mt-40 mb-20 w-[98%] max-w-[1600px] rounded-[44px] border border-white/35 bg-[rgba(188,143,80,0.9)] px-6 py-16 shadow-[0_50px_180px_-70px_rgba(113,63,18,0.85)] md:px-16"
        >
          <div className="flex items-center gap-4 mb-12">
            <img
              src="/picture/image.png"
              alt="Blog icon"
              className="w-12 h-12 rounded-xl shadow-lg object-cover"
              loading="lazy"
            />
            <h2 className="text-white text-3xl font-bold">Blog</h2>
          </div>

          <div className="grid grid-cols-1 gap-10 mb-12 md:grid-cols-2 xl:grid-cols-3">
            {blogItems.slice(0, 6).map((item, index) => (
              <Link key={item.id} href={`/blog/${item.id}`} className="block">
                <div
                  className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-xl opacity-0 transform translate-y-8 blog-item group"
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
                  <div className="p-8">
                    <span className="inline-block text-white text-sm px-4 py-2 rounded-xl mb-6 font-semibold" style={{ backgroundColor: "#FF8A23" }}>
                      {item.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    {formatDate(item.updatedAt) && (
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                        更新日: {formatDate(item.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {!isLoadingBlogs && blogItems.length === 0 && (
              <div className="col-span-full rounded-3xl bg-white/90 p-10 text-center text-sm font-semibold text-gray-600 shadow-lg">
                {blogError ?? "現在表示できる記事がありません。"}
              </div>
            )}

            {showLoading && blogItems.length === 0 && (
              <div className="col-span-full rounded-3xl bg-white/80 p-10 text-center text-sm font-semibold text-gray-500 shadow">
                記事を読み込んでいます...
              </div>
            )}
          </div>

          <div className="text-right">
            {blogItems.length > 0 && (
              <Link
                href="/blog"
                className="inline-flex items-center text-white font-bold transition-all duration-300 text-xl px-6 py-3 rounded-2xl hover:scale-105"
                style={{ backgroundColor: "#FF8A23" }}
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
