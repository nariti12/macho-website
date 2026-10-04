import { expect, test } from "@playwright/test";
import { fetchRakutenPriceLabel } from "../src/lib/rakuten-price";

const originalFetch = globalThis.fetch;
const originalAppId = process.env.RAKUTEN_APPLICATION_ID;
const originalAccessKey = process.env.RAKUTEN_ACCESS_KEY;
const searchUrl = "https://search.rakuten.co.jp/search/mall/SAGUARO/";

test.beforeEach(() => {
  process.env.RAKUTEN_APPLICATION_ID = "local-test-app";
  process.env.RAKUTEN_ACCESS_KEY = "local-test-key";
});
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalAppId === undefined) delete process.env.RAKUTEN_APPLICATION_ID;
  else process.env.RAKUTEN_APPLICATION_ID = originalAppId;
  if (originalAccessKey === undefined) delete process.env.RAKUTEN_ACCESS_KEY;
  else process.env.RAKUTEN_ACCESS_KEY = originalAccessKey;
});

test("shoe price comes from the pictured listing rather than a used search result", async () => {
  let requestedUrl = new URL("https://example.com");
  globalThis.fetch = async (input) => {
    requestedUrl = new URL(String(input));
    return Response.json({ Items: [
      { itemCode: "used-shop:123", itemPrice: 3520 },
      { itemCode: "saguaro:10000005", itemPrice: 3480 },
    ] });
  };
  expect(await fetchRakutenPriceLabel(searchUrl, 4580, "saguaro:10000005")).toBe("3,480円");
  expect(requestedUrl.searchParams.get("itemCode")).toBe("saguaro:10000005");
  expect(requestedUrl.searchParams.has("keyword")).toBe(false);
});

test("a missing pictured listing retains the verified reference instead of another model", async () => {
  globalThis.fetch = async () => Response.json({ Items: [{ itemCode: "other-model:456", itemPrice: 1000 }] });
  expect(await fetchRakutenPriceLabel(searchUrl, 3480, "saguaro:10000005")).toBe("3,480円");
});

test("API failure retains the last verified price", async () => {
  globalThis.fetch = async () => new Response("Unavailable", { status: 400 });
  expect(await fetchRakutenPriceLabel(searchUrl, 3480, "saguaro:10000005")).toBe("3,480円");
});

test("existing keyword price lookups remain compatible", async () => {
  globalThis.fetch = async () => Response.json({ items: [{ itemPrice: 2980 }] });
  expect(await fetchRakutenPriceLabel(searchUrl, 4580)).toBe("2,980円");
});
