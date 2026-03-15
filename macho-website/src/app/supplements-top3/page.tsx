import type { Metadata } from "next";

import { SupplementsTopPage } from "@/components/supplements-top-page";
import { fetchProteinRankingPageData } from "@/lib/protein-rankings/repository";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/supplements-top3");
const description =
  "目的別に選びやすいよう、コスパ・成分・女性向けで厳選したプロテイン/サプリ最強TOP5を自動更新でお届けします。";

export const metadata: Metadata = {
  title: "プロテイン/サプリ 最強TOP5｜マチョ田の部屋",
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "プロテイン/サプリ 最強TOP5｜マチョ田の部屋",
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "プロテイン/サプリ 最強TOP5｜マチョ田の部屋",
    description,
  },
};

export const revalidate = 3600;

export default async function SupplementsTop3Page() {
  const data = await fetchProteinRankingPageData();

  return <SupplementsTopPage data={data} />;
}
