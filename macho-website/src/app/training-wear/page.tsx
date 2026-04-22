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
  searchKeyword: string;
  fallbackImage: string;
};

type RakutenSearchResponse = {
  Items?: Array<{
    itemName?: string;
    mediumImageUrls?: Array<string | { imageUrl?: string }>;
  }>;
};

const shoeItems: ShoeItem[] = [
  {
    rank: 1,
    name: "イノヴェイト",
    comment: "ただただかっこいい。ジムでも街でも映える、見た目重視で選びたい人におすすめです。",
    searchKeyword: "INOV8 トレーニング",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/INOV8%E3%80%80%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0/",
    fallbackImage: "/images/profile-placeholder.svg",
  },
  {
    rank: 2,
    name: "ビブラム ファイブフィンガーズ",
    comment: "プロの選手も愛用している方が多い印象。素足感覚で踏ん張りたいトレーニング向けです。",
    searchKeyword: "ビブラム ファイブフィンガーズ",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%83%93%E3%83%96%E3%83%A9%E3%83%A0+%E3%83%95%E3%82%A1%E3%82%A4%E3%83%96%E3%83%95%E3%82%A3%E3%83%B3%E3%82%AC%E3%83%BC%E3%82%BA/?l-id=pc_header_search_suggest",
    fallbackImage: "/images/profile-placeholder.svg",
  },
  {
    rank: 3,
    name: "親方寅さん トビシューズ",
    comment: "とにかく安い。荷物もかさばらない。現場用シューズですが、筋トレ用としても使いやすいです。",
    searchKeyword: "寅さん スリッポンシューズ",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E5%AF%85%E3%81%95%E3%82%93%E3%80%80%E3%82%B9%E3%83%AA%E3%83%83%E3%83%9D%E3%83%B3%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/",
    fallbackImage: "/images/profile-placeholder.svg",
  },
  {
    rank: 4,
    name: "NIKE メトコン",
    comment: "なんだかんだナイキがかっこいい。ナイキ好きなら、まず候補に入れたい一足です。",
    searchKeyword: "ナイキ メトコン",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%83%8A%E3%82%A4%E3%82%AD+%E3%83%A1%E3%83%88%E3%82%B3%E3%83%B3/?l-id=pc_header_search_suggest",
    fallbackImage: "/images/profile-placeholder.svg",
  },
  {
    rank: 5,
    name: "SAGUARO",
    comment: "コスパ最強ベアフットシューズ。まずベアフット系を試したい人にも選びやすいです。",
    searchKeyword: "サグアロ ベアフットシューズ",
    searchUrl:
      "https://search.rakuten.co.jp/search/mall/%E3%82%B5%E3%82%B0%E3%82%A2%E3%83%AD+%E3%83%99%E3%82%A2%E3%83%95%E3%83%83%E3%83%88%E3%82%B7%E3%83%A5%E3%83%BC%E3%82%BA/",
    fallbackImage: "/images/profile-placeholder.svg",
  },
];

export const metadata: Metadata = {
  title: "おすすめトレーニングシューズ｜マチョ田の部屋",
  description: "総合的に評価して、おすすめしたいトレーニングシューズをTOP5でご紹介します。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "おすすめトレーニングシューズ｜マチョ田の部屋",
    description: "筋トレ用におすすめしたいトレーニングシューズを、マチョ田目線で5つに絞って紹介します。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おすすめトレーニングシューズ｜マチョ田の部屋",
    description: "総合的に評価して、おすすめしたいトレーニングシューズをTOP5でご紹介します。",
  },
};

export const revalidate = 86400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getFirstMediumImageUrl = (images?: Array<string | { imageUrl?: string }>) => {
  if (!images) return null;

  for (const image of images) {
    if (typeof image === "string" && image.trim()) return image;
    if (typeof image === "object" && image.imageUrl) return image.imageUrl;
  }

  return null;
};

const fetchRakutenImage = async (keyword: string) => {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!applicationId || !accessKey) return null;

  const url = new URL("https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601");
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", "3");
  url.searchParams.set("page", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("elements", "itemName,mediumImageUrls");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessKey}`,
      Origin: process.env.RAKUTEN_SITE_ORIGIN || "https://www.machoda.com",
      Referer: `${process.env.RAKUTEN_SITE_ORIGIN || "https://www.machoda.com"}/`,
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    console.warn(`Failed to fetch Rakuten image for ${keyword}: ${response.status}`);
    return null;
  }

  const payload = (await response.json()) as RakutenSearchResponse;
  const imageUrl = getFirstMediumImageUrl(payload.Items?.[0]?.mediumImageUrls);

  return imageUrl;
};

const getItemsWithImages = async () => {
  const items = [];

  for (const item of shoeItems) {
    items.push({
      ...item,
      imageUrl: (await fetchRakutenImage(item.searchKeyword)) ?? item.fallbackImage,
      affiliateUrl: buildRakutenAffiliateUrl(item.searchUrl),
    });
    await sleep(700);
  }

  return items;
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
                総合的に評価して、おすすめしたいトレーニングシューズTOP5をご紹介します。
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
                      <span className="w-fit rounded-full bg-[#FFE7C2] px-3 py-1 text-xs font-semibold text-[#9A3412]">
                        RANK {item.rank}
                      </span>
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
