import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { buildProductOutboundLink } from "@/lib/protein-rankings/links";
import type { CommerceProvider, ProteinRankingPageData, ProteinType, RankingCardItem, RankingKey } from "@/lib/protein-rankings/types";

const profileImageSrc = "/picture/ore.png";

const formatProteinType = (proteinType: ProteinType | null | undefined) => {
  switch (proteinType) {
    case "wpi":
      return "WPI";
    case "wpc":
      return "WPC";
    case "whey":
      return "ホエイ";
    case "soy":
      return "ソイ";
    case "casein":
      return "カゼイン";
    default:
      return "その他";
  }
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
  if (item.product.review_average) {
    return `${item.product.review_average.toFixed(2)} / 5 (${item.product.review_count}件)`;
  }

  if (item.product.review_count > 0) {
    return `${item.product.review_count}件`;
  }

  return "不明";
};

const getOutboundLabel = (provider: CommerceProvider) => {
  switch (provider) {
    case "rakuten":
    default:
      return "楽天で見る";
  }
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
    <MetricChip label="タイプ" value={formatProteinType(item.metrics?.protein_type)} />
    <MetricChip
      label="ブランド"
      value={item.metrics?.canonical_brand || item.product.shop_name || "不明"}
    />
  </>
);

const renderFemaleHighlights = (item: RankingCardItem) => {
  const womenPoints = item.metrics
    ? [...item.metrics.women_keyword_matches, ...item.metrics.beauty_keyword_matches, ...item.metrics.diet_keyword_matches]
        .slice(0, 3)
        .join("・")
    : "";

  return (
    <>
      <MetricChip label="レビュー" value={formatReview(item)} />
      <MetricChip label="タイプ" value={formatProteinType(item.metrics?.protein_type)} />
      <MetricChip label="女性向けポイント" value={womenPoints || "女性向け訴求は控えめ"} />
    </>
  );
};

const RankingCard = ({ rankingKey, item }: { rankingKey: RankingKey; item: RankingCardItem }) => (
  <article className="grid gap-5 rounded-3xl border border-[#FCD27B] bg-white/95 p-5 shadow-xl sm:grid-cols-[108px_1fr] sm:p-6">
    <div className="flex items-start gap-4 sm:block">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
        {item.rank}
      </div>
      <div className="relative mt-0 aspect-square w-24 overflow-hidden rounded-2xl bg-[#FFF4E7] sm:mt-4 sm:w-[108px]">
        {item.product.image_url ? (
          <Image src={item.product.image_url} alt={item.product.title} fill sizes="108px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">画像なし</div>
        )}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#FFE7C2] px-3 py-1 text-xs font-semibold text-[#9A3412]">
            SCORE {item.score.toFixed(3)}
          </span>
          {item.metrics?.canonical_brand ? (
            <span className="rounded-full bg-[#FFF4E7] px-3 py-1 text-xs text-slate-600">{item.metrics.canonical_brand}</span>
          ) : null}
          {item.product.shop_name ? (
            <span className="rounded-full bg-[#FFF4E7] px-3 py-1 text-xs text-slate-600">{item.product.shop_name}</span>
          ) : null}
        </div>
        <h3 className="text-xl font-bold leading-tight text-[#7C2D12]">{item.product.title}</h3>
        <p className="text-sm leading-6 text-slate-600">{item.comment}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rankingKey === "male" ? renderMaleHighlights(item) : renderFemaleHighlights(item)}
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
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">最強プロテインランキング TOP5</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                楽天売上ランキングを母集団に、レビュー、my-best掲載、用途との相性を見直して男性向けと女性向けに再整理しています。ページ表示時は保存済みランキングのみを読み込み、日次更新で差し替える構成です。
              </p>
              {updatedAtLabel ? (
                <p className="text-sm text-slate-500">最終更新: {updatedAtLabel}</p>
              ) : (
                <p className="text-sm text-slate-500">まだランキングデータがありません。初回 cron 実行後に TOP5 が表示されます。</p>
              )}
            </div>
          </section>

          {data.sections.map((section) => (
            <section key={section.key} className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">{section.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{section.description}</p>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#FCD27B] bg-[#FFF8EE] p-8 text-sm text-slate-600">
                  まだ表示できるデータがありません。cron 更新を実行するとここに TOP5 が並びます。
                </div>
              ) : (
                <div className="grid gap-5">
                  {section.items.map((item) => (
                    <RankingCard key={`${section.key}-${item.product.id}`} rankingKey={section.key} item={item} />
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
