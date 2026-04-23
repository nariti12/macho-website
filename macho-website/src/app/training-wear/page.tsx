import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import { buildUrl } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/training-wear");

type ShoeItem = {
  rank: number;
  name: string;
  comment: string;
  searchUrl: string;
  imageUrl: string;
};

const shoeItems: ShoeItem[] = [
  {
    rank: 1,
    name: "INOV8（イノヴェイト）",
    comment: "ただただかっこいい。トレーニングにも最適なシューズで、個人的No.1。",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/INOV8%E3%80%80%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0/",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/store-descente/cabinet/542/nt5ssz93m_1001.jpg",
  },
  {
    rank: 2,
    name: "vibram fivefingers（ビブラム ファイブフィンガーズ）",
    comment: "プロの選手も愛用している方が多いです。イケてるゴリマッチョが履いているイメージです。",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%83%93%E3%83%96%E3%83%A9%E3%83%A0+%E3%83%95%E3%82%A1%E3%82%A4%E3%83%96%E3%83%95%E3%82%A3%E3%83%B3%E3%82%AC%E3%83%BC%E3%82%BA/?l-id=pc_header_search_suggest",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/vibramfivefingers/cabinet/fivefingers/imgrc0087708199.jpg",
  },
  {
    rank: 3,
    name: "親方寅さん トビシューズ",
    comment: "とにかく安い。荷物もかさばらない。現場用シューズですが、筋トレ用としても使いやすいです。",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E5%AF%85%E3%81%95%E3%82%93%E3%80%80%E3%82%B9%E3%83%AA%E3%83%83%E3%83%9D%E3%83%B3%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/luce-8/cabinet/1bn863.jpg",
  },
  {
    rank: 4,
    name: "NIKE Metcon（メトコン）",
    comment: "なんだかんだナイキがかっこいい。ナイキ好きなら、まず候補に入れたい一足です。",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%83%8A%E3%82%A4%E3%82%AD+%E3%83%A1%E3%83%88%E3%82%B3%E3%83%B3/?l-id=pc_header_search_suggest",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/supersportsxebio/cabinet/1/8250401/8631591_m.jpg",
  },
  {
    rank: 5,
    name: "SAGUARO（サグアロ） ベアフットシューズ",
    comment: "コスパ最強ベアフットシューズ。まずベアフット系を試したい人にも選びやすいです。",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%82%B5%E3%82%B0%E3%82%A2%E3%83%AD+%E3%83%99%E3%82%A2%E3%83%95%E3%83%83%E3%83%88%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/saguaro/cabinet/09107349/09133691/xza32_15.jpg",
  },
];

export const metadata: Metadata = {
  title: "おすすめトレーニングシューズ｜マチョ田の部屋",
  description: "カッコよくてジムに最適なトレーニングシューズをご紹介します。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "おすすめトレーニングシューズ｜マチョ田の部屋",
    description: "カッコよくてジムに最適なトレーニングシューズをご紹介します。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おすすめトレーニングシューズ｜マチョ田の部屋",
    description: "カッコよくてジムに最適なトレーニングシューズをご紹介します。",
  },
};

export const revalidate = 86400;

const getItemsWithImages = async () => {
  return shoeItems.map((item) => ({
    ...item,
    affiliateUrl: buildRakutenAffiliateUrl(item.searchUrl),
  }));
};

export default async function TrainingWearPage() {
  const items = await getItemsWithImages();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Training Shoes
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">おすすめトレーニングシューズ TOP5</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                カッコよくてジムに最適なトレーニングシューズをご紹介します。
              </p>
            </div>
          </section>

          <section className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
            <div className="grid gap-5">
              {items.map((item) => (
                <article
                  key={item.rank}
                  className="grid gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6"
                >
                  <div className="flex items-start gap-4 sm:block">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
                      {item.rank}
                    </div>
                    <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="108px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-bold leading-tight text-[#7C2D12]">{item.name}</h2>
                      <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
                      >
                        楽天で探す
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
