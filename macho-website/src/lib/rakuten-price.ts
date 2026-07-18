const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

const RAKUTEN_REQUEST_INTERVAL_MS = 1100;
const RAKUTEN_MAX_ATTEMPTS = 3;

let requestQueue: Promise<void> = Promise.resolve();

type RakutenPriceResponse = {
  Items?: Array<{
    itemPrice?: number;
  }>;
  items?: Array<{
    itemPrice?: number;
  }>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enqueueRakutenRequest = async <T>(request: () => Promise<T>) => {
  const previous = requestQueue;
  let releaseQueue: () => void = () => undefined;
  requestQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await previous;
  try {
    return await request();
  } finally {
    await sleep(RAKUTEN_REQUEST_INTERVAL_MS);
    releaseQueue();
  }
};

const getRakutenKeywordFromSearchUrl = (url: string) => {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/search\/mall\/([^/]+)\//);
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
};

export const formatYen = (price: number) => `${price.toLocaleString("ja-JP")}円`;

export const fetchRakutenPriceLabel = async (searchUrl: string | undefined, fallbackPriceYen: number) => {
  if (!searchUrl || !process.env.RAKUTEN_APPLICATION_ID || !process.env.RAKUTEN_ACCESS_KEY) {
    return formatYen(fallbackPriceYen);
  }

  const keyword = getRakutenKeywordFromSearchUrl(searchUrl);
  if (!keyword) {
    return formatYen(fallbackPriceYen);
  }

  try {
    const url = new URL(RAKUTEN_ITEM_SEARCH_ENDPOINT);
    url.searchParams.set("applicationId", process.env.RAKUTEN_APPLICATION_ID);
    url.searchParams.set("accessKey", process.env.RAKUTEN_ACCESS_KEY);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("hits", "5");
    url.searchParams.set("page", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatVersion", "2");
    url.searchParams.set("elements", "itemPrice");

    let payload: RakutenPriceResponse | null = null;

    for (let attempt = 1; attempt <= RAKUTEN_MAX_ATTEMPTS; attempt += 1) {
      const response = await enqueueRakutenRequest(() =>
        fetch(url, {
          headers: {
            Accept: "application/json",
            Origin: process.env.RAKUTEN_SITE_ORIGIN ?? "https://www.machoda.com",
            Referer: `${process.env.RAKUTEN_SITE_ORIGIN ?? "https://www.machoda.com"}/`,
          },
          next: { revalidate: 604800 },
        })
      );

      if (response.ok) {
        payload = (await response.json()) as RakutenPriceResponse;
        break;
      }

      const body = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === RAKUTEN_MAX_ATTEMPTS) {
        console.warn(`Failed to fetch Rakuten price: ${response.status} ${body.slice(0, 200)}`);
        return formatYen(fallbackPriceYen);
      }
    }

    const prices = (payload?.Items ?? payload?.items ?? [])
      .map((item) => item.itemPrice)
      .filter((price): price is number => typeof price === "number" && price > 0);

    return prices[0] ? formatYen(prices[0]) : formatYen(fallbackPriceYen);
  } catch (error) {
    console.warn("Failed to fetch Rakuten price", error);
    return formatYen(fallbackPriceYen);
  }
};
