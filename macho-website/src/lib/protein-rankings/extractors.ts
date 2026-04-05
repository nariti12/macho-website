import {
  BEAUTY_KEYWORDS,
  DIET_KEYWORDS,
  LIKELY_PROTEIN_KEYWORDS,
  TITLE_NOISE_PATTERNS,
  TRUSTED_MALE_BRANDS,
  WOMEN_KEYWORDS,
} from "@/lib/protein-rankings/constants";
import type { NormalizedRakutenRankingProduct, ProductMetricInput, ProteinType } from "@/lib/protein-rankings/types";

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTitle = (value: string) => {
  let normalized = stripHtml(value);

  for (const pattern of TITLE_NOISE_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }

  return normalized.replace(/\s+/g, " ").trim();
};

const extractWeightCandidates = (text: string) =>
  Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s?(kg|g)/gi))
    .map((match) => {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "kg" ? amount * 1000 : amount;
    })
    .filter((value) => value >= 100 && value <= 6000);

const findContentWeight = (title: string, description: string) => {
  const titleWeights = extractWeightCandidates(title);
  const uniqueTitleWeights = Array.from(new Set(titleWeights.map((value) => Math.round(value))));
  const hasAmbiguousSizeOptions = uniqueTitleWeights.length > 1;

  if (uniqueTitleWeights.length === 1) {
    return { contentWeightG: uniqueTitleWeights[0], hasAmbiguousSizeOptions };
  }

  if (uniqueTitleWeights.length > 1) {
    return {
      contentWeightG: [...uniqueTitleWeights].sort((left, right) => left - right)[0],
      hasAmbiguousSizeOptions,
    };
  }

  const descriptionWeights = extractWeightCandidates(description);
  const uniqueDescriptionWeights = Array.from(new Set(descriptionWeights.map((value) => Math.round(value))));

  if (uniqueDescriptionWeights.length === 1) {
    return {
      contentWeightG: uniqueDescriptionWeights[0],
      hasAmbiguousSizeOptions: false,
    };
  }

  return {
    contentWeightG: null,
    hasAmbiguousSizeOptions: false,
  };
};

const findServingSize = (text: string) => {
  const servingMatch = text.match(/1食(?:分)?(?:あたり|当たり)?\s*[\(（]?\s*(\d+(?:\.\d+)?)\s*g/i);
  return servingMatch ? Number(servingMatch[1]) : null;
};

const findProteinPerServing = (text: string) => {
  const match = text.match(
    /1食(?:分)?(?:あたり|当たり)?.{0,30}?(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*g/i
  );
  return match ? Number(match[1]) : null;
};

const findProteinPer100g = (text: string) => {
  const match = text.match(
    /100g(?:あたり|当たり)?.{0,30}?(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*g/i
  );

  if (match) {
    return Number(match[1]);
  }

  const reverseMatch = text.match(
    /(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*g.{0,20}?100g(?:あたり|当たり)?/i
  );

  return reverseMatch ? Number(reverseMatch[1]) : null;
};

const detectProteinType = (text: string): ProteinType => {
  const normalized = text.toLowerCase();

  if (normalized.includes("wpi")) return "wpi";
  if (normalized.includes("wpc")) return "wpc";
  if (normalized.includes("ソイ") || normalized.includes("soy")) return "soy";
  if (normalized.includes("カゼイン") || normalized.includes("casein")) return "casein";
  if (normalized.includes("ホエイ") || normalized.includes("whey")) return "whey";
  return "other";
};

const collectMatchedKeywords = (text: string, keywords: readonly string[]) =>
  keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));

const isLikelyProteinProduct = (text: string) =>
  LIKELY_PROTEIN_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));

const normalizeBrand = (product: NormalizedRakutenRankingProduct, normalizedText: string) => {
  const trustedBrand = TRUSTED_MALE_BRANDS.find((brand) => normalizedText.toLowerCase().includes(brand.toLowerCase()));
  if (trustedBrand) {
    return trustedBrand;
  }

  const candidates = [product.brandName, product.shopName, product.title].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  for (const value of candidates) {
    const cleaned = value
      .replace(/(公式|楽天市場店|公式ストア|本店|ショップ|ストア|店)$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length > 1) {
      return cleaned;
    }
  }

  return null;
};

export const extractMetricsFromProduct = (product: NormalizedRakutenRankingProduct): ProductMetricInput => {
  const normalizedTitle = normalizeTitle(product.title);
  const normalizedDescription = stripHtml(product.description);
  const normalizedText = `${normalizedTitle} ${normalizedDescription}`.trim();
  const { contentWeightG, hasAmbiguousSizeOptions } = findContentWeight(normalizedTitle, normalizedDescription);
  const servingSizeG = findServingSize(normalizedText);
  const proteinPerServingG = findProteinPerServing(normalizedText);
  const proteinPer100gG = findProteinPer100g(normalizedText);
  const derivedProteinPer100g =
    proteinPer100gG ?? (proteinPerServingG && servingSizeG ? (proteinPerServingG / servingSizeG) * 100 : null);
  const proteinRatio = derivedProteinPer100g ? Math.min(1, derivedProteinPer100g / 100) : null;
  const womenKeywordMatches = collectMatchedKeywords(normalizedText, WOMEN_KEYWORDS);
  const beautyKeywordMatches = collectMatchedKeywords(normalizedText, BEAUTY_KEYWORDS);
  const dietKeywordMatches = collectMatchedKeywords(normalizedText, DIET_KEYWORDS);
  const pricePerProteinGram =
    proteinRatio && contentWeightG && product.priceYen ? product.priceYen / (contentWeightG * proteinRatio) : null;
  const likelyProtein = isLikelyProteinProduct(normalizedText);

  return {
    product,
    canonicalBrand: normalizeBrand(product, normalizedText),
    rakutenRank: product.rakutenRank,
    contentWeightG,
    servingSizeG,
    proteinPerServingG,
    proteinPer100gG: derivedProteinPer100g,
    proteinRatio,
    proteinType: detectProteinType(normalizedText),
    womenKeywordMatches,
    beautyKeywordMatches,
    dietKeywordMatches,
    pricePerProteinGram,
    hasAmbiguousSizeOptions,
    excluded: !likelyProtein,
    exclusionReason: !likelyProtein ? "プロテイン商品として判定できませんでした" : null,
    rawExtraction: {
      normalizedTitle,
      normalizedDescription,
      normalizedText,
      hasAmbiguousSizeOptions,
      titleWeightCandidates: extractWeightCandidates(normalizedTitle),
      descriptionWeightCandidates: extractWeightCandidates(normalizedDescription),
    },
  };
};
