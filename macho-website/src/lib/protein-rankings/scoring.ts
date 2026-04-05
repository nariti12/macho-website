import {
  FEMALE_WEIGHTS,
  MALE_WEIGHTS,
  MAX_EXPERT_BONUS,
  RAKUTEN_RANKING_PAGE_SIZE,
  RAKUTEN_RANKING_PAGES,
  STRICT_MIN_REVIEW_COUNT,
  TOP_RANKING_LIMIT,
  TRUSTED_MALE_BRANDS,
} from "@/lib/protein-rankings/constants";
import type { EnrichedProduct, ExpertSignalRecord, ProteinType, RankedProductInput } from "@/lib/protein-rankings/types";

const TOTAL_RAKUTEN_CANDIDATES = RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const salesRankToScore = (rank: number | null) => {
  if (!rank || rank <= 0) return 0;
  return clamp01((TOTAL_RAKUTEN_CANDIDATES - rank + 1) / TOTAL_RAKUTEN_CANDIDATES);
};

const reviewAverageToScore = (reviewAverage: number | null) => {
  if (!reviewAverage) return 0.55;
  return clamp01((reviewAverage - 3.5) / 1.5);
};

const reviewConfidence = (reviewAverage: number | null, reviewCount: number) =>
  clamp01(reviewAverageToScore(reviewAverage) * 0.6 + (Math.log10(reviewCount + 1) / Math.log10(5000 + 1)) * 0.4);

const proteinTypeScore = (proteinType: ProteinType) => {
  switch (proteinType) {
    case "wpi":
      return 1;
    case "wpc":
      return 0.92;
    case "whey":
      return 0.84;
    case "soy":
      return 0.62;
    case "casein":
      return 0.6;
    default:
      return 0.45;
  }
};

const femaleBaseSuitability = (proteinType: ProteinType) => {
  switch (proteinType) {
    case "soy":
      return 1;
    case "wpi":
      return 0.45;
    case "wpc":
      return 0.42;
    case "whey":
      return 0.36;
    default:
      return 0.3;
  }
};

const getExpertBonus = (signals: ExpertSignalRecord[]) =>
  clamp01(signals.filter((signal) => signal.isActive).reduce((sum, signal) => sum + Math.max(signal.bonus, 0), 0)) *
  MAX_EXPERT_BONUS;

const createRobustNormalizer = (values: number[], higherBetter = true) => {
  const filtered = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);

  if (filtered.length === 0) {
    return () => 0.45;
  }

  const low = filtered[Math.max(0, Math.floor((filtered.length - 1) * 0.1))];
  const high = filtered[Math.min(filtered.length - 1, Math.ceil((filtered.length - 1) * 0.9))];

  if (Math.abs(high - low) < 1e-6) {
    return () => 0.55;
  }

  return (value: number) => {
    const clipped = Math.min(high, Math.max(low, value));
    const normalized = (clipped - low) / (high - low);
    return higherBetter ? clamp01(normalized) : clamp01(1 - normalized);
  };
};

const normalizeBrandKey = (candidate: EnrichedProduct) =>
  (candidate.metrics.canonicalBrand ??
    candidate.product.brandName ??
    candidate.product.shopName ??
    candidate.product.title)
    .toLowerCase()
    .trim();

const hasTrustedMaleBrand = (candidate: EnrichedProduct) => {
  const haystack = `${candidate.product.title} ${candidate.product.brandName ?? ""} ${candidate.metrics.canonicalBrand ?? ""}`.toLowerCase();
  return TRUSTED_MALE_BRANDS.some((brand) => haystack.includes(brand.toLowerCase()));
};

const sortAndTrim = (items: RankedProductInput[]) => {
  const seenBrands = new Set<string>();

  return items
    .sort((left, right) => right.score - left.score)
    .filter((item) => {
      const brandKey = normalizeBrandKey(item);
      if (!brandKey) return true;
      if (seenBrands.has(brandKey)) return false;
      seenBrands.add(brandKey);
      return true;
    })
    .slice(0, TOP_RANKING_LIMIT)
    .map((item, index) => ({
      ...item,
      score: Number(item.score.toFixed(5)),
      rankPosition: index + 1,
    }));
};

const buildComment = (candidate: EnrichedProduct) => {
  const base = candidate.metrics.rakutenRank ? `楽天 ${candidate.metrics.rakutenRank}位 の売上上位。` : "楽天売上上位。";

  if (candidate.metrics.proteinRatio) {
    return `${base} たんぱく質含有率は約 ${(candidate.metrics.proteinRatio * 100).toFixed(1)}% です。`;
  }

  return base;
};

export const buildRankings = (
  candidates: EnrichedProduct[],
  expertSignalsByProductId: Map<string, ExpertSignalRecord[]>
) => {
  const eligible = candidates.filter((candidate) => !candidate.metrics.excluded);

  const reviewScores = new Map(
    eligible.map((candidate) => [
      candidate.product.sourceExternalId,
      reviewConfidence(candidate.product.reviewAverage, candidate.product.reviewCount),
    ])
  );

  const costNormalizer = createRobustNormalizer(
    eligible
      .map((candidate) => candidate.metrics.pricePerProteinGram)
      .filter((value): value is number => typeof value === "number"),
    false
  );

  const proteinNormalizer = createRobustNormalizer(
    eligible
      .map((candidate) => candidate.metrics.proteinRatio)
      .filter((value): value is number => typeof value === "number")
  );

  const maleBase = eligible.filter((candidate) => {
    const explicitWomenTitle =
      candidate.product.title.includes("女性") ||
      candidate.product.title.includes("レディース") ||
      candidate.metrics.womenKeywordMatches.length >= 2;

    return (
      candidate.metrics.rakutenRank !== null &&
      !explicitWomenTitle &&
      candidate.metrics.proteinType !== "soy" &&
      (candidate.metrics.proteinType === "whey" ||
        candidate.metrics.proteinType === "wpc" ||
        candidate.metrics.proteinType === "wpi" ||
        candidate.metrics.proteinRatio !== null)
    );
  });

  const maleCandidates = maleBase.length >= TOP_RANKING_LIMIT ? maleBase : eligible.filter((candidate) => candidate.metrics.rakutenRank !== null);

  const femaleBase = eligible.filter(
    (candidate) =>
      candidate.metrics.proteinType === "soy" ||
      candidate.metrics.womenKeywordMatches.length > 0 ||
      candidate.metrics.beautyKeywordMatches.length > 0 ||
      candidate.metrics.dietKeywordMatches.length > 0 ||
      candidate.product.title.includes("女性") ||
      candidate.product.title.includes("美容")
  );

  const femaleCandidates =
    femaleBase.length >= TOP_RANKING_LIMIT ? femaleBase : eligible.filter((candidate) => candidate.metrics.rakutenRank !== null);

  const male = sortAndTrim(
    maleCandidates.map((candidate) => {
      const salesScore = salesRankToScore(candidate.metrics.rakutenRank);
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0.45;
      const proteinScore =
        candidate.metrics.proteinRatio !== null
          ? proteinNormalizer(candidate.metrics.proteinRatio)
          : proteinTypeScore(candidate.metrics.proteinType);
      const costScore =
        candidate.metrics.pricePerProteinGram !== null ? costNormalizer(candidate.metrics.pricePerProteinGram) : 0.45;
      const expertBonus = getExpertBonus(expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? []);
      const trustedBrandBonus = hasTrustedMaleBrand(candidate) ? 0.04 : 0;
      const reviewPenalty = candidate.product.reviewCount > 0 && candidate.product.reviewCount < STRICT_MIN_REVIEW_COUNT ? 0.92 : 1;
      const score =
        (salesScore * MALE_WEIGHTS.sales +
          reviewScore * MALE_WEIGHTS.review +
          proteinScore * MALE_WEIGHTS.protein +
          costScore * MALE_WEIGHTS.cost +
          expertBonus +
          trustedBrandBonus) *
        reviewPenalty;

      return {
        ...candidate,
        score,
        comment: buildComment(candidate),
        scoreBreakdown: {
          salesScore,
          reviewScore,
          proteinScore,
          costScore,
          expertBonus,
          trustedBrandBonus,
          reviewPenalty,
        },
      };
    })
  );

  const female = sortAndTrim(
    femaleCandidates.map((candidate) => {
      const salesScore = salesRankToScore(candidate.metrics.rakutenRank);
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0.45;
      const keywordScore = clamp01(
        candidate.metrics.womenKeywordMatches.length / 3 +
          candidate.metrics.beautyKeywordMatches.length / 4 +
          candidate.metrics.dietKeywordMatches.length / 4
      );
      const suitabilityScore = clamp01(femaleBaseSuitability(candidate.metrics.proteinType) * 0.55 + keywordScore * 0.45);
      const costScore =
        candidate.metrics.pricePerProteinGram !== null ? costNormalizer(candidate.metrics.pricePerProteinGram) : 0.45;
      const expertBonus = getExpertBonus(expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? []);
      const soyBonus = candidate.metrics.proteinType === "soy" ? 0.03 : 0;
      const score =
        salesScore * FEMALE_WEIGHTS.sales +
        reviewScore * FEMALE_WEIGHTS.review +
        suitabilityScore * FEMALE_WEIGHTS.suitability +
        costScore * FEMALE_WEIGHTS.cost +
        expertBonus +
        soyBonus;

      return {
        ...candidate,
        score,
        comment: buildComment(candidate),
        scoreBreakdown: {
          salesScore,
          reviewScore,
          suitabilityScore,
          costScore,
          expertBonus,
          soyBonus,
        },
      };
    })
  );

  return {
    male,
    female,
  };
};
