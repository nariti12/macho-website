import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

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

test("a submitted photo stays private until published and disappears when archived", async ({ page, request }) => {
  await page.goto("/questions");
  await page.getByRole("textbox", { name: "質問内容" }).fill("この写真のフォームを見てください");
  await page.getByLabel("写真を添付（任意）").setInputFiles("public/images/questions-og.png");
  await expect(page.getByRole("img", { name: "添付する写真のプレビュー" })).toBeVisible();
  await page.getByRole("button", { name: "写真を取り外す" }).click();
  await expect(page.getByRole("img", { name: "添付する写真のプレビュー" })).toHaveCount(0);
  await page.getByLabel("写真を添付（任意）").setInputFiles("public/images/questions-og.png");
  await page.getByRole("button", { name: "匿名で質問を送る", exact: true }).click();
  await expect(page.getByText("質問を受け付けました！", { exact: false })).toBeVisible();
  const { rows } = await (await request.get("http://localhost:4319/fixture/state")).json();
  const id = rows[0].id;
  expect((await request.get(`/api/questions/${id}/image`)).status()).toBe(404);
  await page.reload();
  await expect(page.getByText("この写真のフォームを見てください", { exact: true })).toHaveCount(0);
  await request.get(`http://localhost:4319/fixture/publish?id=${id}`);
  await page.reload();
  const questionPhoto = page.locator("article").filter({ hasText: "この写真のフォームを見てください" }).getByRole("img", { name: "質問に添付された写真" });
  await expect(questionPhoto).toBeVisible();
  await expect.poll(() => questionPhoto.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  const publishedImage = await request.get(`/api/questions/${id}/image`);
  expect(publishedImage.status()).toBe(200);
  expect(publishedImage.headers()["cache-control"]).toContain("no-store");
  expect(publishedImage.headers()["content-type"]).toContain("image/webp");
  await request.get(`http://localhost:4319/fixture/publish?id=${id}&status=archived`);
  expect((await request.get(`/api/questions/${id}/image`)).status()).toBe(404);
});

test("the server rejects fake images and oversized attachments", async ({ request }) => {
  const invalid = await request.post("/api/questions", { multipart: {
    question: "画像の形式検証", image: { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not an image") },
  }});
  expect(invalid.status()).toBe(400);
  const oversized = await request.post("/api/questions", { multipart: {
    question: "画像の容量検証", image: { name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(3 * 1024 * 1024 + 1) },
  }});
  expect(oversized.status()).toBe(413);
});

test("failed question saves remove uploaded files, and rate limits stop uploads", async ({ request }) => {
  const photo = await readFile("public/images/questions-og.png");
  await request.get("http://localhost:4319/fixture?failInsert=true");
  const failed = await request.post("/api/questions", { multipart: {
    question: "保存失敗の確認", image: { name: "photo.png", mimeType: "image/png", buffer: photo },
  }});
  expect(failed.status()).toBe(500);
  expect((await (await request.get("http://localhost:4319/fixture/state")).json()).uploadedFiles).toBe(0);
  await request.get("http://localhost:4319/fixture?denyRate=true");
  const limited = await request.post("/api/questions", { multipart: {
    question: "投稿制限の確認", image: { name: "photo.png", mimeType: "image/png", buffer: photo },
  }});
  expect(limited.status()).toBe(429);
});

test("existing JSON text-only submissions continue to work", async ({ request }) => {
  const response = await request.post("/api/questions", { data: { question: "文章だけの質問です。" }});
  expect(response.status()).toBe(201);
});

test("uploaded photos are resized and stripped of metadata before being served", async ({ request }) => {
  const photo = await sharp({ create: { width: 2200, height: 1000, channels: 3, background: "#ddaa88" } })
    .jpeg().withMetadata({ exif: { IFD0: { Artist: "Private test photographer" } } }).toBuffer();
  expect((await sharp(photo).metadata()).exif).toBeDefined();
  const response = await request.post("/api/questions", { multipart: {
    question: "写真の撮影情報の確認", image: { name: "personal-name.jpg", mimeType: "image/jpeg", buffer: photo },
  }});
  expect(response.status()).toBe(201);
  const { rows } = await (await request.get("http://localhost:4319/fixture/state")).json();
  await request.get(`http://localhost:4319/fixture/publish?id=${rows[0].id}`);
  const image = await request.get(`/api/questions/${rows[0].id}/image`);
  expect(image.status()).toBe(200);
  const metadata = await sharp(await image.body()).metadata();
  expect(metadata.width).toBe(1600);
  expect(metadata.format).toBe("webp");
  expect(metadata.exif).toBeUndefined();
  expect(metadata.xmp).toBeUndefined();
});
