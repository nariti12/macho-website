import { applyRankingFilters } from "@/lib/protein-rankings/filters";
import { MYBEST_FEMALE_SIGNAL_BONUS, MYBEST_MALE_SIGNAL_BONUS } from "@/lib/protein-rankings/constants";
import { extractMetricsFromProduct } from "@/lib/protein-rankings/extractors";
import { fetchMyBestReferenceTitles } from "@/lib/protein-rankings/mybest-client";
import { saveProteinRankingSnapshot } from "@/lib/protein-rankings/repository";
import { fetchCuratedRakutenStapleEntries, fetchRakutenProteinRankingEntries } from "@/lib/protein-rankings/rakuten-client";
import { buildRankings } from "@/lib/protein-rankings/scoring";
import type { EnrichedProduct, ExpertSignalRecord } from "@/lib/protein-rankings/types";

const normalizeComparableText = (value: string) =>
  value
    .toLowerCase()
    .replace(/【[^】]*】/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/（[^）]*）/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .replace(/(100%|100％|ホエイプロテイン|ソイプロテイン|プロテイン|wpc|wpi|whey|soy)/gi, "");

const isMyBestMatch = (productTitle: string, referenceTitle: string) => {
  const normalizedProduct = normalizeComparableText(productTitle);
  const normalizedReference = normalizeComparableText(referenceTitle);

  if (!normalizedProduct || !normalizedReference) {
    return false;
  }

  return (
    normalizedProduct.includes(normalizedReference) ||
    normalizedReference.includes(normalizedProduct) ||
    normalizedProduct.slice(0, 12) === normalizedReference.slice(0, 12)
  );
};

const getExpertSignals = async (products: EnrichedProduct[]): Promise<Map<string, ExpertSignalRecord[]>> => {
  const signalMap = new Map<string, ExpertSignalRecord[]>();

  try {
    const { maleTitles, femaleTitles } = await fetchMyBestReferenceTitles();

    products.forEach((product) => {
      const matchesMale = maleTitles.some((title) => isMyBestMatch(product.product.title, title));
      const matchesFemale = femaleTitles.some((title) => isMyBestMatch(product.product.title, title));

      const signals: ExpertSignalRecord[] = [];
      if (matchesMale) {
        signals.push({
          sourceExternalId: product.product.sourceExternalId,
          bonus: MYBEST_MALE_SIGNAL_BONUS,
          signalKey: "mybest_male",
          note: "my-best 男性向け記事掲載",
          isActive: true,
        });
      }

      if (matchesFemale) {
        signals.push({
          sourceExternalId: product.product.sourceExternalId,
          bonus: MYBEST_FEMALE_SIGNAL_BONUS,
          signalKey: "mybest_female",
          note: "my-best 女性向け記事掲載",
          isActive: true,
        });
      }

      if (signals.length > 0) {
        signalMap.set(product.product.sourceExternalId, signals);
      }
    });
  } catch (error) {
    console.warn("Failed to load my-best reference titles. Proceeding without the signal.", error);
  }

  return signalMap;
};

export const refreshProteinRankings = async () => {
  const [rakutenEntries, curatedEntries] = await Promise.all([
    fetchRakutenProteinRankingEntries(),
    fetchCuratedRakutenStapleEntries(),
  ]);
  const mergedEntries = new Map<string, (typeof rakutenEntries)[number]>();
  rakutenEntries.forEach((entry) => {
    mergedEntries.set(entry.sourceExternalId, entry);
  });
  curatedEntries.forEach((entry) => {
    mergedEntries.set(entry.sourceExternalId, entry);
  });

  const allEntries = Array.from(mergedEntries.values());
  const enrichedProducts: EnrichedProduct[] = allEntries.map((product) => {
    const extracted = extractMetricsFromProduct(product);

    return {
      product,
      metrics: applyRankingFilters(extracted),
    };
  });

  const expertSignals = await getExpertSignals(enrichedProducts);
  const rankings = buildRankings(enrichedProducts, expertSignals);
  const saved = await saveProteinRankingSnapshot({
    products: enrichedProducts,
    rankings,
  });

  return {
    ...saved,
    candidateCount: allEntries.length,
    eligibleCount: enrichedProducts.filter((item) => !item.metrics.excluded).length,
  };
};
