import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ request }) => {
  await request.get("http://localhost:4319/fixture?legacy=false");
});

for (const width of [390, 1280]) {
  test(`answer photo loads without cropping or overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/questions");
    const answer = page.locator("article").filter({ hasText: "腹筋見せてよ" });
    await expect(answer).toContainText("トレーニングの成果です！");
    const image = answer.getByRole("img", { name: "マチョ田の回答に添付された写真" });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveCSS("object-fit", "contain");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const popupPromise = page.waitForEvent("popup");
    await answer.getByRole("link", { name: "回答の写真を大きく見る" }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(popup.url()).toBe("http://localhost:4319/storage/v1/object/public/question-answers/abs.png");
    await popup.close();
    await page.screenshot({ path: `test-results/questions-${width}.png`, fullPage: true });
  });
}

test("text answers remain visible and untrusted photos and pending questions stay hidden", async ({ page }) => {
  await page.goto("/questions");
  await expect(page.locator("article").filter({ hasText: "好きな種目は？" })).toContainText("スクワットです。");
  await expect(page.locator("article").filter({ hasText: "不正な画像URL" })).toContainText("文章は表示されます。");
  await expect(page.getByRole("link", { name: "回答の写真を大きく見る" })).toHaveCount(1);
  await expect(page.getByText("未公開の質問", { exact: true })).toHaveCount(0);
});

test("text answers remain available before the image migration is applied", async ({ page, request }) => {
  await request.get("http://localhost:4319/fixture?legacy=true");
  await page.goto("/questions");
  await expect(page.locator("article").filter({ hasText: "腹筋見せてよ" })).toContainText("トレーニングの成果です！");
  await expect(page.getByRole("link", { name: "回答の写真を大きく見る" })).toHaveCount(0);
});

test("visitors cannot attach photos and multipart image submissions are rejected", async ({ page, request }) => {
  await page.goto("/questions");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  const photo = await readFile("public/images/questions-og.png");
  const response = await request.post("/api/questions", { multipart: {
    question: "ユーザー側の画像添付は停止", image: { name: "photo.png", mimeType: "image/png", buffer: photo },
  }});
  expect(response.status()).toBe(415);
  const state = await (await request.get("http://localhost:4319/fixture/state")).json();
  expect(state.uploadedFiles).toBe(0);
  expect(state.rows).toHaveLength(0);
});

test("existing JSON text-only submissions continue to work", async ({ request }) => {
  const response = await request.post("/api/questions", { data: { question: "文章だけの質問です。" }});
  expect(response.status()).toBe(201);
});

test("previous user photo attachments are hidden and their image URLs no longer work", async ({ page, request }) => {
  await request.get("http://localhost:4319/fixture/legacy-image");
  await page.goto("/questions");
  await expect(page.locator("article").filter({ hasText: "以前の画像付き質問" })).toContainText("回答文は引き続き表示");
  await expect(page.getByRole("img", { name: "質問に添付された写真" })).toHaveCount(0);
  expect((await request.get("/api/questions/11111111-1111-4111-8111-111111111111/image")).status()).toBe(404);
});
