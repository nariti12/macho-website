import { expect, test, type Page } from "@playwright/test";
import {
  applyTap, buyEquipment, buyTraining, createTapGame, levelFromTaps,
  levelProgress, LEVEL_100_TAPS, migrateLegacyTapSave, normalizeTapSave,
  tapPower, tapsForLevel, trainingCost, EQUIPMENT,
} from "../src/lib/macho-clicker/tap-game";

const openGame = async (page: Page) => {
  await page.goto("/macho-clicker", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("macho-character-button")).toBeVisible();
};

test("level curve is tap-based, increasing and reaches Lv100 after 300 hours at two taps per second", () => {
  expect(LEVEL_100_TAPS).toBe(300 * 60 * 60 * 2);
  expect(levelFromTaps(0)).toBe(1);
  expect(levelFromTaps(LEVEL_100_TAPS - 1)).toBe(99);
  expect(levelFromTaps(LEVEL_100_TAPS)).toBe(100);
  expect(tapsForLevel(2)).toBeGreaterThanOrEqual(40);
  for (let level = 2; level <= 100; level += 1) {
    expect(tapsForLevel(level)).toBeGreaterThan(tapsForLevel(level - 1));
    expect(levelFromTaps(tapsForLevel(level))).toBe(level);
  }
  expect(tapsForLevel(100) - tapsForLevel(99)).toBeGreaterThan(tapsForLevel(11) - tapsForLevel(10));
  expect(levelProgress(tapsForLevel(50)).percent).toBe(0);
});

test("only taps earn points; equipment and training raise tap power", () => {
  let game = createTapGame();
  for (let count = 0; count < 15; count += 1) game = applyTap(game);
  expect(game.points).toBe(15);
  expect(game.taps).toBe(15);
  const withDumbbells = buyEquipment(game, "dumbbells");
  expect(withDumbbells).not.toBeNull();
  expect(tapPower(withDumbbells!)).toBe(2);
  expect(buyEquipment(withDumbbells!, "dumbbells")).toBeNull();
  expect(buyEquipment({ ...game, points: 1_000 }, "bench")).toBeNull();
  const withBarbell = buyEquipment({ ...withDumbbells!, points: 70, taps: 50 }, "barbell");
  expect(withBarbell?.owned).toContain("barbell");
  const withBench = buyEquipment({ ...withBarbell!, points: 250, taps: 50 }, "bench");
  expect(withBench?.owned).toContain("bench");
  expect(levelFromTaps(withBench!.taps)).toBe(2);
  const trained = buyTraining({ ...withDumbbells!, points: 100 });
  expect(trained).not.toBeNull();
  expect(tapPower(trained!)).toBeGreaterThan(tapPower(withDumbbells!));
  expect(levelFromTaps(trained!.taps)).toBe(levelFromTaps(game.taps));
});

test("equipment purchases stay within reach across the late game", () => {
  const run = (withTraining: boolean) => {
    let game = createTapGame();
    const milestones: number[] = [];
    for (const item of EQUIPMENT) {
      while (game.points < item.cost) {
        const upgradeCost = trainingCost(game.trainingLevel);
        if (withTraining && upgradeCost <= item.cost * 0.05 && game.points >= upgradeCost) {
          game = buyTraining(game)!;
          continue;
        }
        const tapsToItem = Math.ceil((item.cost - game.points) / tapPower(game));
        const tapsToUpgrade = withTraining && upgradeCost <= item.cost * 0.05
          ? Math.ceil((upgradeCost - game.points) / tapPower(game)) : Infinity;
        const taps = Math.max(1, Math.min(tapsToItem, tapsToUpgrade));
        const earned = taps * tapPower(game);
        game = { ...game, taps: game.taps + taps, points: game.points + earned, totalPoints: game.totalPoints + earned };
      }
      game = buyEquipment(game, item.id)!;
      milestones.push(game.taps);
    }
    return milestones;
  };

  const trained = run(true);
  const equipmentOnly = run(false);
  expect(EQUIPMENT).toHaveLength(18);
  expect(trained.at(-1)).toBeLessThan(300_000);
  expect(equipmentOnly.at(-1)).toBeLessThan(LEVEL_100_TAPS);
  const lateGaps = trained.slice(14).map((taps, index) => taps - trained[index + 13]);
  expect(Math.max(...lateGaps)).toBeLessThan(70_000);
});

test("existing players keep their owned gear when new purchases are inserted", () => {
  const saved = normalizeTapSave({
    ...createTapGame(), owned: EQUIPMENT.filter((item) => item.id !== "infernoMachine" && item.id !== "devilThrone").map((item) => item.id),
  });
  expect(saved?.owned).toContain("energyCore");
  expect(saved?.owned).not.toContain("infernoMachine");
  expect(EQUIPMENT.find((item) => !saved?.owned.includes(item.id))?.id).toBe("infernoMachine");
});

test("legacy save keeps real taps and purchased equipment without importing idle currency", () => {
  const migrated = migrateLegacyTapSave({
    clickCount: 52_000, muscle: 1_000_000_000_000,
    upgrades: { pushUp: 7, benchPress: 2, dumbbell: 1 },
  });
  expect(migrated?.taps).toBe(52_000);
  expect(migrated?.points).toBe(0);
  expect(migrated?.owned).toEqual(["dumbbells", "bench", "powerRack"]);
});

test("browser migration preserves the old save and explains the new currency", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify({
      clickCount: 52_000,
      muscle: 1_000_000_000,
      upgrades: { pushUp: 1, benchPress: 1 },
    }));
  });
  await openGame(page);
  await expect(page.getByTestId("gym-dumbbells")).toBeVisible();
  await expect(page.getByTestId("gym-bench")).toBeVisible();
  const saved = await page.evaluate(() => ({
    old: JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}"),
    next: JSON.parse(localStorage.getItem("machoda:macho-clicker:v4") ?? "{}"),
  }));
  expect(saved.old.muscle).toBe(1_000_000_000);
  expect(saved.next.taps).toBe(52_000);
  expect(saved.next.points).toBe(0);
  await page.getByRole("button", { name: "ゲームメニューを開く" }).click();
  await expect(page.getByText(/旧記録から累計タップと購入済み器具を引き継ぎました/)).toBeVisible();
});

test("desktop: tapping, purchase, room change and save restore", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openGame(page);
  const character = page.getByTestId("macho-character-button");
  for (let count = 0; count < 15; count += 1) await character.click({ force: true });
  await expect(page.getByTestId("macho-points")).toHaveText("15 P");
  await page.getByTestId("shop-dumbbells").click();
  await expect(page.getByTestId("gym-dumbbells")).toBeVisible();
  await expect(page.getByTestId("macho-tap-power")).toHaveText("+2 P");
  await expect(page.getByRole("button", { name: /タップ強化 Lv 0/ })).toContainText("あと 50 タップ");
  await character.click({ force: true });
  await expect(page.getByTestId("macho-points")).toHaveText("2 P");
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v4") ?? "{}").taps)).toBe(16);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("gym-dumbbells")).toBeVisible();
  await expect(page.getByTestId("macho-tap-power")).toHaveText("+2 P");
});

test("rapid pointer input counts exactly once per press", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  const box = await page.getByTestId("macho-character-button").boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  for (let count = 0; count < 100; count += 1) await page.mouse.click(x, y);
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v4") ?? "{}").taps)).toBe(100);
  await expect(page.getByTestId("macho-points")).toHaveText("100 P");
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 500 },
  { width: 1440, height: 900 },
]) {
  test(`${viewport.width}x${viewport.height}: gym fits the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openGame(page);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
    const character = await page.getByTestId("macho-character-button").boundingBox();
    expect(character).not.toBeNull();
    expect(character!.height).toBeGreaterThan(120);
    expect(character!.y + character!.height).toBeLessThanOrEqual(viewport.height + 1);
  });
}

test("mobile: shop opens, purchase appears in the gym and idle time grants nothing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByRole("heading", { name: "ショップ" })).toBeVisible();
  await page.getByRole("button", { name: "ショップを閉じる" }).click();
  await page.waitForTimeout(300);
  const character = page.getByTestId("macho-character-button");
  for (let count = 0; count < 15; count += 1) await character.click({ force: true });
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await page.getByTestId("shop-dumbbells").click();
  await expect(page.getByTestId("gym-dumbbells")).toBeVisible();
  const before = await page.getByTestId("macho-points").textContent();
  await page.waitForTimeout(1100);
  expect(await page.getByTestId("macho-points").textContent()).toBe(before);
});

test("mobile: level progress and shop controls stay readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  await expect(page.getByText("TAP TO TRAIN")).toHaveCount(0);
  await expect(page.getByText("マチョクリッカー", { exact: true })).toHaveCount(0);
  await expect(page.getByText("マチョ田をタップして鍛える")).toHaveCount(0);
  const progress = page.getByRole("progressbar", { name: "次のレベルまでの進捗" });
  expect((await progress.boundingBox())!.height).toBeGreaterThanOrEqual(22);
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByText("BUILD YOUR GYM")).toHaveCount(0);
  const shopCard = page.getByTestId("shop-dumbbells");
  expect((await shopCard.boundingBox())!.height).toBeGreaterThanOrEqual(76);
  const shopTextSize = await shopCard.locator("strong").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(shopTextSize).toBeGreaterThanOrEqual(16);
  const icon = page.locator('img[src$="tap-upgrade.webp"]');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveJSProperty("naturalWidth", 512);
  await expect(page.getByTestId("shop-dumbbells")).toBeVisible();
  await expect(page.getByTestId("shop-bench")).toHaveCount(0);
  await expect(page.getByTestId("shop-mystery")).toHaveCount(1);
  await expect(page.getByTestId("shop-mystery")).toContainText("？？？");
  await expect(page.getByTestId("shop-mystery")).toContainText("購入後に公開");
});

test("buying equipment reveals the next item regardless of level", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("machoda:macho-clicker:v4", JSON.stringify({
      version: 4, points: 1_235, totalPoints: 1_235, taps: 0, trainingLevel: 0, owned: [],
    }));
  });
  await openGame(page);
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByTestId("shop-barbell")).toHaveCount(0);
  await page.getByTestId("shop-dumbbells").click();
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByTestId("shop-barbell")).toBeVisible();
  await page.getByTestId("shop-barbell").click();
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByTestId("shop-bench")).toBeVisible();
  await expect(page.getByTestId("gym-dumbbells")).toHaveCount(0);
  await expect(page.getByTestId("gym-barbell")).toBeVisible();
  await page.getByTestId("shop-bench").click();
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByTestId("shop-plateTree")).toBeVisible();
  await expect(page.getByTestId("shop-mystery")).toContainText("購入後に公開");
});

test("shop translates equipment cost into taps at the current earning rate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openGame(page);
  await expect(page.getByTestId("shop-dumbbells")).toContainText("あと 15 タップ");
  await page.getByTestId("macho-character-button").click({ force: true });
  await expect(page.getByTestId("macho-points")).toHaveText("1 P");
  await expect(page.getByTestId("shop-dumbbells")).toContainText("あと 14 タップ");
  await expect(page.getByTestId("shop-mystery")).not.toContainText("70 P");
});

test("equipment bonus reflects the current training multiplier", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const game = {
    ...createTapGame(), points: 8_532, totalPoints: 8_532, taps: 1_759,
    trainingLevel: 13, owned: EQUIPMENT.slice(0, 8).map((item) => item.id),
  };
  await page.addInitScript((saved) => localStorage.setItem("machoda:macho-clicker:v4", JSON.stringify(saved)), game);
  await openGame(page);
  expect(tapPower(game)).toBeGreaterThan(87);
  await expect(page.getByRole("button", { name: /タップ強化 Lv 13/ })).toContainText("29,807 P");
  await expect(page.getByRole("button", { name: /タップ強化 Lv 13/ })).toContainText(`あと ${Math.ceil((29_807 - 8_532) / tapPower(game))} タップ`);
  const rackWithout = { ...game, owned: game.owned.filter((id) => id !== "powerRack") };
  await expect(page.getByTestId("shop-powerRack")).toContainText(`+${tapPower(game) - tapPower(rackWithout)} P`);
  await expect(page.getByTestId("shop-treadmill")).toContainText("900,000 P");
  await expect(page.getByTestId("shop-mystery")).not.toContainText("3,600,000 P");
});

test("the complete gym uses the upgraded room and keeps the tap target clear", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((owned) => localStorage.setItem("machoda:macho-clicker:v4", JSON.stringify({
    version: 4, points: 0, totalPoints: 0, taps: 2_160_000, trainingLevel: 0, owned,
  })), EQUIPMENT.map((item) => item.id));
  await openGame(page);
  await expect(page.locator('img[src$="legend-gym-mobile.webp"]')).toBeVisible();
  await expect(page.getByTestId("gym-energyCore")).toBeVisible();
  await expect(page.getByTestId("gym-devilPowerRack")).toBeVisible();
  await expect(page.getByTestId("gym-dumbbells")).toHaveCount(0);
  await expect(page.getByTestId("macho-character-button")).toBeVisible();
  await page.locator('nav[aria-label="ゲーム操作"] button').click();
  await expect(page.getByText("18 設置")).toBeVisible();
  await expect(page.getByTestId("shop-mystery")).toHaveCount(0);
});

test("menu reset requires confirmation and starts a new local run", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("machoda:macho-clicker:v4")) return;
    localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify({ clickCount: 100, muscle: 1000 }));
    localStorage.setItem("machoda:macho-clicker:v4", JSON.stringify({
      version: 4, points: 123, totalPoints: 138, taps: 100,
      trainingLevel: 0, owned: ["dumbbells"],
    }));
  });
  await openGame(page);
  await page.getByRole("button", { name: "ゲームメニューを開く" }).click();
  await page.getByRole("button", { name: "最初から始める" }).click();
  await expect(page.getByRole("alertdialog", { name: "最初から始める確認" })).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByTestId("macho-points")).toHaveText("123 P");
  await page.getByRole("button", { name: "最初から始める" }).click();
  await page.getByRole("button", { name: "初期化して始める" }).click();
  await expect(page.getByTestId("macho-points")).toHaveText("0 P");
  await expect(page.getByTestId("gym-dumbbells")).toHaveCount(0);
  const saved = await page.evaluate(() => ({
    old: JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}"),
    next: JSON.parse(localStorage.getItem("machoda:macho-clicker:v4") ?? "{}"),
  }));
  expect(saved.old.clickCount).toBe(100);
  expect(saved.next.taps).toBe(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("macho-points")).toHaveText("0 P");
});

test("header ranking opens over the game and registers cumulative taps", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let submitted: { nickname: string; taps: number; playerId: string } | null = null;
  await page.route("**/api/macho-clicker/tap-rankings", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON();
      await route.fulfill({ json: { available: true, items: [
        { id: "mine", playerId: submitted!.playerId, nickname: submitted!.nickname, taps: submitted!.taps, updatedAt: new Date().toISOString() },
      ] } });
      return;
    }
    await route.fulfill({ json: { available: true, items: [
      { id: "first", playerId: "other", nickname: "先輩マッチョ", taps: 42, updatedAt: new Date().toISOString() },
    ] } });
  });
  await openGame(page);
  await page.getByTestId("macho-character-button").click({ force: true });
  await page.getByRole("button", { name: "ランキングを開く" }).click();
  const dialog = page.getByRole("dialog", { name: "累計タップランキング" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.height).toBeGreaterThan(750);
  expect(bounds!.width).toBeGreaterThan(380);
  await expect(dialog).toContainText("先輩マッチョ");
  await dialog.getByLabel("自分の記録を登録").fill("テスト筋肉");
  await dialog.getByRole("button", { name: "登録する" }).click();
  await expect(dialog).toContainText("記録を登録しました！");
  expect(submitted).toMatchObject({ nickname: "テスト筋肉", taps: 1 });
  await dialog.getByRole("button", { name: "ランキングを閉じる" }).click();
  await expect(dialog).toHaveCount(0);
});
