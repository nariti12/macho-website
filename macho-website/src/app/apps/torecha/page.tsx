import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TorechaPageShell } from "@/components/torecha-page-shell";
import { MACHO_CHARACTER_HEIGHT, MACHO_CHARACTER_WIDTH, getMachoCharacterAsset } from "@/lib/characters/macho-face2";
import { buildUrl, toJsonLd } from "@/lib/seo";

const pageUrl = buildUrl("/apps/torecha");

export const metadata: Metadata = {
  title: "トレチャ｜チャットで記録できる筋トレアプリ",
  description: "筋トレ、体組成、食事をチャットに送るだけ。AI食事スキャンとキャラクター育成にも対応した筋トレ記録アプリです。",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "トレチャ｜チャットで記録できる筋トレアプリ",
    description: "筋トレも食事も、チャットに送るだけ。",
    url: pageUrl,
    type: "website",
  },
};

const points = [
  {
    number: "01",
    title: "チャットで、全部まとまる",
    body: "筋トレ、体組成、食事、写真、メモをひとつのチャットに。トレーニングは重量と回数を選ぶだけでも、すぐ記録できます。",
  },
  {
    number: "02",
    title: "食事は撮るだけ。悩みはAIに聞くだけ。",
    body: "食事の写真からカロリーと栄養を自動で推定。AIパーソナルには、これまでの筋トレ・体組成・食事の記録をもとに相談できます。",
  },
  {
    number: "03",
    title: "ジムに通うほど、キャラクターが育つ",
    body: "ジムのIN・OUTと滞在時間を自動で記録。通った時間に合わせて、キャラクターが少しずつ進化します。",
  },
];

const characterStages = [1, 20, 50].map((level) => ({
  level,
  imageSrc: getMachoCharacterAsset(level).imageSrc,
}));

export default function TorechaPage() {
  const structuredData = toJsonLd({
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "トレチャ",
    alternateName: "Train Chat",
    operatingSystem: "iOS",
    applicationCategory: "HealthApplication",
    description: "筋トレ、体組成、食事をチャット形式で記録できるアプリ。",
    url: pageUrl,
  });

  return (
    <TorechaPageShell>
      <main className="bg-[#FCC081]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

        <section className="overflow-hidden border-b-2 border-[#171717] px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px] lg:gap-16">
            <div className="max-w-xl">
              <h1 className="text-4xl font-black leading-[1.14] tracking-tight text-[#171717] sm:text-6xl">
                トレーニングも食事も、<br />チャットでかんたん記録。
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="rounded-2xl bg-[#171717] px-6 py-4 text-base font-black text-white">App Storeで近日公開</span>
                <Link href="/apps/torecha/support" className="text-base font-bold text-[#171717] underline decoration-2 underline-offset-4">サポート</Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[38px] border-[8px] border-[#171717] bg-[#171717] shadow-[12px_14px_0_#FF8A23] sm:border-[10px]">
                <Image src="/apps/torecha/app-screen-ai.webp" alt="チャットに食事の写真を記録したトレチャの画面" width={588} height={650} priority className="h-auto w-full" sizes="(min-width: 640px) 340px, 78vw" />
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:py-16">
          <div className="mx-auto max-w-5xl border-t-2 border-[#171717]">
            {points.map((point) => (
              <article key={point.number} className="border-b-2 border-[#171717] py-8 sm:py-10">
                <div className="grid gap-3 sm:grid-cols-[72px_300px_1fr] sm:items-start sm:gap-6">
                  <span className="text-sm font-black text-[#9A3E00]">{point.number}</span>
                  <h2 className="text-2xl font-black leading-tight text-[#171717]">{point.title}</h2>
                  <p className="max-w-xl text-base font-medium leading-8 text-[#39281b]">{point.body}</p>
                </div>

                {point.number === "03" ? (
                  <div className="mt-8 overflow-hidden border-2 border-[#171717] bg-[#FFE4C5] px-3 pt-5 sm:ml-[96px] sm:px-8 sm:pt-7">
                    <div className="flex items-end justify-center gap-1 sm:gap-8">
                      {characterStages.map((stage, index) => (
                        <div key={stage.level} className="flex min-w-0 flex-1 items-end justify-center">
                          <div className="text-center">
                            <span className="inline-block rounded-full bg-[#171717] px-3 py-1 text-xs font-black text-white">Lv.{stage.level}</span>
                            <Image
                              src={stage.imageSrc}
                              alt={`レベル${stage.level}のキャラクター`}
                              width={MACHO_CHARACTER_WIDTH}
                              height={MACHO_CHARACTER_HEIGHT}
                              className={`mx-auto mt-2 h-auto object-contain ${index === 0 ? "w-[76px] sm:w-[108px]" : index === 1 ? "w-[100px] sm:w-[148px]" : "w-[132px] sm:w-[196px]"}`}
                              sizes="(min-width: 640px) 196px, 132px"
                            />
                          </div>
                          {index < characterStages.length - 1 ? <span aria-hidden="true" className="mb-20 shrink-0 text-xl font-black sm:mb-28 sm:text-3xl">→</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>
    </TorechaPageShell>
  );
}
