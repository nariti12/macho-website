import type { Metadata } from "next";

import { MachoClickerPage } from "@/components/macho-clicker-page";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/macho-clicker");
const description = "クリックで筋肉ポイントを稼ぎ、強化メニューでマチョ田級を目指すミニゲームです。";

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
  return <MachoClickerPage />;
}
