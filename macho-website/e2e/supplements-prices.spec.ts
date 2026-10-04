import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import type { RankingCardItem } from "../src/lib/protein-rankings/types";

const item: RankingCardItem = {
  rank: 1,
  score: 1,
  comment: null,
  product: {
    id: "verifyst-price-test", ec_provider: "rakuten", title: "Verifyst ホエイ 3kg",
    image_url: null, price_yen: 6000, review_average: null, review_count: 0,
    item_url: null, affiliate_url: null, shop_name: "Verifyst", matched_queries: [],
    source_external_id: "curated:verifyst", updated_at: new Date().toISOString(),
  },
  metrics: {
    product_id: "verifyst-price-test", canonical_brand: "verifyst", rakuten_rank: null,
    content_weight_g: 3000, serving_size_g: null, protein_per_serving_g: null,
    protein_per_100g_g: null, protein_ratio: null, protein_type: "wpc",
    women_keyword_matches: [], beauty_keyword_matches: [], diet_keyword_matches: [],
    price_per_protein_gram: null, excluded: false, exclusion_reason: null,
  },
};

const renderPriceCard = (product: RankingCardItem) => {
  const html = execFileSync(process.execPath, ["e2e/fixtures/render-supplements.cjs"], { input: JSON.stringify({
    data: { sections: [{ key: "male", title: "プロテイン", description: "", items: [product] }], updatedAt: null },
    creatinePrices: { innocect: 2170, "nature-in": 2490 },
  }), encoding: "utf8" });
  return html.match(/<article id="protein-verifyst"[\s\S]*?<\/article>/)?.[0] ?? "";
};

test("verified protein prices are converted to 1kg instead of using the fixed reference", () => {
  expect(renderPriceCard(item)).toContain("2,000円");
  expect(renderPriceCard({ ...item, product: { ...item.product, price_yen: 7500 } })).toContain("2,500円");
});

test("protein prices use the actual package weight and round to whole yen", () => {
  expect(renderPriceCard({ ...item, product: { ...item.product, price_yen: 14580 },
    metrics: { ...item.metrics!, content_weight_g: 2270 } })).toContain("6,423円");
});

test("missing or invalid package weight retains a usable reference price", () => {
  const missing = renderPriceCard({ ...item, metrics: null });
  const invalid = renderPriceCard({ ...item, metrics: { ...item.metrics!, content_weight_g: 0 } });
  expect(missing).toMatch(/参考価格（1kg）[\s\S]*?\d,[\d,]+円/);
  expect(invalid).toMatch(/参考価格（1kg）[\s\S]*?\d,[\d,]+円/);
  expect(missing).not.toContain("Infinity");
  expect(invalid).not.toContain("Infinity");
});
