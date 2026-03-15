import {
  COMPOSITION_WEIGHTS,
  COST_PERFORMANCE_WEIGHTS,
  MAX_EXPERT_BONUS,
  TOP_RANKING_LIMIT,
  WOMEN_WEIGHTS,
} from "@/lib/protein-rankings/constants";
import type {
  EnrichedProduct,
  ExpertSignalRecord,
  ProteinType,
  RankedProductInput,
  RankingKey,
} from "@/lib/protein-rankings/types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const percentile = (values: number[], ratio: number) => {
  if (values.length === 0) {
    return 0;
  }

  const position = (values.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return values[lower];
  }

  return values[lower] + (values[upper] - values[lower]) * (position - lower);
};

const createRobustNormalizer = (values: number[], higherBetter = true) => {
  const filtered = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);

  if (filtered.length === 0) {
    return () => 0;
  }

  const low = percentile(filtered, 0.1);
  const high = percentile(filtered, 0.9);

  if (Math.abs(high - low) < 1e-6) {
    return () => 0.5;
  }

  return (value: number) => {
    const clipped = Math.min(high, Math.max(low, value));
    const normalized = (clipped - low) / (high - low);
    return higherBetter ? clamp01(normalized) : clamp01(1 - normalized);
  };
};

const reviewAverageToScore = (reviewAverage: number) => clamp01((reviewAverage - 3.5) / 1.5);

const reviewConfidence = (reviewAverage: number, reviewCount: number) =>
  clamp01(reviewAverageToScore(reviewAverage) * 0.55 + Math.log10(reviewCount + 1) / Math.log10(1000 + 1) * 0.45);

const proteinTypeBonus = (proteinType: ProteinType) => {
  switch (proteinType) {
    case "wpi":
      return 1;
    case "wpc":
      return 0.75;
    case "whey":
      return 0.6;
    case "soy":
      return 0.55;
    case "casein":
      return 0.45;
    default:
      return 0.25;
  }
};

const womenSuitabilityBase = (proteinType: ProteinType) => {
  switch (proteinType) {
    case "soy":
      return 1;
    case "whey":
      return 0.45;
    case "wpi":
      return 0.5;
    case "wpc":
      return 0.45;
    default:
      return 0.35;
  }
};

const getExpertBonus = (signals: ExpertSignalRecord[]) =>
  clamp01(
    signals.filter((signal) => signal.isActive).reduce((sum, signal) => sum + Math.max(signal.bonus, 0), 0)
  ) * MAX_EXPERT_BONUS;

const buildComment = (rankingKey: RankingKey, candidate: EnrichedProduct) => {
  switch (rankingKey) {
    case "cost-performance":
      if (candidate.metrics.pricePerProteinGram) {
        return `たんぱく質 1g あたり約 ${candidate.metrics.pricePerProteinGram.toFixed(1)} 円で、レビュー評価とのバランスが良好です。`;
      }
      return "価格とレビューのバランスがよく、初めてでも選びやすい定番候補です。";
    case "composition":
      return candidate.metrics.proteinRatio
        ? `たんぱく質含有率は約 ${(candidate.metrics.proteinRatio * 100).toFixed(1)}% で、成分重視で選びやすい一品です。`
        : "成分情報の取得精度が高く、レビュー面も含めて安定した評価です。";
    case "women":
      if (candidate.metrics.womenKeywordMatches.length > 0 || candidate.metrics.beautyKeywordMatches.length > 0) {
        return `${[...candidate.metrics.womenKeywordMatches, ...candidate.metrics.beautyKeywordMatches].slice(0, 3).join("・")} に関連する訴求があり、女性向けの選びやすさがあります。`;
      }
      return "レビューの安定感と女性向け適合度のバランスがよい候補です。";
  }
};

const sortAndTrim = (items: RankedProductInput[]) =>
  items
    .sort((left, right) => right.score - left.score)
    .slice(0, TOP_RANKING_LIMIT)
    .map((item, index) => ({
      ...item,
      score: Number(item.score.toFixed(5)),
      scoreBreakdown: item.scoreBreakdown,
      comment: item.comment,
      rankPosition: index + 1,
    }));

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

  const popularityScores = new Map(
    eligible.map((candidate) => [
      candidate.product.sourceExternalId,
      clamp01(
        candidate.product.discoveryScore * 0.6 +
          Math.log10(candidate.product.reviewCount + 1) / Math.log10(1000 + 1) * 0.4
      ),
    ])
  );

  const costCandidates = eligible.filter(
    (candidate) => candidate.metrics.pricePerProteinGram || candidate.metrics.contentWeightG
  );
  const costValues = costCandidates.map((candidate) =>
    candidate.metrics.pricePerProteinGram ?? candidate.product.priceYen / Math.max(candidate.metrics.contentWeightG ?? 1000, 100)
  );
  const costNormalizer = createRobustNormalizer(costValues, false);

  const compositionCandidates = eligible.filter((candidate) => candidate.metrics.proteinRatio !== null);
  const purityNormalizer = createRobustNormalizer(
    compositionCandidates.map((candidate) => candidate.metrics.proteinRatio ?? 0)
  );

  const womenCandidates = eligible;
  const womenCostNormalizer = createRobustNormalizer(
    womenCandidates
      .filter((candidate) => candidate.metrics.pricePerProteinGram)
      .map((candidate) => candidate.metrics.pricePerProteinGram ?? 0),
    false
  );
  const beautyNormalizer = createRobustNormalizer(
    womenCandidates.map((candidate) => candidate.metrics.beautyKeywordMatches.length)
  );

  const costPerformance = sortAndTrim(
    costCandidates.map((candidate) => {
      const costBasis =
        candidate.metrics.pricePerProteinGram ??
        candidate.product.priceYen / Math.max(candidate.metrics.contentWeightG ?? 1000, 100);
      const costScore = costNormalizer(costBasis);
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0;
      const popularityScore = popularityScores.get(candidate.product.sourceExternalId) ?? 0;
      const expertBonus = getExpertBonus(
        expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? []
      );
      const score =
        costScore * COST_PERFORMANCE_WEIGHTS.cost +
        reviewScore * COST_PERFORMANCE_WEIGHTS.review +
        popularityScore * COST_PERFORMANCE_WEIGHTS.popularity +
        expertBonus;

      return {
        ...candidate,
        score,
        comment: buildComment("cost-performance", candidate),
        scoreBreakdown: {
          costScore,
          reviewScore,
          popularityScore,
          expertBonus,
        },
      };
    })
  );

  const composition = sortAndTrim(
    compositionCandidates.map((candidate) => {
      const purityScore = purityNormalizer(candidate.metrics.proteinRatio ?? 0);
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0;
      const typeBonus = proteinTypeBonus(candidate.metrics.proteinType);
      const expertBonus = getExpertBonus(
        expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? []
      );
      const score =
        purityScore * COMPOSITION_WEIGHTS.purity +
        reviewScore * COMPOSITION_WEIGHTS.review +
        typeBonus * COMPOSITION_WEIGHTS.typeBonus +
        expertBonus;

      return {
        ...candidate,
        score,
        comment: buildComment("composition", candidate),
        scoreBreakdown: {
          purityScore,
          reviewScore,
          typeBonus,
          expertBonus,
        },
      };
    })
  );

  const women = sortAndTrim(
    womenCandidates.map((candidate) => {
      const keywordScore = clamp01(
        candidate.metrics.womenKeywordMatches.length / 3 + candidate.metrics.dietKeywordMatches.length / 4
      );
      const suitabilityScore = clamp01(
        womenSuitabilityBase(candidate.metrics.proteinType) * 0.45 + keywordScore * 0.55
      );
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0;
      const costScore = candidate.metrics.pricePerProteinGram
        ? womenCostNormalizer(candidate.metrics.pricePerProteinGram)
        : 0.35;
      const beautyScore = beautyNormalizer(candidate.metrics.beautyKeywordMatches.length);
      const expertBonus = getExpertBonus(
        expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? []
      );
      const score =
        suitabilityScore * WOMEN_WEIGHTS.suitability +
        reviewScore * WOMEN_WEIGHTS.review +
        costScore * WOMEN_WEIGHTS.cost +
        beautyScore * WOMEN_WEIGHTS.beauty +
        expertBonus;

      return {
        ...candidate,
        score,
        comment: buildComment("women", candidate),
        scoreBreakdown: {
          suitabilityScore,
          reviewScore,
          costScore,
          beautyScore,
          expertBonus,
        },
      };
    })
  );

  return {
    "cost-performance": costPerformance,
    composition,
    women,
  };
};
