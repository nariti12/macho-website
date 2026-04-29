import type { Metadata } from "next";

import { buildUrl } from "@/lib/seo";

import { IntakeCalculator } from "./_components/intake-calculator";

const pageUrl = buildUrl("/intake-calculator");
const heroImageUrl = buildUrl("/picture/man.png");

export const metadata: Metadata = {
  title: "１日摂取カロリー/たんぱく質 計算機｜マチョ田の部屋",
  description:
    "年齢・身長・体重・活動量から、1日の摂取カロリーとたんぱく質の目安を計算できる無料ツール。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "１日摂取カロリー/たんぱく質 計算機｜マチョ田の部屋",
    description:
      "年齢・身長・体重・活動量を入力すると、1日の摂取カロリーとたんぱく質の目安を計算します。",
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
    title: "１日摂取カロリー/たんぱく質 計算機｜マチョ田の部屋",
    description:
      "年齢・身長・体重・活動量から、1日の摂取カロリーとたんぱく質の目安を計算できる無料ツール。",
  },
};

export default function IntakeCalculatorPage() {
  return <IntakeCalculator />;
}
