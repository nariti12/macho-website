import type { Metadata } from "next";

import { MachoClickerV3 } from "@/components/macho-clicker-v3";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/macho-clicker");
const description = "マチョ田をタップして筋肉ポイントを獲得。器具を増やしてジムとタップ力を育て、Lv100を目指すクリッカーゲームです。";

export const metadata: Metadata = {
  title: "マチョクリッカー｜マチョ田の部屋",
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "マチョクリッカー｜マチョ田の部屋",
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "マチョクリッカー｜マチョ田の部屋",
    description,
  },
};

export default function Page() {
  return <MachoClickerV3 />;
}
