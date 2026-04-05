import { BANNED_BRANDS, BANNED_PRODUCT_KEYWORDS, MIN_REVIEW_COUNT } from "@/lib/protein-rankings/constants";
import type { ProductMetricInput } from "@/lib/protein-rankings/types";

export const applyRankingFilters = (metrics: ProductMetricInput): ProductMetricInput => {
  if (metrics.excluded) {
    return metrics;
  }

  const combinedText =
    `${metrics.product.title} ${metrics.product.description} ${metrics.product.brandName ?? ""}`.toLowerCase();
  const bannedKeyword = BANNED_PRODUCT_KEYWORDS.find((keyword) => combinedText.includes(keyword.toLowerCase()));

  if (bannedKeyword) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `${bannedKeyword} を含むため除外`,
    };
  }

  const bannedBrand = BANNED_BRANDS.find((brand) => combinedText.includes(brand.toLowerCase()));
  if (bannedBrand) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `${bannedBrand} はランキング対象外`,
    };
  }

  if (metrics.product.reviewCount > 0 && metrics.product.reviewCount < MIN_REVIEW_COUNT) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `レビュー件数が ${MIN_REVIEW_COUNT} 件未満のため除外`,
    };
  }

  return metrics;
};
