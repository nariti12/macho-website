import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildUrl } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/training-wear");

export const metadata: Metadata = {
  title: "トレーニングウェア｜マチョ田の部屋",
  description:
    "トレーニングウェアのおすすめブランドやコーディネートを準備中です。公開まで今しばらくお待ちください。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "トレーニングウェア｜マチョ田の部屋",
    description:
      "マチョ田が厳選するトレーニングウェア情報を準備しています。公開までしばらくお待ちください。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "トレーニングウェア｜マチョ田の部屋",
    description:
      "トレーニングウェアの特集ページを準備中です。最新情報をお届けするまでお待ちください。",
  },
};

export default function TrainingWearPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-20 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[32px] bg-white/95 p-10 text-center shadow-2xl">
          <h1 className="text-3xl font-bold text-[#7C2D12]">トレーニングウェア</h1>
          <p className="text-sm leading-6 text-gray-700">
            ただいま工事中です。近いうちに公開予定ですので、今しばらくお待ちください。
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className="rounded-full bg-[#FF8A23] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
            >
              トップページへ戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
