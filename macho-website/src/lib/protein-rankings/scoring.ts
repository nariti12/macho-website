import {
  FEMALE_WEIGHTS,
  MALE_FIXED_BRAND_CONFIG,
  MALE_FIXED_BRAND_ORDER,
  MALE_FIXED_COMMENTS,
  MALE_WEIGHTS,
  MAX_EXPERT_BONUS,
  RAKUTEN_RANKING_PAGE_SIZE,
  RAKUTEN_RANKING_PAGES,
  STRICT_MIN_REVIEW_COUNT,
  TOP_RANKING_LIMIT,
  TRUSTED_MALE_BRANDS,
} from "@/lib/protein-rankings/constants";
import { buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import type { EnrichedProduct, ExpertSignalRecord, RankedProductInput } from "@/lib/protein-rankings/types";

const TOTAL_RAKUTEN_CANDIDATES = RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const salesRankToScore = (rank: number | null) => {
  if (!rank || rank <= 0) return 0;
  return clamp01((TOTAL_RAKUTEN_CANDIDATES - rank + 1) / TOTAL_RAKUTEN_CANDIDATES);
};

const maleRankPriorityBonus = (rank: number | null) => {
  if (!rank || rank <= 0) return 0;
  if (rank === 1) return 0.35;
  if (rank === 2) return 0.22;
  if (rank === 3) return 0.14;
  if (rank <= 5) return 0.08;
  if (rank <= 10) return 0.04;
  return 0;
};

const reviewAverageToScore = (reviewAverage: number | null) => {
  if (!reviewAverage) return 0.55;
  return clamp01((reviewAverage - 3.5) / 1.5);
};

const reviewConfidence = (reviewAverage: number | null, reviewCount: number) =>
  clamp01(reviewAverageToScore(reviewAverage) * 0.6 + (Math.log10(reviewCount + 1) / Math.log10(5000 + 1)) * 0.4);

const femaleBaseSuitability = (candidate: EnrichedProduct) => {
  const title = candidate.product.title;
  const keywordCount =
    candidate.metrics.womenKeywordMatches.length +
    candidate.metrics.beautyKeywordMatches.length +
    candidate.metrics.dietKeywordMatches.length;

  let score = 0.2;
  if (candidate.metrics.proteinType === "soy") score += 0.35;
  if (title.includes("女性") || title.includes("レディース")) score += 0.2;
  if (title.includes("美容")) score += 0.15;
  if (title.includes("置き換え") || title.includes("ダイエット")) score += 0.1;
  score += Math.min(0.2, keywordCount * 0.05);

  return clamp01(score);
};

const getExpertBonus = (signals: ExpertSignalRecord[]) =>
  Math.min(
    MAX_EXPERT_BONUS,
    signals.filter((signal) => signal.isActive).reduce((sum, signal) => sum + Math.max(signal.bonus, 0), 0)
  );

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

const getMaleBrandKey = (candidate: EnrichedProduct) => {
  const haystack = `${candidate.product.title} ${candidate.product.brandName ?? ""} ${candidate.metrics.canonicalBrand ?? ""}`.toLowerCase();
  return MALE_FIXED_BRAND_ORDER.find((brand) =>
    MALE_FIXED_BRAND_CONFIG[brand].aliases.some((alias) => haystack.includes(alias.toLowerCase()))
  );
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

const buildComment = (candidate: EnrichedProduct, signals: ExpertSignalRecord[], rankingKey: "male" | "female") => {
  const hasMyBestSignal = signals.some((signal) => signal.signalKey === "mybest_male" || signal.signalKey === "mybest_female");
  const trustedBrand = hasTrustedMaleBrand(candidate);

  if (rankingKey === "male") {
    if (hasMyBestSignal && trustedBrand) {
      return "楽天売上上位で、定番ブランドとしての支持と my-best 掲載実績があります。";
    }
    if (trustedBrand) {
      return "楽天売上上位で、定番ブランドとして選ばれやすい一品です。";
    }
    if (hasMyBestSignal) {
      return "楽天売上上位で、my-best 掲載実績がある定番候補です。";
    }
    return "楽天売上上位で、レビュー評価も安定している候補です。";
  }

  if (hasMyBestSignal) {
    return "楽天売上上位で、my-best 掲載実績があり女性向けとして選びやすい一品です。";
  }

  return "楽天売上上位で、女性向けの訴求が分かりやすい候補です。";
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

  const maleCandidates = candidates.filter(
    (candidate) => candidate.metrics.rakutenRank !== null && getMaleBrandKey(candidate)
  );

  const femaleBase = eligible.filter(
    (candidate) =>
      candidate.metrics.proteinType === "soy" &&
      (candidate.metrics.womenKeywordMatches.length > 0 ||
        candidate.metrics.beautyKeywordMatches.length > 0 ||
        candidate.metrics.dietKeywordMatches.length > 0 ||
        candidate.product.title.includes("女性") ||
        candidate.product.title.includes("美容") ||
        candidate.product.title.includes("ダイエット") ||
        candidate.product.title.includes("置き換え"))
  );

  const femaleCandidates = femaleBase;

  const bestMaleByBrand = new Map<string, EnrichedProduct>();
  for (const candidate of maleCandidates) {
    const brandKey = getMaleBrandKey(candidate);
    if (!brandKey) continue;
    const current = bestMaleByBrand.get(brandKey);
    if (!current || (candidate.metrics.rakutenRank ?? 999) < (current.metrics.rakutenRank ?? 999)) {
      bestMaleByBrand.set(brandKey, candidate);
    }
  }

  const buildMaleFallback = (brandKey: (typeof MALE_FIXED_BRAND_ORDER)[number]): RankedProductInput => {
    const config = MALE_FIXED_BRAND_CONFIG[brandKey];
    const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(config.fallbackSearchTerm)}/`;

    return {
      product: {
        source: "rakuten",
        sourceExternalId: `curated:${brandKey}`,
        ecProvider: "rakuten",
        title: config.fallbackTitle,
        description: config.fallbackTitle,
        imageUrl: config.fallbackImagePath,
        priceYen: 0,
        reviewAverage: null,
        reviewCount: 0,
        itemUrl: searchUrl,
        affiliateUrl: buildRakutenAffiliateUrl(searchUrl),
        shopName: config.label,
        brandName: config.label,
        matchedQueries: ["curated fixed top 5"],
        discoveryScore: 0,
        rakutenRank: 999,
        rawPayload: { curated: true, brandKey },
      },
      metrics: {
        product: {
          source: "rakuten",
          sourceExternalId: `curated:${brandKey}`,
          ecProvider: "rakuten",
          title: config.fallbackTitle,
          description: config.fallbackTitle,
          imageUrl: config.fallbackImagePath,
          priceYen: 0,
          reviewAverage: null,
          reviewCount: 0,
          itemUrl: searchUrl,
          affiliateUrl: buildRakutenAffiliateUrl(searchUrl),
          shopName: config.label,
          brandName: config.label,
          matchedQueries: ["curated fixed top 5"],
          discoveryScore: 0,
          rakutenRank: 999,
          rawPayload: { curated: true, brandKey },
        },
        canonicalBrand: config.label,
        rakutenRank: 999,
        contentWeightG: null,
        servingSizeG: null,
        proteinPerServingG: null,
        proteinPer100gG: null,
        proteinRatio: null,
        proteinType: "whey",
        womenKeywordMatches: [],
        beautyKeywordMatches: [],
        dietKeywordMatches: [],
        pricePerProteinGram: null,
        excluded: false,
        exclusionReason: null,
        rawExtraction: { curated: true, brandKey },
      },
      score: 0,
      comment: MALE_FIXED_COMMENTS[brandKey],
      scoreBreakdown: {
        fixedRankOrder: MALE_FIXED_BRAND_ORDER.indexOf(brandKey) + 1,
      },
    };
  };

  const male = MALE_FIXED_BRAND_ORDER.flatMap((brandKey, index) => {
    const candidate = bestMaleByBrand.get(brandKey);
    if (!candidate) {
      return [
        {
          ...buildMaleFallback(brandKey),
          score: Number((1 - index * 0.01).toFixed(5)),
          rankPosition: index + 1,
        },
      ];
    }

    const signals = expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? [];
    const salesScore = salesRankToScore(candidate.metrics.rakutenRank);
    const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0.45;
    const expertBonus = getExpertBonus(signals);
    const rankPriorityBonus = maleRankPriorityBonus(candidate.metrics.rakutenRank);
    const score = Number((1 - index * 0.01 + salesScore * 0.001 + reviewScore * 0.001 + expertBonus * 0.001 + rankPriorityBonus * 0.001).toFixed(5));

    return [
      {
        ...candidate,
        product: {
          ...candidate.product,
          imageUrl: candidate.product.imageUrl ?? MALE_FIXED_BRAND_CONFIG[brandKey].fallbackImagePath,
        },
        score,
        rankPosition: index + 1,
        comment: MALE_FIXED_COMMENTS[brandKey],
        scoreBreakdown: {
          fixedRankOrder: MALE_FIXED_BRAND_ORDER.length - index,
          salesScore,
          reviewScore,
          expertBonus,
          rankPriorityBonus,
        },
      },
    ];
  });

  const female = sortAndTrim(
    femaleCandidates.map((candidate) => {
      const signals = expertSignalsByProductId.get(candidate.product.sourceExternalId) ?? [];
      const salesScore = salesRankToScore(candidate.metrics.rakutenRank);
      const reviewScore = reviewScores.get(candidate.product.sourceExternalId) ?? 0.45;
      const suitabilityScore = femaleBaseSuitability(candidate);
      const expertBonus = getExpertBonus(signals);
      const soyBonus = candidate.metrics.proteinType === "soy" ? 0.03 : 0;
      const score =
        salesScore * FEMALE_WEIGHTS.sales +
        reviewScore * FEMALE_WEIGHTS.review +
        suitabilityScore * FEMALE_WEIGHTS.suitability +
        expertBonus +
        soyBonus;

      return {
        ...candidate,
        score,
        comment: buildComment(candidate, signals, "female"),
        scoreBreakdown: {
          salesScore,
          reviewScore,
          suitabilityScore,
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
