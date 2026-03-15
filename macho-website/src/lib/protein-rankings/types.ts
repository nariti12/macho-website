export type RankingKey = "cost-performance" | "composition" | "women";

export type ProteinType = "wpi" | "wpc" | "whey" | "soy" | "casein" | "other";

export type NormalizedRakutenProduct = {
  source: "rakuten";
  sourceExternalId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  priceYen: number;
  reviewAverage: number;
  reviewCount: number;
  itemUrl: string;
  affiliateUrl: string | null;
  shopName: string | null;
  matchedQueries: string[];
  discoveryScore: number;
  rawPayload: unknown;
};

export type ProductMetricInput = {
  product: NormalizedRakutenProduct;
  contentWeightG: number | null;
  servingSizeG: number | null;
  proteinPerServingG: number | null;
  proteinPer100gG: number | null;
  proteinRatio: number | null;
  proteinType: ProteinType;
  womenKeywordMatches: string[];
  beautyKeywordMatches: string[];
  dietKeywordMatches: string[];
  pricePerProteinGram: number | null;
  excluded: boolean;
  exclusionReason: string | null;
  rawExtraction: Record<string, unknown>;
};

export type EnrichedProduct = {
  product: NormalizedRakutenProduct;
  metrics: ProductMetricInput;
};

export type ExpertSignalRecord = {
  productId?: string;
  sourceExternalId?: string;
  bonus: number;
  signalKey: string;
  note: string | null;
  isActive: boolean;
};

export type RankingScoreBreakdown = Record<string, number>;

export type RankedProductInput = EnrichedProduct & {
  score: number;
  comment: string;
  scoreBreakdown: RankingScoreBreakdown;
};

export type ProductRow = {
  id: string;
  title: string;
  image_url: string | null;
  price_yen: number;
  review_average: number | null;
  review_count: number;
  item_url: string | null;
  affiliate_url: string | null;
  shop_name: string | null;
  matched_queries: string[];
  source_external_id: string;
};

export type ProductMetricRow = {
  product_id: string;
  content_weight_g: number | null;
  serving_size_g: number | null;
  protein_per_serving_g: number | null;
  protein_per_100g_g: number | null;
  protein_ratio: number | null;
  protein_type: ProteinType;
  women_keyword_matches: string[];
  beauty_keyword_matches: string[];
  diet_keyword_matches: string[];
  price_per_protein_gram: number | null;
  excluded: boolean;
  exclusion_reason: string | null;
};

export type RankingRow = {
  ranking_key: RankingKey;
  rank_position: number;
  score: number;
  comment: string | null;
  product_id: string;
  updated_at: string;
};

export type RankingCardItem = {
  rank: number;
  score: number;
  comment: string | null;
  product: ProductRow;
  metrics: ProductMetricRow | null;
};

export type RankingSectionData = {
  key: RankingKey;
  title: string;
  description: string;
  items: RankingCardItem[];
};

export type ProteinRankingPageData = {
  sections: RankingSectionData[];
  updatedAt: string | null;
};
