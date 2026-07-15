import Image from "next/image";

import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { AffiliateLink } from "@/components/affiliate-link";
import { RecommendationNotes } from "@/components/recommendation-notes";
import { SiteHeader } from "@/components/site-header";
import { MALE_FIXED_BRAND_CONFIG, MALE_FIXED_BRAND_ORDER, MALE_FIXED_COMMENTS, MALE_FIXED_SCORES } from "@/lib/protein-rankings/constants";
import { buildAmazonAffiliateUrl, buildProductOutboundLink, buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import type { CommerceProvider, ProteinRankingPageData, RankingCardItem } from "@/lib/protein-rankings/types";
import { buildUrl, toJsonLd } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";

type CreatineRecommendation = {
  rank: number;
  name: string;
  comment: string;
  imageUrl: string;
  pricePerKgYen: number;
  rakutenUrl?: string;
  amazonUrl?: string;
  bestFor: string;
  caution: string;
  evaluation: string;
};

type PreWorkoutRecommendation = {
  name: string;
  comment: string;
  imageUrl: string;
  iherbUrl: string;
  bestFor: string;
  caution: string;
  evaluation: string;
};

const creatineRecommendations: CreatineRecommendation[] = [
  {
    rank: 1,
    name: "INNOCECT（イノセクト）",
    comment: "イノセクトは昔からコスパ最強のクレアチンのブランド。",
    imageUrl: "https://shop.r10s.jp/innocect/cabinet/amino/creatine/new_creatin.jpg",
    pricePerKgYen: 2040,
    amazonUrl:
      "https://www.amazon.co.jp/INNOCECT-%E3%82%AF%E3%83%AC%E3%82%A2%E3%83%81%E3%83%B3-%E3%83%A2%E3%83%8E%E3%83%8F%E3%82%A4%E3%83%89%E3%83%AC%E3%83%BC%E3%83%88-1000g-%E9%AB%98%E7%B4%94%E5%BA%A699-9/dp/B0DHTBTPJQ/ref=sr_1_3_pp?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&s=hpc&sr=1-3",
    rakutenUrl:
      "https://item.rakuten.co.jp/innocect/cre_1000/?iasid=07rpp_10095___2t-mompqf6d-1a-760651ea-0acb-40b3-88ee-e30aa1bc794a",
    bestFor: "毎日続けやすい価格を優先したい人",
    caution: "粉末なので、毎日量を測って飲む必要があります。",
    evaluation: "継続しやすい価格と、シンプルなモノハイドレートで選定",
  },
  {
    rank: 2,
    name: "Nature In（ネイチャーイン）",
    comment: "INNOCECTの次に安いクレアチンブランド。たまに最安値になる時もあるので、INNOCECTを購入する前に確認はしておきたい。",
    imageUrl: "https://m.media-amazon.com/images/I/61Jwb0vWWZL._AC_SL1500_.jpg",
    pricePerKgYen: 2390,
    amazonUrl:
      "https://www.amazon.co.jp/Nature-%EF%BC%88%E3%83%8D%E3%82%A4%E3%83%81%E3%83%A3%E3%83%BC%E3%82%A4%E3%83%B3%EF%BC%89-%E3%82%AF%E3%83%AC%E3%82%A2%E3%83%81%E3%83%B3%E3%83%A2%E3%83%8E%E3%83%8F%E3%82%A4%E3%83%89%E3%83%AC%E3%83%BC%E3%83%88-%E3%82%88%E3%81%8F%E9%96%89%E3%81%BE%E3%82%8B%E3%83%81%E3%83%A3%E3%83%83%E3%82%AF-ISO22000%E8%A6%8F%E6%A0%BC/dp/B0FY5PBSM1/ref=sr_1_7?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&sr=8-7",
    bestFor: "Amazonで価格を比較して買いたい人",
    caution: "販売価格は変動するため、購入前にINNOCECTとも比較してください。",
    evaluation: "Amazonで買いやすい低価格帯のモノハイドレートとして選定",
  },
];

const preWorkoutRecommendation: PreWorkoutRecommendation = {
  name: "PRE-X",
  comment: "コスパ最強のプレワークアウトです。モンスターとかレッドブルを買うならこれを買って炭酸で割って飲みましょう。",
  imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto%2Cq_auto%3Aeco/images/ncs/ncs67096/l/8.jpg",
  iherbUrl:
    "https://jp.iherb.com/search?sug=nutricost%20pre-x&kw=nutricost%20pre-x&rank=4&rawkw=pre-x&refererLocation=suggestion",
  bestFor: "トレーニング前の集中力を高めたい人",
  caution: "カフェインを含むため、夜の使用や摂りすぎには注意が必要です。",
  evaluation: "1回あたりの価格と成分構成を重視して選定",
};

const proteinRecommendationNotes: Record<
  (typeof MALE_FIXED_BRAND_ORDER)[number],
  { bestFor: string; caution: string; evaluation: string }
> = {
  verifyst: {
    bestFor: "ホエイを1kgあたりの価格重視で選びたい人",
    caution: "表示中の商品はホエイです。マチョ田が購入した同ブランドの商品はソイです。",
    evaluation: "ホエイの参考価格と、同ブランドのソイを実際に購入した経験から選定",
  },
  "x-plosion": {
    bestFor: "味・成分・価格のバランスを重視したい人",
    caution: "大容量の商品が中心なので、初めての味は少量品での確認がおすすめです。",
    evaluation: "価格だけでなく、味と成分のバランスも含めて比較",
  },
  "gold standard": {
    bestFor: "価格よりも味と成分を優先したい人",
    caution: "国産の大容量プロテインと比べると1kgあたりの価格は高めです。",
    evaluation: "成分、味、定番ブランドとしての信頼性を重視",
  },
};

const getBrandKey = (item: RankingCardItem) => {
  const sourceExternalId = item.product.source_external_id;
  if (sourceExternalId.startsWith("curated:")) {
    const key = sourceExternalId.replace("curated:", "");
    if (key in MALE_FIXED_BRAND_CONFIG) {
      return key as (typeof MALE_FIXED_BRAND_ORDER)[number];
    }
  }

  const haystack = `${item.product.title} ${item.metrics?.canonical_brand ?? ""} ${item.product.shop_name ?? ""}`.toLowerCase();
  return MALE_FIXED_BRAND_ORDER.find((key) =>
    MALE_FIXED_BRAND_CONFIG[key].aliases.some((alias) => haystack.includes(alias.toLowerCase()))
  );
};

const formatUpdatedAt = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const formatPricePerKg = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  const weightG = item.metrics?.content_weight_g;
  const priceYen = item.product.price_yen;

  if (priceYen && priceYen > 0) {
    const effectiveWeightG =
      weightG && weightG > 0
        ? weightG
        : brandKey
          ? MALE_FIXED_BRAND_CONFIG[brandKey].preferredWeightG
          : null;

    if (effectiveWeightG) {
      const pricePerKg = Math.round((priceYen / effectiveWeightG) * 1000);
      return `${pricePerKg.toLocaleString("ja-JP")}円`;
    }
  }

  if (brandKey) {
    return `${MALE_FIXED_BRAND_CONFIG[brandKey].fallbackPricePerKgYen.toLocaleString("ja-JP")}円`;
  }

  return "楽天で確認";
};

const getOutboundLabel = (provider: CommerceProvider) => {
  switch (provider) {
    case "rakuten":
    default:
      return "楽天で見る";
  }
};

const getFallbackImagePath = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  return brandKey ? MALE_FIXED_BRAND_CONFIG[brandKey].fallbackImagePath : null;
};

const getProductImagePath = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);

  if (brandKey === "verifyst") {
    return MALE_FIXED_BRAND_CONFIG[brandKey].fallbackImagePath;
  }

  return item.product.image_url ?? getFallbackImagePath(item);
};

const getDisplayTitle = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  return brandKey ? MALE_FIXED_BRAND_CONFIG[brandKey].displayName : item.product.title;
};

const getAmazonUrl = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  return brandKey ? buildAmazonAffiliateUrl(MALE_FIXED_BRAND_CONFIG[brandKey].amazonSearchUrl) : null;
};

const getRakutenUrl = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  if (brandKey && MALE_FIXED_BRAND_CONFIG[brandKey].rakutenSearchUrl) {
    return buildRakutenAffiliateUrl(MALE_FIXED_BRAND_CONFIG[brandKey].rakutenSearchUrl);
  }

  if (brandKey) {
    return null;
  }

  return buildProductOutboundLink({
    provider: item.product.ec_provider,
    affiliateUrl: item.product.affiliate_url,
    itemUrl: item.product.item_url ?? "#",
  });
};

const MetricChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-[#FFF4E7] px-4 py-3 text-sm text-slate-700 shadow-inner">
    <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">{label}</div>
    <div className="mt-1 font-medium text-slate-800">{value}</div>
  </div>
);

const renderMaleHighlights = (item: RankingCardItem) => (
  <>
    <MetricChip label="1kgあたり" value={formatPricePerKg(item)} />
    <MetricChip
      label="美味しさ"
      value={getBrandKey(item) ? MALE_FIXED_BRAND_CONFIG[getBrandKey(item) as (typeof MALE_FIXED_BRAND_ORDER)[number]].tasteRating : "不明"}
    />
    <MetricChip
      label="成分"
      value={getBrandKey(item) ? MALE_FIXED_BRAND_CONFIG[getBrandKey(item) as (typeof MALE_FIXED_BRAND_ORDER)[number]].formulaRating : "不明"}
    />
  </>
);

const buildFallbackRankingItem = (
  brandKey: (typeof MALE_FIXED_BRAND_ORDER)[number],
  index: number
): RankingCardItem => {
  const config = MALE_FIXED_BRAND_CONFIG[brandKey];

  return {
    rank: index + 1,
    score: MALE_FIXED_SCORES[brandKey] / 100,
    comment: MALE_FIXED_COMMENTS[brandKey],
    product: {
      id: `fallback-${brandKey}`,
      ec_provider: "rakuten",
      title: config.fallbackTitle,
      image_url: config.fallbackImagePath,
      price_yen: 0,
      review_average: null,
      review_count: 0,
      item_url: config.rakutenSearchUrl ?? null,
      affiliate_url: null,
      shop_name: config.label,
      matched_queries: ["fixed fallback"],
      source_external_id: `curated:${brandKey}`,
    },
    metrics: null,
  };
};

const ensureFixedProteinItems = (items: RankingCardItem[]) => {
  const itemByBrand = new Map<(typeof MALE_FIXED_BRAND_ORDER)[number], RankingCardItem>();

  items.forEach((item) => {
    const brandKey = getBrandKey(item);
    if (brandKey) {
      itemByBrand.set(brandKey, item);
    }
  });

  return MALE_FIXED_BRAND_ORDER.map((brandKey, index) => {
    const item = itemByBrand.get(brandKey) ?? buildFallbackRankingItem(brandKey, index);
    return {
      ...item,
      rank: index + 1,
      score: MALE_FIXED_SCORES[brandKey] / 100,
      comment: MALE_FIXED_COMMENTS[brandKey],
    };
  });
};

const RankingCard = ({ item }: { item: RankingCardItem }) => {
  const brandKey = getBrandKey(item);
  const notes = brandKey ? proteinRecommendationNotes[brandKey] : null;

  return (
    <article
      id={brandKey ? `protein-${brandKey.replaceAll(" ", "-")}` : undefined}
      className="grid scroll-mt-24 gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6"
    >
      <div className="flex items-start gap-4 sm:block">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
          {item.rank}
        </div>
        <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
          {getProductImagePath(item) ? (
            <Image
              src={getProductImagePath(item) as string}
              alt={item.product.title}
              fill
              sizes="108px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">画像なし</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{getDisplayTitle(item)}</h3>
          <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {renderMaleHighlights(item)}
        </div>

        {notes ? <RecommendationNotes {...notes} /> : null}

        <div className="flex flex-wrap items-center gap-3">
          {getAmazonUrl(item) ? (
            <AffiliateLink
              href={getAmazonUrl(item) as string}
              merchant="amazon"
              productName={getDisplayTitle(item)}
              rank={item.rank}
              placement="protein-ranking"
              className="rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]"
            >
              Amazonで見る
            </AffiliateLink>
          ) : null}
          {getRakutenUrl(item) ? (
            <AffiliateLink
              href={getRakutenUrl(item) as string}
              merchant="rakuten"
              productName={getDisplayTitle(item)}
              rank={item.rank}
              placement="protein-ranking"
              className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
            >
              {getOutboundLabel(item.product.ec_provider)}
            </AffiliateLink>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const CreatineCard = ({ item }: { item: CreatineRecommendation }) => (
  <article id={`creatine-${item.rank}`} className="grid scroll-mt-24 gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6">
    <div className="flex items-start gap-4 sm:block">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
        {item.rank}
      </div>
      <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
        <Image src={item.imageUrl} alt={item.name} fill sizes="108px" className="object-cover" />
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{item.name}</h3>
        <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricChip label="1kgあたり" value={`${item.pricePerKgYen.toLocaleString("ja-JP")}円`} />
      </div>

      <RecommendationNotes bestFor={item.bestFor} caution={item.caution} evaluation={item.evaluation} />

      <div className="flex flex-wrap items-center gap-3">
        {item.amazonUrl ? (
          <AffiliateLink
            href={buildAmazonAffiliateUrl(item.amazonUrl)}
            merchant="amazon"
            productName={item.name}
            rank={item.rank}
            placement="creatine-ranking"
            className="rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]"
          >
            Amazonで見る
          </AffiliateLink>
        ) : null}
        {item.rakutenUrl ? (
          <AffiliateLink
            href={buildRakutenAffiliateUrl(item.rakutenUrl)}
            merchant="rakuten"
            productName={item.name}
            rank={item.rank}
            placement="creatine-ranking"
            className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
          >
            楽天で見る
          </AffiliateLink>
        ) : null}
      </div>
    </div>
  </article>
);

const PreWorkoutCard = ({ item }: { item: PreWorkoutRecommendation }) => (
  <article id="pre-workout-1" className="grid scroll-mt-24 gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6">
    <div className="flex items-start gap-4 sm:block">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
        1
      </div>
      <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
        <Image src={item.imageUrl} alt={item.name} fill sizes="108px" className="object-cover" />
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{item.name}</h3>
        <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
      </div>

      <RecommendationNotes bestFor={item.bestFor} caution={item.caution} evaluation={item.evaluation} />

      <div className="flex flex-wrap items-center gap-3">
        <AffiliateLink
          href={item.iherbUrl}
          merchant="iherb"
          productName={item.name}
          rank={1}
          placement="pre-workout-recommendation"
          className="rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9A3412]"
        >
          iHerbで見る
        </AffiliateLink>
      </div>
    </div>
  </article>
);

export function SupplementsTopPage({ data }: { data: ProteinRankingPageData }) {
  const updatedAtLabel = formatUpdatedAt(data.updatedAt);
  const filteredSections = data.sections.map((section) => ({
    ...section,
    items: ensureFixedProteinItems(section.items.filter((item) => {
      const brandKey = getBrandKey(item);
      return brandKey ? MALE_FIXED_BRAND_ORDER.includes(brandKey) : false;
    })),
  }));
  const itemListStructuredData = toJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "おすすめプロテイン TOP3",
      numberOfItems: MALE_FIXED_BRAND_ORDER.length,
      itemListElement: MALE_FIXED_BRAND_ORDER.map((brandKey, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: MALE_FIXED_BRAND_CONFIG[brandKey].displayName,
        url: `${buildUrl("/supplements-ranking")}#protein-${brandKey.replaceAll(" ", "-")}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "おすすめクレアチン TOP2",
      numberOfItems: creatineRecommendations.length,
      itemListElement: creatineRecommendations.map((item) => ({
        "@type": "ListItem",
        position: item.rank,
        name: item.name,
        url: `${buildUrl("/supplements-ranking")}#creatine-${item.rank}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "おすすめプレワークアウト",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: preWorkoutRecommendation.name,
          url: `${buildUrl("/supplements-ranking")}#pre-workout-1`,
        },
      ],
    },
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListStructuredData }} />
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Protein / Creatine
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">おすすめプロテイン/クレアチン/プレワークアウト</h1>
              <p className="max-w-5xl whitespace-pre-line text-base leading-8 text-slate-700">
                {`筋トレをするなら、基本は「プロテイン」と「クレアチン」を摂取しておけば間違いありません。
プロテインは筋肉の材料となるたんぱく質を手軽に補給でき、クレアチンは筋力やトレーニングパフォーマンス向上が期待できます。
さらに、トレーニング中の集中力やモチベーションを高めたい方には、プレワークアウトもおすすめです。
一方で、EAA・BCAAはプロテインを十分摂取できていれば必要なアミノ酸を補えるため、不要だと考えています。`}
              </p>
              {updatedAtLabel ? (
                <p className="text-sm text-slate-500">最終更新: {updatedAtLabel}</p>
              ) : (
                <p className="text-sm text-slate-500">おすすめ商品の表示を準備中です。</p>
              )}
              <AffiliateDisclosure />
            </div>
          </section>

          {filteredSections.map((section) => (
            <section key={section.key} className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">{section.title}</h2>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#FCD27B] bg-[#FFF8EE] p-8 text-sm text-slate-600">
                  まだおすすめを表示できていません。
                </div>
              ) : (
                <div className="grid gap-5">
                  {section.items.map((item) => (
                    <RankingCard key={`${section.key}-${item.product.id}`} item={item} />
                  ))}
                </div>
              )}
            </section>
          ))}

          <section className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">おすすめクレアチン TOP2</h2>
              <p className="rounded-2xl bg-[#FFF4E7] px-4 py-3 text-sm leading-7 text-slate-700 sm:text-base">
                クレアルカリンはコスパがかなり悪いので、あまりおすすめしません。粉のモノハイドレートがコスパ最強なのでおすすめです。
              </p>
            </div>
            <div className="grid gap-5">
              {creatineRecommendations.map((item) => (
                <CreatineCard key={item.name} item={item} />
              ))}
            </div>
          </section>

          <section className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">おすすめプレワークアウト</h2>
            </div>
            <PreWorkoutCard item={preWorkoutRecommendation} />
          </section>
        </div>
      </main>
    </div>
  );
}
