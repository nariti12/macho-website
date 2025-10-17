import type { Metadata } from "next";
import { Suspense } from "react";

import { buildUrl } from "@/lib/seo";

import { MenuWizard } from "./_components/menu-wizard";

const pageUrl = buildUrl("/menu");
const heroImageUrl = buildUrl("/picture/man.png");

export const metadata: Metadata = {
  title: "用途別 最強筋トレメニュー｜マチョ田の部屋",
  description:
    "性別・トレーニングタイプ・頻度から最適な筋トレメニューを診断。ジム週３回の最強メニューを今すぐチェック。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "用途別 最強筋トレメニュー｜マチョ田の部屋",
    description:
      "性別・トレーニングタイプ・頻度から最適な筋トレメニューを診断。ジム週３回の最強メニューをチェック。",
    url: pageUrl,
    type: "website",
    images: [
      {
        url: heroImageUrl,
        width: 800,
        height: 800,
        alt: "マチョ田の部屋 キャラクター",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "用途別 最強筋トレメニュー｜マチョ田の部屋",
    description:
      "性別・トレーニングタイプ・頻度から最適な筋トレメニューを診断。ジム週３回の最強メニューを今すぐチェック。",
  },
};

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">読み込み中...</div>}>
      <MenuWizard />
    </Suspense>
  );
}
