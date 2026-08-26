import { expect, test } from "@playwright/test";
import {
  calculateProduction,
  getBuildingCost,
  getBulkBuildingCost,
  getBulkPurchase,
  getMaxAffordableBuildingCount,
} from "../src/lib/macho-clicker/economy";
import {
  MACHO_CLICKER_SAVE_VERSION,
  createMachoClickerSave,
  migrateMachoClickerSave,
  serializeMachoClickerSave,
} from "../src/lib/macho-clicker/save";
import {
  BODY_EVOLUTION_STAGES,
  FINAL_BODY_EVOLUTION_STAGE,
  getBodyStage,
  getUnlockedBodyEvolutionStage,
} from "../src/lib/macho-clicker/progression";
import { MACHO_BUILDINGS } from "../src/lib/macho-clicker/buildings";
import { getMachoCharacterAsset } from "../src/lib/characters/macho-face2";

const dumbbell = {
  baseCost: 15,
  costRate: 1.15,
};

test.describe("macho clicker economy", () => {
  test("building prices use the 115% curve and round each purchase up", () => {
    expect(getBuildingCost(dumbbell, 0)).toBe(15);
    expect(getBuildingCost(dumbbell, 1)).toBe(18);
    expect(getBuildingCost(dumbbell, 2)).toBe(20);
    expect(getBulkBuildingCost(dumbbell, 0, 3)).toBe(53);
  });

  test("fixed and maximum bulk purchases share the same exact cost", () => {
    expect(getBulkPurchase(dumbbell, 0, 53, 10)).toEqual({
      quantity: 10,
      cost: getBulkBuildingCost(dumbbell, 0, 10),
    });
    expect(getBulkPurchase(dumbbell, 0, 53, "max")).toEqual({
      quantity: 3,
      cost: 53,
    });
    expect(getMaxAffordableBuildingCount(dumbbell, 0, 14)).toEqual({
      quantity: 0,
      cost: 0,
    });
  });

  test("production exposes every multiplier instead of hiding the final formula", () => {
    expect(
      calculateProduction(10, {
        prestige: 1.25,
        legacy: 1.05,
        frenzy: 7,
        powerUpgrades: 2,
      })
    ).toEqual({
      basePerSecond: 10,
      multipliers: {
        prestige: 1.25,
        legacy: 1.05,
        frenzy: 7,
        powerUpgrades: 2,
      },
      finalPerSecond: 183.75,
    });
  });

  test("legacy saves migrate and retain one-generation rollback data", () => {
    const migrated = migrateMachoClickerSave({
      muscle: 123,
      dailyTrainingPlanId: "chest",
      muscleCrystals: 7,
    });

    expect(migrated.saveVersion).toBe(MACHO_CLICKER_SAVE_VERSION);
    expect(migrated.previousVersionSnapshot).toEqual({
      sourceVersion: 1,
      systems: {
        dailyTrainingPlanId: "chest",
        muscleCrystals: 7,
      },
    });
    expect(JSON.parse(serializeMachoClickerSave(migrated)).previousVersionSnapshot).toEqual(
      migrated.previousVersionSnapshot
    );
  });

  test("current saves are versioned and future saves fail safely", () => {
    expect(createMachoClickerSave({ muscle: 10 })).toEqual({
      muscle: 10,
      saveVersion: MACHO_CLICKER_SAVE_VERSION,
    });
    expect(() =>
      migrateMachoClickerSave({ saveVersion: MACHO_CLICKER_SAVE_VERSION + 1 })
    ).toThrow(/新しいバージョン/);
  });

  test("body evolution progression is deterministic outside React", () => {
    expect(getUnlockedBodyEvolutionStage(0)).toBe(0);
    expect(getUnlockedBodyEvolutionStage(4_999)).toBe(1);
    expect(getUnlockedBodyEvolutionStage(5_000)).toBe(2);
    expect(getUnlockedBodyEvolutionStage(Number.MAX_SAFE_INTEGER)).toBe(
      BODY_EVOLUTION_STAGES.at(-1)?.stage
    );
    expect(BODY_EVOLUTION_STAGES.map((stage) => stage.level)).toEqual([1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    for (const stage of BODY_EVOLUTION_STAGES) {
      expect(getUnlockedBodyEvolutionStage(stage.requirement)).toBe(stage.stage);
      if (stage.stage > 0) expect(getUnlockedBodyEvolutionStage(stage.requirement - 1)).toBe(stage.stage - 1);
      expect(stage.imageSrc).toMatch(/macho-face2\/v1\/macho-face2-lv\d{3}\.webp$/);
    }
    expect(getBodyStage(6).level).toBe(50);
    expect(getBodyStage(10).label).toBe("伝説のマチョ田");
    expect(getBodyStage(11).label).toBe("最終形態");
    expect(BODY_EVOLUTION_STAGES).toHaveLength(12);
    expect(FINAL_BODY_EVOLUTION_STAGE).toBe(11);
    expect(new Set(BODY_EVOLUTION_STAGES.map((stage) => stage.imageSrc)).size).toBe(
      BODY_EVOLUTION_STAGES.length
    );
    expect(getBodyStage(999)).toBe(BODY_EVOLUTION_STAGES[0]);
  });

  test("every numeric character level maps to the nearest approved lower asset", () => {
    expect(getMachoCharacterAsset(37).level).toBe(30);
    expect(getMachoCharacterAsset(99).level).toBe(90);
    expect(getMachoCharacterAsset(100).level).toBe(100);
    expect(getMachoCharacterAsset(0).level).toBe(1);
    for (let level = 1; level <= 100; level += 1) {
      const eligible = BODY_EVOLUTION_STAGES.filter((stage) => stage.level <= level);
      expect(getMachoCharacterAsset(level).level).toBe(eligible.at(-1)?.level);
    }
  });

  test("all legacy body stages migrate once without losing other save state", () => {
    const expected = [0, 1, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11];
    for (const saveVersion of [1, 2]) {
      for (let stage = 0; stage < 20; stage += 1) {
        const migrated = migrateMachoClickerSave({ saveVersion, bodyEvolutionStage: stage, muscle: 123, clickCount: 456 });
        expect(migrated.bodyEvolutionStage).toBe(expected[stage]);
        expect(migrated.muscle).toBe(123);
        expect(migrated.clickCount).toBe(456);
        expect(migrateMachoClickerSave(migrated)).toEqual(migrated);
      }
    }
    expect(migrateMachoClickerSave({ saveVersion: 2, bodyEvolutionStage: -1 }).bodyEvolutionStage).toBe(0);
    expect(migrateMachoClickerSave({ saveVersion: 2, bodyEvolutionStage: NaN }).bodyEvolutionStage).toBe(0);
  });

  test("all building definitions retain the canonical 115% progression", () => {
    expect(MACHO_BUILDINGS).toHaveLength(20);
    expect(new Set(MACHO_BUILDINGS.map(({ key }) => key)).size).toBe(MACHO_BUILDINGS.length);
    expect(MACHO_BUILDINGS.every(({ costRate }) => costRate === 1.15)).toBe(true);
    expect(MACHO_BUILDINGS.map(({ baseCost }) => baseCost)).toEqual(
      [...MACHO_BUILDINGS].map(({ baseCost }) => baseCost).sort((left, right) => left - right)
    );
    expect(MACHO_BUILDINGS[0]?.key).toBe("pushUp");
    expect(MACHO_BUILDINGS.at(-1)?.key).toBe("finalMacho");
  });
});
