import {
  MALE_FIXED_BRAND_CONFIG,
  MALE_FIXED_BRAND_ORDER,
  MALE_FIXED_COMMENTS,
  MALE_FIXED_SCORES,
} from "@/lib/protein-rankings/constants";
import { buildRakutenAffiliateUrl } from "@/lib/protein-rankings/links";
import type { EnrichedProduct, RankedProductInput } from "@/lib/protein-rankings/types";

const getMaleBrandKey = (candidate: EnrichedProduct) => {
  const haystack = `${candidate.product.title} ${candidate.product.brandName ?? ""} ${candidate.metrics.canonicalBrand ?? ""}`.toLowerCase();
  return MALE_FIXED_BRAND_ORDER.find((brand) =>
    MALE_FIXED_BRAND_CONFIG[brand].aliases.some((alias) => haystack.includes(alias.toLowerCase()))
  );
};

export const buildRankings = (candidates: EnrichedProduct[]) => {
  const maleCandidates = candidates.filter(
    (candidate) => candidate.metrics.rakutenRank !== null && getMaleBrandKey(candidate)
  );

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
        matchedQueries: ["curated fixed top 3"],
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
          matchedQueries: ["curated fixed top 3"],
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
          score: MALE_FIXED_SCORES[brandKey] / 100,
          rankPosition: index + 1,
        },
      ];
    }

    return [
      {
        ...candidate,
        product: {
          ...candidate.product,
          imageUrl: candidate.product.imageUrl ?? MALE_FIXED_BRAND_CONFIG[brandKey].fallbackImagePath,
        },
        score: MALE_FIXED_SCORES[brandKey] / 100,
        rankPosition: index + 1,
        comment: MALE_FIXED_COMMENTS[brandKey],
        scoreBreakdown: {
          fixedRankOrder: MALE_FIXED_BRAND_ORDER.length - index,
        },
      },
    ];
  });

  return {
    male,
  };
};
