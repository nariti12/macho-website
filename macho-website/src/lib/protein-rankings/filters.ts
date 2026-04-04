import { BANNED_PRODUCT_KEYWORDS, MIN_REVIEW_AVERAGE, MIN_REVIEW_COUNT } from "@/lib/protein-rankings/constants";
import type { ProductMetricInput } from "@/lib/protein-rankings/types";

export const applyRankingFilters = (metrics: ProductMetricInput): ProductMetricInput => {
  if (metrics.excluded) {
    return metrics;
  }

  const combinedText = `${metrics.product.title} ${metrics.product.description}`.toLowerCase();
  const bannedKeyword = BANNED_PRODUCT_KEYWORDS.find((keyword) => combinedText.includes(keyword.toLowerCase()));

  if (bannedKeyword) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `${bannedKeyword} を含むため除外`,
    };
  }

  if (metrics.product.reviewCount < MIN_REVIEW_COUNT) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `レビュー件数が ${MIN_REVIEW_COUNT} 件未満のため除外`,
    };
  }

  if (metrics.product.reviewAverage < MIN_REVIEW_AVERAGE) {
    return {
      ...metrics,
      excluded: true,
      exclusionReason: `レビュー平均が ${MIN_REVIEW_AVERAGE} 未満のため除外`,
    };
  }

  return metrics;
};
