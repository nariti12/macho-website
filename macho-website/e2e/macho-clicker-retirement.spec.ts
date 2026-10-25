import { expect, test } from "@playwright/test";
import { GET as getLegacy, POST as postLegacy } from "../src/app/api/macho-clicker/rankings/route";
import { GET as getTaps, POST as postTaps } from "../src/app/api/macho-clicker/tap-rankings/route";
import sitemap from "../src/app/sitemap";

for (const [name, get, post] of [["legacy", getLegacy, postLegacy], ["tap", getTaps, postTaps]] as const) {
  test(`${name} ranking reads and submissions are retired without database access`, async () => {
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    try {
      const responses = [await get(), await post()];
      for (const response of responses) {
        expect(response.status).toBe(410);
        expect(await response.json()).toMatchObject({ available: false, items: [] });
      }
    } finally {
      if (savedKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
    }
  });
}

test("the retired game is excluded from the sitemap", async () => {
  const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
  expect(urls).not.toContain("/macho-clicker");
  expect(urls).toContain("/training-wear");
  expect(urls).toContain("/questions");
});

for (const width of [390, 1280]) {
  test(`published site removes the game and redirects old links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href*="/macho-clicker"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /トレチャ/ }).first()).toBeVisible();
    const response = await page.request.get("/macho-clicker", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, page.url()).pathname).toBe("/");
    await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByTestId("macho-character-button")).toHaveCount(0);
  });
}
