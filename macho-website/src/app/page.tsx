import type { Metadata } from "next";

import { HomePage } from "@/components/home-page";
import { fetchLatestBlogCards } from "@/lib/blogs";
import { buildUrl } from "@/lib/seo";

const DESCRIPTION =
  "マチョ田の部屋は筋トレの悩みを解決するための統合プラットフォーム。マチョ田の筋トレメニューやおすすめプロテイン情報など、筋トレに関する情報をまとめてお届けします。";

export const metadata: Metadata = {
  title: "マチョ田の部屋｜筋トレの悩みを解決する統合プラットフォーム",
  description: DESCRIPTION,
  alternates: {
    canonical: buildUrl("/"),
  },
  openGraph: {
    title: "マチョ田の部屋｜筋トレの悩みを解決する統合プラットフォーム",
    description: DESCRIPTION,
    url: buildUrl("/"),
    siteName: "マチョ田の部屋",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "マチョ田の部屋｜筋トレの悩みを解決する統合プラットフォーム",
    description: DESCRIPTION,
  },
};

export default async function Page() {
  const blogItems = await fetchLatestBlogCards(6).catch((error) => {
    console.error("Failed to render latest blogs on the home page", error);
    return [];
  });

  return <HomePage blogItems={blogItems} />;
}
