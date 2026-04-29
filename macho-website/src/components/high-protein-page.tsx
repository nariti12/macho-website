"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { highProteinCategories, highProteinFoods } from "@/data/high-protein-foods";

const profileImageSrc = "/picture/ore.png";

const categoryStyles: Record<string, string> = {
  セブンイレブン: "bg-[#16a34a] text-white",
  大戸屋: "bg-[#7C2D12] text-white",
  スーパー食材: "bg-[#2563eb] text-white",
};

const nutritionItems = [
  { key: "protein", label: "タンパク質", unit: "g" },
  { key: "calories", label: "カロリー", unit: "kcal" },
  { key: "fat", label: "脂質", unit: "g" },
  { key: "carbs", label: "炭水化物", unit: "g" },
] as const;

export function HighProteinPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredFoods = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return highProteinFoods.filter((food) => {
      const matchesCategory = selectedCategory === "all" || food.category === selectedCategory;
      const matchesKeyword = keyword.length === 0 || food.name.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [searchKeyword, selectedCategory]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-6 pb-24 md:px-12">
        <section className="mx-auto max-w-6xl pb-12 pt-20">
          <div className="flex flex-col gap-8 rounded-3xl bg-white/95 p-10 shadow-2xl">
            <div className="flex flex-col gap-5 text-slate-800">
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">高たんぱく食品一覧</h1>
              <p className="max-w-4xl text-base leading-relaxed text-slate-700">
                コンビニやチェーン店、スーパーで買える、高たんぱくな食品をまとめていきます。
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="flex flex-col gap-6 rounded-3xl bg-white/95 p-8 shadow-2xl">
              <h2 className="text-xl font-semibold text-[#7C2D12]">絞り込み</h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">カテゴリ</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory === "all"
                        ? "bg-[#FF8A23] text-white shadow-lg"
                        : "bg-[#FFE7C2] text-[#C2410C] hover:bg-[#FFD29A]"
                    }`}
                  >
                    すべて
                  </button>
                  {highProteinCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedCategory === category
                          ? "bg-[#FF8A23] text-white shadow-lg"
                          : "bg-[#FFE7C2] text-[#C2410C] hover:bg-[#FFD29A]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="keyword">
                  キーワード
                </label>
                <input
                  id="keyword"
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="商品名を入力"
                  className="w-full rounded-xl border border-[#FCD27B] bg-white px-4 py-2 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchKeyword("");
                }}
                className="mt-2 rounded-2xl border border-transparent bg-[#FDBA74] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#FB923C]"
              >
                条件をリセット
              </button>
            </aside>

            <section className="flex flex-col gap-6">
              <header className="flex flex-col gap-3 rounded-3xl bg-[#FFE7C2] px-6 py-4 text-sm text-[#7C2D12] shadow-inner sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">{filteredFoods.length}件の食品がヒットしました</div>
                <div className="text-xs sm:text-sm">比較しやすいように商品ごとの成分を掲載しています</div>
              </header>

              {filteredFoods.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-12 text-center text-slate-600 shadow-inner">
                  条件に一致する食品が見つかりませんでした。キーワードやカテゴリを変更してみてください。
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredFoods.map((food) => (
                    <article
                      key={food.name}
                      className="flex h-full flex-col gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-6 shadow-xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            categoryStyles[food.category] ?? "bg-[#475569] text-white"
                          }`}
                        >
                          {food.category}
                        </span>
                      </div>

                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#FFF7EB]">
                        <Image
                          src={food.imageUrl}
                          alt={food.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <h2 className="text-xl font-bold leading-tight text-[#7C2D12]">{food.name}</h2>
                        <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                          {nutritionItems.map((item) => (
                            <div key={item.key} className="rounded-2xl bg-[#FFF7EB] px-4 py-3">
                              <dt className="font-semibold text-slate-700">{item.label}</dt>
                              <dd className="mt-1 text-base font-bold text-[#7C2D12]">
                                {food[item.key]}
                                {item.unit}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
