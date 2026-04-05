import {
  RAKUTEN_MAX_RETRIES,
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

export const fetchRakutenProteinRankingEntries = async (): Promise<NormalizedRakutenRankingProduct[]> => {
  const html = await fetchRankingPageHtml();
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
