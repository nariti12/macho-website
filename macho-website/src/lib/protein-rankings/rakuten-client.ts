import {
  RAKUTEN_MAX_RETRIES,
  RAKUTEN_REQUEST_DELAY_MS,
  PROTEIN_SEARCH_QUERIES,
  RAKUTEN_SEARCH_HITS,
  RAKUTEN_SEARCH_PAGES,
} from "@/lib/protein-rankings/constants";
import type { NormalizedRakutenProduct } from "@/lib/protein-rankings/types";

type RakutenImage = {
  imageUrl: string;
};

type RakutenItem = {
  itemCode: string;
  itemName: string;
  itemCaption: string;
  itemPrice: number;
  reviewAverage: string;
  reviewCount: number;
  itemUrl: string;
  affiliateUrl?: string;
  shopName?: string;
  mediumImageUrls?: RakutenImage[];
  smallImageUrls?: RakutenImage[];
};

type RakutenResponse = {
  Items: Array<{ Item: RakutenItem }>;
};

const RAKUTEN_ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRakutenApplicationId = () => {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;

  if (!applicationId) {
    throw new Error("Missing environment variable: RAKUTEN_APPLICATION_ID");
  }

  return applicationId;
};

const getRakutenAccessKey = () => {
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("Missing environment variable: RAKUTEN_ACCESS_KEY");
  }

  return accessKey;
};

const getRakutenSiteOrigin = () =>
  process.env.RAKUTEN_SITE_ORIGIN?.replace(/\/$/, "") ?? "https://www.machoda.com";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchRakutenPage = async (url: string, accessKey: string, siteOrigin: string) => {
  let attempt = 0;

  while (attempt < RAKUTEN_MAX_RETRIES) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessKey}`,
        Referer: `${siteOrigin}/`,
        Origin: siteOrigin,
        Accept: "application/json",
        "User-Agent": "machoda-protein-rankings/1.0",
      },
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return response;
    }

    if (response.status !== 429) {
      const errorBody = await response.text();
      throw new Error(`Rakuten API request failed: ${response.status} ${errorBody}`.trim());
    }

    attempt += 1;

    if (attempt >= RAKUTEN_MAX_RETRIES) {
      const errorBody = await response.text();
      throw new Error(`Rakuten API request failed: ${response.status} ${errorBody}`.trim());
    }

    await sleep(RAKUTEN_REQUEST_DELAY_MS * 5 * attempt);
  }

  throw new Error("Rakuten API request failed: retries exhausted");
};

const normalizeRakutenItem = (
  item: RakutenItem,
  keyword: string,
  discoveryScore: number
): NormalizedRakutenProduct => ({
  source: "rakuten",
  sourceExternalId: item.itemCode,
  title: item.itemName.trim(),
  description: stripHtml(item.itemCaption ?? ""),
  imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? item.smallImageUrls?.[0]?.imageUrl ?? null,
  priceYen: item.itemPrice,
  reviewAverage: Number(item.reviewAverage || 0),
  reviewCount: item.reviewCount ?? 0,
  itemUrl: item.itemUrl,
  affiliateUrl: item.affiliateUrl ?? null,
  shopName: item.shopName ?? null,
  matchedQueries: [keyword],
  discoveryScore,
  rawPayload: item,
});

export const fetchRakutenProteinCandidates = async () => {
  const applicationId = getRakutenApplicationId();
  const accessKey = getRakutenAccessKey();
  const siteOrigin = getRakutenSiteOrigin();
  const aggregate = new Map<string, NormalizedRakutenProduct>();

  for (const keyword of PROTEIN_SEARCH_QUERIES) {
    for (let page = 1; page <= RAKUTEN_SEARCH_PAGES; page += 1) {
      const params = new URLSearchParams({
        applicationId,
        accessKey,
        keyword,
        hits: String(RAKUTEN_SEARCH_HITS),
        page: String(page),
        format: "json",
        availability: "1",
      });

      if (process.env.RAKUTEN_AFFILIATE_ID) {
        params.set("affiliateId", process.env.RAKUTEN_AFFILIATE_ID);
      }

      const response = await fetchRakutenPage(
        `${RAKUTEN_ENDPOINT}?${params.toString()}`,
        accessKey,
        siteOrigin
      );

      const data = (await response.json()) as RakutenResponse;

      data.Items.forEach((entry, index) => {
        const discoveryScore = Math.max(
          0,
          1 - ((page - 1) * RAKUTEN_SEARCH_HITS + index) / (RAKUTEN_SEARCH_HITS * RAKUTEN_SEARCH_PAGES)
        );
        const normalized = normalizeRakutenItem(entry.Item, keyword, discoveryScore);
        const existing = aggregate.get(normalized.sourceExternalId);

        if (!existing) {
          aggregate.set(normalized.sourceExternalId, normalized);
          return;
        }

        aggregate.set(normalized.sourceExternalId, {
          ...existing,
          matchedQueries: Array.from(new Set([...existing.matchedQueries, keyword])),
          discoveryScore: Math.max(existing.discoveryScore, discoveryScore),
          reviewAverage: Math.max(existing.reviewAverage, normalized.reviewAverage),
          reviewCount: Math.max(existing.reviewCount, normalized.reviewCount),
          priceYen: normalized.priceYen || existing.priceYen,
          imageUrl: existing.imageUrl ?? normalized.imageUrl,
          affiliateUrl: existing.affiliateUrl ?? normalized.affiliateUrl,
          rawPayload: normalized.rawPayload,
        });
      });

      await sleep(RAKUTEN_REQUEST_DELAY_MS);
    }
  }

  return Array.from(aggregate.values());
};
