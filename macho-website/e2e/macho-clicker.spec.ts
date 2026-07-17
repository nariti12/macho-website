import { expect, test, type Page } from "@playwright/test";

const openFreshGame = async (page: Page) => {
  // Keep UI regression tests deterministic and independent from the optional
  // public ranking API. The API itself is covered by server-side checks.
  await page.route("**/api/macho-clicker/rankings", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ rankings: [] }) })
  );
  await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "マチョ田をクリック" })).toBeVisible();
  await page.waitForTimeout(750);
};

const expectNoPageOverflow = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
};

for (const viewport of [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "mobile-390", width: 390, height: 844 },
]) {
  test(`${viewport.name}: layout and screenshot`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshGame(page);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `test-results/visual/${viewport.name}.png`, fullPage: true });
  });
}

test("desktop: click, purchase, settings and save", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);

  const character = page.getByRole("button", { name: "マチョ田をクリック" });
  for (let count = 0; count < 20; count += 1) await character.click({ force: true });

  const dumbbell = page.getByRole("button", { name: /ダンベル/ }).last();
  await expect(dumbbell).toBeEnabled();
  await dumbbell.click();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}").upgrades?.pushUp ?? 0)
    )
    .toBe(1);

  const soundButton = page.getByRole("button", { name: /効果音 OFF/ }).first();
  await soundButton.click();
  await expect(page.getByRole("button", { name: /効果音 ON/ }).first()).toBeVisible();

  const lightweightButton = page.getByRole("button", { name: /軽量 OFF/ }).first();
  await lightweightButton.click();
  await expect(page.getByRole("button", { name: /軽量 ON/ }).first()).toBeVisible();

  // The game auto-saves every five seconds. Reloading verifies the real restore path,
  // not just the presence of a save button.
  await page.waitForTimeout(5_500);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}"));
  expect(saved.upgrades.pushUp).toBe(1);
  expect(saved.lastSavedAt).toBeGreaterThan(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "マチョ田をクリック" })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}").upgrades?.pushUp ?? 0)
    )
    .toBe(1);
  await expectNoPageOverflow(page);
});

test("mobile: tabs remain usable and shop scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  await page.getByRole("button", { name: "ショップ", exact: true }).click();
  await expect(page.getByText("ショップ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("アップグレード", { exact: true })).toBeVisible();
  await page.mouse.wheel(0, 1_400);

  await page.getByRole("button", { name: "ジム", exact: true }).click();
  await expect(page.getByText("ジム設備", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "統計", exact: true }).click();
  await expect(page.getByRole("heading", { name: "統計・セーブ" })).toBeVisible();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("保存しました。", { exact: true }).first()).toBeVisible();
  await expectNoPageOverflow(page);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: 30-minute session resume keeps production and save healthy`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshGame(page);

    const before = {
      muscle: 5,
      totalMuscle: 20,
      upgrades: { pushUp: 1 },
      lastSavedAt: Date.now() - 30 * 60 * 1_000,
    };
    // Seed on the next document before React mounts. Writing immediately before
    // reload would be overwritten by the current component's cleanup save.
    await page.addInitScript((seeded) => {
      localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify(seeded));
    }, before);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "マチョ田をクリック" })).toBeVisible();
    await page.waitForTimeout(5_500);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}"));

    expect(after.totalMuscle).toBeGreaterThan(before.totalMuscle);
    expect(after.lastSavedAt).toBeGreaterThan(before.lastSavedAt);
    await expectNoPageOverflow(page);
  });
}

test("all gameplay sounds are delivered", async ({ request }) => {
  for (const sound of ["click", "buy", "blocked", "achievement", "golden-spawn", "golden-collect"]) {
    const response = await request.get(`/sounds/macho-clicker/${sound}.wav`);
    expect(response.ok(), `${sound}.wav should be available`).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("audio");
  }
});

test("golden protein spawns and grants a reward", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.clock.install({ time: new Date("2026-07-17T12:00:00+09:00") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);

  await page.clock.fastForward("05:01");
  const goldenProtein = page.getByRole("button", { name: /プロテインを獲得$/ });
  await expect(goldenProtein).toBeVisible();
  await goldenProtein.click({ force: true });
  await expect(page.getByText(/Lucky!/).first()).toBeVisible();
});
