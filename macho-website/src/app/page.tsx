"use client";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const blogItems = document.querySelectorAll('.blog-item');
    blogItems.forEach((item, index) => {
      setTimeout(() => {
        observer.observe(item);
      }, index * 100);
    });

    return () => observer.disconnect();
  }, []);
  const menuItems = [
    "相談別\n最適筋トレメニュー",
    "最新TOP3\nプロテインサプリ",
    "俺たんぱく質一覧",
    "トレーニングギア",
    "トレーニングウェア",
    "消費カロリー/\nタンパク質計算機"
  ];

  const blogItems = [
    { image: "/images/blog-placeholder.svg", title: "プロテイン", text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。" },
    { image: "/images/blog-placeholder.svg", title: "プロテイン", text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。" },
    { image: "/images/blog-placeholder.svg", title: "プロテイン", text: "プロテインに関する詳細な情報を\nお届けします。最新の研究結果や\n効果的な摂取方法について解説します。" },
    { image: "/images/blog-placeholder.svg", title: "グッズ", text: "Lopovofが「Fire Emblems」をプレイ\nするときにいつも聞いているという\nゲーム音楽をシリーズ化しました。" },
    { image: "/images/blog-placeholder.svg", title: "グッズ", text: "期間限定で「ポップアッププライベイト」\nの商品を販売いたします。今年も\nポップアップ企画をお楽しみください。" },
    { image: "/images/blog-placeholder.svg", title: "グッズ", text: "ポップアップ企画第2弾として\n「ファンが集める」の商品を\n期間限定で販売いたします。" }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCC081' }}>

      {/* Header */}
      <header className="flex justify-between items-start px-12 pt-12 pb-8">
        <div>
          <h1 className="text-white text-6xl font-bold mb-2 leading-none tracking-tight">マチョ田の部屋</h1>
          <p className="text-white text-xl font-medium">〜組織を結う筋トレ組織〜</p>
        </div>
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-2xl mb-3 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300">
            <Image
              src="/picture/ore.svg"
              alt="Profile"
              width={72}
              height={72}
              className="rounded-xl object-cover"
            />
          </div>
          <p className="text-white text-base font-semibold">Profile</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-12">
        <div className="flex items-start gap-16 mb-20">
          {/* Character */}
          <div className="flex-shrink-0 mt-4">
            <Image
              src="/picture/man.svg"
              alt="マチョ田キャラクター"
              width={180}
              height={240}
              className="hover:scale-105 transition-transform duration-300 object-cover"
            />
          </div>

          {/* Menu Buttons */}
          <div className="grid grid-cols-2 gap-8 flex-1 max-w-4xl pt-8">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="text-white font-bold py-8 px-10 rounded-2xl shadow-lg transition-all duration-300 text-center text-xl leading-tight hover:scale-105 hover:shadow-xl"
                style={{ backgroundColor: '#FF8A23' }}
              >
                {item.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex}>{line}</div>
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Section */}
        <div className="rounded-3xl p-12 max-w-8xl mx-auto mb-16" style={{ backgroundColor: 'rgba(188, 143, 80, 0.8)' }}>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-blue-500 rounded-xl shadow-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-lg"></div>
            </div>
            <h2 className="text-white font-bold text-3xl">Blog</h2>
          </div>

          <div className="grid grid-cols-3 gap-10 mb-12">
            {blogItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-700 hover:-translate-y-2 hover:shadow-xl opacity-0 transform translate-y-8 blog-item"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="aspect-video relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <span className="inline-block text-white text-sm px-4 py-2 rounded-xl mb-6 font-semibold" style={{ backgroundColor: '#FF8A23' }}>
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
            <button className="text-white font-bold transition-all duration-300 text-xl px-6 py-3 rounded-2xl hover:scale-105" style={{ backgroundColor: '#FF8A23' }}>
              MORE →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}