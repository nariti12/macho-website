import type { Metadata } from "next";

import { IntakeCalculator } from "./_components/intake-calculator";

export const metadata: Metadata = {
  title: "１日摂取カロリー/たんぱく質 計算機｜マチョ田の部屋",
  description:
    "年齢・身長・体重・活動量から男性・女性別に1日の推定摂取カロリーとタンパク質目安を算出する無料計算機。",
  openGraph: {
    title: "１日摂取カロリー/たんぱく質 計算機｜マチョ田の部屋",
    description:
      "年齢・身長・体重・活動量を入力すると、男性・女性別の1日の摂取カロリーとタンパク質目安を計算します。",
    url: "https://macho.example/intake-calculator",
    type: "website",
    images: [
      {
        url: "/picture/man.png",
        width: 800,
        height: 800,
        alt: "マチョ田の部屋 キャラクター",
      },
    ],
  },
};

export default function IntakeCalculatorPage() {
  return <IntakeCalculator />;
}

