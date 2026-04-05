import { applyRankingFilters } from "@/lib/protein-rankings/filters";
import { extractMetricsFromProduct } from "@/lib/protein-rankings/extractors";
import { saveProteinRankingSnapshot } from "@/lib/protein-rankings/repository";
import { fetchRakutenProteinRankingEntries } from "@/lib/protein-rankings/rakuten-client";
import { buildRankings } from "@/lib/protein-rankings/scoring";
import type { EnrichedProduct, ExpertSignalRecord } from "@/lib/protein-rankings/types";

const getExpertSignals = async (): Promise<Map<string, ExpertSignalRecord[]>> => {
  // Future extension point: product-specific expert signals can be loaded from DB
  // and merged into ranking scores without changing the core scoring pipeline.
  return new Map();
};

export const refreshProteinRankings = async () => {
  const rakutenEntries = await fetchRakutenProteinRankingEntries();
  const enrichedProducts: EnrichedProduct[] = rakutenEntries.map((product) => {
    const extracted = extractMetricsFromProduct(product);

    return {
      product,
      metrics: applyRankingFilters(extracted),
    };
  });

  const expertSignals = await getExpertSignals();
  const rankings = buildRankings(enrichedProducts, expertSignals);
  const saved = await saveProteinRankingSnapshot({
    products: enrichedProducts,
    rankings,
  });

  return {
    ...saved,
    candidateCount: rakutenEntries.length,
    eligibleCount: enrichedProducts.filter((item) => !item.metrics.excluded).length,
  };
};
