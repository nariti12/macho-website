import type { Metadata } from "next";

import { SupplementsTopPage } from "@/components/supplements-top-page";
import { fetchProteinRankingPageData } from "@/lib/protein-rankings/repository";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/supplements-ranking");
const description =
  "迷ったらここから選べる、おすすめプロテイン TOP5。定番ブランドを中心に、今選びやすい5つをまとめています。";

export const metadata: Metadata = {
  title: "おすすめプロテイン TOP5｜マチョ田の部屋",
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "おすすめプロテイン TOP5｜マチョ田の部屋",
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おすすめプロテイン TOP5｜マチョ田の部屋",
    description,
  },
};

export const dynamic = "force-dynamic";

export default async function SupplementsRankingPage() {
  const data = await fetchProteinRankingPageData();

  return <SupplementsTopPage data={data} />;
}
