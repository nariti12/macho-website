import { mkdir, readFile, writeFile } from "node:fs/promises";

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

const checkpointSeconds = new Set([1 * 60, 5 * 60, 10 * 60, 30 * 60, 60 * 60]);
const inputProfiles = [
  { id: "idle", label: "放置", clicksPerSecond: 0 },
  { id: "2-cps", label: "毎秒2クリック", clicksPerSecond: 2 },
  { id: "5-cps", label: "毎秒5クリック", clicksPerSecond: 5 },
  { id: "8-cps", label: "毎秒8クリック", clicksPerSecond: 8 },
];

const clicksPerSecondAt = (elapsedSeconds) => {
  if (elapsedSeconds <= 60) return 5;
  if (elapsedSeconds <= 5 * 60) return 2;
  return 0.25;
};

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

const simulateProgression = (definitions, clicksPerSecondAt) => {
  const buildings = definitions.map(([key, baseCost, cps]) => ({ key, baseCost, cps, owned: 0 }));
  let bank = 0;
  let produced = 0;
  let cps = 0;
  const checkpoints = [];
  const unlocks = [];

  for (let second = 1; second <= 60 * 60; second += 1) {
    const earned = cps + clicksPerSecondAt(second);
    bank += earned;
    produced += earned;

    // Use the same deterministic ROI purchase strategy for both games.
    // This removes player skill and random golden events from the comparison.
    for (let purchase = 0; purchase < 1_000; purchase += 1) {
      const affordable = buildings
        .map((building) => ({
          building,
          cost: Math.ceil(building.baseCost * 1.15 ** building.owned),
        }))
        .filter(({ cost }) => cost <= bank)
        .sort((left, right) => right.building.cps / right.cost - left.building.cps / left.cost);
      if (affordable.length === 0) break;
      const selected = affordable[0];
      bank -= selected.cost;
      selected.building.owned += 1;
      cps += selected.building.cps;
      if (selected.building.owned === 1) {
        unlocks.push({ key: selected.building.key, second, cost: selected.cost });
      }
    }

    if (checkpointSeconds.has(second)) {
      const highest = [...buildings].reverse().find((building) => building.owned > 0);
      checkpoints.push({
        minutes: second / 60,
        produced: Math.floor(produced),
        bank: Math.floor(bank),
        cps: Number(cps.toFixed(1)),
        buildings: buildings.reduce((sum, building) => sum + building.owned, 0),
        highest: highest?.key ?? "none",
      });
    }
  }

  return { checkpoints, unlocks };
};

const failures = [];
const actualDefinitions = [];
for (const [key, expectedCost, expectedCps] of canonicalBuildings) {
  const actual = readBuilding(key);
  actualDefinitions.push([key, actual.baseCost, actual.cps]);
  if (actual.baseCost !== expectedCost || actual.cps !== expectedCps || actual.costRate !== 1.15) {
    failures.push(`${key}: expected ${expectedCost}/${expectedCps}/1.15, got ${actual.baseCost}/${actual.cps}/${actual.costRate}`);
  }
}

const cookieProgression = simulateProgression(canonicalBuildings, clicksPerSecondAt);
const machoProgression = simulateProgression(actualDefinitions, clicksPerSecondAt);
for (let index = 0; index < cookieProgression.checkpoints.length; index += 1) {
  const cookie = cookieProgression.checkpoints[index];
  const macho = machoProgression.checkpoints[index];
  if (JSON.stringify(cookie) !== JSON.stringify(macho)) {
    failures.push(`${cookie.minutes} minute progression differs: Cookie=${JSON.stringify(cookie)}, Macho=${JSON.stringify(macho)}`);
  }
}

const profileReports = inputProfiles.map((profile) => {
  const clickRate = () => profile.clicksPerSecond;
  const cookie = simulateProgression(canonicalBuildings, clickRate);
  const macho = simulateProgression(actualDefinitions, clickRate);
  if (JSON.stringify(cookie) !== JSON.stringify(macho)) {
    failures.push(`${profile.label} progression differs between the base economies.`);
  }
  return { ...profile, cookie, macho };
});

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

const reportDirectory = new URL("../test-results/", import.meta.url);
const reportUrl = new URL("../test-results/macho-clicker-balance-report.json", import.meta.url);
await mkdir(reportDirectory, { recursive: true });
await writeFile(
  reportUrl,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      scope: "base equipment only; power upgrades and random events excluded",
      profiles: profileReports,
      offlineRows,
    },
    null,
    2
  )}\n`
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
  console.log(`Verified ${canonicalBuildings.length} base equipment definitions (cost rate 1.15).`);
  console.log("Base-economy comparison only: custom Macho Clicker multipliers are intentionally excluded.");
  console.log("Controlled base progression (same input and ROI purchase strategy):");
  console.table(
    cookieProgression.checkpoints.map((row, index) => ({
      time: `${row.minutes} min`,
      cookieCps: row.cps,
      machoCps: machoProgression.checkpoints[index].cps,
      cookieBuildings: row.buildings,
      machoBuildings: machoProgression.checkpoints[index].buildings,
      highest: row.highest,
    }))
  );
  console.log("Input profile checkpoints:");
  for (const profile of profileReports) {
    console.log(profile.label);
    console.table(
      profile.macho.checkpoints.map((row) => ({
        time: `${row.minutes} min`,
        produced: row.produced,
        bank: row.bank,
        cps: row.cps,
        buildings: row.buildings,
        highest: row.highest,
      }))
    );
  }
  console.table(offlineRows);
  console.log("Wrote test-results/macho-clicker-balance-report.json");
}
