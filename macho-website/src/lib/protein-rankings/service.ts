import { extractMetricsFromProduct } from "@/lib/protein-rankings/extractors";
import { saveProteinRankingSnapshot } from "@/lib/protein-rankings/repository";
import { fetchCuratedRakutenStapleEntries } from "@/lib/protein-rankings/rakuten-client";
import { buildRankings } from "@/lib/protein-rankings/scoring";
import type { EnrichedProduct } from "@/lib/protein-rankings/types";

export const refreshProteinRankings = async () => {
  const curatedEntries = await fetchCuratedRakutenStapleEntries();
  const enrichedProducts: EnrichedProduct[] = curatedEntries.map((product) => {
    const extracted = extractMetricsFromProduct(product);

    return {
      product,
      metrics: {
        ...extracted,
        excluded: false,
        exclusionReason: null,
      },
    };
  });

  const rankings = buildRankings(enrichedProducts, new Map());
  const saved = await saveProteinRankingSnapshot({
    products: enrichedProducts,
    rankings,
  });

  return {
    ...saved,
    candidateCount: curatedEntries.length,
    eligibleCount: enrichedProducts.length,
  };
};
