import {
  RAKUTEN_MAX_RETRIES,
  RAKUTEN_RANKING_ENDPOINT,
  RAKUTEN_PUBLIC_RANKING_URL,
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

const buildAffiliateUrl = (itemUrl: string) => {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!affiliateId) return itemUrl;
  return `${itemUrl}${itemUrl.includes("?") ? "&" : "?"}scid=af_pc_etc&sc2id=${affiliateId}`;
};

const getRequiredEnv = (name: "RAKUTEN_APPLICATION_ID" | "RAKUTEN_ACCESS_KEY") => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const getSiteOrigin = () => process.env.RAKUTEN_SITE_ORIGIN?.trim() || "https://www.machoda.com";

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const extractSourceExternalId = (itemUrl: string) => {
  try {
    const url = new URL(itemUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
  } catch {
    // ignore URL parse failure
  }

  return itemUrl;
};

const extractPriceYen = (block: string) => {
  const match = block.match(/([0-9][0-9,]*)円(?:～)?/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
};

const extractReviewCount = (block: string) => {
  const match = block.match(/レビュー\(([\d,]+)件\)/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
};

const extractShopName = (block: string) => {
  const matches = [...block.matchAll(/<a[^>]+href="https:\/\/www\.rakuten\.co\.jp\/[^"]*"[^>]*>(.*?)<\/a>/gi)];
  const value = matches.at(-1)?.[1];
  return value ? stripHtml(decodeHtml(value)) : null;
};

const extractImageUrl = (block: string) => {
  const match = block.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
  return match ? decodeHtml(match[1]) : null;
};

const fetchRankingPageHtml = async () => {
  let attempt = 0;

  while (attempt < RAKUTEN_MAX_RETRIES) {
    const response = await fetch(RAKUTEN_PUBLIC_RANKING_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return await response.text();
    }

    const body = await response.text();
    attempt += 1;

    if (attempt >= RAKUTEN_MAX_RETRIES) {
      throw new Error(`Rakuten ranking page request failed: ${response.status} ${body.slice(0, 200)}`.trim());
    }

    await sleep(RAKUTEN_REQUEST_DELAY_MS * attempt);
  }

  throw new Error("Rakuten ranking page request failed: retries exhausted");
};

type RakutenRankingResponse = {
  Items?: Array<{
    Item?: {
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
  }>;
};

const fetchRankingApiPage = async (page: number) => {
  const applicationId = getRequiredEnv("RAKUTEN_APPLICATION_ID");
  const accessKey = getRequiredEnv("RAKUTEN_ACCESS_KEY");
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  const url = new URL(RAKUTEN_RANKING_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
  url.searchParams.set("genreId", "567603");
  url.searchParams.set("page", String(page));
  url.searchParams.set("period", "realtime");
  url.searchParams.set("format", "json");
  if (affiliateId) {
    url.searchParams.set("affiliateId", affiliateId);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessKey}`,
      Origin: getSiteOrigin(),
      Referer: `${getSiteOrigin()}/`,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Rakuten ranking API fallback failed: ${response.status} ${body.slice(0, 200)}`.trim());
  }

  return (await response.json()) as RakutenRankingResponse;
};

const fetchRakutenRankingApiEntries = async (): Promise<NormalizedRakutenRankingProduct[]> => {
  const entries: NormalizedRakutenRankingProduct[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= RAKUTEN_RANKING_PAGES; page += 1) {
    const payload = await fetchRankingApiPage(page);
    const items = payload.Items ?? [];

    for (const [index, wrappedItem] of items.entries()) {
      const item = wrappedItem.Item;
      const itemCode = item?.itemCode;
      const title = stripHtml(item?.itemName);
      const itemUrl = item?.itemUrl ?? null;

      if (!itemCode || !title || !itemUrl || seen.has(itemCode)) {
        continue;
      }

      const parsedReviewAverage = item.reviewAverage ? Number(item.reviewAverage) : null;
      const imageUrl = item.mediumImageUrls?.find((image) => image.imageUrl)?.imageUrl ?? null;
      const rank = (page - 1) * RAKUTEN_RANKING_PAGE_SIZE + index + 1;

      entries.push({
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
        affiliateUrl: item.affiliateUrl ?? buildAffiliateUrl(itemUrl),
        shopName: stripHtml(item.shopName) || null,
        brandName: stripHtml(item.shopName) || null,
        matchedQueries: [`楽天 ${rank}位`],
        discoveryScore: Math.max(0, 1 - (rank - 1) / (RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES)),
        rakutenRank: rank,
        rawPayload: item,
      });

      seen.add(itemCode);
    }
  }

  return entries;
};

export const fetchRakutenProteinRankingEntries = async (): Promise<NormalizedRakutenRankingProduct[]> => {
  let html: string | null = null;
  try {
    html = await fetchRankingPageHtml();
  } catch (error) {
    console.warn("Failed to fetch public Rakuten ranking page, falling back to ranking API.", error);
  }

  if (!html) {
    return fetchRakutenRankingApiEntries();
  }

  const entries: NormalizedRakutenRankingProduct[] = [];
  const seen = new Set<string>();
  const itemMatches = [
    ...html.matchAll(/<a[^>]+href="(https:\/\/item\.rakuten\.co\.jp\/[^"]+)"[^>]*>(.*?)<\/a>/gi),
  ];

  for (const [index, match] of itemMatches.entries()) {
    const itemUrl = decodeHtml(match[1]);
    const rawTitle = decodeHtml(match[2]);
    const title = stripHtml(rawTitle);

    if (!title || seen.has(itemUrl)) {
      continue;
    }

    const nextIndex = itemMatches[index + 1]?.index ?? html.length;
    const block = html.slice(match.index ?? 0, nextIndex);
    const reviewCount = extractReviewCount(block);
    const shopName = extractShopName(block);
    const imageUrl = extractImageUrl(block);
    const sourceExternalId = extractSourceExternalId(itemUrl);
    const rank = entries.length + 1;

    if (rank > RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES) {
      break;
    }

    entries.push({
      source: "rakuten",
      sourceExternalId,
      ecProvider: "rakuten",
      title,
      description: title,
      imageUrl,
      priceYen: extractPriceYen(block),
      reviewAverage: null,
      reviewCount,
      itemUrl,
      affiliateUrl: buildAffiliateUrl(itemUrl),
      shopName,
      brandName: shopName,
      matchedQueries: [`楽天 ${rank}位`],
      discoveryScore: Math.max(0, 1 - (rank - 1) / (RAKUTEN_RANKING_PAGE_SIZE * RAKUTEN_RANKING_PAGES)),
      rakutenRank: rank,
      rawPayload: {
        block: block.slice(0, 1000),
      },
    });

    seen.add(itemUrl);
  }

  return entries;
};
