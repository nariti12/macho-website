import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { MALE_FIXED_BRAND_CONFIG, MALE_FIXED_BRAND_ORDER, MALE_FIXED_SCORES } from "@/lib/protein-rankings/constants";
import { buildProductOutboundLink } from "@/lib/protein-rankings/links";
import type { CommerceProvider, ProteinRankingPageData, RankingCardItem } from "@/lib/protein-rankings/types";

const profileImageSrc = "/picture/ore.png";

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

const formatReview = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  const fallbackReviewAverage = brandKey ? MALE_FIXED_BRAND_CONFIG[brandKey].fallbackReviewAverage ?? null : null;
  const fallbackReviewCount = brandKey ? MALE_FIXED_BRAND_CONFIG[brandKey].fallbackReviewCount ?? 0 : 0;
  const reviewAverage = item.product.review_average ?? fallbackReviewAverage;
  const reviewCount = item.product.review_count > 0 ? item.product.review_count : fallbackReviewCount;

  if (reviewAverage) {
    return `${reviewAverage.toFixed(2)}点/5点（レビュー数${reviewCount}件）`;
  }

  if (reviewCount > 0) {
    return `レビュー数${reviewCount}件`;
  }

  return "不明";
};

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

const getDisplayTitle = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  return brandKey ? MALE_FIXED_BRAND_CONFIG[brandKey].displayName : item.product.title;
};

const getDisplayScore = (item: RankingCardItem) => {
  const brandKey = getBrandKey(item);
  if (brandKey) {
    return MALE_FIXED_SCORES[brandKey];
  }
  return Math.round(item.score * 100);
};

const MetricChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-[#FFF4E7] px-4 py-3 text-sm text-slate-700 shadow-inner">
    <div className="text-xs font-semibold uppercase tracking-wide text-[#C2410C]">{label}</div>
    <div className="mt-1 font-medium text-slate-800">{value}</div>
  </div>
);

const renderMaleHighlights = (item: RankingCardItem) => (
  <>
    <MetricChip label="レビュー" value={formatReview(item)} />
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

const RankingCard = ({ item }: { item: RankingCardItem }) => (
  <article className="grid gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6">
    <div className="flex items-start gap-4 sm:block">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
        {item.rank}
      </div>
      <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
        {item.product.image_url || getFallbackImagePath(item) ? (
          <Image
            src={item.product.image_url ?? (getFallbackImagePath(item) as string)}
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#FFE7C2] px-3 py-1 text-xs font-semibold text-[#9A3412]">
            SCORE {getDisplayScore(item)}
          </span>
        </div>
        <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{getDisplayTitle(item)}</h3>
        <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {renderMaleHighlights(item)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={buildProductOutboundLink({
            provider: item.product.ec_provider,
            affiliateUrl: item.product.affiliate_url,
            itemUrl: item.product.item_url ?? "#",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#FF8A23] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
        >
          {getOutboundLabel(item.product.ec_provider)}
        </Link>
      </div>
    </div>
  </article>
);

export function SupplementsTopPage({ data }: { data: ProteinRankingPageData }) {
  const updatedAtLabel = formatUpdatedAt(data.updatedAt);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Protein Ranking
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">おすすめプロテイン TOP5</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                総合的に評価して、おすすめしたい最強プロテインTOP5をご紹介します。
              </p>
              {updatedAtLabel ? (
                <p className="text-sm text-slate-500">最終更新: {updatedAtLabel}</p>
              ) : (
                <p className="text-sm text-slate-500">ランキングを準備中です。更新が完了すると、ここにおすすめの5商品が表示されます。</p>
              )}
            </div>
          </section>

          {data.sections.map((section) => (
            <section key={section.key} className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">{section.title}</h2>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#FCD27B] bg-[#FFF8EE] p-8 text-sm text-slate-600">
                  まだおすすめを表示できていません。更新が反映されると、ここにTOP5が並びます。
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
        </div>
      </main>
    </div>
  );
}
