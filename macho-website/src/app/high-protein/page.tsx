"use client";

import { useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import {
  HighProteinFood,
  highProteinCategories,
  highProteinFoods,
} from "@/data/high-protein-foods";

type SortKey = "proteinDesc" | "energyAsc" | "fatAsc" | "nameAsc";

const proteinValues = highProteinFoods.map((food) => food.proteinPer100g);

const MIN_PROTEIN = Math.min(...proteinValues);
const MAX_PROTEIN = Math.max(...proteinValues);

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "proteinDesc", label: "たんぱく質が多い順" },
  { value: "energyAsc", label: "カロリーが低い順" },
  { value: "fatAsc", label: "脂質が低い順" },
  { value: "nameAsc", label: "名前順" },
];

const profileImageSrc = "/picture/ore.png";

const applySort = (items: HighProteinFood[], sortKey: SortKey) => {
  return [...items].sort((a, b) => {
    switch (sortKey) {
      case "proteinDesc":
        return b.proteinPer100g - a.proteinPer100g;
      case "energyAsc":
        return a.energyPer100g - b.energyPer100g;
      case "fatAsc":
        return a.fatPer100g - b.fatPer100g;
      case "nameAsc":
        return a.name.localeCompare(b.name, "ja");
      default:
        return 0;
    }
  });
};

const highlightColorByCategory = (category: string) => {
  switch (category) {
    case "肉類":
      return "bg-[#f97316] text-white";
    case "魚類":
      return "bg-[#0ea5e9] text-white";
    case "卵・豆類":
      return "bg-[#8b5cf6] text-white";
    case "乳製品":
      return "bg-[#14b8a6] text-white";
    default:
      return "bg-[#475569] text-white";
  }
};

export default function HighProteinPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [minProtein, setMinProtein] = useState<number>(20);
  const [sortKey, setSortKey] = useState<SortKey>("proteinDesc");

  const filteredFoods = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const base = highProteinFoods.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesKeyword =
        keyword.length === 0 || item.name.toLowerCase().includes(keyword);
      const matchesProtein = item.proteinPer100g >= minProtein;
      return matchesCategory && matchesKeyword && matchesProtein;
    });

    return applySort(base, sortKey);
  }, [selectedCategory, searchKeyword, minProtein, sortKey]);

  const topProteinFoods = useMemo(
    () =>
      [...highProteinFoods]
        .sort((a, b) => b.proteinPer100g - a.proteinPer100g)
        .slice(0, 3),
    []
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-6 md:px-12 pb-24">
        <section className="max-w-6xl mx-auto pt-20 pb-16">
          <div className="flex flex-col gap-8 rounded-3xl bg-white/90 p-10 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-5 text-slate-800">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#7C2D12]">
                高たんぱく質フード一覧
              </h1>
              <p className="text-base leading-relaxed text-slate-700">
                高たんぱくな食材を一覧にまとめました。タンパク質が必要なのは筋肉だけではありません。髪や爪、皮膚などにも必要なのです。美しくなりたい、かっこよくなるためにもタンパク質は不可欠です。
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topProteinFoods.map((food, index) => (
                <div
                  key={`top-${food.name}`}
                  className="rounded-2xl border border-[#FCD27B] bg-[#FFF7EB] p-6 shadow-lg"
                >
                  <span
                    className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${highlightColorByCategory(
                      food.category
                    )}`}
                  >
                    TOP{index + 1}
                  </span>
                  <h2 className="text-xl font-bold text-[#7C2D12]">{food.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    100gあたり {food.proteinPer100g.toFixed(1)}g のたんぱく質。
                  </p>
                  <p className="text-xs text-slate-500">※以下はすべて100gあたりの値です</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <dt className="font-semibold text-slate-800">タンパク質</dt>
                      <dd>{food.proteinPer100g.toFixed(1)}g</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">エネルギー</dt>
                      <dd>{food.energyPer100g}kcal</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">炭水化物</dt>
                      <dd>{food.carbsPer100g.toFixed(1)}g</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">脂質</dt>
                      <dd>{food.fatPer100g.toFixed(1)}g</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="flex flex-col gap-6 rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur">
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
                  placeholder="食材名を入力"
                  className="w-full rounded-xl border border-[#FCD27B] bg-white px-4 py-2 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-700" htmlFor="protein-range">
                  最低たんぱく質 ({minProtein.toFixed(1)}g)
                </label>
                <input
                  id="protein-range"
                  type="range"
                  min={MIN_PROTEIN}
                  max={MAX_PROTEIN}
                  value={minProtein}
                  step={0.5}
                  onChange={(event) => setMinProtein(Number(event.target.value))}
                  className="accent-[#FF8A23]"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{MIN_PROTEIN}g</span>
                  <span>{MAX_PROTEIN}g</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="sort-key">
                  並び替え
                </label>
                <select
                  id="sort-key"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  className="w-full rounded-xl border border-[#FCD27B] bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/40"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchKeyword("");
                  setMinProtein(20);
                  setSortKey("proteinDesc");
                }}
                className="mt-2 rounded-2xl border border-transparent bg-[#FDBA74] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#FB923C]"
              >
                条件をリセット
              </button>
            </aside>

            <section className="flex flex-col gap-6">
              <header className="flex flex-col gap-3 rounded-3xl bg-[#FFE7C2] px-6 py-4 text-sm text-[#7C2D12] shadow-inner sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">
                  {filteredFoods.length}件の食材がヒットしました
                </div>
                <div className="text-xs sm:text-sm">
                  条件: たんぱく質 ≥ {minProtein.toFixed(1)}g
                </div>
              </header>

              {filteredFoods.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-12 text-center text-slate-600 shadow-inner">
                  条件に一致する食材が見つかりませんでした。フィルターを調整して再検索してみてください。
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredFoods.map((food) => (
                    <article
                      key={food.name}
                      className="relative flex h-full flex-col gap-4 rounded-3xl border border-[#FCD27B] bg-white/95 p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex items-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${highlightColorByCategory(
                            food.category
                          )}`}
                        >
                          {food.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#7C2D12]">{food.name}</h3>
                      <p className="text-xs text-slate-500">※100gあたりの栄養成分</p>
                      <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <div>
                          <dt className="font-semibold text-slate-700">タンパク質</dt>
                          <dd>{food.proteinPer100g.toFixed(1)}g</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-700">エネルギー</dt>
                          <dd>{food.energyPer100g}kcal</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-700">炭水化物</dt>
                          <dd>{food.carbsPer100g.toFixed(1)}g</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-700">脂質</dt>
                          <dd>{food.fatPer100g.toFixed(1)}g</dd>
                        </div>
                      </dl>
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
