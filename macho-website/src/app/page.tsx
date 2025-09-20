"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const blogSectionRef = useRef<HTMLDivElement | null>(null);
  const animationTimeouts = useRef<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
      setProgress(ratio);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const section = blogSectionRef.current;
    if (!section) return;

    const tiles = Array.from(section.querySelectorAll<HTMLElement>(".blog-item"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add("animate-fade-in-up");
            section.classList.remove("opacity-0", "translate-y-8");

            animationTimeouts.current.forEach((id) => window.clearTimeout(id));
            animationTimeouts.current = [];

            tiles.forEach((tile, index) => {
              const timeoutId = window.setTimeout(() => {
                tile.classList.add("animate-fade-in-up");
                tile.classList.remove("opacity-0", "translate-y-8");
              }, index * 150);
              animationTimeouts.current.push(timeoutId);
            });

            return;
          }

          section.classList.remove("animate-fade-in-up");
          section.classList.add("opacity-0", "translate-y-8");
          tiles.forEach((tile) => {
            tile.classList.remove("animate-fade-in-up");
            tile.classList.add("opacity-0", "translate-y-8");
          });
        });
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10%",
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      animationTimeouts.current.forEach((id) => window.clearTimeout(id));
      animationTimeouts.current = [];
    };
  }, []);

  const menuItems = [
    "用途別\n最強筋トレメニュー",
    "最新TOP3\nプロテインサプリ",
    "高たんぱく質一覧",
    "トレーニングギア",
    "トレーニングウェア",
    "消費カロリー/\nタンパク質計算機",
  ];

  const blogItems = [
    {
      image: "/images/blog-placeholder.svg",
      title: "プロテイン",
      text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。",
    },
    {
      image: "/images/blog-placeholder.svg",
      title: "プロテイン",
      text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。",
    },
    {
      image: "/images/blog-placeholder.svg",
      title: "プロテイン",
      text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。",
    },
    {
      image: "/images/blog-placeholder.svg",
      title: "グッズ",
      text: "Lopovofが「Fire Emblems」をプレイ\nするときにいつも聞いているという\nゲーム音楽をシリーズ化しました。",
    },
    {
      image: "/images/blog-placeholder.svg",
      title: "グッズ",
      text: "期間限定で「ポップアッププライベイト」\nの商品を販売いたします。今年も\nポップアップ企画をお楽しみください。",
    },
    {
      image: "/images/blog-placeholder.svg",
      title: "グッズ",
      text: "ポップアップ企画第2弾として\n「ファンが集める」の商品を\n期間限定で販売いたします。",
    },
  ];

  const profileImageSrc = "/picture/ore.png";
  const characterImageSrc = "/picture/man.png";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <div
        className="fixed top-0 left-0 right-0 h-2 z-50"
        style={{
          backgroundColor: "rgba(255, 173, 51, 0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="h-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: "#FF8A23",
            transition: "width 0.1s ease-out",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-4 z-40 flex justify-between items-start px-12 pt-6 pb-4">
        <div>
          <h1 className="text-white text-6xl font-bold mb-2 leading-none tracking-tight">マチョ田の部屋</h1>
          <p className="text-white text-xl font-medium">〜筋トレについてもう悩まなくていい〜</p>
        </div>
        <div className="text-center">
          <div className="w-28 h-28 bg-white rounded-2xl mb-3 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300">
            <img
              src={profileImageSrc}
              alt="Profile"
              className="w-20 h-20 rounded-xl object-cover"
              loading="eager"
            />
          </div>
          <p className="text-white text-base font-semibold">Profile</p>
      </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-12">
        <section className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16 transform lg:-translate-x-10 lg:-translate-y-28">
            <div className="flex justify-center lg:justify-end w-full lg:w-auto">
              <img
                src={characterImageSrc}
                alt="マチョ田キャラクター"
                className="w-[200px] sm:w-[220px] lg:w-[240px] xl:w-[260px] h-auto hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                loading="eager"
              />
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-10 text-center">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-white font-bold py-9 px-12 rounded-3xl shadow-lg transition-all duration-300 text-2xl leading-tight hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(255,138,35,0.5)]"
                  style={{ backgroundColor: "#FF8A23" }}
                >
                  {item.split("\n").map((line, lineIndex) => (
                    <div key={lineIndex}>{line}</div>
                  ))}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <div
          ref={blogSectionRef}
          className="rounded-3xl p-12 w-full max-w-7xl mx-auto mt-0 mb-12 opacity-0 translate-y-8 transform md:-translate-y-24 lg:-translate-y-48"
          style={{ backgroundColor: "rgba(188, 143, 80, 0.8)" }}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
            {blogItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-700 hover:-translate-y-2 hover:shadow-xl opacity-0 transform translate-y-8 blog-item"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="aspect-video relative">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-8">
                  <span className="inline-block text-white text-sm px-4 py-2 rounded-xl mb-6 font-semibold" style={{ backgroundColor: "#FF8A23" }}>
                    {item.title}
                  </span>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right">
            <button
              className="text-white font-bold transition-all duration-300 text-xl px-6 py-3 rounded-2xl hover:scale-105"
              style={{ backgroundColor: "#FF8A23" }}
            >
              MORE →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
