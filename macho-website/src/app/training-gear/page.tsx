import Image from "next/image";
import type { Metadata } from "next";

import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { AffiliateLink } from "@/components/affiliate-link";
import { RecommendationNotes } from "@/components/recommendation-notes";
import { SiteHeader } from "@/components/site-header";
import { buildAmazonAffiliateUrl, buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import { fetchRakutenPriceLabel, formatYen } from "@/lib/rakuten-price";
import { buildUrl, toJsonLd } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/training-gear");

const formatLastUpdated = () =>
  new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

type GearItem = {
  rank: number;
  name: string;
  comment: string;
  imageUrl: string;
  fallbackPriceYen: number;
  searchUrl?: string;
  amazonUrl?: string;
  bestFor: string;
  caution: string;
  evaluation: string;
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
        fallbackPriceYen: 48800,
        bestFor: "高重量で使う本格的なレバー式ベルトが欲しい人",
        caution: "価格が高く、サイズ選びを誤ると使いにくいため事前確認が必須です。",
        evaluation: "剛性、固定力、定番ブランドとしての信頼性を評価",
      },
      {
        rank: 2,
        name: "鬼 ONI",
        comment: "最初は馴染むまで大変ですが、馴染むと最強です。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/ONI%E3%80%80%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88/200170/",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/tfgoods/cabinet/goodsp/compass1534142264.jpg",
        fallbackPriceYen: 19800,
        bestFor: "硬めのベルトを長く馴染ませて使いたい人",
        caution: "最初は硬く、身体に馴染むまで時間がかかります。",
        evaluation: "馴染んだ後の固定力と耐久性を評価",
      },
      {
        rank: 3,
        name: "木澤さんベルト",
        comment: "木澤さんの魂が込められたベルト。",
        imageUrl: "https://fitnessshop.jp/cdn/shop/files/2d9c4804812069d1138604546f3593c3_1200x1200.png?v=1684400831",
        fallbackPriceYen: 19800,
        bestFor: "選手のこだわりが反映された国産レザーベルトが欲しい人",
        caution: "販売状況やサイズ在庫は公式ページで確認が必要です。",
        evaluation: "木澤大祐さん監修の設計とレザー仕様を評価",
      },
      {
        rank: 4,
        name: "ゴールドジム レザー",
        comment: "迷ったらこれ。王道ベルト。コスパ・品質ともに良し。",
        searchUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%AC%E3%82%B6%E3%83%BC+%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88/",
        amazonUrl:
          "https://www.amazon.co.jp/s?k=%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B8%E3%83%A0+%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%99%E3%83%AB%E3%83%88",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/powerpit/cabinet/04825845/imgrc0092518792.jpg",
        fallbackPriceYen: 7920,
        bestFor: "初めてでも扱いやすい王道レザーベルトが欲しい人",
        caution: "レバー式ほど素早く締め外しできるタイプではありません。",
        evaluation: "価格、革の馴染みやすさ、入手しやすさを評価",
      },
      {
        rank: 5,
        name: "P.L.College",
        comment: "レバー式タイプでいい感じのやつです。",
        amazonUrl:
          "https://www.amazon.co.jp/P-L-College-P-L-College%E3%83%91%E3%83%AF%E3%83%BC%E3%83%99%E3%83%AB%E3%83%88-%E3%83%91%E3%83%AF%E3%83%BC%E3%83%81%E3%83%A5%E3%83%BC%E3%83%96%E9%96%8B%E7%99%BA-%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%99%E3%83%AB%E3%83%88-M/dp/B0F53HGKQP/ref=sr_1_6?sr=8-6",
        imageUrl: "https://m.media-amazon.com/images/I/31unTrG-pXL.jpg",
        fallbackPriceYen: 18000,
        bestFor: "比較的手頃なレバー式ベルトを探している人",
        caution: "Amazonのみの掲載なので、サイズと返品条件を確認してください。",
        evaluation: "レバー式の使いやすさと価格のバランスを評価",
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
        fallbackPriceYen: 11980,
        bestFor: "背中トレで握力をしっかり補助したい人",
        caution: "手首周りのサイズと装着方向に慣れが必要です。",
        evaluation: "使用者の多さ、グリップ力、耐久性を評価",
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
        fallbackPriceYen: 10450,
        bestFor: "定番ブランドの安心感を重視したい人",
        caution: "類似商品が多いため、正規品とサイズを確認してください。",
        evaluation: "機能性と入手しやすさをVersa Grippsと比較して選定",
      },
    ],
  },
];

export const metadata: Metadata = {
  title: "おすすめトレーニングギア｜マチョ田の部屋",
  description: "トレーニングベルトとパワーグリップを中心に、おすすめトレーニングギアをご紹介します。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "おすすめトレーニングギア｜マチョ田の部屋",
    description: "トレーニングベルトとパワーグリップを中心に、おすすめトレーニングギアをご紹介します。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "おすすめトレーニングギア｜マチョ田の部屋",
    description: "トレーニングベルトとパワーグリップを中心に、おすすめトレーニングギアをご紹介します。",
  },
};

export const revalidate = 604800;

const getSections = async () =>
  Promise.all(gearSections.map(async (section) => ({
    ...section,
    items: await Promise.all(section.items.map(async (item) => ({
      ...item,
      affiliateUrl: item.searchUrl ? buildRakutenAffiliateUrl(item.searchUrl) : null,
      amazonAffiliateUrl: item.amazonUrl ? buildAmazonAffiliateUrl(item.amazonUrl) : null,
      priceLabel: item.searchUrl
        ? await fetchRakutenPriceLabel(item.searchUrl, item.fallbackPriceYen)
        : formatYen(item.fallbackPriceYen),
    }))),
  })));

export default async function TrainingGearPage() {
  const sections = await getSections();
  const updatedAtLabel = formatLastUpdated();
  const itemListStructuredData = toJsonLd(
    sections.map((section, sectionIndex) => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `おすすめ${section.title}`,
      numberOfItems: section.items.length,
      itemListElement: section.items.map((item) => ({
        "@type": "ListItem",
        position: item.rank,
        name: item.name,
        url: `${pageUrl}#gear-${sectionIndex + 1}-${item.rank}`,
      })),
    })),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListStructuredData }} />
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Training Gear
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">おすすめトレーニングギア</h1>
              <p className="max-w-5xl whitespace-pre-line text-base leading-8 text-slate-700">
                {`トレーニングするなら「トレーニングベルト」と「パワーグリップ」は用意しておきたいです。トレーニングベルトは腹圧を高めて腰をサポートし、高重量トレーニング時により効かせるために役立ちます。
またパワーグリップは、握力を補助してくれるため、主に背中トレーニングで狙った筋肉に集中しやすくなり、効率よく追い込めます。`}
              </p>
              <p className="text-sm text-slate-500">最終更新: {updatedAtLabel}</p>
              <AffiliateDisclosure />
            </div>
          </section>

          {sections.map((section, sectionIndex) => (
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
                    id={`gear-${sectionIndex + 1}-${item.rank}`}
                    className="grid scroll-mt-24 gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6"
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
                      <div className="w-fit rounded-2xl bg-[#FFF4E7] px-4 py-3 text-sm text-slate-700 shadow-inner">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">参考価格</div>
                        <div className="mt-1 font-medium text-slate-800">{item.priceLabel}</div>
                      </div>

                      <RecommendationNotes
                        bestFor={item.bestFor}
                        caution={item.caution}
                        evaluation={item.evaluation}
                      />

                      {item.affiliateUrl || item.amazonAffiliateUrl ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {item.amazonAffiliateUrl ? (
                            <AffiliateLink
                              href={item.amazonAffiliateUrl}
                              merchant="amazon"
                              productName={item.name}
                              rank={item.rank}
                              placement={`training-gear-${section.title}`}
                              className="rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]"
                            >
                              Amazonで見る
                            </AffiliateLink>
                          ) : null}
                          {item.affiliateUrl ? (
                            <AffiliateLink
                              href={item.affiliateUrl}
                              merchant="rakuten"
                              productName={item.name}
                              rank={item.rank}
                              placement={`training-gear-${section.title}`}
                              className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
                            >
                              楽天で探す
                            </AffiliateLink>
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
