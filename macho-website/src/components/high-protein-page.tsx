"use client";

import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { highProteinFoods } from "@/data/high-protein-foods";

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
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-6 pb-24 md:px-12">
        <section className="mx-auto max-w-6xl pb-12 pt-20">
          <div className="flex flex-col gap-8 rounded-3xl bg-white/95 p-10 shadow-2xl">
            <div className="flex flex-col gap-5 text-slate-800">
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">高たんぱく食品一覧</h1>
              <p className="max-w-4xl text-base leading-relaxed text-slate-700">
                セブンイレブンや外食チェーン、スーパーで買いやすい高たんぱく食品をまとめていきます。まずは、手軽に食べやすくてタンパク質量もしっかり取れる商品から掲載しています。
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {highProteinFoods.map((food) => (
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

                <div className="mt-auto">
                  <Link
                    href={food.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
                  >
                    商品ページを見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
