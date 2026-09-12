import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TorechaPageShell } from "@/components/torecha-page-shell";
import { MACHO_CHARACTER_HEIGHT, MACHO_CHARACTER_WIDTH, MACHO_HERO_IMAGE } from "@/lib/characters/macho-face2";
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
    title: "チャットに送るだけ",
    body: "筋トレ、体組成、食事、写真、メモ。入力場所に迷わず、いつものチャットと同じ感覚で残せます。",
  },
  {
    number: "02",
    title: "写真も記録も、AIに相談",
    body: "トレチャ Plusなら、食事の写真からカロリーと栄養を推定。これまでの記録をもとに、トレーニングや食事も相談できます。",
  },
  {
    number: "03",
    title: "通うほど、キャラクターが育つ",
    body: "ジムの滞在時間を自動で記録。通った時間に合わせて、自分のキャラクターが成長します。",
  },
];

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
      <main className="bg-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

        <section className="overflow-hidden bg-[#FCC081] px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px] lg:gap-16">
            <div className="max-w-xl">
              <div className="flex items-center gap-4">
                <Image src="/apps/torecha/icon.webp" alt="トレチャのアプリアイコン" width={88} height={88} priority className="h-[72px] w-[72px] rounded-[18px] sm:h-[88px] sm:w-[88px] sm:rounded-[21px]" />
                <h1 className="text-4xl font-black tracking-tight text-[#171717] sm:text-6xl">トレチャ</h1>
              </div>
              <h2 className="mt-9 text-3xl font-black leading-tight tracking-tight text-[#171717] sm:text-5xl">筋トレも、食事も。<br />チャットに送るだけ。</h2>
              <p className="mt-6 text-base font-semibold leading-8 text-[#39281b] sm:text-lg">記録のために、複雑な画面を覚える必要はありません。</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="rounded-2xl bg-[#171717] px-6 py-4 text-base font-black text-white">App Storeで近日公開</span>
                <Link href="/apps/torecha/support" className="text-base font-bold text-[#171717] underline decoration-2 underline-offset-4">サポート</Link>
              </div>
            </div>

            <div className="relative mx-auto min-h-[500px] w-full max-w-[440px] sm:min-h-[580px]">
              <Image
                src={MACHO_HERO_IMAGE}
                alt="マチョ田のキャラクター"
                width={MACHO_CHARACTER_WIDTH}
                height={MACHO_CHARACTER_HEIGHT}
                className="absolute bottom-0 left-[-42px] z-10 h-auto w-[170px] object-contain sm:left-[-58px] sm:w-[220px]"
                sizes="220px"
              />
              <div className="absolute right-0 top-0 w-[78%] overflow-hidden rounded-[38px] border-[8px] border-[#171717] bg-[#171717] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] sm:border-[10px]">
                <Image src="/apps/torecha/app-screen-ai.webp" alt="チャットに食事の写真を記録したトレチャの画面" width={588} height={650} priority className="h-auto w-full" sizes="(min-width: 640px) 340px, 78vw" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:py-16">
          <div className="mx-auto max-w-5xl border-t-2 border-[#171717]">
            {points.map((point) => (
              <article key={point.number} className="grid gap-3 border-b-2 border-[#171717] py-8 sm:grid-cols-[72px_260px_1fr] sm:items-start sm:gap-6 sm:py-10">
                <span className="text-sm font-black text-[#FF8A23]">{point.number}</span>
                <h2 className="text-2xl font-black leading-tight text-[#171717]">{point.title}</h2>
                <p className="max-w-xl text-base leading-8 text-[#4a4a4a]">{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#FF8A23] px-5 py-12 text-center text-white sm:py-16">
          <h2 className="text-3xl font-black">記録を、もっと簡単に。</h2>
          <p className="mt-4 text-base font-semibold">トレチャは現在、公開に向けて準備中です。</p>
        </section>
      </main>
    </TorechaPageShell>
  );
}
