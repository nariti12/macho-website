import { MYBEST_FEMALE_URL, MYBEST_MALE_URL, RAKUTEN_MAX_RETRIES, RAKUTEN_REQUEST_DELAY_MS } from "@/lib/protein-rankings/constants";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n");

const FALLBACK_MALE_TITLES = [
  "ゴールドスタンダード 100%ホエイプロテイン",
  "ビーレジェンド WPC",
  "VALX ホエイプロテイン",
  "WINZONE ホエイプロテイン",
] as const;

const FALLBACK_FEMALE_TITLES = [
  "女性向けプロテイン",
  "ソイプロテイン",
  "ビューティプロテイン",
  "置き換えプロテイン",
] as const;

const fetchHtml = async (url: string) => {
  let attempt = 0;

  while (attempt < RAKUTEN_MAX_RETRIES) {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja-JP,ja;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return response.text();
    }

    attempt += 1;
    if (attempt >= RAKUTEN_MAX_RETRIES) {
      throw new Error(`my-best request failed: ${response.status}`);
    }

    await sleep(RAKUTEN_REQUEST_DELAY_MS * attempt);
  }

  throw new Error("my-best request failed: retries exhausted");
};

const extractRankedTitles = (html: string) => {
  const lines = toText(html)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && line.length < 120);

  const titles: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] !== "おすすめスコア") {
      continue;
    }

    for (let cursor = index - 1; cursor >= Math.max(0, index - 6); cursor -= 1) {
      const candidate = lines[cursor];
      if (
        /(プロテイン|ホエイ|ソイ|WPC|WPI|ウェイトダウン|ビューティ)/i.test(candidate) &&
        !titles.includes(candidate)
      ) {
        titles.push(candidate);
        break;
      }
    }

    if (titles.length >= 10) {
      break;
    }
  }

  return titles;
};

export const fetchMyBestReferenceTitles = async () => {
  const [maleHtml, femaleHtml] = await Promise.all([fetchHtml(MYBEST_MALE_URL), fetchHtml(MYBEST_FEMALE_URL)]);

  const maleTitles = extractRankedTitles(maleHtml);
  const femaleTitles = extractRankedTitles(femaleHtml);

  return {
    maleTitles: maleTitles.length > 0 ? maleTitles : [...FALLBACK_MALE_TITLES],
    femaleTitles: femaleTitles.length > 0 ? femaleTitles : [...FALLBACK_FEMALE_TITLES],
  };
};
