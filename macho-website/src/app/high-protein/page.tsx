import type { Metadata } from "next";

import { HighProteinPage } from "@/components/high-protein-page";
import { buildUrl } from "@/lib/seo";

const DESCRIPTION =
  "高たんぱく質な食材をカテゴリ別に検索・比較できるデータベース。タンパク質量やカロリー、脂質で絞り込みながら効率的に食材を選べます。";
const pageUrl = buildUrl("/high-protein");

export const metadata: Metadata = {
  title: "高たんぱく質フード一覧｜マチョ田の部屋",
  description: DESCRIPTION,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "高たんぱく質フード一覧｜マチョ田の部屋",
    description: DESCRIPTION,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "高たんぱく質フード一覧｜マチョ田の部屋",
    description: DESCRIPTION,
  },
};

export default function Page() {
  return <HighProteinPage />;
}
