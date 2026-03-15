import {
  BEAUTY_KEYWORDS,
  DIET_KEYWORDS,
  LIKELY_PROTEIN_KEYWORDS,
  WOMEN_KEYWORDS,
} from "@/lib/protein-rankings/constants";
import type { NormalizedRakutenProduct, ProductMetricInput, ProteinType } from "@/lib/protein-rankings/types";

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
    return { contentWeightG: null, hasAmbiguousSizeOptions };
  }

  const descriptionWeights = extractWeightCandidates(description);
  const uniqueDescriptionWeights = Array.from(
    new Set(descriptionWeights.map((value) => Math.round(value)))
  );

  if (uniqueDescriptionWeights.length === 1) {
    return {
      contentWeightG: uniqueDescriptionWeights[0],
      hasAmbiguousSizeOptions: uniqueDescriptionWeights.length > 1,
    };
  }

  return {
    contentWeightG: null,
    hasAmbiguousSizeOptions: uniqueDescriptionWeights.length > 1,
  };
};

const findServingSize = (text: string) => {
  const servingMatch = text.match(/1食(?:分)?(?:あたり|当たり)?\s*[\(（]?\s*(\d+(?:\.\d+)?)\s*g/i);

  if (!servingMatch) {
    return null;
  }

  return Number(servingMatch[1]);
};

const findProteinPerServing = (text: string) => {
  const match = text.match(
    /1食(?:分)?(?:あたり|当たり)?.{0,30}?(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*g/i
  );

  if (match) {
    return Number(match[1]);
  }

  const fallback = text.match(/(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*g/i);
  return fallback ? Number(fallback[1]) : null;
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

  if (normalized.includes("wpi")) {
    return "wpi";
  }

  if (normalized.includes("wpc")) {
    return "wpc";
  }

  if (normalized.includes("ソイ") || normalized.includes("soy")) {
    return "soy";
  }

  if (normalized.includes("カゼイン") || normalized.includes("casein")) {
    return "casein";
  }

  if (normalized.includes("ホエイ") || normalized.includes("whey")) {
    return "whey";
  }

  return "other";
};

const collectMatchedKeywords = (text: string, keywords: readonly string[]) =>
  keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));

const isLikelyProteinProduct = (text: string) =>
  LIKELY_PROTEIN_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));

export const extractMetricsFromProduct = (product: NormalizedRakutenProduct): ProductMetricInput => {
  const normalizedTitle = stripHtml(product.title);
  const normalizedDescription = stripHtml(product.description);
  const normalizedText = `${normalizedTitle} ${normalizedDescription}`.trim();
  const { contentWeightG, hasAmbiguousSizeOptions } = findContentWeight(
    normalizedTitle,
    normalizedDescription
  );
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
    proteinRatio && contentWeightG ? product.priceYen / (contentWeightG * proteinRatio) : null;

  return {
    product,
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
    excluded: !isLikelyProteinProduct(normalizedText),
    exclusionReason: !isLikelyProteinProduct(normalizedText) ? "プロテイン商品として判定できませんでした" : null,
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
