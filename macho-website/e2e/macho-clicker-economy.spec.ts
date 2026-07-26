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
    expect(getBodyStage(3).label).toBe("三日坊主突破");
    expect(getBodyStage(4).label).toBe("食生活改善");
    expect(getBodyStage(5).label).toBe("脱メタボ開始");
    expect(getBodyStage(6).label).toBe("筋肉の芽");
    expect(getBodyStage(7).label).toBe("初心者卒業");
    expect(getBodyStage(8).label).toBe("細マッチョ入口");
    expect(getBodyStage(9).label).toBe("中級トレーニー");
    expect(getBodyStage(10).label).toBe("胸板覚醒");
    expect(getBodyStage(11).label).toBe("逆三角形");
    expect(getBodyStage(12).label).toBe("バルク期");
    expect(getBodyStage(13).label).toBe("仕上げ期");
    expect(getBodyStage(14).label).toBe("上級マッチョ");
    expect(getBodyStage(15).label).toBe("ゴリマッチョ");
    expect(getBodyStage(16).label).toBe("大会準備");
    expect(getBodyStage(17).label).toBe("大会仕上がり");
    expect(getBodyStage(18).label).toBe("伝説のマチョ田");
    expect(getBodyStage(19).label).toBe("最終形態");
    expect(getUnlockedBodyEvolutionStage(1_999_999)).toBe(7);
    expect(getUnlockedBodyEvolutionStage(2_000_000)).toBe(8);
    expect(getUnlockedBodyEvolutionStage(4_000_000)).toBe(9);
    expect(getUnlockedBodyEvolutionStage(7_000_000)).toBe(10);
    expect(getUnlockedBodyEvolutionStage(10_000_000)).toBe(11);
    expect(getUnlockedBodyEvolutionStage(20_000_000)).toBe(12);
    expect(getUnlockedBodyEvolutionStage(40_000_000)).toBe(13);
    expect(getUnlockedBodyEvolutionStage(70_000_000)).toBe(14);
    expect(getUnlockedBodyEvolutionStage(100_000_000)).toBe(15);
    expect(getUnlockedBodyEvolutionStage(250_000_000)).toBe(16);
    expect(getUnlockedBodyEvolutionStage(500_000_000)).toBe(17);
    expect(getUnlockedBodyEvolutionStage(1_000_000_000)).toBe(18);
    expect(getUnlockedBodyEvolutionStage(2_500_000_000)).toBe(19);
    expect(BODY_EVOLUTION_STAGES).toHaveLength(20);
    expect(FINAL_BODY_EVOLUTION_STAGE).toBe(19);
    expect(new Set(BODY_EVOLUTION_STAGES.map((stage) => stage.imageSrc)).size).toBe(
      BODY_EVOLUTION_STAGES.length
    );
    expect(getBodyStage(999)).toBe(BODY_EVOLUTION_STAGES[0]);
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
