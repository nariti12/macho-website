import {
  MALE_SUPPLEMENTAL_SEARCH_QUERIES,
  RAKUTEN_ITEM_SEARCH_ENDPOINT,
  RAKUTEN_MAX_RETRIES,
  RAKUTEN_PROTEIN_GENRE_ID,
  RAKUTEN_RANKING_ENDPOINT,
  RAKUTEN_RANKING_PAGE_SIZE,
  RAKUTEN_RANKING_PAGES,
  RAKUTEN_REQUEST_DELAY_MS,
} from "@/lib/protein-rankings/constants";
import type { NormalizedRakutenRankingProduct } from "@/lib/protein-rankings/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHtml = (value: string | null | undefined) =>
  (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const getRequiredEnv = (name: "RAKUTEN_APPLICATION_ID" | "RAKUTEN_ACCESS_KEY") => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const getSiteOrigin = () => process.env.RAKUTEN_SITE_ORIGIN?.trim() || "https://www.machoda.com";

const buildAffiliateUrl = (itemUrl: string) => {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!affiliateId) return itemUrl;
  return `${itemUrl}${itemUrl.includes("?") ? "&" : "?"}scid=af_pc_etc&sc2id=${affiliateId}`;
};

type RakutenApiItem = {
  itemCode?: string;
  itemName?: string;
  itemCaption?: string;
  itemPrice?: number;
  reviewAverage?: string;
  reviewCount?: number;
  itemUrl?: string;
  affiliateUrl?: string;
  shopName?: string;
  mediumImageUrls?: Array<{ imageUrl?: string }>;
};

type RakutenRankingResponse = {
  Items?: Array<{
    Item?: RakutenApiItem;
  }>;
};

type RakutenItemSearchResponse = {
  Items?: Array<{
    Item?: RakutenApiItem;
  }>;
};

const buildHeaders = (accessKey: string) => ({
  Accept: "application/json",
  Authorization: `Bearer ${accessKey}`,
  Origin: getSiteOrigin(),
  Referer: `${getSiteOrigin()}/`,
});

const fetchJsonWithRetry = async (url: URL) => {
  const accessKey = getRequiredEnv("RAKUTEN_ACCESS_KEY");
  let attempt = 0;

  while (attempt < RAKUTEN_MAX_RETRIES) {
    const response = await fetch(url, {
      headers: buildHeaders(accessKey),
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return response.json();
    }

    const body = await response.text();
    attempt += 1;

    if (attempt >= RAKUTEN_MAX_RETRIES) {
      throw new Error(`Rakuten request failed: ${response.status} ${body.slice(0, 200)}`.trim());
    }

    await sleep(RAKUTEN_REQUEST_DELAY_MS * attempt);
  }

  throw new Error("Rakuten request failed: retries exhausted");
};

const toProduct = (item: RakutenApiItem, rank: number, matchedQueries: string[]): NormalizedRakutenRankingProduct | null => {
  const itemCode = item.itemCode;
  const title = stripHtml(item.itemName);
  const itemUrl = item.itemUrl ?? null;

  if (!itemCode || !title || !itemUrl) {
    return null;
  }

  const parsedReviewAverage = item.reviewAverage ? Number(item.reviewAverage) : null;
  const imageUrl = item.mediumImageUrls?.find((image) => image.imageUrl)?.imageUrl ?? null;

  return {
    source: "rakuten",
    sourceExternalId: itemCode,
    ecProvider: "rakuten",
    title,
    description: stripHtml(item.itemCaption) || title,
    imageUrl,
    priceYen: typeof item.itemPrice === "number" ? item.itemPrice : 0,
    reviewAverage: Number.isFinite(parsedReviewAverage) ? parsedReviewAverage : null,
    reviewCount: typeof item.reviewCount === "number" ? item.reviewCount : 0,
    itemUrl,
    affiliateUrl: buildAffiliateUrl(item.affiliateUrl ?? itemUrl),
    shopName: stripHtml(item.shopName) || null,
    brandName: stripHtml(item.shopName) || null,
    matchedQueries,
    discoveryScore: Math.max(0, 1 - (rank - 1) / 100),
    rakutenRank: rank,
    rawPayload: item,
  };
};

const fetchRankingEntries = async () => {
  const applicationId = getRequiredEnv("RAKUTEN_APPLICATION_ID");
  const accessKey = getRequiredEnv("RAKUTEN_ACCESS_KEY");
  const entries: NormalizedRakutenRankingProduct[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= RAKUTEN_RANKING_PAGES; page += 1) {
    const url = new URL(RAKUTEN_RANKING_ENDPOINT);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("accessKey", accessKey);
    url.searchParams.set("genreId", RAKUTEN_PROTEIN_GENRE_ID);
    url.searchParams.set("page", String(page));
    url.searchParams.set("format", "json");

    const payload = (await fetchJsonWithRetry(url)) as RakutenRankingResponse;
    const items = payload.Items ?? [];

    if (items.length === 0) {
      break;
    }

    items.forEach((wrappedItem, index) => {
      const rank = (page - 1) * RAKUTEN_RANKING_PAGE_SIZE + index + 1;
      const product = toProduct(wrappedItem.Item ?? {}, rank, [`楽天 ${rank}位`]);

      if (!product || seen.has(product.sourceExternalId)) {
        return;
      }

      entries.push(product);
      seen.add(product.sourceExternalId);
    });

    if (page < RAKUTEN_RANKING_PAGES) {
      await sleep(RAKUTEN_REQUEST_DELAY_MS);
    }
  }

  return entries;
};

const fetchSupplementalEntries = async (seen: Set<string>) => {
  const applicationId = getRequiredEnv("RAKUTEN_APPLICATION_ID");
  const accessKey = getRequiredEnv("RAKUTEN_ACCESS_KEY");
  const entries: NormalizedRakutenRankingProduct[] = [];
  let syntheticRank = RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES + 1;

  for (const query of MALE_SUPPLEMENTAL_SEARCH_QUERIES) {
    const url = new URL(RAKUTEN_ITEM_SEARCH_ENDPOINT);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("accessKey", accessKey);
    url.searchParams.set("genreId", RAKUTEN_PROTEIN_GENRE_ID);
    url.searchParams.set("keyword", query);
    url.searchParams.set("hits", "3");
    url.searchParams.set("sort", "-reviewCount");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatVersion", "2");

    const payload = (await fetchJsonWithRetry(url)) as RakutenItemSearchResponse;
    const items = payload.Items ?? [];

    items.forEach((wrappedItem) => {
      const product = toProduct(wrappedItem.Item ?? {}, syntheticRank, [query]);
      syntheticRank += 1;

      if (!product || seen.has(product.sourceExternalId)) {
        return;
      }

      entries.push(product);
      seen.add(product.sourceExternalId);
    });

    await sleep(RAKUTEN_REQUEST_DELAY_MS);
  }

  return entries;
};

export const fetchRakutenProteinRankingEntries = async (): Promise<NormalizedRakutenRankingProduct[]> => {
  const rankingEntries = await fetchRankingEntries();
  const seen = new Set(rankingEntries.map((entry) => entry.sourceExternalId));
  const supplementalEntries = await fetchSupplementalEntries(seen);

  return [...rankingEntries, ...supplementalEntries];
};
