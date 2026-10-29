import { expect, test } from "@playwright/test";

const authorizedSeller = "google.com, pub-8978423301604206, DIRECT, f08c47fec0942fa0";
const googleDataPolicy = "https://policies.google.com/technologies/partner-sites";

test.beforeEach(async ({ context, baseURL }) => {
  // Keep verification local, including when the shared layout contains ad code.
  const origin = new URL(baseURL!).origin;
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
});

test("web and app buyers can retrieve the authorized seller as plain text", async ({ request }) => {
  for (const path of ["/ads.txt", "/app-ads.txt"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain("text/plain");
    expect((await response.text()).trim(), path).toBe(authorizedSeller);
  }
});

for (const width of [390, 1280]) {
  test(`visitors can open the published iOS app at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/apps/torecha");
    const storeLink = page.getByRole("link", { name: "App Storeでダウンロード" });
    await expect(storeLink).toBeVisible();
    expect(await storeLink.getAttribute("href")).toBe("https://apps.apple.com/app/id6808664886");
    await expect(page.getByText("App Storeで近日公開", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

for (const path of ["/privacy", "/apps/torecha/privacy?lang=ja", "/apps/torecha/privacy?lang=en", "/apps/torecha/privacy?lang=ko"]) {
  test(`readers can reach Google's data-use explanation from ${path}`, async ({ page }) => {
    await page.goto(path);
    const link = page.locator(`a[href="${googleDataPolicy}"]`);
    await expect(link).toBeVisible();
    await expect(link).not.toHaveText("");
  });
}
