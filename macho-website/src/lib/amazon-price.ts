import { unstable_cache } from "next/cache";

const AMAZON_PRICE_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const AMAZON_PRICE_TIMEOUT_MS = 8_000;

export type CreatinePriceKey = "innocect" | "nature-in";

export type CreatinePriceSnapshot = Record<CreatinePriceKey, number>;

type AmazonBuyingOption = {
  priceAmount?: number;
  buyingOptionType?: string;
};

type AmazonBuyingOptionsPayload = Record<string, AmazonBuyingOption[]>;

const CREATINE_PRICE_TARGETS: Record<
  CreatinePriceKey,
  { asin: string; fallbackPriceYen: number }
> = {
  innocect: {
    asin: "B0DHTBTPJQ",
    fallbackPriceYen: 2_340,
  },
  "nature-in": {
    asin: "B0FY5PBSM1",
    fallbackPriceYen: 2_490,
  },
};

const parseAmazonOneTimePrice = (html: string) => {
  const payloadMatch = html.match(
    /twister-plus-buying-options-price-data[^>]*>(\{[\s\S]*?\})<\/div>/
  );

  if (payloadMatch) {
    try {
      const payload = JSON.parse(payloadMatch[1]) as AmazonBuyingOptionsPayload;
      const buyingOptions = Object.values(payload).flat();
      const oneTimePurchase = buyingOptions.find(
        (option) => option.buyingOptionType === "NEW"
      );

      if (
        typeof oneTimePurchase?.priceAmount === "number" &&
        oneTimePurchase.priceAmount > 0
      ) {
        return Math.round(oneTimePurchase.priceAmount);
      }
    } catch (error) {
      console.warn("Failed to parse Amazon buying options", error);
    }
  }

  const visiblePriceMatch = html.match(
    /priceToPay[^>]*>[\s\S]*?<span class="a-offscreen">\s*￥([\d,]+)/
  );
  return visiblePriceMatch
    ? Number.parseInt(visiblePriceMatch[1].replaceAll(",", ""), 10)
    : null;
};

const fetchAmazonOneTimePrice = async (
  asin: string,
) => {
  const response = await fetch(`https://www.amazon.co.jp/gp/aw/d/${asin}`, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja-JP,ja;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36",
    },
    signal: AbortSignal.timeout(AMAZON_PRICE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Amazon price request failed for ${asin}: ${response.status}`);
  }

  const priceYen = parseAmazonOneTimePrice(await response.text());
  if (!priceYen || priceYen < 1_000 || priceYen > 20_000) {
    throw new Error(`Amazon price was not found for ${asin}`);
  }

  return priceYen;
};

const cachedAmazonPriceFetchers = Object.fromEntries(
  (Object.keys(CREATINE_PRICE_TARGETS) as CreatinePriceKey[]).map((key) => {
    const { asin } = CREATINE_PRICE_TARGETS[key];
    return [
      key,
      unstable_cache(
        () => fetchAmazonOneTimePrice(asin),
        ["amazon-creatine-price", asin],
        { revalidate: AMAZON_PRICE_REVALIDATE_SECONDS }
      ),
    ];
  })
) as Record<CreatinePriceKey, () => Promise<number>>;

const getAmazonPriceWithFallback = async (key: CreatinePriceKey) => {
  try {
    return await cachedAmazonPriceFetchers[key]();
  } catch (error) {
    console.warn(`Amazon price request failed for ${key}`, error);
    return CREATINE_PRICE_TARGETS[key].fallbackPriceYen;
  }
};

export const fetchCreatinePriceSnapshot = async (): Promise<CreatinePriceSnapshot> => {
  const [innocect, natureIn] = await Promise.all(
    (Object.keys(CREATINE_PRICE_TARGETS) as CreatinePriceKey[]).map((key) =>
      getAmazonPriceWithFallback(key)
    )
  );

  return {
    innocect,
    "nature-in": natureIn,
  };
};
