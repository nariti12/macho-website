import { RANKING_DESCRIPTIONS, RANKING_LABELS } from "@/lib/protein-rankings/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from "@/lib/supabase/config";
import type {
  EnrichedProduct,
  ProductMetricRow,
  ProductRow,
  ProteinRankingPageData,
  RankedProductInput,
  RankingCardItem,
  RankingKey,
  RankingRow,
} from "@/lib/protein-rankings/types";

const RANKING_KEYS: RankingKey[] = ["male"];

type RankingPayload = Record<RankingKey, Array<RankedProductInput & { rankPosition: number }>>;

type SaveInput = {
  products: EnrichedProduct[];
  rankings: RankingPayload;
};

export const saveProteinRankingSnapshot = async ({ products, rankings }: SaveInput) => {
  const supabase = createSupabaseAdminClient();
  const timestamp = new Date().toISOString();

  const rankingProducts = RANKING_KEYS.flatMap((rankingKey) => rankings[rankingKey].map((item) => item as EnrichedProduct));
  const uniqueProducts = new Map<string, EnrichedProduct>();

  [...products, ...rankingProducts].forEach((entry) => {
    uniqueProducts.set(entry.product.sourceExternalId, entry);
  });

  const allProducts = Array.from(uniqueProducts.values());

  const productRows = allProducts.map(({ product }) => ({
    source: product.source,
    source_external_id: product.sourceExternalId,
    ec_provider: product.ecProvider,
    title: product.title,
    description: product.description,
    image_url: product.imageUrl,
    price_yen: product.priceYen,
    review_average: product.reviewAverage,
    review_count: product.reviewCount,
    item_url: product.itemUrl,
    affiliate_url: product.affiliateUrl,
    shop_name: product.shopName,
    matched_queries: product.matchedQueries,
    discovery_score: product.discoveryScore,
    raw_payload: product.rawPayload,
    updated_at: timestamp,
  }));

  const { data: upsertedProducts, error: productError } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "source,source_external_id" })
    .select("id, source_external_id");

  if (productError || !upsertedProducts) {
    throw new Error(`Failed to upsert products: ${productError?.message ?? "unknown error"}`);
  }

  const productIdByExternalId = new Map(
    upsertedProducts.map((product) => [product.source_external_id as string, product.id as string])
  );

  const metricRows = allProducts.map(({ product, metrics }) => ({
    product_id: productIdByExternalId.get(product.sourceExternalId),
    canonical_brand: metrics.canonicalBrand,
    rakuten_rank: metrics.rakutenRank,
    content_weight_g: metrics.contentWeightG,
    serving_size_g: metrics.servingSizeG,
    protein_per_serving_g: metrics.proteinPerServingG,
    protein_per_100g_g: metrics.proteinPer100gG,
    protein_ratio: metrics.proteinRatio,
    protein_type: metrics.proteinType,
    women_keyword_matches: metrics.womenKeywordMatches,
    beauty_keyword_matches: metrics.beautyKeywordMatches,
    diet_keyword_matches: metrics.dietKeywordMatches,
    price_per_protein_gram: metrics.pricePerProteinGram,
    excluded: metrics.excluded,
    exclusion_reason: metrics.exclusionReason,
    raw_extraction: metrics.rawExtraction,
    updated_at: timestamp,
  }));

  const { error: metricError } = await supabase.from("product_metrics").upsert(metricRows, { onConflict: "product_id" });

  if (metricError) {
    throw new Error(`Failed to upsert product metrics: ${metricError.message}`);
  }

  const { error: deleteError } = await supabase.from("rankings").delete().in("ranking_key", RANKING_KEYS);
  if (deleteError) {
    throw new Error(`Failed to reset rankings: ${deleteError.message}`);
  }

  const rankingRows = RANKING_KEYS.flatMap((rankingKey) =>
    rankings[rankingKey].map((item) => ({
      ranking_key: rankingKey,
      product_id: productIdByExternalId.get(item.product.sourceExternalId),
      rank_position: item.rankPosition,
      score: item.score,
      comment: item.comment,
      score_breakdown: item.scoreBreakdown,
      updated_at: timestamp,
    }))
  );

  const { error: rankingError } = await supabase.from("rankings").insert(rankingRows);
  if (rankingError) {
    throw new Error(`Failed to save rankings: ${rankingError.message}`);
  }

  return {
    productCount: products.length,
    rankingCount: rankingRows.length,
  };
};

export const fetchProteinRankingPageData = async (): Promise<ProteinRankingPageData> => {
  if (!hasPublicSupabaseEnv() && !hasServiceSupabaseEnv()) {
    return {
      sections: RANKING_KEYS.map((key) => ({
        key,
        title: RANKING_LABELS[key],
        description: RANKING_DESCRIPTIONS[key],
        items: [],
      })),
      updatedAt: null,
    };
  }

  const supabase = createSupabaseServerClient();
  const { data: rankingRows, error: rankingError } = await supabase
    .from("rankings")
    .select("ranking_key, rank_position, score, comment, product_id, updated_at")
    .in("ranking_key", RANKING_KEYS)
    .order("rank_position", { ascending: true });

  if (rankingError || !rankingRows) {
    console.error("Failed to load rankings", rankingError);
    return {
      sections: RANKING_KEYS.map((key) => ({
        key,
        title: RANKING_LABELS[key],
        description: RANKING_DESCRIPTIONS[key],
        items: [],
      })),
      updatedAt: null,
    };
  }

  const productIds = Array.from(new Set(rankingRows.map((row) => row.product_id as string)));

  if (productIds.length === 0) {
    return {
      sections: RANKING_KEYS.map((key) => ({
        key,
        title: RANKING_LABELS[key],
        description: RANKING_DESCRIPTIONS[key],
        items: [],
      })),
      updatedAt: null,
    };
  }

  const [{ data: productRows, error: productError }, { data: metricRows, error: metricError }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, ec_provider, title, image_url, price_yen, review_average, review_count, item_url, affiliate_url, shop_name, matched_queries, source_external_id"
      )
      .in("id", productIds),
    supabase
      .from("product_metrics")
      .select(
        "product_id, canonical_brand, rakuten_rank, content_weight_g, serving_size_g, protein_per_serving_g, protein_per_100g_g, protein_ratio, protein_type, women_keyword_matches, beauty_keyword_matches, diet_keyword_matches, price_per_protein_gram, excluded, exclusion_reason"
      )
      .in("product_id", productIds),
  ]);

  if (productError || metricError || !productRows) {
    console.error("Failed to load ranking products or metrics", productError ?? metricError);
    return {
      sections: RANKING_KEYS.map((key) => ({
        key,
        title: RANKING_LABELS[key],
        description: RANKING_DESCRIPTIONS[key],
        items: [],
      })),
      updatedAt: null,
    };
  }

  const productsById = new Map((productRows as ProductRow[]).map((product) => [product.id, product]));
  const metricsByProductId = new Map(((metricRows ?? []) as ProductMetricRow[]).map((metric) => [metric.product_id, metric]));
  const itemsByRankingKey = new Map<RankingKey, RankingCardItem[]>(RANKING_KEYS.map((key) => [key, []]));

  (rankingRows as RankingRow[]).forEach((row) => {
    const product = productsById.get(row.product_id);
    if (!product) return;

    itemsByRankingKey.get(row.ranking_key)?.push({
      rank: row.rank_position,
      score: row.score,
      comment: row.comment,
      product,
      metrics: metricsByProductId.get(row.product_id) ?? null,
    });
  });

  const updatedAt = (rankingRows as RankingRow[]).reduce<string | null>((latest, row) => {
    if (!latest || row.updated_at > latest) {
      return row.updated_at;
    }
    return latest;
  }, null);

  return {
    sections: RANKING_KEYS.map((key) => ({
      key,
      title: RANKING_LABELS[key],
      description: RANKING_DESCRIPTIONS[key],
      items: itemsByRankingKey.get(key) ?? [],
    })),
    updatedAt,
  };
};
