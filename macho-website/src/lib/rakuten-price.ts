const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

type RakutenPriceResponse = {
  Items?: Array<{
    itemPrice?: number;
  }>;
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

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.RAKUTEN_ACCESS_KEY}`,
        Referer: `${process.env.RAKUTEN_SITE_ORIGIN ?? "https://www.machoda.com"}/`,
      },
      next: { revalidate: 604800 },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch Rakuten price: ${response.status}`);
      return formatYen(fallbackPriceYen);
    }

    const payload = (await response.json()) as RakutenPriceResponse;
    const prices = (payload.Items ?? [])
      .map((item) => item.itemPrice)
      .filter((price): price is number => typeof price === "number" && price > 0);

    return prices[0] ? formatYen(prices[0]) : formatYen(fallbackPriceYen);
  } catch (error) {
    console.warn("Failed to fetch Rakuten price", error);
    return formatYen(fallbackPriceYen);
  }
};
