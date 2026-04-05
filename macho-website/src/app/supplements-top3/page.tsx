import type { Metadata } from "next";

import { SupplementsTopPage } from "@/components/supplements-top-page";
import { fetchProteinRankingPageData } from "@/lib/protein-rankings/repository";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/supplements-top3");
const description =
  "楽天売上ランキングをもとに、男性向けと女性向けに再選抜した最強プロテイン TOP5 を自動更新でお届けします。";

export const metadata: Metadata = {
  title: "最強プロテインランキング TOP5｜マチョ田の部屋",
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "最強プロテインランキング TOP5｜マチョ田の部屋",
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "最強プロテインランキング TOP5｜マチョ田の部屋",
    description,
  },
};

export const revalidate = 3600;

export default async function SupplementsTop3Page() {
  const data = await fetchProteinRankingPageData();

  return <SupplementsTopPage data={data} />;
}
