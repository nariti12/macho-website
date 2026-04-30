import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildAmazonAffiliateUrl, buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import { buildUrl } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/training-gear");

type GearItem = {
  rank: number;
  name: string;
  comment: string;
  imageUrl: string;
  searchUrl?: string;
  amazonUrl?: string;
};

type GearSection = {
  label: string;
  title: string;
  items: GearItem[];
};

const gearSections: GearSection[] = [
  {
    label: "Training Belt",
    title: "トレーニングベルト",
    items: [
      {
        rank: 1,
        name: "SBD",
        comment: "憧れのSBD。でも価格が高騰しすぎて買えません。高杉や・・・。",
        imageUrl: "https://shop.r10s.jp/jumblestore/cabinet/05987/2341684105987-01.jpg",
      },
      {
        rank: 2,
        name: "ゴールドジム プロレザー",
        comment: "ワンランク上のベルト。皮なじみが良く扱いやすいです。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%97%E3%83%AD%E3%83%AC%E3%82%B6%E3%83%BC+%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88/",
        amazonUrl:
          "https://www.amazon.co.jp/s?k=%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%97%E3%83%AD%E3%83%AC%E3%82%B6%E3%83%BC&__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/goldsgym/cabinet/ggp/imgrc0075354610.jpg",
      },
      {
        rank: 3,
        name: "ゴールドジム レザー",
        comment: "迷ったらこれ。王道ベルト。コスパ・品質ともに良し。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%AC%E3%82%B6%E3%83%BC+%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88/",
        amazonUrl:
          "https://www.amazon.co.jp/s?k=%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%99%E3%83%AB%E3%83%88",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/powerpit/cabinet/04825845/imgrc0092518792.jpg",
      },
      {
        rank: 4,
        name: "木澤さんベルト",
        comment: "木澤さんの魂が込められたベルト。",
        imageUrl: "https://fitnessshop.jp/cdn/shop/files/2d9c4804812069d1138604546f3593c3_1200x1200.png?v=1684400831",
      },
      {
        rank: 5,
        name: "鬼 ONI",
        comment: "最初は馴染むまで大変ですが、馴染むと最強です。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/ONI%E3%80%80%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88/200170/",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/tfgoods/cabinet/goodsp/compass1534142264.jpg",
      },
    ],
  },
  {
    label: "Power Grip",
    title: "パワーグリップ",
    items: [
      {
        rank: 1,
        name: "Versa Gripps",
        comment: "上級者マッチョはみんなこれを使ってる印象があります。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/versa+gripps+%E3%83%91%E3%83%AF%E3%83%BC%E3%82%B0%E3%83%AA%E3%83%83%E3%83%97/?l-id=pc_header_search_suggest",
        amazonUrl:
          "https://www.amazon.co.jp/s?k=versa+gripps+%E3%83%91%E3%83%AF%E3%83%BC%E3%82%B0%E3%83%AA%E3%83%83%E3%83%97",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/tkikaku/cabinet/traininggoods/vgripps/powergripps-aii2.jpg",
      },
      {
        rank: 2,
        name: "ゴールドジム",
        comment: "流石のゴールドジム。安心感しかない。間違いないです。Versa Grippsを1位にしましたが、機能面とか正直変わらないので、文字面の好みの問題です。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%91%E3%83%AF%E3%83%BC%E3%82%B0%E3%83%AA%E3%83%83%E3%83%97/",
        amazonUrl:
          "https://www.amazon.co.jp/s?k=%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%91%E3%83%AF%E3%83%BC%E3%82%B0%E3%83%AA%E3%83%83%E3%83%97&__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/goldsgym/cabinet/ggp/3710-2.jpg",
      },
    ],
  },
];

export const metadata: Metadata = {
  title: "おすすめトレーニングギア｜マチョ田の部屋",
  description: "筋トレで揃えておきたいおすすめトレーニングギアをご紹介します。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "おすすめトレーニングギア｜マチョ田の部屋",
    description: "筋トレで揃えておきたいおすすめトレーニングギアをご紹介します。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おすすめトレーニングギア｜マチョ田の部屋",
    description: "筋トレで揃えておきたいおすすめトレーニングギアをご紹介します。",
  },
};

export const revalidate = 86400;

const getSections = () =>
  gearSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      affiliateUrl: item.searchUrl ? buildRakutenAffiliateUrl(item.searchUrl) : null,
      amazonAffiliateUrl: item.amazonUrl ? buildAmazonAffiliateUrl(item.amazonUrl) : null,
    })),
  }));

export default function TrainingGearPage() {
  const sections = getSections();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Training Gear
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">おすすめトレーニングギア</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                筋トレで揃えておきたいおすすめトレーニングギアをご紹介します。
              </p>
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3">
                <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                  {section.label}
                </span>
                <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">{section.title}</h2>
              </div>

              <div className="grid gap-5">
                {section.items.map((item) => (
                  <article
                    key={`${section.title}-${item.rank}`}
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
                        <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{item.name}</h3>
                        <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
                      </div>

                      {item.affiliateUrl || item.amazonAffiliateUrl ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {item.amazonAffiliateUrl ? (
                            <Link
                              href={item.amazonAffiliateUrl}
                              target="_blank"
                              rel="nofollow sponsored noopener noreferrer"
                              className="rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]"
                            >
                              Amazonで見る
                            </Link>
                          ) : null}
                          {item.affiliateUrl ? (
                            <Link
                              href={item.affiliateUrl}
                              target="_blank"
                              rel="nofollow sponsored noopener noreferrer"
                              className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
                            >
                              楽天で探す
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
