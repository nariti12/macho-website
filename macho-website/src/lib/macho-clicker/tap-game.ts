import { getMachoCharacterAsset } from "@/lib/characters/macho-face2";

export const TAP_SAVE_KEY = "machoda:macho-clicker:v4";
export const LEGACY_SAVE_KEY = "machoda:macho-clicker:v3";
export const MAX_LEVEL = 100;

// Two deliberate taps per second reaches Lv100 after roughly 300 active hours.
export const LEVEL_100_TAPS = 2_160_000;

export const EQUIPMENT = [
  { id: "dumbbells", name: "ダンベル", cost: 15, power: 1, image: "dumbbells.webp", zone: "weights" },
  { id: "barbell", name: "バーベル", cost: 70, power: 2, image: "barbell.webp", zone: "weights" },
  { id: "bench", name: "トレーニングベンチ", cost: 250, power: 3, image: "bench.webp", zone: "bench" },
  { id: "plateTree", name: "プレートラック", cost: 900, power: 8, image: "plate-tree.webp", zone: "plates" },
  { id: "powerRack", name: "パワーラック", cost: 3_500, power: 12, image: "power-rack.webp", zone: "rack" },
  { id: "punchingBag", name: "サンドバッグ", cost: 14_000, power: 28, image: "punching-bag.webp", zone: "combat" },
  { id: "rower", name: "ローイングマシン", cost: 55_000, power: 50, image: "rower.webp", zone: "cardio" },
  { id: "trainingMachine", name: "トレーニングマシン", cost: 220_000, power: 50, image: "training-machine.webp", zone: "machine" },
  { id: "treadmill", name: "ランニングマシン", cost: 900_000, power: 160, image: "treadmill.webp", zone: "cardio" },
  { id: "proteinWorkshop", name: "プロテイン工房", cost: 3_600_000, power: 200, image: "protein-workshop.webp", zone: "protein" },
  { id: "ultimateTrainer", name: "最強ジムトレーナー", cost: 14_000_000, power: 800, image: "ultimate-trainer.webp", zone: "trainer" },
  { id: "gymRenovation", name: "伝説のジム改装", cost: 60_000_000, power: 1_000, image: "legend-gym-desktop.webp", zone: "room" },
  { id: "devilDumbbells", name: "デビルダンベル", cost: 250_000_000, power: 3_000, image: "devil-dumbbells.webp", zone: "weights" },
  { id: "devilAltar", name: "デビル祭壇", cost: 1_000_000_000, power: 3_200, image: "devil-altar.webp", zone: "combat" },
  { id: "devilPowerRack", name: "デビルパワーラック", cost: 4_000_000_000, power: 10_000, image: "devil-power-rack.webp", zone: "rack" },
  { id: "energyCore", name: "マッスルコア", cost: 32_000_000_000, power: 12_000, image: "energy-core.webp", zone: "protein" },
] as const;

export type EquipmentId = (typeof EQUIPMENT)[number]["id"];

export type TapGameSave = {
  version: 4;
  points: number;
  totalPoints: number;
  taps: number;
  trainingLevel: number;
  owned: EquipmentId[];
  soundEnabled: boolean;
  reducedMotion: boolean;
  updatedAt: number;
};

export const createTapGame = (): TapGameSave => ({
  version: 4,
  points: 0,
  totalPoints: 0,
  taps: 0,
  trainingLevel: 0,
  owned: [],
  soundEnabled: true,
  reducedMotion: false,
  updatedAt: Date.now(),
});

export const tapsForLevel = (level: number) => {
  if (level <= 1) return 0;
  if (level >= MAX_LEVEL) return LEVEL_100_TAPS;
  const progress = (level - 1) / (MAX_LEVEL - 1);
  return Math.ceil(LEVEL_100_TAPS * (0.2 * progress ** 2 + 0.8 * progress ** 3));
};

export const levelFromTaps = (taps: number) => {
  const safeTaps = Math.max(0, Math.floor(taps));
  let low = 1;
  let high = MAX_LEVEL;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (tapsForLevel(middle) <= safeTaps) low = middle;
    else high = middle - 1;
  }
  return low;
};

export const levelProgress = (taps: number) => {
  const level = levelFromTaps(taps);
  const start = tapsForLevel(level);
  const end = level === MAX_LEVEL ? start : tapsForLevel(level + 1);
  return {
    level,
    current: level === MAX_LEVEL ? 1 : Math.max(0, taps - start),
    required: level === MAX_LEVEL ? 1 : end - start,
    remaining: level === MAX_LEVEL ? 0 : Math.max(0, end - taps),
    percent: level === MAX_LEVEL ? 100 : Math.min(100, ((taps - start) / (end - start)) * 100),
    character: getMachoCharacterAsset(level),
  };
};

export const trainingCost = (trainingLevel: number) => Math.ceil(100 * 1.55 ** trainingLevel);

export const tapPower = (game: TapGameSave) => {
  const equipmentPower = EQUIPMENT.reduce(
    (sum, item) => sum + (game.owned.includes(item.id) ? item.power : 0),
    1,
  );
  // The additive term ensures every training purchase is felt immediately,
  // including the first few upgrades when the base power is small.
  // Early upgrades feel strong; later upgrades remain useful without making
  // the final gym affordable after only a few thousand taps.
  const multiplier = 1.12 ** Math.min(game.trainingLevel, 13)
    * 1.03 ** Math.max(0, game.trainingLevel - 13);
  return Math.max(1, Math.floor(equipmentPower * multiplier) + game.trainingLevel);
};

export const applyTap = (game: TapGameSave): TapGameSave => {
  const gain = tapPower(game);
  return {
    ...game,
    points: game.points + gain,
    totalPoints: game.totalPoints + gain,
    taps: game.taps + 1,
    updatedAt: Date.now(),
  };
};

export const buyEquipment = (game: TapGameSave, id: EquipmentId): TapGameSave | null => {
  const itemIndex = EQUIPMENT.findIndex((candidate) => candidate.id === id);
  const item = EQUIPMENT[itemIndex];
  if (!item || game.owned.includes(id) || game.points < item.cost ||
    EQUIPMENT.slice(0, itemIndex).some((previous) => !game.owned.includes(previous.id))) return null;
  return {
    ...game,
    points: game.points - item.cost,
    owned: [...game.owned, id],
    updatedAt: Date.now(),
  };
};

export const buyTraining = (game: TapGameSave): TapGameSave | null => {
  const cost = trainingCost(game.trainingLevel);
  if (game.points < cost || game.trainingLevel >= 120) return null;
  return {
    ...game,
    points: game.points - cost,
    trainingLevel: game.trainingLevel + 1,
    updatedAt: Date.now(),
  };
};

const nonnegativeInt = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export const normalizeTapSave = (value: unknown): TapGameSave | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (source.version !== 4) return null;
  const owned = Array.isArray(source.owned)
    ? EQUIPMENT.filter((item) => source.owned instanceof Array && source.owned.includes(item.id)).map((item) => item.id)
    : [];
  return {
    version: 4,
    points: nonnegativeInt(source.points),
    totalPoints: nonnegativeInt(source.totalPoints),
    taps: nonnegativeInt(source.taps),
    trainingLevel: Math.min(120, nonnegativeInt(source.trainingLevel)),
    owned,
    soundEnabled: source.soundEnabled !== false,
    reducedMotion: source.reducedMotion === true,
    updatedAt: nonnegativeInt(source.updatedAt),
  };
};

const LEGACY_EQUIPMENT: Partial<Record<EquipmentId, string>> = {
  dumbbells: "pushUp",
  bench: "benchPress",
  powerRack: "dumbbell",
  trainingMachine: "gym",
  proteinWorkshop: "protein",
  ultimateTrainer: "trainer",
  devilDumbbells: "machoPortal",
  devilPowerRack: "finalMacho",
};

// The v3 save remains untouched in its own key. Idle-earned points cannot
// enter the manual-tap economy, but actual taps and purchased gear can.
export const migrateLegacyTapSave = (value: unknown): TapGameSave | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const upgrades = source.upgrades && typeof source.upgrades === "object"
    ? source.upgrades as Record<string, unknown>
    : {};
  return {
    ...createTapGame(),
    taps: nonnegativeInt(source.clickCount),
    owned: EQUIPMENT.filter((item) => {
      const legacyId = LEGACY_EQUIPMENT[item.id];
      return legacyId && nonnegativeInt(upgrades[legacyId]) > 0;
    }).map((item) => item.id),
  };
};
