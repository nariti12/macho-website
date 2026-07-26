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

const expectGameFillsViewport = async (page: Page) => {
  const dimensions = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".macho-game-shell");
    const mainGrid = document.querySelector<HTMLElement>(".macho-main-grid");
    return {
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      shellBottom: shell?.getBoundingClientRect().bottom ?? 0,
      mainGridBottom: mainGrid?.getBoundingClientRect().bottom ?? 0,
    };
  });

  expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
  expect(Math.abs(dimensions.shellBottom - dimensions.viewportHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(dimensions.mainGridBottom - dimensions.viewportHeight)).toBeLessThanOrEqual(1);
};

for (const viewport of [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "mobile-360-browser-ui", width: 360, height: 500 },
  { name: "mobile-360-short", width: 360, height: 640 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "mobile-landscape-667", width: 667, height: 375 },
]) {
  test(`${viewport.name}: layout and screenshot`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openFreshGame(page);
    await expectNoPageOverflow(page);
    await expectGameFillsViewport(page);
    const characterBox = await page.getByRole("button", { name: "マチョ田をクリック" }).boundingBox();
    const characterImageBox = await page.locator(".macho-character-image").boundingBox();
    expect(characterBox).not.toBeNull();
    expect(characterImageBox).not.toBeNull();
    expect((characterBox?.y ?? 0) + (characterBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);
    expect((characterImageBox?.y ?? 0) + (characterImageBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);
    if (viewport.name.startsWith("mobile-")) {
      const minimumCharacterHeight = viewport.height <= 520 ? 120 : viewport.height <= 700 ? 180 : 220;
      expect(characterImageBox?.height ?? 0).toBeGreaterThanOrEqual(minimumCharacterHeight);
    } else {
      expect(characterImageBox?.height ?? 0).toBeGreaterThanOrEqual(210);
    }
    await page.screenshot({ path: `test-results/visual/${viewport.name}.png`, fullPage: true });
  });
}

test("late-game save keeps the simple core screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);
  await expect
    .poll(async () => page.evaluate(() => Boolean(localStorage.getItem("machoda:macho-clicker:v3"))))
    .toBe(true);
  await page.evaluate(() => {
    const key = "machoda:macho-clicker:v3";
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({
      ...saved,
      muscle: 1_000_000_000_000,
      totalMuscle: 1_000_000_000_000,
      prestigeLevel: 0,
    }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByRole("button", { name: /仕上げ直し/ })).toBeVisible();
  await expect(page.getByText("概要", { exact: true })).toHaveCount(0);
  await expect(page.getByText("日課", { exact: true })).toHaveCount(0);
  await expect(page.getByText("結晶研究", { exact: true })).toHaveCount(0);
  await expect(page.getByText("設備Lv", { exact: true })).toHaveCount(0);
  await expectGameFillsViewport(page);
});

test("final body evolution reaches stage 19 within two seconds and stays in frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}")
  );
  await page.addInitScript((seeded) => {
    localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify(seeded));
    localStorage.setItem("machoda:macho-clicker:onboarding:v1", "complete");
  }, {
    ...saved,
    muscle: 2_500_000_000,
    totalMuscle: 2_500_000_000,
    bodyEvolutionStage: 18,
    lastSavedAt: Date.now(),
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByText("現在: 伝説のマチョ田")).toBeVisible();
  const startedAt = Date.now();
  await page.getByRole("button", { name: "進化する" }).click({ force: true });
  await expect(page.getByText("現在: 最終形態")).toBeVisible({ timeout: 2_000 });
  expect(Date.now() - startedAt).toBeLessThan(2_000);
  await expect(page.getByText("最終進化済み")).toBeVisible();
  await expect(page.locator(".macho-character-image")).toHaveAttribute(
    "src",
    /stage-19-final-form/
  );
  const characterImageBox = await page.locator(".macho-character-image").boundingBox();
  expect(characterImageBox).not.toBeNull();
  expect((characterImageBox?.y ?? 0) + (characterImageBox?.height ?? 0)).toBeLessThanOrEqual(901);
  await expectNoPageOverflow(page);
});

test("desktop: click, purchase, settings and save", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);

  const character = page.getByRole("button", { name: "マチョ田をクリック" });
  for (let count = 0; count < 20; count += 1) await character.click({ force: true });

  const levelBadge = page.getByTestId("shop-level-pushUp");
  const stateChip = page.getByTestId("shop-state-pushUp");
  const [levelBox, stateBox] = await Promise.all([levelBadge.boundingBox(), stateChip.boundingBox()]);
  expect(levelBox).not.toBeNull();
  expect(stateBox).not.toBeNull();
  expect((levelBox?.x ?? 0) + (levelBox?.width ?? 0)).toBeLessThanOrEqual((stateBox?.x ?? 0) - 4);

  const dumbbell = page.getByRole("button", { name: /ダンベル/ }).last();
  await expect(dumbbell).toBeEnabled();
  await dumbbell.click();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}").upgrades?.pushUp ?? 0)
    )
    .toBe(1);
  const dumbbellOrbit = page.getByTestId("macho-dumbbell-orbit").first();
  await expect(dumbbellOrbit).toBeVisible();
  const orbitLayers = await page.evaluate(() => {
    const orbit = document.querySelector<HTMLElement>('[data-testid="macho-dumbbell-orbit"]');
    const characterButton = document.querySelector<HTMLElement>('[data-testid="macho-character-button"]');
    return {
      orbit: Number.parseInt(getComputedStyle(orbit!).zIndex, 10),
      character: Number.parseInt(getComputedStyle(characterButton!).zIndex, 10),
    };
  });
  expect(orbitLayers.orbit).toBeLessThan(orbitLayers.character);

  await page.getByRole("button", { name: "ゲームメニューを開く" }).click();
  const soundButton = page.getByRole("button", { name: /効果音 ON/ }).first();
  await soundButton.click();
  await expect(page.getByRole("button", { name: /効果音 OFF/ }).first()).toBeVisible();

  const lightweightButton = page.getByRole("button", { name: /軽量モード OFF/ }).first();
  await lightweightButton.click();
  await expect(page.getByRole("button", { name: /軽量モード ON/ }).first()).toBeVisible();

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

test("desktop: bulk purchase buys the selected quantity at the exact cumulative price", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);
  await expect
    .poll(async () => page.evaluate(() => Boolean(localStorage.getItem("machoda:macho-clicker:v3"))))
    .toBe(true);

  await page.evaluate(() => {
    const key = "machoda:macho-clicker:v3";
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(
      key,
      JSON.stringify({
        ...saved,
        muscle: 1_000,
        totalMuscle: 1_000,
      })
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "×10", exact: true }).click();
  await page.getByRole("button", { name: "ダンベル、10個購入可能" }).click();

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}");
        return {
          owned: saved.upgrades?.pushUp,
          saveVersion: saved.saveVersion,
        };
      })
    )
    .toEqual({
      owned: 10,
      saveVersion: 2,
    });
  const savedMuscle = await page.evaluate(
    () => JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}").muscle
  );
  // The exact 308-point cumulative cost is covered by the pure economy test.
  // Passive production starts immediately after purchase, so the browser value
  // is expected to be at or just above the remaining 692 points.
  expect(savedMuscle).toBeGreaterThanOrEqual(692);
  expect(savedMuscle).toBeLessThan(710);
});

test("mobile: tabs remain usable and shop scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openFreshGame(page);

  await page.getByRole("button", { name: "ショップ", exact: true }).click();
  await expect(page.getByText("ショップ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("アップグレード", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/visual/mobile-360-short-shop.png" });
  await page.mouse.wheel(0, 1_400);

  await page.getByRole("button", { name: "設備", exact: true }).click();
  await expect(page.getByText("ジム設備", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/visual/mobile-360-short-equipment.png" });

  await page.getByRole("button", { name: "ゲームメニューを開く" }).click();
  await expect(page.getByRole("heading", { name: "メニュー" })).toBeVisible();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("保存しました。", { exact: true }).first()).toBeVisible();
  await expectNoPageOverflow(page);
});

test("mobile: three-step guide teaches click, purchase and passive production", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openFreshGame(page);

  const character = page.getByTestId("macho-character-button");
  await expect(page.getByTestId("macho-onboarding-card")).toContainText("1/3");
  const guideStyles = await character.evaluate((element) => {
    const styles = getComputedStyle(element, "::after");
    return {
      borderTopWidth: styles.borderTopWidth,
      borderRadius: styles.borderRadius,
      boxShadow: styles.boxShadow,
      filter: styles.filter,
    };
  });
  expect(guideStyles.borderTopWidth).toBe("0px");
  expect(guideStyles.borderRadius).toBe("50%");
  expect(guideStyles.boxShadow).toBe("none");
  expect(guideStyles.filter).not.toBe("none");
  await character.click({ force: true });
  await expect(page.getByTestId("macho-onboarding-card")).toContainText("2/3");

  for (let count = 0; count < 14; count += 1) await character.click({ force: true });
  await expect(page.getByTestId("macho-onboarding-shop-card")).toContainText("ダンベルを1個買う");
  await page.getByRole("button", { name: "ダンベル、1個購入可能" }).click();

  await expect(page.getByTestId("macho-onboarding-card")).toContainText("3/3");
  await expect(page.getByTestId("macho-onboarding-card")).toContainText("毎秒 +0.1");
  const characterImageBox = await page.locator(".macho-character-image").boundingBox();
  expect(characterImageBox).not.toBeNull();
  expect((characterImageBox?.y ?? 0) + (characterImageBox?.height ?? 0)).toBeLessThanOrEqual(641);
  await page.getByRole("button", { name: "トレーニング開始" }).click();
  await expect(page.getByTestId("macho-onboarding-card")).toHaveCount(0);
});

test("mobile: primary controls meet the 44px touch target", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  const controls = [
    page.getByRole("button", { name: "効果音をオフにする" }),
    page.getByRole("button", { name: "実績を開く" }),
    page.getByRole("button", { name: "ゲームメニューを開く" }),
    page.getByRole("button", { name: "鍛える", exact: true }),
    page.getByRole("button", { name: "設備", exact: true }),
    page.getByRole("button", { name: "ショップ", exact: true }),
  ];
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("sound preference is available from the game header and persists", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  await page.getByRole("button", { name: "効果音をオフにする" }).click();
  await expect(page.getByRole("button", { name: "効果音をオンにする" })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "効果音をオンにする" })).toBeVisible();
});

test("fresh game: shop reveals only the first equipment and two mysteries", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);

  const shop = page.getByRole("complementary").filter({ has: page.getByRole("heading", { name: "ショップ" }) });
  await expect(shop.getByRole("button", { name: /ダンベル/ })).toBeVisible();
  await expect(shop.getByLabel("未解放の設備")).toHaveCount(2);
  await expect(shop.getByText("腹筋ローラー職人", { exact: true })).toHaveCount(0);
});

test("mobile: equipment details open in a bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);
  await page.getByRole("button", { name: "ショップ", exact: true }).click();

  await page.getByRole("button", { name: "ダンベルの詳細を開く" }).click();
  const details = page.getByRole("dialog", { name: "ダンベルの生産詳細" });
  await expect(details).toBeVisible();
  await expect(details.getByText("所有数 0")).toBeVisible();
  await expect(details.getByText("1個あたり")).toBeVisible();
  await expect(details.getByText("合計生産")).toBeVisible();
  await expect(details.getByText("価格")).toBeVisible();
  await page.getByRole("button", { name: "生産詳細を閉じる" }).click();
  await expect(details).toHaveCount(0);
});

test("equipment unlock announces itself and animates the revealed row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("machoda:macho-clicker:v3") ?? "{}")
  );
  await page.addInitScript((seeded) => {
    localStorage.setItem("machoda:macho-clicker:v3", JSON.stringify(seeded));
  }, {
    ...saved,
    muscle: 99,
    totalMuscle: 99,
    lastSavedAt: Date.now(),
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "マチョ田をクリック" }).click({ force: true });
  await expect(page.getByText("新設備「腹筋ローラー職人」がショップに解放されました！")).toBeVisible();
  await expect(page.getByRole("button", { name: /腹筋ローラー職人/ })).toHaveClass(/macho-shop-unlocked/);
});

test("mobile: rapid touch input stays responsive and counts each tap once", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  const character = page.getByTestId("macho-character-button");
  const inputStyles = await character.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      touchAction: styles.touchAction,
      userSelect: styles.userSelect,
    };
  });
  expect(inputStyles.touchAction).toBe("manipulation");
  expect(inputStyles.userSelect).toBe("none");
  await expect(page.locator('[data-effect-slot="gain"]')).toHaveCount(28);
  await expect(page.locator('[data-effect-slot="spark"]')).toHaveCount(96);

  await character.evaluate((element) => {
    for (let index = 1; index <= 100; index += 1) {
      element.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerId: index,
          pointerType: "touch",
          clientX: 180,
          clientY: 360,
          isPrimary: true,
        })
      );
      element.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          pointerId: index,
          pointerType: "touch",
          clientX: 180,
          clientY: 360,
          isPrimary: true,
        })
      );
    }
  });

  await expect(page.getByTestId("macho-click-count")).toHaveText("100");
  await expect(page.locator('[data-effect-slot="gain"]')).toHaveCount(28);
  await expect(page.locator('[data-effect-slot="spark"]')).toHaveCount(96);
  await expect(character).not.toHaveAttribute("data-pressed");
  await expectNoPageOverflow(page);
});

test("mobile: left, center and right taps share the same hit target", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  const character = page.getByTestId("macho-character-button");
  const box = await character.boundingBox();
  expect(box).not.toBeNull();

  const tapXs = [box!.x + 12, box!.x + box!.width / 2, box!.x + box!.width - 12];
  await character.evaluate((element, positions) => {
    positions.forEach((clientX, index) => {
      const pointerId = index + 1;
      const options = {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: "touch",
        clientX,
        clientY: 360,
        isPrimary: true,
      };
      element.dispatchEvent(new PointerEvent("pointerdown", options));
      element.dispatchEvent(new PointerEvent("pointerup", options));
    });
  }, tapXs);

  await expect(page.getByTestId("macho-click-count")).toHaveText("3");
  await expect(character).not.toHaveAttribute("data-pressed");
});

test("desktop: paced click profiles do not lose inputs or create long tasks", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openFreshGame(page);

  await page.evaluate(() => {
    const monitoredWindow = window as Window & { __machoLongTasks?: number[]; __machoObserver?: PerformanceObserver };
    monitoredWindow.__machoLongTasks = [];
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      monitoredWindow.__machoObserver = new PerformanceObserver((entries) => {
        monitoredWindow.__machoLongTasks?.push(...entries.getEntries().map((entry) => entry.duration));
      });
      monitoredWindow.__machoObserver.observe({ type: "longtask", buffered: false });
    }
  });

  const character = page.getByTestId("macho-character-button");
  let expectedClicks = 0;
  for (const clicksPerSecond of [2, 5, 8, 15]) {
    const clicks = clicksPerSecond * 2;
    await character.evaluate(
      async (element, profile) => {
        for (let index = 0; index < profile.clicks; index += 1) {
          const pointerId = profile.pointerOffset + index;
          const options = {
            bubbles: true,
            cancelable: true,
            pointerId,
            pointerType: "mouse",
            button: 0,
            clientX: 320,
            clientY: 360,
            isPrimary: true,
          };
          element.dispatchEvent(new PointerEvent("pointerdown", options));
          element.dispatchEvent(new PointerEvent("pointerup", options));
          await new Promise((resolve) => window.setTimeout(resolve, 1_000 / profile.clicksPerSecond));
        }
      },
      { clicks, clicksPerSecond, pointerOffset: expectedClicks + 1 }
    );
    expectedClicks += clicks;
    await expect(page.getByTestId("macho-click-count")).toHaveText(String(expectedClicks));
  }

  const longTasks = await page.evaluate(() => {
    const monitoredWindow = window as Window & { __machoLongTasks?: number[]; __machoObserver?: PerformanceObserver };
    monitoredWindow.__machoObserver?.disconnect();
    return monitoredWindow.__machoLongTasks ?? [];
  });
  expect(longTasks, `Long Tasks detected: ${longTasks.join(", ")}`).toHaveLength(0);
});

test("mobile: simultaneous touches count only the first active pointer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  const character = page.getByTestId("macho-character-button");
  await character.evaluate((element) => {
    const dispatch = (type: string, pointerId: number, isPrimary: boolean) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId,
          pointerType: "touch",
          clientX: 180,
          clientY: 360,
          isPrimary,
        })
      );

    dispatch("pointerdown", 1, true);
    dispatch("pointerdown", 2, false);
    dispatch("pointerup", 2, false);
    dispatch("pointerup", 1, true);
  });

  await expect(page.getByTestId("macho-click-count")).toHaveText("1");
  await expect(character).not.toHaveAttribute("data-pressed");
});

test("mobile: a drag gesture does not award a click", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshGame(page);

  const character = page.getByTestId("macho-character-button");
  await character.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "touch",
        clientX: 180,
        clientY: 360,
        isPrimary: true,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "touch",
        clientX: 180,
        clientY: 400,
        isPrimary: true,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "touch",
        clientX: 180,
        clientY: 400,
        isPrimary: true,
      })
    );
  });

  await expect(page.getByTestId("macho-click-count")).toHaveText("0");
  await expect(character).not.toHaveAttribute("data-pressed");
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
  for (const sound of [
    "click",
    "buy",
    "blocked",
    "unlock",
    "upgrade",
    "evolution",
    "achievement",
    "golden-spawn",
    "golden-collect",
  ]) {
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
