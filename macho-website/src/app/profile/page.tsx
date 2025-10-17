import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Youtube } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { buildUrl, toJsonLd } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const profilePageUrl = buildUrl("/profile");
const profileImageFullUrl = buildUrl(profileImageSrc);

export const metadata: Metadata = {
  title: "プロフィール｜マチョ田の部屋",
  description:
    "マチョ田（machoda）のプロフィール。AIエンジニアとしての経歴、保有資格、趣味やサイトへの想いを紹介します。",
  alternates: {
    canonical: profilePageUrl,
  },
  openGraph: {
    title: "プロフィール｜マチョ田の部屋",
    description:
      "マチョ田（machoda）のプロフィール。AIエンジニアとしての経歴、保有資格、趣味やサイトへの想いを紹介します。",
    url: profilePageUrl,
    type: "profile",
    images: [
      {
        url: profileImageFullUrl,
        width: 800,
        height: 800,
        alt: "マチョ田のプロフィール写真",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "プロフィール｜マチョ田の部屋",
    description:
      "マチョ田（machoda）のプロフィール。AIエンジニアとしての経歴、保有資格、趣味やサイトへの想いを紹介します。",
  },
};

export default function ProfilePage() {
  const structuredData = toJsonLd({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "マチョ田",
    alternateName: "machoda",
    jobTitle: "AIエンジニア",
    url: buildUrl("/profile"),
    image: profileImageFullUrl,
    sameAs: ["https://x.com/narita1_", "https://www.youtube.com/@ganmochan"],
    knowsAbout: ["筋トレ", "AI", "データ分析"],
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-20 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded-[32px] bg-white/95 p-10 shadow-2xl">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
          <section className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:text-left">
            <div className="overflow-hidden rounded-[28px] border-4 border-[#FFE7C2] bg-[#FFF8F0] shadow-lg">
              <Image
                src={profileImageSrc}
                alt="マチョ田のプロフィール写真"
                width={224}
                height={224}
                className="h-56 w-56 object-cover"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col items-center gap-4 md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8A23]">Profile</p>
                <h1 className="mt-2 text-3xl font-bold text-[#7C2D12] md:text-4xl">マチョ田 / machoda</h1>
              </div>
              <div className="flex gap-4">
                <Link
                  href="https://x.com/narita1_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition-transform duration-200 hover:scale-105"
                >
                  <span className="sr-only">X（旧Twitter）</span>
                  <span aria-hidden className="text-xl font-semibold leading-none">
                    X
                  </span>
                </Link>
                <Link
                  href="https://www.youtube.com/@ganmochan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white transition-transform duration-200 hover:scale-105"
                >
                  <span className="sr-only">YouTubeチャンネル</span>
                  <Youtube aria-hidden className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#FFE7C2] bg-[#FFF6EB] p-6 text-left shadow-inner">
              <h2 className="text-lg font-semibold text-[#7C2D12]">職業</h2>
              <p className="mt-3 text-sm leading-7 text-gray-700">AIエンジニア</p>
            </div>
            <div className="rounded-3xl border border-[#FFE7C2] bg-[#FFF6EB] p-6 text-left shadow-inner">
              <h2 className="text-lg font-semibold text-[#7C2D12]">資格</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-gray-700">
                <li>基本/応用情報</li>
                <li>G検定/E資格</li>
                <li>統計検定2級</li>
                <li>Python3 基礎/データ分析</li>
                <li>AWS SAA</li>
                <li>CCNA</li>
                <li>LPIC (LEVEL1)</li>
                <li>Oracle (Bronze)</li>
              </ul>
            </div>
            <div className="md:col-span-2 rounded-3xl border border-[#FFE7C2] bg-[#FFF6EB] p-6 text-left shadow-inner">
              <h2 className="text-lg font-semibold text-[#7C2D12]">趣味</h2>
              <p className="mt-3 text-sm leading-7 text-gray-700">
                腹筋ローラー、二日酔い（飲み始めたら限界まで飲まないと終われないタイプです）
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#FFE7C2] bg-[#FFF6EB] p-6 text-left shadow-inner">
            <h2 className="text-lg font-semibold text-[#7C2D12]">このサイトについて</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700">
              こんにちは、マチョ田です。
              このサイトでは、世の中に溢れる筋トレ情報を最適解としてまとめ、分かりやすく整理しています。
            </p>
            <p className="mt-3 text-sm leading-7 text-gray-700">
              筋トレの情報を探す時間がもったいないです。
              分からないことがあれば、まずはこのサイトをチェックして、浮いた時間をトレーニングに回しましょう。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
