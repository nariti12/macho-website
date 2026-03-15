import { applyRankingFilters } from "@/lib/protein-rankings/filters";
import { extractMetricsFromProduct } from "@/lib/protein-rankings/extractors";
import { fetchRakutenProteinCandidates } from "@/lib/protein-rankings/rakuten-client";
import { saveProteinRankingSnapshot } from "@/lib/protein-rankings/repository";
import { buildRankings } from "@/lib/protein-rankings/scoring";
import type { EnrichedProduct, ExpertSignalRecord } from "@/lib/protein-rankings/types";

const getExpertSignals = async (): Promise<Map<string, ExpertSignalRecord[]>> => {
  // Future extension point: product-specific expert signals can be loaded from DB
  // and merged into ranking scores without changing the core scoring pipeline.
  return new Map();
};

export const refreshProteinRankings = async () => {
  const candidates = await fetchRakutenProteinCandidates();
  const enrichedProducts: EnrichedProduct[] = candidates.map((product) => {
    const extracted = extractMetricsFromProduct(product);
    return {
      product,
      metrics: applyRankingFilters(extracted),
    };
  });
  const expertSignals = await getExpertSignals();
  const rankings = buildRankings(enrichedProducts, expertSignals);
  const saved = await saveProteinRankingSnapshot(enrichedProducts, rankings);

  return {
    ...saved,
    candidateCount: candidates.length,
    eligibleCount: enrichedProducts.filter((item) => !item.metrics.excluded).length,
  };
};
