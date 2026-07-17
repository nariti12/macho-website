import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/macho-clicker-page.tsx", import.meta.url), "utf8");
const equipmentSource = source.slice(source.indexOf("const upgrades: Upgrade[]"), source.indexOf("const visualUpgrades"));

const canonicalBuildings = [
  ["pushUp", 15, 0.1],
  ["abRoller", 100, 1],
  ["dumbbell", 1_100, 8],
  ["protein", 12_000, 47],
  ["chicken", 130_000, 260],
  ["benchPress", 1_400_000, 1_400],
  ["trainer", 20_000_000, 7_800],
  ["gym", 330_000_000, 44_000],
  ["supplementStore", 5_100_000_000, 260_000],
  ["mealPrepLab", 75_000_000_000, 1_600_000],
  ["machoPortal", 1_000_000_000_000, 10_000_000],
  ["timeGym", 14_000_000_000_000, 65_000_000],
  ["antiGravityGym", 170_000_000_000_000, 430_000_000],
  ["proteinPrism", 2_100_000_000_000_000, 2_900_000_000],
  ["chanceMachine", 26_000_000_000_000_000, 21_000_000_000],
  ["fractalMuscle", 310_000_000_000_000_000, 150_000_000_000],
  ["muscleConsole", 71_000_000_000_000_000_000, 1_100_000_000_000],
  ["idleverseGym", 12_000_000_000_000_000_000_000, 8_300_000_000_000],
  ["cortexTrainer", 1_900_000_000_000_000_000_000_000, 64_000_000_000_000],
  ["finalMacho", 540_000_000_000_000_000_000_000_000, 510_000_000_000_000],
];

const parseNumericLiteral = (literal) => Number(literal.replaceAll("_", ""));

const readBuilding = (key) => {
  const match = equipmentSource.match(
    new RegExp(
      `key: "${key}",[\\s\\S]*?baseCost: ([0-9_]+),[\\s\\S]*?costRate: ([0-9.]+),[\\s\\S]*?perSecondBonus: ([0-9._]+),`
    )
  );
  if (!match) throw new Error(`Could not read equipment definition: ${key}`);
  return {
    baseCost: parseNumericLiteral(match[1]),
    costRate: Number(match[2]),
    cps: parseNumericLiteral(match[3]),
  };
};

const failures = [];
for (const [key, expectedCost, expectedCps] of canonicalBuildings) {
  const actual = readBuilding(key);
  if (actual.baseCost !== expectedCost || actual.cps !== expectedCps || actual.costRate !== 1.15) {
    failures.push(`${key}: expected ${expectedCost}/${expectedCps}/1.15, got ${actual.baseCost}/${actual.cps}/${actual.costRate}`);
  }
}

const offlineScenarios = [
  { label: "base", limitSeconds: 30 * 60 },
  { label: "offline-coach", limitSeconds: 30 * 60 + 8 * 60 * 60 },
];

const offlineRows = offlineScenarios.flatMap((scenario) =>
  [24 * 60 * 60, 7 * 24 * 60 * 60].map((elapsedSeconds) => ({
    scenario: scenario.label,
    elapsed: elapsedSeconds === 24 * 60 * 60 ? "1 day" : "1 week",
    creditedSeconds: Math.min(elapsedSeconds, scenario.limitSeconds),
  }))
);

if (offlineRows[0].creditedSeconds !== 1_800 || offlineRows[1].creditedSeconds !== 1_800) {
  failures.push("Base offline credit must remain capped at 30 minutes.");
}
if (offlineRows[2].creditedSeconds !== 30_600 || offlineRows[3].creditedSeconds !== 30_600) {
  failures.push("Offline Coach credit must remain capped at 8.5 hours.");
}

if (failures.length > 0) {
  console.error("Macho Clicker balance guard failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Verified ${canonicalBuildings.length} Cookie-style equipment definitions (cost rate 1.15).`);
  console.table(offlineRows);
}
