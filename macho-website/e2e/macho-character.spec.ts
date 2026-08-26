import { expect, test, type Page } from "@playwright/test";
import { BODY_EVOLUTION_STAGES } from "../src/lib/macho-clicker/progression";
import { MACHO_CLICKER_SAVE_VERSION } from "../src/lib/macho-clicker/save";

const loadedCharacter = async (page: Page, selector: string) => {
  const image = page.locator(selector);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  return image;
};

const seedGame = async (page: Page, stage: number) => {
  await page.route("**/api/macho-clicker/rankings", (route) => route.fulfill({ json: { rankings: [] } }));
  await page.addInitScript(({ stage, saveVersion }) => {
    localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify({
      saveVersion, bodyEvolutionStage: stage, muscle: 2_500_000_000, totalMuscle: 2_500_000_000,
      lastSavedAt: Date.now(),
    }));
    localStorage.setItem("machoda:macho-clicker:onboarding:v1", "complete");
  }, { stage, saveVersion: MACHO_CLICKER_SAVE_VERSION });
};

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-narrow", width: 320, height: 640 },
]) {
  test(`home ${viewport.name}: full body, no overlap, only Lv50, reduced motion`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const characterRequests = new Set<string>();
    page.on("request", (request) => {
      const level = decodeURIComponent(request.url()).match(/macho-face2-lv(\d{3})/);
      if (level) characterRequests.add(level[1]);
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const image = await loadedCharacter(page, ".macho-brand-character");
    await expect(image).toHaveAttribute("width", "768");
    await expect(image).toHaveAttribute("height", "1230");
    await expect(image).not.toHaveAttribute("loading", "lazy");
    const styles = await image.evaluate((element) => {
      const style = getComputedStyle(element);
      return { objectFit: style.objectFit, aspectRatio: style.aspectRatio, duration: style.animationDuration };
    });
    expect(styles).toEqual({ objectFit: "contain", aspectRatio: "768 / 1230", duration: "4s" });
    const box = (await image.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(768 / 1230, 2);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    for (const link of await page.locator("main > section a").all()) {
      const linkBox = (await link.boundingBox())!;
      const overlaps = box.x < linkBox.x + linkBox.width && box.x + box.width > linkBox.x &&
        box.y < linkBox.y + linkBox.height && box.y + box.height > linkBox.y;
      expect(overlaps).toBe(false);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/character/home-${viewport.name}.png`, fullPage: true });
    await page.screenshot({ path: `test-results/character/home-${viewport.name}-viewport.png` });
    expect([...characterRequests]).toEqual(["050"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(image).toHaveCSS("animation-name", "none");
    await expect(image).toHaveCSS("transform", "none");
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  for (const stage of [0, 6, 11]) {
    const current = BODY_EVOLUTION_STAGES[stage];
    test(`game ${viewport.name} Lv${current.level}: full body and current/next-only requests`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const characterRequests = new Set<number>();
      page.on("request", (request) => {
        const level = request.url().match(/macho-face2-lv(\d{3})/);
        if (level) characterRequests.add(Number(level[1]));
      });
      await seedGame(page, stage);
      await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
      const image = await loadedCharacter(page, ".macho-character-image");
      await expect(image).toHaveAttribute("src", current.imageSrc);
      await expect(image).toHaveCSS("object-fit", "contain");
      const box = (await image.boundingBox())!;
      const zone = (await page.locator(".macho-character-zone").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(zone.x - 1);
      expect(box.y).toBeGreaterThanOrEqual(zone.y - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(zone.x + zone.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(zone.y + zone.height + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      const allowed = [current.level, BODY_EVOLUTION_STAGES[stage + 1]?.level].filter(Boolean);
      await expect.poll(() => [...characterRequests].sort((a, b) => a - b)).toEqual(allowed);
      await page.screenshot({ path: `test-results/character/game-${viewport.name}-lv${current.level}.png`, fullPage: true });
    });
  }
}

test("all 12 stages evolve in one stable rectangle and crossfade", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedGame(page, 0);
  await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
  await loadedCharacter(page, ".macho-character-image");
  const initialBox = (await page.locator(".macho-character-image").boundingBox())!;
  for (const stage of BODY_EVOLUTION_STAGES.slice(1)) {
    await page.evaluate(() => {
      const frame = document.querySelector(".macho-character-frame")!;
      frame.removeAttribute("data-verified-crossfade");
      const observer = new MutationObserver(() => {
        const layers = frame.querySelectorAll("img");
        if (layers.length !== 2) return;
        const [oldBox, newBox] = Array.from(layers, (image) => image.getBoundingClientRect());
        const same = (["x", "y", "width", "height"] as const).every((key) =>
          Math.abs(oldBox[key] - newBox[key]) < 1,
        );
        frame.setAttribute("data-verified-crossfade", String(same));
        observer.disconnect();
      });
      observer.observe(frame, { childList: true });
    });
    await page.getByRole("button", { name: "進化する", exact: true }).click({ force: true });
    await expect(page.locator(".macho-character-image")).toHaveAttribute("src", stage.imageSrc);
    await expect(page.locator(".macho-character-frame")).toHaveAttribute("data-verified-crossfade", "true");
    await expect(page.locator(".macho-character-outgoing")).toHaveCount(0);
    const box = (await page.locator(".macho-character-image").boundingBox())!;
    expect(box.width).toBeCloseTo(initialBox.width, 0);
    expect(box.height).toBeCloseTo(initialBox.height, 0);
    expect(box.x).toBeCloseTo(initialBox.x, 0);
    expect(box.y).toBeCloseTo(initialBox.y, 0);
  }
  await expect(page.getByText("最終進化済み")).toBeVisible();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3")!).bodyEvolutionStage)).toBe(11);
});

test("reduced motion disables evolution fades", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedGame(page, 10);
  await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
  await loadedCharacter(page, ".macho-character-image");
  await page.getByRole("button", { name: "進化する", exact: true }).click({ force: true });
  await expect(page.locator(".macho-character-image")).toHaveAttribute("src", /lv100/);
  await expect(page.locator(".macho-character-image")).toHaveCSS("animation-name", "none");
});
