"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const characterImageSrc = "/picture/man.png";
const STORAGE_KEY = "machoda:macho-clicker:v3";
const SAVE_INTERVAL_MS = 1000;
const GAME_TICK_MS = 50;
const NUMBER_ANIMATION_MS = 420;
const NEWS_INTERVAL_MS = 18_000;
const OFFLINE_BASE_LIMIT_SECONDS = 60 * 30;
const OFFLINE_LEGACY_BONUS_SECONDS = 60 * 60 * 8;
const MAX_SCORE = 1e300;
const PRESTIGE_REQUIREMENT = 1_000_000_000_000;
const PRESTIGE_BONUS_RATE = 0.01;
const LUCKY_BANK_RATE = 0.15;
const LUCKY_CPS_SECONDS = 900;
const LUCKY_FLAT_BONUS = 13;
const FRENZY_DURATION_MS = 77_000;
const CLICK_FRENZY_DURATION_MS = 13_000;
const BUILDING_FRENZY_DURATION_MS = 30_000;
const FRENZY_MULTIPLIER = 7;
const CLICK_FRENZY_MULTIPLIER = 777;
const BUILDING_FRENZY_MULTIPLIER = 20;
const GOLDEN_SPAWN_MIN_MS = 5 * 60 * 1000;
const GOLDEN_SPAWN_MAX_MS = 15 * 60 * 1000;
const GOLDEN_LIFETIME_MS = 13_000;
const MUSCLE_CRYSTAL_GROW_MS = 24 * 60 * 60 * 1000;
const BUILDING_LEVEL_BONUS_RATE = 0.01;
const MAX_BUILDING_LEVEL_MULTIPLIER = 4;
const MAX_PRESTIGE_MULTIPLIER = 25;
const MAX_ACHIEVEMENT_SUPPORT_MULTIPLIER = 3;
const BALANCE_CLICKS_PER_SECOND = 1;
const BALANCE_MAX_MINUTES = 240;
const BUILDING_COUNT_CHECKPOINTS = [1, 5, 10, 25, 50, 100, 150, 200] as const;
const GOLDEN_HISTORY_LIMIT = 12;
const LEGACY_STARTING_MUSCLE = 100;

type UpgradeKey =
  | "pushUp"
  | "abRoller"
  | "dumbbell"
  | "protein"
  | "chicken"
  | "benchPress"
  | "trainer"
  | "gym"
  | "supplementStore"
  | "mealPrepLab"
  | "machoPortal"
  | "timeGym"
  | "antiGravityGym"
  | "proteinPrism"
  | "chanceMachine"
  | "fractalMuscle"
  | "muscleConsole"
  | "idleverseGym"
  | "cortexTrainer"
  | "finalMacho";

type Upgrade = {
  key: UpgradeKey;
  name: string;
  label: string;
  icon: string;
  spriteSrc: string;
  description: string;
  baseCost: number;
  costRate: number;
  perSecondBonus?: number;
  accent: string;
};

type PowerUpgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  spriteSrc: string;
  effectLabel: string;
  target?: UpgradeKey;
  buildingMultiplier?: number;
  clickBonus?: number;
  clickMultiplier?: number;
  clickCpsPercent?: number;
  goldenMultiplier?: number;
  achievementSupportRate?: number;
  unlock: (state: GameState) => boolean;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
  handMadeMuscle: number;
  clickCount: number;
  upgrades: Record<UpgradeKey, number>;
  buildingLevels: Record<UpgradeKey, number>;
  muscleCrystals: number;
  nextMuscleCrystalAt: number;
  goldenClicks: number;
  goldenHistory: GoldenHistoryEntry[];
  legacyUpgrades: string[];
  purchasedPowerUps: string[];
  activeBuffs: ActiveBuff[];
  prestigeLevel: number;
  ascensionCount: number;
  lastSavedAt: number;
  unlockedAchievements: string[];
};

type RankingEntry = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
};

type FloatingGain = {
  id: number;
  x: number;
  y: number;
  value: number;
};

type TooltipPosition = {
  x: number;
  y: number;
};

type Spark = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
};

type PurchaseFlight = {
  id: number;
  src: string;
  fromX: number;
  fromY: number;
  dx: number;
  dy: number;
};

type MobilePanel = "click" | "gym" | "shop" | "stats";
type DesktopDetailPanel = "overview" | "achievements" | "legacy" | "levels" | "save" | "benchmarks";

type SoundType = "click" | "buy" | "blocked" | "golden";

type NumberNotation = "short" | "japanese" | "full";

type Achievement = {
  key: string;
  category?: "累計" | "クリック" | "設備数" | "建物別" | "ゴールデン" | "仕上げ直し" | "隠し";
  title: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
};

type AchievementCategory = NonNullable<Achievement["category"]>;

type GoldenProtein = {
  id: number;
  x: number;
  y: number;
};

type ActiveBuff = {
  id: string;
  type: "frenzy" | "clickFrenzy" | "buildingFrenzy";
  name: string;
  multiplier: number;
  endAt: number;
  target?: UpgradeKey;
};

type GoldenHistoryEntry = {
  id: string;
  name: string;
  detail: string;
  createdAt: number;
};

type SeasonalEvent = {
  id: "winter" | "spring" | "summer" | "autumn";
  name: string;
  description: string;
  multiplier: number;
  icon: string;
  bonusLabel: string;
};

type AmbientItem = {
  id: string;
  src: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
};

type MysteryShopItem = {
  id: string;
  name: string;
  description: string;
  unlockHint: string;
};

type BalanceBenchmark = {
  minutes: number;
  muscle: number;
  perSecond: number;
  upgrades: Record<UpgradeKey, number>;
};

type CookieStyleBenchmarkTarget = {
  minutes: number;
  perSecondRange: [number, number];
  ownedRange: [number, number];
  focus: string;
};

type BuildingCountCheckpoint = {
  owned: number;
  minute: number | null;
  perSecond: number;
};

type BodyPartKey = "chest" | "back" | "legs" | "shoulders" | "arms" | "abs";

type BodyPartDefinition = {
  key: BodyPartKey;
  label: string;
  mainUpgrades: UpgradeKey[];
  accent: string;
};

type BodyPartProgress = BodyPartDefinition & {
  level: number;
  progress: number;
};

type GoldenEffect = {
  id: "lucky" | "frenzy" | "clickFrenzy" | "buildingFrenzy" | "jackpot";
  weight: number;
  unlock?: (state: GameState) => boolean;
};

const cookieStyleBenchmarkTargets: CookieStyleBenchmarkTarget[] = [
  {
    minutes: 5,
    perSecondRange: [0.8, 4],
    ownedRange: [8, 20],
    focus: "ダンベル中心。腹筋ローラーに届くかどうかの序盤。",
  },
  {
    minutes: 10,
    perSecondRange: [2, 10],
    ownedRange: [14, 30],
    focus: "腹筋ローラーを増やし、バーベル部隊を目指す段階。",
  },
  {
    minutes: 30,
    perSecondRange: [12, 70],
    ownedRange: [28, 55],
    focus: "バーベル部隊が主力になり、プロテイン工房が見え始める段階。",
  },
  {
    minutes: 60,
    perSecondRange: [45, 240],
    ownedRange: [45, 80],
    focus: "プロテイン工房を買い始め、高たんぱく食堂を遠い目標にする段階。",
  },
];

type LegacyUpgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effectLabel: string;
  unlock: (state: GameState) => boolean;
};

const upgrades: Upgrade[] = [
  {
    key: "pushUp",
    name: "ダンベル",
    label: "DB",
    icon: "➤",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/dumbbell.png",
    description: "10秒に1回、ダンベルが筋肉ポイントを生みます。",
    baseCost: 15,
    costRate: 1.15,
    perSecondBonus: 0.1,
    accent: "from-[#FFE7C2] to-[#F97316]",
  },
  {
    key: "abRoller",
    name: "腹筋ローラー職人",
    label: "ABS",
    icon: "◎",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/ab-roller.png",
    description: "腹筋ローラーを転がし続ける職人です。",
    baseCost: 100,
    costRate: 1.15,
    perSecondBonus: 1,
    accent: "from-[#FED7AA] to-[#EA580C]",
  },
  {
    key: "dumbbell",
    name: "バーベル部隊",
    label: "BAR",
    icon: "B",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/barbell-rack.png",
    description: "黙々とバーベルを上げ続ける部隊です。",
    baseCost: 1100,
    costRate: 1.15,
    perSecondBonus: 8,
    accent: "from-[#FDBA74] to-[#C2410C]",
  },
  {
    key: "protein",
    name: "プロテイン工房",
    label: "PRO",
    icon: "P",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/protein-workshop.png",
    description: "筋肉の材料を大量に作る工房です。",
    baseCost: 12000,
    costRate: 1.15,
    perSecondBonus: 47,
    accent: "from-[#FFEDD5] to-[#FB923C]",
  },
  {
    key: "chicken",
    name: "高たんぱく食堂",
    label: "MEAL",
    icon: "肉",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/high-protein-meal.png",
    description: "鶏むね肉を大量提供する食堂です。",
    baseCost: 130000,
    costRate: 1.15,
    perSecondBonus: 260,
    accent: "from-[#FED7AA] to-[#D97706]",
  },
  {
    key: "benchPress",
    name: "ベンチプレス軍団",
    label: "BENCH",
    icon: "B",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/bench-press.png",
    description: "胸トレで筋肉ポイントを量産します。",
    baseCost: 1400000,
    costRate: 1.15,
    perSecondBonus: 1400,
    accent: "from-[#FDE68A] to-[#EA580C]",
  },
  {
    key: "trainer",
    name: "専属トレーナー",
    label: "COACH",
    icon: "T",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/trainer.png",
    description: "フォーム改善で筋肉生産を加速します。",
    baseCost: 20000000,
    costRate: 1.15,
    perSecondBonus: 7800,
    accent: "from-[#FDBA74] to-[#9A3412]",
  },
  {
    key: "gym",
    name: "巨大ジム",
    label: "GYM",
    icon: "G",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/gym.png",
    description: "街ごと筋トレ空間に変える巨大施設です。",
    baseCost: 330000000,
    costRate: 1.15,
    perSecondBonus: 44000,
    accent: "from-[#FFB45D] to-[#7C2D12]",
  },
  {
    key: "supplementStore",
    name: "サプリ宇宙便",
    label: "SHIP",
    icon: "S",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/supplement-ship.png",
    description: "宇宙規模でサプリを届け、筋肉ポイントを増やします。",
    baseCost: 5_100_000_000,
    costRate: 1.15,
    perSecondBonus: 260_000,
    accent: "from-[#FFE7C2] to-[#B45309]",
  },
  {
    key: "mealPrepLab",
    name: "栄養錬金ラボ",
    label: "LAB",
    icon: "L",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/nutrition-lab.png",
    description: "食事管理を錬金術レベルまで高める研究所です。",
    baseCost: 75_000_000_000,
    costRate: 1.15,
    perSecondBonus: 1_600_000,
    accent: "from-[#FED7AA] to-[#92400E]",
  },
  {
    key: "machoPortal",
    name: "マッチョポータル",
    label: "PORT",
    icon: "P",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/macho-portal.png",
    description: "異世界の筋肉を呼び込むポータルです。",
    baseCost: 1_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 10_000_000,
    accent: "from-[#FDBA74] to-[#7C2D12]",
  },
  {
    key: "timeGym",
    name: "時空ジム",
    label: "TIME",
    icon: "T",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/time-gym.png",
    description: "未来のトレーニング成果を前借りします。",
    baseCost: 14_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 65_000_000,
    accent: "from-[#FFEDD5] to-[#C2410C]",
  },
  {
    key: "antiGravityGym",
    name: "反重力ジム",
    label: "ANTI",
    icon: "A",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/anti-gravity-gym.png",
    description: "重力を超えた負荷で筋肉ポイントを作ります。",
    baseCost: 170_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 430_000_000,
    accent: "from-[#FDE68A] to-[#9A3412]",
  },
  {
    key: "proteinPrism",
    name: "プロテインプリズム",
    label: "PRISM",
    icon: "R",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/protein-prism.png",
    description: "光をプロテインに変換する最強装置です。",
    baseCost: 2_100_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 2_900_000_000,
    accent: "from-[#FEF3C7] to-[#EA580C]",
  },
  {
    key: "chanceMachine",
    name: "筋肉ガチャ装置",
    label: "LUCK",
    icon: "C",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/chance-machine.png",
    description: "運の力で筋肉ポイントを引き当てます。",
    baseCost: 26_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 21_000_000_000,
    accent: "from-[#FDBA74] to-[#7C2D12]",
  },
  {
    key: "fractalMuscle",
    name: "フラクタル筋肉炉",
    label: "FRAC",
    icon: "F",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/fractal-muscle.png",
    description: "筋肉が筋肉を生む、終盤用の増殖炉です。",
    baseCost: 310_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 150_000_000_000,
    accent: "from-[#FFB45D] to-[#451A03]",
  },
  {
    key: "muscleConsole",
    name: "筋肉コンソール",
    label: "CODE",
    icon: "JS",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/muscle-console.png",
    description: "筋肉生産をコードで直接書き換える終盤用コンソールです。",
    baseCost: 71_000_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 1_100_000_000_000,
    accent: "from-[#FCE7F3] to-[#831843]",
  },
  {
    key: "idleverseGym",
    name: "アイドルバースジム",
    label: "IDLE",
    icon: "I",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/idleverse-gym.png",
    description: "別次元の放置ゲームから筋肉ポイントを横取りします。",
    baseCost: 12_000_000_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 8_300_000_000_000,
    accent: "from-[#FED7AA] to-[#2A140B]",
  },
  {
    key: "cortexTrainer",
    name: "脳筋コルテックス",
    label: "CORTEX",
    icon: "C",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/cortex-trainer.png",
    description: "脳まで筋肉化し、思考だけで筋肉ポイントを作ります。",
    baseCost: 1_900_000_000_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 64_000_000_000_000,
    accent: "from-[#FFE7C2] to-[#7C2D12]",
  },
  {
    key: "finalMacho",
    name: "マチョ田本人",
    label: "YOU",
    icon: "Y",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/final-macho.png",
    description: "最終的にマチョ田自身が筋肉ポイントを量産します。",
    baseCost: 540_000_000_000_000_000_000_000_000,
    costRate: 1.15,
    perSecondBonus: 510_000_000_000_000,
    accent: "from-[#FF8A23] to-[#451A03]",
  },
];

const visualUpgrades = upgrades.filter((upgrade) => upgrade.key !== "pushUp");

const bodyPartDefinitions: BodyPartDefinition[] = [
  {
    key: "chest",
    label: "胸",
    mainUpgrades: ["benchPress", "trainer", "finalMacho"],
    accent: "from-rose-300 to-red-600",
  },
  {
    key: "back",
    label: "背中",
    mainUpgrades: ["dumbbell", "gym", "machoPortal"],
    accent: "from-sky-300 to-blue-700",
  },
  {
    key: "legs",
    label: "脚",
    mainUpgrades: ["chicken", "antiGravityGym", "timeGym"],
    accent: "from-emerald-300 to-green-700",
  },
  {
    key: "shoulders",
    label: "肩",
    mainUpgrades: ["proteinPrism", "chanceMachine", "fractalMuscle"],
    accent: "from-violet-300 to-purple-700",
  },
  {
    key: "arms",
    label: "腕",
    mainUpgrades: ["pushUp", "dumbbell", "muscleConsole"],
    accent: "from-amber-300 to-orange-700",
  },
  {
    key: "abs",
    label: "腹筋",
    mainUpgrades: ["abRoller", "mealPrepLab", "cortexTrainer"],
    accent: "from-cyan-200 to-teal-700",
  },
];

const getUpgradeTier = (key: UpgradeKey) => {
  const index = upgrades.findIndex((upgrade) => upgrade.key === key);

  if (index >= 14) return "cosmic";
  if (index >= 10) return "mythic";
  if (index >= 6) return "advanced";
  return "basic";
};

const ambientItems: AmbientItem[] = [
  { id: "amb-dumbbell-1", src: "/game/macho-clicker/icons/generated-v3/dumbbell.png", left: "7%", size: 42, delay: "-2s", duration: "15s", opacity: 0.42 },
  { id: "amb-protein-1", src: "/game/macho-clicker/icons/generated-v3/protein-workshop.png", left: "17%", size: 48, delay: "-11s", duration: "21s", opacity: 0.34 },
  { id: "amb-roller-1", src: "/game/macho-clicker/icons/generated-v3/ab-roller.png", left: "29%", size: 44, delay: "-7s", duration: "18s", opacity: 0.38 },
  { id: "amb-meal-1", src: "/game/macho-clicker/icons/generated-v3/high-protein-meal.png", left: "41%", size: 50, delay: "-16s", duration: "24s", opacity: 0.3 },
  { id: "amb-bench-1", src: "/game/macho-clicker/icons/generated-v3/bench-press.png", left: "54%", size: 54, delay: "-5s", duration: "22s", opacity: 0.28 },
  { id: "amb-golden-1", src: "/game/macho-clicker/icons/generated-v3/golden-protein.png", left: "66%", size: 46, delay: "-13s", duration: "19s", opacity: 0.34 },
  { id: "amb-trainer-1", src: "/game/macho-clicker/icons/generated-v3/trainer.png", left: "78%", size: 42, delay: "-9s", duration: "23s", opacity: 0.28 },
  { id: "amb-gym-1", src: "/game/macho-clicker/icons/generated-v3/gym.png", left: "90%", size: 50, delay: "-18s", duration: "26s", opacity: 0.24 },
];

const upgradeSceneClasses: Record<UpgradeKey, string> = {
  pushUp: "from-[#FFF7EB] via-[#FED7AA] to-[#F97316]",
  abRoller: "from-[#E0F2FE] via-[#BAE6FD] to-[#0284C7]",
  dumbbell: "from-[#E5E7EB] via-[#9CA3AF] to-[#374151]",
  protein: "from-[#EFF6FF] via-[#BFDBFE] to-[#2563EB]",
  chicken: "from-[#FEFCE8] via-[#BBF7D0] to-[#65A30D]",
  benchPress: "from-[#FEE2E2] via-[#FB7185] to-[#7F1D1D]",
  trainer: "from-[#ECFCCB] via-[#84CC16] to-[#365314]",
  gym: "from-[#DBEAFE] via-[#60A5FA] to-[#1E3A8A]",
  supplementStore: "from-[#F5F3FF] via-[#A78BFA] to-[#4C1D95]",
  mealPrepLab: "from-[#DCFCE7] via-[#22C55E] to-[#14532D]",
  machoPortal: "from-[#FAE8FF] via-[#D946EF] to-[#581C87]",
  timeGym: "from-[#E0E7FF] via-[#818CF8] to-[#312E81]",
  antiGravityGym: "from-[#F0FDFA] via-[#2DD4BF] to-[#134E4A]",
  proteinPrism: "from-[#FEF9C3] via-[#FACC15] to-[#A16207]",
  chanceMachine: "from-[#FFE4E6] via-[#F43F5E] to-[#881337]",
  fractalMuscle: "from-[#FFEDD5] via-[#EA580C] to-[#431407]",
  muscleConsole: "from-[#FCE7F3] via-[#EC4899] to-[#831843]",
  idleverseGym: "from-[#F8FAFC] via-[#64748B] to-[#0F172A]",
  cortexTrainer: "from-[#FCE7F3] via-[#EC4899] to-[#831843]",
  finalMacho: "from-[#FFF7ED] via-[#FF8A23] to-[#451A03]",
};

const getUpgradeSceneClass = (key: UpgradeKey) => upgradeSceneClasses[key];

const upgradeSceneImages: Record<UpgradeKey, string> = {
  pushUp: "/game/macho-clicker/scenes/generated-v2/push-up-stage.png",
  abRoller: "/game/macho-clicker/scenes/generated-v4/ab-roller-studio.png",
  dumbbell: "/game/macho-clicker/scenes/generated-v4/barbell-squad-zone.png",
  protein: "/game/macho-clicker/scenes/generated-v4/protein-workshop.png",
  chicken: "/game/macho-clicker/scenes/generated-v4/high-protein-cafeteria.png",
  benchPress: "/game/macho-clicker/scenes/generated-v4/bench-press-arena.png",
  trainer: "/game/macho-clicker/scenes/generated-v5/trainer-office.png",
  gym: "/game/macho-clicker/scenes/generated-v5/huge-gym-hall.png",
  supplementStore: "/game/macho-clicker/scenes/generated-v5/supplement-space-delivery.png",
  mealPrepLab: "/game/macho-clicker/scenes/generated-v5/nutrition-alchemy-lab.png",
  machoPortal: "/game/macho-clicker/scenes/generated-v5/macho-portal-chamber.png",
  timeGym: "/game/macho-clicker/scenes/generated-v5/time-gym.png",
  antiGravityGym: "/game/macho-clicker/scenes/generated-v6/anti-gravity-gym.png",
  proteinPrism: "/game/macho-clicker/scenes/generated-v6/protein-prism-room.png",
  chanceMachine: "/game/macho-clicker/scenes/generated-v6/muscle-gacha-arcade.png",
  fractalMuscle: "/game/macho-clicker/scenes/generated-v6/fractal-reactor-room.png",
  muscleConsole: "/game/macho-clicker/scenes/generated-v6/muscle-console-room.png",
  idleverseGym: "/game/macho-clicker/scenes/generated-v6/idleverse-gym.png",
  cortexTrainer: "/game/macho-clicker/scenes/generated-v6/cortex-trainer-room.png",
  finalMacho: "/game/macho-clicker/scenes/generated-v6/final-macho-arena.png",
};

const getUpgradeSceneImage = (key: UpgradeKey) => upgradeSceneImages[key];
const clickStageImageSizes = "(min-width: 1536px) 980px, (min-width: 1280px) 860px, (min-width: 768px) 60vw, 100vw";
const buildingSceneImageSizes = "(min-width: 1536px) 780px, (min-width: 1280px) 58vw, (min-width: 768px) 100vw, 100vw";

const emptyUpgrades: Record<UpgradeKey, number> = {
  pushUp: 0,
  abRoller: 0,
  dumbbell: 0,
  protein: 0,
  chicken: 0,
  benchPress: 0,
  trainer: 0,
  gym: 0,
  supplementStore: 0,
  mealPrepLab: 0,
  machoPortal: 0,
  timeGym: 0,
  antiGravityGym: 0,
  proteinPrism: 0,
  chanceMachine: 0,
  fractalMuscle: 0,
  muscleConsole: 0,
  idleverseGym: 0,
  cortexTrainer: 0,
  finalMacho: 0,
};

const emptyBuildingLevels: Record<UpgradeKey, number> = {
  pushUp: 0,
  abRoller: 0,
  dumbbell: 0,
  protein: 0,
  chicken: 0,
  benchPress: 0,
  trainer: 0,
  gym: 0,
  supplementStore: 0,
  mealPrepLab: 0,
  machoPortal: 0,
  timeGym: 0,
  antiGravityGym: 0,
  proteinPrism: 0,
  chanceMachine: 0,
  fractalMuscle: 0,
  muscleConsole: 0,
  idleverseGym: 0,
  cortexTrainer: 0,
  finalMacho: 0,
};

const manualPowerUpgrades: PowerUpgrade[] = [
  {
    id: "grip-gloves",
    name: "握力強化グローブ",
    description: "クリック時の筋肉ポイントが+1されます。序盤の手動クリックを少しだけ強くします。",
    cost: 100,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/dumbbell.png",
    effectLabel: "クリック +1",
    clickBonus: 1,
    unlock: (state) => state.upgrades.pushUp >= 1 || state.totalMuscle >= 100,
  },
  {
    id: "double-grip",
    name: "両手クリック",
    description: "クリック時の筋肉ポイントがさらに+1されます。設備を増やした後の次の手動強化です。",
    cost: 5_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/dumbbell.png",
    effectLabel: "クリック +1",
    clickBonus: 1,
    unlock: (state) => state.upgrades.pushUp >= 10 && state.totalMuscle >= 2_500,
  },
  {
    id: "cps-click-1",
    name: "神経伝達強化",
    description: "クリック時に毎秒生産量の0.1%が追加されます。",
    cost: 500_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/trainer.png",
    effectLabel: "クリック +CpS 0.1%",
    clickCpsPercent: 0.001,
    unlock: (state) => state.upgrades.pushUp >= 25 && getPerSecond(state) >= 25,
  },
  {
    id: "cps-click-2",
    name: "爆速パンプ",
    description: "クリック時に毎秒生産量の0.1%が追加されます。",
    cost: 50_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "クリック +CpS 0.1%",
    clickCpsPercent: 0.001,
    unlock: (state) => state.upgrades.pushUp >= 50 && getPerSecond(state) >= 250,
  },
  {
    id: "protein-blend",
    name: "黄金プロテイン配合",
    description: "ゴールデンプロテインの獲得ボーナスが2倍になります。",
    cost: 50_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "黄金 x2",
    goldenMultiplier: 2,
    unlock: (state) => state.totalMuscle >= 10_000,
  },
  {
    id: "macho-cat-rookie",
    name: "マチョ猫サポート",
    description: "実績数に応じて毎秒生産が伸びます。実績を集めるほど強くなります。",
    cost: 250_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/trainer.png",
    effectLabel: "実績1個ごとに +0.2%",
    achievementSupportRate: 0.002,
    unlock: (state) => state.unlockedAchievements.length >= 5,
  },
  {
    id: "macho-cat-pro",
    name: "マチョ猫プロ",
    description: "実績数に応じた毎秒生産ボーナスをさらに強化します。",
    cost: 50_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/trainer.png",
    effectLabel: "実績1個ごとに +0.3%",
    achievementSupportRate: 0.003,
    unlock: (state) => state.unlockedAchievements.length >= 20,
  },
  {
    id: "macho-cat-legend",
    name: "伝説のマチョ猫",
    description: "大量実績を集めたプレイヤー向けの長期ボーナスです。",
    cost: 25_000_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/final-macho.png",
    effectLabel: "実績1個ごとに +0.5%",
    achievementSupportRate: 0.005,
    unlock: (state) => state.unlockedAchievements.length >= 50,
  },
];

const buildingPowerUpgradeTiers = [
  { owned: 1, costMultiplier: 10, label: "基礎強化" },
  { owned: 5, costMultiplier: 50, label: "効率化" },
  { owned: 25, costMultiplier: 500, label: "量産体制" },
  { owned: 50, costMultiplier: 5_000, label: "完全自動化" },
  { owned: 100, costMultiplier: 50_000, label: "神域到達" },
  { owned: 150, costMultiplier: 500_000, label: "宇宙規模化" },
] as const;

const getBuildingPowerUpgradeCost = (upgrade: Upgrade, upgradeIndex: number, costMultiplier: number) => {
  const rankMultiplier = 1 + upgradeIndex * 0.08;
  return Math.ceil(upgrade.baseCost * costMultiplier * rankMultiplier);
};

const buildingPowerUpgrades: PowerUpgrade[] = upgrades.flatMap((upgrade, upgradeIndex) =>
  buildingPowerUpgradeTiers.map((tier) => ({
    id: `${upgrade.key}-${tier.owned}`,
    name: `${upgrade.name}${tier.label}`,
    description: `${upgrade.name}の毎秒生産が2倍になります。`,
    cost: getBuildingPowerUpgradeCost(upgrade, upgradeIndex, tier.costMultiplier),
    spriteSrc: upgrade.spriteSrc,
    effectLabel: `${upgrade.name} x2`,
    target: upgrade.key,
    buildingMultiplier: 2,
    unlock: (state: GameState) => state.upgrades[upgrade.key] >= tier.owned,
  }))
);

const powerUpgrades: PowerUpgrade[] = [...manualPowerUpgrades, ...buildingPowerUpgrades];

const achievementCategories = ["累計", "クリック", "設備数", "建物別", "ゴールデン", "仕上げ直し", "隠し"] as const;

const achievementCategoryIcons: Record<AchievementCategory, string> = {
  累計: "Σ",
  クリック: "＋",
  設備数: "器",
  建物別: "館",
  ゴールデン: "金",
  仕上げ直し: "転",
  隠し: "?",
};

const mysteryShopItems: MysteryShopItem[] = [
  {
    id: "mystery-equipment",
    name: "？？？",
    description: "まだ正体不明のジム設備です。さらに筋肉ポイントを稼ぐと、新しい設備を追加できる余地として残しています。",
    unlockHint: "未解放",
  },
];

const formatAchievementValue = (value: number) => value.toLocaleString("ja-JP");

const baseAchievements: Achievement[] = [
  {
    key: "first-click",
    title: "入会完了",
    description: "初めて筋肉ポイントを獲得した",
    isUnlocked: (state) => state.totalMuscle >= 1,
  },
  {
    key: "beginner",
    title: "初心者トレーニー",
    description: "累計500筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 500,
  },
  {
    key: "first-upgrade",
    title: "成長の始まり",
    description: "強化メニューを初めて購入した",
    isUnlocked: (state) => Object.values(state.upgrades).some((level) => level > 0),
  },
  {
    key: "auto-training",
    title: "自動筋トレ開始",
    description: "毎秒筋肉ポイントを獲得できるようになった",
    isUnlocked: (state) => getPerSecond(state) > 0,
  },
  {
    key: "gorilla",
    title: "ゴリマッチョ",
    description: "累計250,000筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 250_000,
  },
  {
    key: "machoda",
    title: "マチョ田級",
    description: "累計1,000,000筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 1_000_000,
  },
  {
    key: "upgrade-10",
    title: "強化厨",
    description: "強化メニューを合計10回購入した",
    isUnlocked: (state) => Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 10,
  },
  {
    key: "building-50",
    title: "ジム拡張",
    description: "強化メニューを合計50回購入した",
    isUnlocked: (state) => Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 50,
  },
  {
    key: "building-100",
    title: "巨大ジム運営者",
    description: "強化メニューを合計100回購入した",
    isUnlocked: (state) => Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 100,
  },
  {
    key: "click-master",
    title: "クリック職人",
    description: "クリック回数が1,000回を超えた",
    isUnlocked: (state) => state.clickCount >= 1000,
  },
  {
    key: "factory",
    title: "筋肉工場",
    description: "毎秒獲得量が1,000を超えた",
    isUnlocked: (state) => getPerSecond(state) >= 1000,
  },
  {
    key: "macho-god",
    title: "マチョ神",
    description: "累計10,000,000筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 10_000_000,
  },
  {
    key: "first-ascension",
    title: "仕上げ直し",
    description: "初めて仕上げ直しを実行した",
    isUnlocked: (state) => state.ascensionCount >= 1,
  },
  {
    key: "prestige-10",
    title: "永久パンプ",
    description: "永久倍率が10%を超えた",
    isUnlocked: (state) => state.prestigeLevel >= 10,
  },
  {
    key: "millionaire",
    title: "ミリオン到達",
    description: "累計1 million筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 1_000_000,
  },
  {
    key: "billionaire",
    title: "ビリオン到達",
    description: "累計1 billion筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 1_000_000_000,
  },
  {
    key: "trillionaire",
    title: "トリリオン到達",
    description: "累計1 trillion筋肉ポイントを達成",
    isUnlocked: (state) => state.totalMuscle >= 1_000_000_000_000,
  },
  {
    key: "golden-boost",
    title: "黄金の筋肉",
    description: "ゴールデン効果を受けた",
    isUnlocked: (state) => state.activeBuffs.length > 0,
  },
  {
    key: "all-basic-buildings",
    title: "ジム一式完成",
    description: "全設備を1つ以上購入した",
    isUnlocked: (state) => upgrades.every((upgrade) => state.upgrades[upgrade.key] >= 1),
  },
  {
    key: "hundred-dumbbells",
    title: "ダンベル百景",
    description: "ダンベルを100個購入した",
    isUnlocked: (state) => state.upgrades.pushUp >= 100,
  },
];

const totalAchievementTiers = [
  1,
  100,
  500,
  1_000,
  5_000,
  10_000,
  50_000,
  100_000,
  500_000,
  1_000_000,
  10_000_000,
  100_000_000,
  1_000_000_000,
  10_000_000_000,
  100_000_000_000,
  1_000_000_000_000,
  10_000_000_000_000,
  100_000_000_000_000,
  1_000_000_000_000_000,
  10_000_000_000_000_000,
] as const;

const clickAchievementTiers = [10, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000] as const;
const buildingCountAchievementTiers = [1, 5, 10, 25, 50, 100, 200, 400, 800, 1_200] as const;
const perSecondAchievementTiers = [
  1,
  10,
  100,
  1_000,
  10_000,
  100_000,
  1_000_000,
  10_000_000,
  100_000_000,
  1_000_000_000,
] as const;
const buildingSpecificAchievementTiers = [1, 10, 25, 50, 100] as const;

const generatedAchievements: Achievement[] = [
  ...totalAchievementTiers.map((value) => ({
    key: `total-${value}`,
    category: "累計" as const,
    title: `累計 ${formatAchievementValue(value)}`,
    description: `累計 ${formatAchievementValue(value)} 筋肉ポイントを達成`,
    isUnlocked: (state: GameState) => state.totalMuscle >= value,
  })),
  ...clickAchievementTiers.map((value) => ({
    key: `click-${value}`,
    category: "クリック" as const,
    title: `クリック ${formatAchievementValue(value)}回`,
    description: `クリック回数 ${formatAchievementValue(value)} 回を達成`,
    isUnlocked: (state: GameState) => state.clickCount >= value,
  })),
  ...buildingCountAchievementTiers.map((value) => ({
    key: `building-count-${value}`,
    category: "設備数" as const,
    title: `設備 ${formatAchievementValue(value)}個`,
    description: `設備を合計 ${formatAchievementValue(value)} 個購入`,
    isUnlocked: (state: GameState) => Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= value,
  })),
  ...perSecondAchievementTiers.map((value) => ({
    key: `cps-${value}`,
    category: "設備数" as const,
    title: `毎秒 ${formatAchievementValue(value)}`,
    description: `毎秒 ${formatAchievementValue(value)} 筋肉ポイントに到達`,
    isUnlocked: (state: GameState) => getPerSecond(state) >= value,
  })),
  ...upgrades.flatMap((upgrade) =>
    buildingSpecificAchievementTiers.map((value) => ({
      key: `${upgrade.key}-owned-${value}`,
      category: "建物別" as const,
      title: `${upgrade.name} ${formatAchievementValue(value)}個`,
      description: `${upgrade.name}を ${formatAchievementValue(value)} 個購入`,
      isUnlocked: (state: GameState) => state.upgrades[upgrade.key] >= value,
    }))
  ),
  {
    key: "golden-first-buff",
    category: "ゴールデン",
    title: "ゴールデン初体験",
    description: "ゴールデンプロテイン効果を発動",
    isUnlocked: (state) => state.goldenClicks >= 1 || state.activeBuffs.length > 0,
  },
  {
    key: "golden-10",
    category: "ゴールデン",
    title: "黄金慣れ",
    description: "ゴールデンプロテインを10回獲得",
    isUnlocked: (state) => state.goldenClicks >= 10,
  },
  {
    key: "golden-77",
    category: "ゴールデン",
    title: "黄金ハンター",
    description: "ゴールデンプロテインを77回獲得",
    isUnlocked: (state) => state.goldenClicks >= 77,
  },
  {
    key: "ascension-3",
    category: "仕上げ直し",
    title: "仕上げ直し三段",
    description: "仕上げ直しを3回実行",
    isUnlocked: (state) => state.ascensionCount >= 3,
  },
  {
    key: "ascension-10",
    category: "仕上げ直し",
    title: "転生マッチョ",
    description: "仕上げ直しを10回実行",
    isUnlocked: (state) => state.ascensionCount >= 10,
  },
  {
    key: "first-crystal",
    category: "隠し",
    title: "筋肉結晶",
    description: "筋肉結晶を初めて獲得",
    isUnlocked: (state) => state.muscleCrystals >= 1 || Object.values(state.buildingLevels).some((level) => level >= 1),
  },
  {
    key: "building-level-1",
    category: "建物別",
    title: "設備レベル開始",
    description: "いずれかの設備レベルを1にした",
    isUnlocked: (state) => Object.values(state.buildingLevels).some((level) => level >= 1),
  },
  {
    key: "building-level-10",
    category: "建物別",
    title: "設備レベル10",
    description: "いずれかの設備レベルを10にした",
    isUnlocked: (state) => Object.values(state.buildingLevels).some((level) => level >= 10),
  },
  {
    key: "season-winter",
    category: "隠し",
    title: "冬の増量期",
    description: "冬の増量期にプレイした",
    isUnlocked: () => getSeasonalEvent().id === "winter",
  },
  {
    key: "season-spring",
    category: "隠し",
    title: "春の入会キャンペーン",
    description: "春の入会キャンペーン中にプレイした",
    isUnlocked: () => getSeasonalEvent().id === "spring",
  },
  {
    key: "season-summer",
    category: "隠し",
    title: "夏の仕上げ期",
    description: "夏の仕上げ期にプレイした",
    isUnlocked: () => getSeasonalEvent().id === "summer",
  },
  {
    key: "season-autumn",
    category: "隠し",
    title: "秋のバルク期",
    description: "秋のバルク期にプレイした",
    isUnlocked: () => getSeasonalEvent().id === "autumn",
  },
];

const achievements: Achievement[] = [...baseAchievements, ...generatedAchievements].filter(
  (achievement, index, list) => list.findIndex((candidate) => candidate.key === achievement.key) === index
);

const initialState: GameState = {
  muscle: 0,
  totalMuscle: 0,
  handMadeMuscle: 0,
  clickCount: 0,
  upgrades: emptyUpgrades,
  buildingLevels: emptyBuildingLevels,
  muscleCrystals: 0,
  nextMuscleCrystalAt: Date.now() + MUSCLE_CRYSTAL_GROW_MS,
  goldenClicks: 0,
  goldenHistory: [],
  legacyUpgrades: [],
  purchasedPowerUps: [],
  activeBuffs: [],
  prestigeLevel: 0,
  ascensionCount: 0,
  lastSavedAt: Date.now(),
  unlockedAchievements: [],
};

const legacyUpgrades: LegacyUpgrade[] = [
  {
    id: "starter-dumbbell",
    name: "スターターダンベル",
    description: "仕上げ直し後、最初から少しだけ筋肉ポイントを持った状態で再開できます。",
    cost: 1,
    effectLabel: `周回開始 +${LEGACY_STARTING_MUSCLE} 筋肉`,
    unlock: (state) => state.prestigeLevel >= 1,
  },
  {
    id: "offline-coach",
    name: "留守番トレーナー",
    description: "オフライン中に貯められる筋肉ポイントの上限時間が伸びます。",
    cost: 3,
    effectLabel: "オフライン上限 +8時間",
    unlock: (state) => state.prestigeLevel >= 3,
  },
  {
    id: "golden-beacon",
    name: "黄金ビーコン",
    description: "ゴールデンプロテインが少し出現しやすくなります。",
    cost: 5,
    effectLabel: "ゴールデン出現間隔 -15%",
    unlock: (state) => state.prestigeLevel >= 5,
  },
  {
    id: "crystal-gym",
    name: "結晶ジム",
    description: "筋肉結晶の成長時間を短縮します。",
    cost: 7,
    effectLabel: "筋肉結晶 20時間化",
    unlock: (state) => state.prestigeLevel >= 7,
  },
  {
    id: "permanent-pump",
    name: "永久パンプ炉",
    description: "仕上げ直しとは別枠で、全体生産を底上げします。",
    cost: 10,
    effectLabel: "全体生産 +5%",
    unlock: (state) => state.prestigeLevel >= 10,
  },
];

const clampScore = (value: number) => Math.min(MAX_SCORE, Math.max(0, value));

const largeNumberUnits = [
  { value: 1e90, name: "novemvigintillion" },
  { value: 1e87, name: "octovigintillion" },
  { value: 1e84, name: "septenvigintillion" },
  { value: 1e81, name: "sexvigintillion" },
  { value: 1e78, name: "quinvigintillion" },
  { value: 1e75, name: "quattuorvigintillion" },
  { value: 1e72, name: "trevigintillion" },
  { value: 1e69, name: "duovigintillion" },
  { value: 1e66, name: "unvigintillion" },
  { value: 1e63, name: "vigintillion" },
  { value: 1e60, name: "novemdecillion" },
  { value: 1e57, name: "octodecillion" },
  { value: 1e54, name: "septendecillion" },
  { value: 1e51, name: "sexdecillion" },
  { value: 1e48, name: "quindecillion" },
  { value: 1e45, name: "quattuordecillion" },
  { value: 1e42, name: "tredecillion" },
  { value: 1e39, name: "duodecillion" },
  { value: 1e36, name: "undecillion" },
  { value: 1e33, name: "decillion" },
  { value: 1e30, name: "nonillion" },
  { value: 1e27, name: "octillion" },
  { value: 1e24, name: "septillion" },
  { value: 1e21, name: "sextillion" },
  { value: 1e18, name: "quintillion" },
  { value: 1e15, name: "quadrillion" },
  { value: 1e12, name: "trillion" },
  { value: 1e9, name: "billion" },
  { value: 1e6, name: "million" },
] as const;

const formatNumber = (value: number) => {
  const safeValue = Math.max(0, value);
  if (safeValue < 1_000_000) return Math.floor(safeValue).toLocaleString("ja-JP");

  const unit = largeNumberUnits.find((candidate) => safeValue >= candidate.value);
  if (!unit) return Math.floor(safeValue).toLocaleString("ja-JP");

  const scaled = safeValue / unit.value;
  const decimals = scaled >= 100 ? 1 : scaled >= 10 ? 2 : 3;
  return `${scaled.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unit.name}`;
};

const formatFullNumber = (value: number) => Math.floor(value).toLocaleString("ja-JP");

const japaneseNumberUnits = [
  { value: 1e16, name: "京" },
  { value: 1e12, name: "兆" },
  { value: 1e8, name: "億" },
  { value: 1e4, name: "万" },
] as const;

const formatJapaneseNumber = (value: number) => {
  const safeValue = Math.max(0, value);
  if (safeValue < 10_000) return Math.floor(safeValue).toLocaleString("ja-JP");

  const unit = japaneseNumberUnits.find((candidate) => safeValue >= candidate.value);
  if (!unit) return Math.floor(safeValue).toLocaleString("ja-JP");

  const scaled = safeValue / unit.value;
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${unit.name}`;
};

const formatDisplayNumber = (value: number, notation: NumberNotation) =>
  notation === "full" ? formatFullNumber(value) : notation === "japanese" ? formatJapaneseNumber(value) : formatNumber(value);

const useAnimatedNumber = (target: number) => {
  const [displayValue, setDisplayValue] = useState(target);
  const frameRef = useRef<number | null>(null);
  const previousTargetRef = useRef(target);

  useEffect(() => {
    const from = previousTargetRef.current;
    const to = target;
    previousTargetRef.current = target;

    if (!Number.isFinite(from) || !Number.isFinite(to) || Math.abs(to - from) < 0.001) {
      setDisplayValue(to);
      return;
    }

    const startedAt = performance.now();
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / NUMBER_ANIMATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target]);

  return displayValue;
};

const formatRate = (value: number) =>
  value >= 1_000_000
    ? formatNumber(value)
    : value < 100 && !Number.isInteger(value)
    ? value.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : Math.floor(value).toLocaleString("ja-JP");

const getUpgradeCost = (upgrade: Upgrade, level: number) => Math.ceil(upgrade.baseCost * upgrade.costRate ** level);

const hasLegacyUpgrade = (state: GameState, id: string) => state.legacyUpgrades.includes(id);

const getLegacySpent = (state: GameState) =>
  legacyUpgrades.reduce((total, legacy) => (state.legacyUpgrades.includes(legacy.id) ? total + legacy.cost : total), 0);

const getAvailableLegacyPoints = (state: GameState) => Math.max(0, state.prestigeLevel - getLegacySpent(state));

const getLegacyProductionMultiplier = (state: GameState) => (hasLegacyUpgrade(state, "permanent-pump") ? 1.05 : 1);

const getOfflineLimitSeconds = (state: GameState) =>
  OFFLINE_BASE_LIMIT_SECONDS + (hasLegacyUpgrade(state, "offline-coach") ? OFFLINE_LEGACY_BONUS_SECONDS : 0);

const getCrystalGrowMs = (state: GameState) => (hasLegacyUpgrade(state, "crystal-gym") ? 20 * 60 * 60 * 1000 : MUSCLE_CRYSTAL_GROW_MS);

const getGoldenSpawnMinMs = (state: GameState) =>
  hasLegacyUpgrade(state, "golden-beacon") ? GOLDEN_SPAWN_MIN_MS * 0.85 : GOLDEN_SPAWN_MIN_MS;

const getGoldenSpawnMaxMs = (state: GameState) =>
  hasLegacyUpgrade(state, "golden-beacon") ? GOLDEN_SPAWN_MAX_MS * 0.85 : GOLDEN_SPAWN_MAX_MS;

const getAscensionStartingMuscle = (state: GameState) => (hasLegacyUpgrade(state, "starter-dumbbell") ? LEGACY_STARTING_MUSCLE : 0);

const getBuildingLevelMultiplier = (state: GameState, key: UpgradeKey) =>
  Math.min(MAX_BUILDING_LEVEL_MULTIPLIER, 1 + (state.buildingLevels[key] ?? 0) * BUILDING_LEVEL_BONUS_RATE);

const getNextMuscleCrystalText = (timestamp: number) => {
  const remainingMs = timestamp - Date.now();
  if (remainingMs <= 0) return "収穫できます";

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes.toString().padStart(2, "0")}分`;
};

const getShortage = (muscle: number, cost: number) => Math.max(0, cost - muscle);

const getPurchaseProgress = (muscle: number, cost: number) => Math.min(100, Math.max(0, (muscle / cost) * 100));

const getUpgradeVisibleCount = (level: number) => Math.min(180, level);

const getActiveBuffs = (state: GameState) => state.activeBuffs.filter((buff) => buff.endAt > Date.now());

const getPrestigeMultiplier = (state: GameState) => Math.min(MAX_PRESTIGE_MULTIPLIER, 1 + state.prestigeLevel * PRESTIGE_BONUS_RATE);

const getFrenzyMultiplier = (state: GameState) =>
  getActiveBuffs(state).reduce((total, buff) => (buff.type === "frenzy" ? total * buff.multiplier : total), 1);

const getBuildingFrenzyMultiplier = (state: GameState, key: UpgradeKey) =>
  getActiveBuffs(state).reduce(
    (total, buff) => (buff.type === "buildingFrenzy" && (!buff.target || buff.target === key) ? total * buff.multiplier : total),
    1
  );

const getClickFrenzyMultiplier = (state: GameState) =>
  getActiveBuffs(state).reduce((total, buff) => (buff.type === "clickFrenzy" ? total * buff.multiplier : total), 1);

const getPendingPrestige = (state: GameState) =>
  Math.max(0, Math.floor(Math.cbrt(state.totalMuscle / PRESTIGE_REQUIREMENT)) - state.prestigeLevel);

const upsertBuff = (buffs: ActiveBuff[], nextBuff: ActiveBuff) => [
  ...buffs.filter((buff) => buff.type !== nextBuff.type && buff.endAt > Date.now()),
  nextBuff,
];

const getSeasonalEvent = (date = new Date()): SeasonalEvent => {
  const month = date.getMonth() + 1;
  if (month === 12 || month <= 2) {
    return {
      id: "winter",
      name: "冬の増量期",
      description: "食べて鍛える季節。全体生産が少し上がります。",
      multiplier: 1.08,
      icon: "WIN",
      bonusLabel: "全体生産 +8%",
    };
  }
  if (month >= 3 && month <= 5) {
    return {
      id: "spring",
      name: "春の入会キャンペーン",
      description: "新規トレーニーが増える季節。設備生産が少し上がります。",
      multiplier: 1.05,
      icon: "SPR",
      bonusLabel: "全体生産 +5%",
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      id: "summer",
      name: "夏の仕上げ期",
      description: "絞りの季節。クリック効率と生産が少し上がります。",
      multiplier: 1.07,
      icon: "SUM",
      bonusLabel: "全体生産 +7%",
    };
  }
  return {
    id: "autumn",
    name: "秋のバルク期",
    description: "じっくり重量を伸ばす季節。全体生産が少し上がります。",
    multiplier: 1.06,
    icon: "AUT",
    bonusLabel: "全体生産 +6%",
  };
};

const mobilePanels: { key: MobilePanel; label: string }[] = [
  { key: "click", label: "クリック" },
  { key: "shop", label: "ショップ" },
  { key: "gym", label: "ジム" },
  { key: "stats", label: "統計" },
];

const desktopDetailPanels: { key: DesktopDetailPanel; label: string; description: string }[] = [
  { key: "overview", label: "概要", description: "今見るべき進行状況" },
  { key: "achievements", label: "実績", description: "解除状況とシェイク" },
  { key: "legacy", label: "遺産", description: "仕上げ直しの恒久強化" },
  { key: "levels", label: "設備Lv", description: "筋肉結晶で設備強化" },
  { key: "save", label: "保存", description: "表示設定とセーブ" },
  { key: "benchmarks", label: "検証", description: "難易度調整用データ" },
];

const soundFiles: Record<SoundType, string> = {
  click: "/sounds/macho-clicker/click.wav",
  buy: "/sounds/macho-clicker/buy.wav",
  blocked: "/sounds/macho-clicker/blocked.wav",
  golden: "/sounds/macho-clicker/golden.wav",
};

const goldenEffects: GoldenEffect[] = [
  { id: "lucky", weight: 45 },
  { id: "frenzy", weight: 30 },
  { id: "clickFrenzy", weight: 14 },
  {
    id: "buildingFrenzy",
    weight: 9,
    unlock: (state) => getOwnedUpgradeCount(state.upgrades) >= 20 && getPerSecond(state) >= 10,
  },
  {
    id: "jackpot",
    weight: 2,
    unlock: (state) => state.totalMuscle >= 1_000_000 && getPerSecond(state) >= 100,
  },
];

const pickGoldenEffect = (state: GameState) => {
  const availableEffects = goldenEffects.filter((effect) => !effect.unlock || effect.unlock(state));
  const totalWeight = availableEffects.reduce((total, effect) => total + effect.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const effect of availableEffects) {
    roll -= effect.weight;
    if (roll <= 0) return effect.id;
  }

  return availableEffects[0]?.id ?? "lucky";
};

const getDumbbellOrbitItems = (count: number) => {
  const ringCapacities = [18, 28, 40, 54, 72, 96];
  const items: { index: number; angle: number; radius: string; size: number }[] = [];
  let remaining = Math.min(308, count);
  let indexOffset = 0;

  for (let ringIndex = 0; ringIndex < ringCapacities.length && remaining > 0; ringIndex += 1) {
    const ringCount = Math.min(ringCapacities[ringIndex], remaining);
    const maxRadius = 15.5 + ringIndex * 2.05;
    const viewportRadius = 31 + ringIndex * 5;
    const radius = `clamp(${maxRadius - 1.6}rem, ${viewportRadius}vw, ${maxRadius}rem)`;
    const size = ringIndex < 2 ? 42 : 34;

    for (let index = 0; index < ringCount; index += 1) {
      items.push({
        index: indexOffset + index,
        angle: (360 / ringCapacities[ringIndex]) * index - 90,
        radius,
        size,
      });
    }

    indexOffset += ringCount;
    remaining -= ringCount;
  }

  return items;
};

const getClickPower = (state: GameState, pendingPowerUp?: PowerUpgrade) => {
  const baseClick = powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total + (powerUp.clickBonus ?? 0);
  }, 1);
  const clickMultiplier = powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.clickMultiplier ?? 1);
  }, 1);
  const cpsClickBonus = powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total + getPerSecond(state) * (powerUp.clickCpsPercent ?? 0);
  }, 0);

  const currentClick = (baseClick * clickMultiplier + cpsClickBonus) * getClickFrenzyMultiplier(state);
  if (!pendingPowerUp || state.purchasedPowerUps.includes(pendingPowerUp.id)) return currentClick;

  const pendingBase = baseClick + (pendingPowerUp.clickBonus ?? 0);
  const pendingMultiplier = clickMultiplier * (pendingPowerUp.clickMultiplier ?? 1);
  const pendingCpsBonus = cpsClickBonus + getPerSecond(state) * (pendingPowerUp.clickCpsPercent ?? 0);

  return (pendingBase * pendingMultiplier + pendingCpsBonus) * getClickFrenzyMultiplier(state);
};

const getBuildingMultiplier = (state: GameState, key: UpgradeKey) =>
  powerUpgrades.reduce((total, powerUp) => {
    if (powerUp.target !== key || !state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.buildingMultiplier ?? 1);
  }, 1);

const getBuildingMultiplierWithPendingPowerUp = (state: GameState, key: UpgradeKey, pendingPowerUp?: PowerUpgrade) => {
  const currentMultiplier = getBuildingMultiplier(state, key);
  if (!pendingPowerUp || pendingPowerUp.target !== key || state.purchasedPowerUps.includes(pendingPowerUp.id)) {
    return currentMultiplier;
  }

  return currentMultiplier * (pendingPowerUp.buildingMultiplier ?? 1);
};

const getBuildingUnitProduction = (state: GameState, upgrade: Upgrade, pendingPowerUp?: PowerUpgrade) =>
  (upgrade.perSecondBonus ?? 0) *
  getBuildingMultiplierWithPendingPowerUp(state, upgrade.key, pendingPowerUp) *
  getBuildingLevelMultiplier(state, upgrade.key) *
  getBuildingFrenzyMultiplier(state, upgrade.key);

const getBuildingTotalProduction = (state: GameState, upgrade: Upgrade, pendingPowerUp?: PowerUpgrade) =>
  getBuildingUnitProduction(state, upgrade, pendingPowerUp) * state.upgrades[upgrade.key];

const getGoldenMultiplier = (state: GameState) =>
  powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.goldenMultiplier ?? 1);
  }, 1);

const getProteinShakeLevel = (unlockedAchievementCount: number) => Math.min(100, Math.floor(unlockedAchievementCount / 5) * 5);

const getProteinShakeName = (unlockedAchievementCount: number) => {
  if (unlockedAchievementCount >= 100) return "神域プロテインシェイク";
  if (unlockedAchievementCount >= 75) return "極濃プロテインシェイク";
  if (unlockedAchievementCount >= 50) return "ゴリマッチョシェイク";
  if (unlockedAchievementCount >= 25) return "濃厚プロテインシェイク";
  if (unlockedAchievementCount >= 10) return "初心者プロテインシェイク";
  return "水";
};

const getAchievementSupportMultiplier = (state: GameState) => {
  const supportRate = powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total + (powerUp.achievementSupportRate ?? 0);
  }, 0);

  return Math.min(MAX_ACHIEVEMENT_SUPPORT_MULTIPLIER, 1 + state.unlockedAchievements.length * supportRate);
};

const getBasePerSecond = (state: GameState) =>
  upgrades.reduce((total, upgrade) => total + getBuildingUnitProduction(state, upgrade) * state.upgrades[upgrade.key], 0);

const getPerSecond = (state: GameState) =>
  getBasePerSecond(state) *
  getPrestigeMultiplier(state) *
  getLegacyProductionMultiplier(state) *
  getFrenzyMultiplier(state) *
  getAchievementSupportMultiplier(state) *
  getSeasonalEvent().multiplier;

const createBenchmarkState = (): GameState => ({
  ...initialState,
  upgrades: { ...emptyUpgrades },
  lastSavedAt: Date.now(),
});

const buyAffordableBenchmarkBuildings = (state: GameState) => {
  let simulated = state;
  let purchased = true;

  while (purchased) {
    purchased = false;
    const nextUpgrade = [...upgrades]
      .reverse()
      .find((upgrade) => simulated.muscle >= getUpgradeCost(upgrade, simulated.upgrades[upgrade.key]));

    if (!nextUpgrade) continue;

    const cost = getUpgradeCost(nextUpgrade, simulated.upgrades[nextUpgrade.key]);
    simulated = {
      ...simulated,
      muscle: clampScore(simulated.muscle - cost),
      upgrades: {
        ...simulated.upgrades,
        [nextUpgrade.key]: simulated.upgrades[nextUpgrade.key] + 1,
      },
    };
    purchased = true;
  }

  return simulated;
};

const advanceBenchmarkSecond = (state: GameState, clicksPerSecond = BALANCE_CLICKS_PER_SECOND) => {
  const clickGain = getClickPower(state) * clicksPerSecond;
  const passiveGain = getPerSecond(state);
  const nextState = {
    ...state,
    muscle: clampScore(state.muscle + clickGain + passiveGain),
    totalMuscle: clampScore(state.totalMuscle + clickGain + passiveGain),
    handMadeMuscle: clampScore(state.handMadeMuscle + clickGain),
    clickCount: state.clickCount + clicksPerSecond,
  };

  return buyAffordableBenchmarkBuildings(nextState);
};

const simulateBalanceBenchmark = (minutes: number, clicksPerSecond = BALANCE_CLICKS_PER_SECOND): BalanceBenchmark => {
  let simulated = createBenchmarkState();
  const seconds = minutes * 60;

  for (let second = 0; second < seconds; second += 1) {
    simulated = advanceBenchmarkSecond(simulated, clicksPerSecond);
  }

  return {
    minutes,
    muscle: simulated.muscle,
    perSecond: getPerSecond(simulated),
    upgrades: simulated.upgrades,
  };
};

const balanceBenchmarks = [5, 10, 30, 60].map((minutes) => simulateBalanceBenchmark(minutes));

const getOwnedUpgradeCount = (upgradeCounts: Record<UpgradeKey, number>) =>
  Object.values(upgradeCounts).reduce((total, level) => total + level, 0);

const simulateBuildingCountCheckpoints = (): BuildingCountCheckpoint[] => {
  let simulated = createBenchmarkState();
  const reached = new Map<number, BuildingCountCheckpoint>();
  const maxSeconds = BALANCE_MAX_MINUTES * 60;

  for (let second = 0; second <= maxSeconds; second += 1) {
    if (second > 0) {
      simulated = advanceBenchmarkSecond(simulated);
    }

    const owned = getOwnedUpgradeCount(simulated.upgrades);
    for (const checkpoint of BUILDING_COUNT_CHECKPOINTS) {
      if (owned >= checkpoint && !reached.has(checkpoint)) {
        reached.set(checkpoint, {
          owned: checkpoint,
          minute: Math.round((second / 60) * 10) / 10,
          perSecond: getPerSecond(simulated),
        });
      }
    }

    if (reached.size === BUILDING_COUNT_CHECKPOINTS.length) break;
  }

  return BUILDING_COUNT_CHECKPOINTS.map(
    (checkpoint) =>
      reached.get(checkpoint) ?? {
        owned: checkpoint,
        minute: null,
        perSecond: getPerSecond(simulated),
      }
  );
};

const buildingCountCheckpoints = simulateBuildingCountCheckpoints();

const getCookieBenchmarkTarget = (minutes: number) =>
  cookieStyleBenchmarkTargets.find((target) => target.minutes === minutes);

const getRangeStatus = (value: number, [min, max]: [number, number]) => {
  if (value < min) return "遅め";
  if (value > max) return "速め";
  return "目安内";
};

const getTitle = (totalMuscle: number) => {
  if (totalMuscle >= 1_000_000_000_000) return "伝説のマチョ田";
  if (totalMuscle >= 100_000_000_000) return "宇宙マチョ";
  if (totalMuscle >= 1_000_000_000) return "神域トレーニー";
  if (totalMuscle >= 100_000_000) return "歩くパワーラック";
  if (totalMuscle >= 10_000_000) return "マチョ神";
  if (totalMuscle >= 1_000_000) return "マチョ田級";
  if (totalMuscle >= 250_000) return "ゴリマッチョ";
  if (totalMuscle >= 50_000) return "細マッチョ";
  if (totalMuscle >= 5_000) return "筋トレ中級者";
  if (totalMuscle >= 500) return "初心者トレーニー";
  return "入会したて";
};

const getNextTitleGoal = (totalMuscle: number) => {
  const goals = [
    { title: "初心者トレーニー", value: 500 },
    { title: "筋トレ中級者", value: 5_000 },
    { title: "細マッチョ", value: 50_000 },
    { title: "ゴリマッチョ", value: 250_000 },
    { title: "マチョ田級", value: 1_000_000 },
    { title: "マチョ神", value: 10_000_000 },
    { title: "歩くパワーラック", value: 100_000_000 },
    { title: "神域トレーニー", value: 1_000_000_000 },
    { title: "宇宙マチョ", value: 100_000_000_000 },
    { title: "伝説のマチョ田", value: 1_000_000_000_000 },
  ];
  return goals.find((goal) => totalMuscle < goal.value) ?? goals[goals.length - 1];
};

const getBodyPartProgress = (state: GameState): BodyPartProgress[] =>
  bodyPartDefinitions.map((part) => {
    const rawScore = part.mainUpgrades.reduce((total, key, index) => {
      const countScore = state.upgrades[key] * (index === 0 ? 1 : 1.35);
      const levelScore = (state.buildingLevels[key] ?? 0) * 3;
      return total + countScore + levelScore;
    }, 0);
    const titleScore = Math.log10(Math.max(1, state.totalMuscle)) * 2;
    const score = rawScore + titleScore;
    const level = Math.max(1, Math.min(10, Math.floor(score / 18) + 1));
    const progress = Math.min(100, Math.max(0, ((score % 18) / 18) * 100));

    return {
      ...part,
      level,
      progress,
    };
  });

const getBodyStage = (totalMuscle: number) => {
  if (totalMuscle >= 1_000_000) {
    return {
      label: "完成形マチョ",
      ring: "border-red-100 bg-[#FF8A23]",
      scale: 1.18,
      aura: "opacity-90",
    };
  }
  if (totalMuscle >= 250_000) {
    return {
      label: "ゴリマッチョ化",
      ring: "border-orange-100 bg-[#FF9D2E]",
      scale: 1.1,
      aura: "opacity-75",
    };
  }
  if (totalMuscle >= 50_000) {
    return {
      label: "細マッチョ化",
      ring: "border-white/80 bg-[#FFB45D]",
      scale: 1,
      aura: "opacity-55",
    };
  }
  if (totalMuscle >= 5_000) {
    return {
      label: "筋トレ継続中",
      ring: "border-white/70 bg-[#FFC46F]",
      scale: 0.95,
      aura: "opacity-40",
    };
  }
  if (totalMuscle >= 500) {
    return {
      label: "初心者トレーニー",
      ring: "border-white/70 bg-[#FFD89A]",
      scale: 0.9,
      aura: "opacity-25",
    };
  }
  return {
    label: "ひょろひょろ期",
    ring: "border-white/60 bg-[#FFE7C2]",
    scale: 0.75,
    aura: "opacity-10",
  };
};

const getNewsLines = (state: GameState, title: string, perSecond: number) => {
  const seasonalEvent = getSeasonalEvent();
  const lines = [
    "ジムの片隅で謎のクリック音が鳴り響いています。",
    "マチョ田、今日も腹筋ローラーを抱えて登場。",
    `${title} が街で少しずつ噂になっています。`,
    `現在の自動筋トレ効率は毎秒 ${formatRate(perSecond)} 筋肉です。`,
    `${seasonalEvent.name} 開催中。${seasonalEvent.description}`,
    "速報: プロテイン工房の在庫がなぜか爆発的に増えています。",
    "近所のトレーニーが、マチョ田のクリック音で目を覚ましました。",
    "筋肉ポイント市場は今日も強気です。",
    "専門家は『腹筋ローラーは裏切らない』とコメントしています。",
    "ジムの床が少しずつ強化されています。",
  ];

  if (state.totalMuscle >= 50_000) lines.push("近所のジムで『あの人、仕上がってない？』という声が増えています。");
  if (state.totalMuscle >= 1_000_000) lines.push("マチョ田級の肉体が完成しつつあります。もはや歩くパワーラックです。");
  if (state.totalMuscle >= 1_000_000_000) lines.push("筋肉ポイントが billion に到達。街のジムがざわついています。");
  if (state.totalMuscle >= 1_000_000_000_000) lines.push("筋肉ポイントが trillion に到達。もはや単位が現実離れしています。");
  if (state.prestigeLevel > 0) lines.push(`仕上げ直しの効果で永久倍率が +${state.prestigeLevel}% になっています。`);
  if (state.activeBuffs.length > 0) lines.push("ゴールデン効果発動中。今すぐクリックする価値があります。");
  if (seasonalEvent.id === "winter") lines.push("冬の増量期。食べて鍛えて、筋肉ポイントの土台を作る時期です。");
  if (seasonalEvent.id === "spring") lines.push("春の入会キャンペーンで、ジムに新しいトレーニーが増えています。");
  if (seasonalEvent.id === "summer") lines.push("夏の仕上げ期。クリックにも少し気合いが入っています。");
  if (seasonalEvent.id === "autumn") lines.push("秋のバルク期。重量を伸ばすにはちょうどいい季節です。");
  if (state.upgrades.finalMacho > 0) lines.push("マチョ田本人が稼働開始。ゲームの概念が少し壊れました。");
  if (Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 10) {
    lines.push("強化メニューの購入履歴が完全に筋トレ沼です。");
  }
  if (Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 100) {
    lines.push("設備数100突破。これはもうジムではなく筋肉都市です。");
  }

  return lines;
};

const getPowerUpgradeSummary = (powerUp: PowerUpgrade, state: GameState) => {
  if (powerUp.clickBonus || powerUp.clickMultiplier || powerUp.clickCpsPercent) {
    const before = getClickPower(state);
    const after = getClickPower(state, powerUp);
    return `クリック +${formatRate(Math.max(0, after - before))}`;
  }

  if (powerUp.target) {
    const target = upgrades.find((upgrade) => upgrade.key === powerUp.target);
    if (!target) return powerUp.effectLabel;

    const before = getBuildingTotalProduction(state, target);
    const after = getBuildingTotalProduction(state, target, powerUp);
    const increase = Math.max(0, after - before);

    return `${target.name} +${formatRate(increase)}/秒`;
  }

  if (powerUp.goldenMultiplier) {
    return `ゴールデンプロテイン x${powerUp.goldenMultiplier}`;
  }

  if (powerUp.achievementSupportRate) {
    const bonus = state.unlockedAchievements.length * powerUp.achievementSupportRate * 100;
    return `実績ボーナス +${bonus.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
  }

  return powerUp.effectLabel;
};

const getNextShopGoal = (state: GameState) =>
  upgrades
    .map((upgrade) => ({
      upgrade,
      cost: getUpgradeCost(upgrade, state.upgrades[upgrade.key]),
    }))
    .filter((item) => item.cost > state.muscle)
    .sort((a, b) => a.cost - b.cost)[0] ?? null;

const BuildingProductionDetails = ({
  state,
  upgrade,
}: {
  state: GameState;
  upgrade: Upgrade;
}) => {
  const owned = state.upgrades[upgrade.key];
  const buildingLevel = state.buildingLevels[upgrade.key];
  const levelMultiplier = getBuildingLevelMultiplier(state, upgrade.key);
  const unitProduction = getBuildingUnitProduction(state, upgrade);
  const totalProduction = getBuildingTotalProduction(state, upgrade);
  const nextTotalProduction = totalProduction + unitProduction;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
      <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
        次の価格<br />{formatNumber(getUpgradeCost(upgrade, owned))}
      </div>
      <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
        1個あたり<br />+{formatRate(unitProduction)}/秒
      </div>
      <div className="col-span-2 rounded-xl bg-[#FFE7C2] px-3 py-2">
        合計生産<br />+{formatRate(totalProduction)}/秒
      </div>
      <div className="col-span-2 rounded-xl bg-[#FFE7C2] px-3 py-2">
        設備レベル<br />Lv.{buildingLevel} / x{levelMultiplier.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
      </div>
      <div className="col-span-2 rounded-xl bg-[#7C2D12] px-3 py-2 text-white">
        次に買うと +{formatRate(unitProduction)}/秒、合計 +{formatRate(nextTotalProduction)}/秒
      </div>
    </div>
  );
};

const PowerUpgradeDetails = ({ state, powerUp }: { state: GameState; powerUp: PowerUpgrade }) => {
  if (powerUp.target) {
    const target = upgrades.find((upgrade) => upgrade.key === powerUp.target);
    if (target) {
      const before = getBuildingTotalProduction(state, target);
      const after = getBuildingTotalProduction(state, target, powerUp);
      const increase = Math.max(0, after - before);

      return (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
          <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
            現在<br />+{formatRate(before)}/秒
          </div>
          <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
            購入後<br />+{formatRate(after)}/秒
          </div>
          <div className="col-span-2 rounded-xl bg-[#7C2D12] px-3 py-2 text-white">
            このアップグレードで +{formatRate(increase)}/秒
          </div>
        </div>
      );
    }
  }

  if (powerUp.clickBonus || powerUp.clickMultiplier || powerUp.clickCpsPercent) {
    const currentClick = getClickPower(state);
    const nextClick = getClickPower(state, powerUp);
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          現在クリック<br />+{formatRate(currentClick)}
        </div>
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          購入後<br />+{formatRate(nextClick)}
        </div>
      </div>
    );
  }

  if (powerUp.achievementSupportRate) {
    const currentMultiplier = getAchievementSupportMultiplier(state);
    const nextMultiplier = currentMultiplier + state.unlockedAchievements.length * powerUp.achievementSupportRate;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          現在倍率<br />x{currentMultiplier.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}
        </div>
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          購入後<br />x{nextMultiplier.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-[#FFE7C2] px-3 py-2 text-xs font-black">
      効果: {powerUp.effectLabel}
    </div>
  );
};

const normalizeSavedUpgrades = (value?: Partial<Record<UpgradeKey, number>>) => ({
  ...emptyUpgrades,
  ...Object.fromEntries(
    upgrades.map((upgrade) => [upgrade.key, Math.max(0, Math.floor(value?.[upgrade.key] ?? 0))])
  ),
});

const normalizeSavedBuildingLevels = (value?: Partial<Record<UpgradeKey, number>>) => ({
  ...emptyBuildingLevels,
  ...Object.fromEntries(
    upgrades.map((upgrade) => [upgrade.key, Math.max(0, Math.floor(value?.[upgrade.key] ?? 0))])
  ),
});

const normalizeGoldenHistory = (value?: GoldenHistoryEntry[]) =>
  Array.isArray(value)
    ? value
        .filter(
          (entry): entry is GoldenHistoryEntry =>
            typeof entry?.id === "string" &&
            typeof entry.name === "string" &&
            typeof entry.detail === "string" &&
            typeof entry.createdAt === "number"
        )
        .slice(0, GOLDEN_HISTORY_LIMIT)
    : [];

const normalizeLegacyUpgrades = (value?: string[]) =>
  Array.isArray(value)
    ? value.filter((id) => legacyUpgrades.some((legacy) => legacy.id === id))
    : [];

const readSavedState = (): GameState => {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState, lastSavedAt: Date.now() };

    const saved = JSON.parse(raw) as Partial<GameState>;
    const normalized: GameState = {
      muscle: typeof saved.muscle === "number" ? clampScore(saved.muscle) : 0,
      totalMuscle: typeof saved.totalMuscle === "number" ? clampScore(saved.totalMuscle) : 0,
      handMadeMuscle: typeof saved.handMadeMuscle === "number" ? clampScore(saved.handMadeMuscle) : 0,
      clickCount: typeof saved.clickCount === "number" ? Math.max(0, Math.floor(saved.clickCount)) : 0,
      upgrades: normalizeSavedUpgrades(saved.upgrades),
      buildingLevels: normalizeSavedBuildingLevels(saved.buildingLevels),
      muscleCrystals: typeof saved.muscleCrystals === "number" ? Math.max(0, Math.floor(saved.muscleCrystals)) : 0,
      nextMuscleCrystalAt:
        typeof saved.nextMuscleCrystalAt === "number" ? saved.nextMuscleCrystalAt : Date.now() + MUSCLE_CRYSTAL_GROW_MS,
      goldenClicks: typeof saved.goldenClicks === "number" ? Math.max(0, Math.floor(saved.goldenClicks)) : 0,
      goldenHistory: normalizeGoldenHistory(saved.goldenHistory),
      legacyUpgrades: normalizeLegacyUpgrades(saved.legacyUpgrades),
      purchasedPowerUps: Array.isArray(saved.purchasedPowerUps)
        ? saved.purchasedPowerUps.filter((id): id is string => typeof id === "string")
        : [],
      activeBuffs: Array.isArray(saved.activeBuffs)
        ? saved.activeBuffs.filter(
            (buff): buff is ActiveBuff =>
              typeof buff?.id === "string" &&
              (buff.type === "frenzy" || buff.type === "clickFrenzy" || buff.type === "buildingFrenzy") &&
              typeof buff.name === "string" &&
              typeof buff.multiplier === "number" &&
              typeof buff.endAt === "number" &&
              buff.endAt > Date.now()
          )
        : [],
      prestigeLevel: typeof saved.prestigeLevel === "number" ? Math.max(0, Math.floor(saved.prestigeLevel)) : 0,
      ascensionCount: typeof saved.ascensionCount === "number" ? Math.max(0, Math.floor(saved.ascensionCount)) : 0,
      lastSavedAt: typeof saved.lastSavedAt === "number" ? saved.lastSavedAt : Date.now(),
      unlockedAchievements: Array.isArray(saved.unlockedAchievements) ? saved.unlockedAchievements : [],
    };

    const offlineSeconds = Math.min(
      getOfflineLimitSeconds(normalized),
      Math.max(0, Math.floor((Date.now() - normalized.lastSavedAt) / 1000))
    );
    const offlineGain = getPerSecond(normalized) * offlineSeconds;

    return {
      ...normalized,
      muscle: clampScore(normalized.muscle + offlineGain),
      totalMuscle: clampScore(normalized.totalMuscle + offlineGain),
      lastSavedAt: Date.now(),
    };
  } catch {
    return { ...initialState, lastSavedAt: Date.now() };
  }
};

export function MachoClickerPage() {
  const [state, setState] = useState<GameState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nickname, setNickname] = useState("");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingMessage, setRankingMessage] = useState("");
  const [floatingGains, setFloatingGains] = useState<FloatingGain[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastClickAt, setLastClickAt] = useState(0);
  const [clickBurst, setClickBurst] = useState(false);
  const [purchaseFlash, setPurchaseFlash] = useState<string | null>(null);
  const [purchasePulse, setPurchasePulse] = useState(false);
  const [purchaseFlights, setPurchaseFlights] = useState<PurchaseFlight[]>([]);
  const [recentlyPurchasedPowerUpId, setRecentlyPurchasedPowerUpId] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [goldenProtein, setGoldenProtein] = useState<GoldenProtein | null>(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const [hoveredGymUpgradeKey, setHoveredGymUpgradeKey] = useState<UpgradeKey | null>(null);
  const [hoveredShopUpgradeKey, setHoveredShopUpgradeKey] = useState<UpgradeKey | null>(null);
  const [hoveredPowerUpId, setHoveredPowerUpId] = useState<string | null>(null);
  const [selectedOwnedPowerUpId, setSelectedOwnedPowerUpId] = useState<string | null>(null);
  const [hoveredMysteryId, setHoveredMysteryId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [recentlyPurchasedKey, setRecentlyPurchasedKey] = useState<UpgradeKey | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("click");
  const [desktopDetailPanel, setDesktopDetailPanel] = useState<DesktopDetailPanel>("overview");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [numberNotation, setNumberNotation] = useState<NumberNotation>("short");
  const [reducedEffects, setReducedEffects] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const effectIdRef = useRef(0);
  const stateRef = useRef<GameState>(initialState);
  const lastTickAtRef = useRef(Date.now());
  const soundRefs = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});
  const clickPower = useMemo(() => getClickPower(state), [state]);
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const basePerSecond = useMemo(() => getBasePerSecond(state), [state]);
  const activeBuffs = getActiveBuffs(state);
  const activeBuildingFrenzyTargets = activeBuffs.flatMap((buff) =>
    buff.type === "buildingFrenzy" && buff.target ? [buff.target] : []
  );
  const pendingPrestige = getPendingPrestige(state);
  const seasonalEvent = getSeasonalEvent();
  const proteinShakeLevel = getProteinShakeLevel(state.unlockedAchievements.length);
  const proteinShakeName = getProteinShakeName(state.unlockedAchievements.length);
  const achievementSupportMultiplier = getAchievementSupportMultiplier(state);
  const title = getTitle(state.totalMuscle);
  const nextGoal = getNextTitleGoal(state.totalMuscle);
  const bodyPartProgress = useMemo(() => getBodyPartProgress(state), [state]);
  const bodyPartAverageLevel = Math.round(
    bodyPartProgress.reduce((total, part) => total + part.level, 0) / Math.max(1, bodyPartProgress.length)
  );
  const titleProgress = Math.min(100, Math.max(0, (state.totalMuscle / nextGoal.value) * 100));
  const ownedUpgradeCount = Object.values(state.upgrades).reduce((total, level) => total + level, 0);
  const totalBuildingLevel = Object.values(state.buildingLevels).reduce((total, level) => total + level, 0);
  const visualOwnedUpgradeCount = visualUpgrades.reduce((total, upgrade) => total + state.upgrades[upgrade.key], 0);
  const newsLines = getNewsLines(state, title, perSecond);
  const news = newsLines[newsIndex % newsLines.length];
  const bodyStage = getBodyStage(state.totalMuscle);
  const dumbbellOrbitItems = useMemo(() => getDumbbellOrbitItems(state.upgrades.pushUp), [state.upgrades.pushUp]);
  const visibleAmbientItems = useMemo(() => {
    if (reducedEffects) return [];

    const count =
      state.totalMuscle >= 100_000_000
        ? ambientItems.length
        : state.totalMuscle >= 1_000_000
        ? 6
        : state.totalMuscle >= 50_000
        ? 5
        : 4;

    return ambientItems.slice(0, count);
  }, [reducedEffects, state.totalMuscle]);
  const hoveredGymUpgrade = hoveredGymUpgradeKey ? upgrades.find((upgrade) => upgrade.key === hoveredGymUpgradeKey) ?? null : null;
  const hoveredShopUpgrade = hoveredShopUpgradeKey ? upgrades.find((upgrade) => upgrade.key === hoveredShopUpgradeKey) ?? null : null;
  const hoveredPowerUp = hoveredPowerUpId ? powerUpgrades.find((powerUp) => powerUp.id === hoveredPowerUpId) ?? null : null;
  const selectedOwnedPowerUp = selectedOwnedPowerUpId
    ? powerUpgrades.find((powerUp) => powerUp.id === selectedOwnedPowerUpId) ?? null
    : null;
  const hoveredMystery = hoveredMysteryId ? mysteryShopItems.find((item) => item.id === hoveredMysteryId) ?? null : null;
  const unlockedPowerUps = powerUpgrades.filter(
    (powerUp) => powerUp.unlock(state) && !state.purchasedPowerUps.includes(powerUp.id)
  );
  const purchasedPowerUps = powerUpgrades.filter((powerUp) => state.purchasedPowerUps.includes(powerUp.id));
  const recentPurchasedPowerUps = purchasedPowerUps.slice(-6).reverse();
  const hiddenPurchasedPowerUpCount = Math.max(0, purchasedPowerUps.length - recentPurchasedPowerUps.length);
  const displayNumber = (value: number) => formatDisplayNumber(value, numberNotation);
  const animatedMuscle = useAnimatedNumber(state.muscle);
  const animatedPerSecond = useAnimatedNumber(perSecond);
  const animatedClickPower = useAnimatedNumber(clickPower);
  const nextShopGoal = getNextShopGoal(state);
  const canHarvestMuscleCrystal = state.nextMuscleCrystalAt <= Date.now();
  const availableLegacyPoints = getAvailableLegacyPoints(state);
  const goldenSpawnMinMs = getGoldenSpawnMinMs(state);
  const goldenSpawnMaxMs = getGoldenSpawnMaxMs(state);
  const achievementCategoryCounts = achievementCategories.map((category) => ({
    category,
    icon: achievementCategoryIcons[category],
    unlocked: achievements.filter(
      (achievement) => (achievement.category ?? "隠し") === category && state.unlockedAchievements.includes(achievement.key)
    ).length,
    total: achievements.filter((achievement) => (achievement.category ?? "隠し") === category).length,
  }));
  const purchasedSupportPowerUps = purchasedPowerUps.filter((powerUp) => powerUp.achievementSupportRate);
  const tooltipStyle: CSSProperties = {
    left: Math.max(16, tooltipPosition.x - 360),
    top: Math.max(96, tooltipPosition.y - 28),
  };

  useEffect(() => {
    setState(readSavedState());
    lastTickAtRef.current = Date.now();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sounds = Object.fromEntries(
      Object.entries(soundFiles).map(([type, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = type === "click" ? 0.8 : 0.72;
        return [type, audio];
      })
    ) as Record<SoundType, HTMLAudioElement>;

    soundRefs.current = sounds;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNewsIndex((current) => current + 1);
    }, NEWS_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setInterval(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
    }, SAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const timer = window.setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.max(0, (now - lastTickAtRef.current) / 1000);
      lastTickAtRef.current = now;
      const gain = perSecond * deltaSeconds;
      setState((current) => ({
        ...current,
        muscle: clampScore(current.muscle + gain),
        totalMuscle: clampScore(current.totalMuscle + gain),
        activeBuffs: getActiveBuffs(current),
        lastSavedAt: now,
      }));
    }, GAME_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isLoaded, perSecond]);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const response = await fetch("/api/macho-clicker/rankings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items?: RankingEntry[] };
        setRankings(data.items ?? []);
      } catch (error) {
        console.error("Failed to load macho clicker rankings", error);
      }
    };

    loadRankings();
  }, []);

  useEffect(() => {
    let hideTimer: number | null = null;
    let spawnTimer: number | null = null;

    const spawn = () => {
      setGoldenProtein({
        id: Date.now(),
        x: 12 + Math.random() * 76,
        y: 14 + Math.random() * 62,
      });
      hideTimer = window.setTimeout(() => setGoldenProtein(null), GOLDEN_LIFETIME_MS);
      scheduleNext();
    };

    const scheduleNext = () => {
      const delay = goldenSpawnMinMs + Math.random() * (goldenSpawnMaxMs - goldenSpawnMinMs);
      spawnTimer = window.setTimeout(spawn, delay);
    };

    scheduleNext();

    return () => {
      if (hideTimer !== null) window.clearTimeout(hideTimer);
      if (spawnTimer !== null) window.clearTimeout(spawnTimer);
    };
  }, [goldenSpawnMaxMs, goldenSpawnMinMs]);

  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      (achievement) => !state.unlockedAchievements.includes(achievement.key) && achievement.isUnlocked(state)
    );

    if (newlyUnlocked.length === 0) return;

    setState((current) => ({
      ...current,
      unlockedAchievements: [
        ...current.unlockedAchievements,
        ...newlyUnlocked
          .filter((achievement) => !current.unlockedAchievements.includes(achievement.key))
          .map((achievement) => achievement.key),
      ],
    }));
    setAchievementToast(newlyUnlocked[0]);
    if (soundEnabled) {
      const audio = soundRefs.current.buy;
      if (audio) {
        const sound = audio.cloneNode(true) as HTMLAudioElement;
        sound.volume = audio.volume;
        void sound.play();
      }
    }
    window.setTimeout(() => setAchievementToast(null), 3200);
  }, [state, soundEnabled]);

  const spawnClickEffects = (value: number) => {
    const baseId = effectIdRef.current;
    effectIdRef.current += 8;
    setFloatingGains((current) => [
      ...current,
      {
        id: baseId,
        x: 36 + Math.random() * 28,
        y: 26 + Math.random() * 30,
        value,
      },
    ]);
    setSparks((current) => [
      ...current,
      ...Array.from({ length: reducedEffects ? 0 : 7 }, (_, index) => ({
        id: baseId + index + 1,
        x: 20 + Math.random() * 60,
        y: 18 + Math.random() * 62,
        size: 6 + Math.random() * 10,
        rotate: Math.random() * 360,
      })),
    ]);
    window.setTimeout(() => setFloatingGains((current) => current.filter((item) => item.id !== baseId)), 950);
    window.setTimeout(() => setSparks((current) => current.filter((item) => item.id < baseId || item.id > baseId + 7)), 760);
  };

  const spawnPurchaseEffects = (upgrade: Upgrade, event?: MouseEvent<HTMLElement>) => {
    const id = effectIdRef.current;
    effectIdRef.current += 1;
    const fromX = event?.clientX ?? window.innerWidth - 180;
    const fromY = event?.clientY ?? window.innerHeight * 0.62;
    const dx = Math.round(window.innerWidth * 0.46 - fromX);
    const dy = Math.round(window.innerHeight * 0.5 - fromY);

    setPurchasePulse(true);
    setRecentlyPurchasedKey(upgrade.key);
    setPurchaseFlights((current) => [
      ...current,
      {
        id,
        src: upgrade.spriteSrc,
        fromX,
        fromY,
        dx,
        dy,
      },
    ]);

    window.setTimeout(() => setPurchasePulse(false), 720);
    window.setTimeout(() => setRecentlyPurchasedKey(null), 950);
    window.setTimeout(() => setPurchaseFlights((current) => current.filter((flight) => flight.id !== id)), 900);
  };

  const spawnPowerUpgradeEffects = (powerUp: PowerUpgrade, event?: MouseEvent<HTMLElement>) => {
    const id = effectIdRef.current;
    effectIdRef.current += 1;
    const fromX = event?.clientX ?? window.innerWidth - 180;
    const fromY = event?.clientY ?? window.innerHeight * 0.28;
    const dx = Math.round(window.innerWidth * 0.78 - fromX);
    const dy = Math.round(window.innerHeight * 0.22 - fromY);

    setPurchasePulse(true);
    setRecentlyPurchasedPowerUpId(powerUp.id);
    setPurchaseFlights((current) => [
      ...current,
      {
        id,
        src: powerUp.spriteSrc,
        fromX,
        fromY,
        dx,
        dy,
      },
    ]);

    window.setTimeout(() => setPurchasePulse(false), 720);
    window.setTimeout(() => setRecentlyPurchasedPowerUpId(null), 1100);
    window.setTimeout(() => setPurchaseFlights((current) => current.filter((flight) => flight.id !== id)), 900);
  };

  const unlockAudio = () => {
    if (!soundEnabled) return;
    const clickSound = soundRefs.current.click;
    if (!clickSound) return;
    clickSound.load();
  };

  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;

    try {
      const audio = soundRefs.current[type];
      if (!audio) return;

      const sound = audio.cloneNode(true) as HTMLAudioElement;
      sound.volume = audio.volume;
      sound.currentTime = 0;
      void sound.play();
    } catch (error) {
      console.error("Failed to play macho clicker sound", error);
    }
  };

  const handleClick = () => {
    const now = Date.now();
    const nextCombo = now - lastClickAt < 800 ? Math.min(99, combo + 1) : 1;
    const gain = clickPower;

    setCombo(nextCombo);
    setLastClickAt(now);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 140);
    spawnClickEffects(gain);
    playSound("click");

    setState((current) => ({
      ...current,
      muscle: clampScore(current.muscle + gain),
      totalMuscle: clampScore(current.totalMuscle + gain),
      handMadeMuscle: clampScore(current.handMadeMuscle + gain),
      clickCount: current.clickCount + 1,
      lastSavedAt: Date.now(),
    }));
  };

  const updateTooltipPosition = (event: MouseEvent<HTMLElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const buyUpgrade = (upgrade: Upgrade, event?: MouseEvent<HTMLElement>) => {
    setState((current) => {
      const level = current.upgrades[upgrade.key];
      const cost = getUpgradeCost(upgrade, level);
      if (current.muscle < cost) {
        playSound("blocked");
        return current;
      }

      const increase = getBuildingUnitProduction(current, upgrade);
      setPurchaseFlash(`${upgrade.name} +${formatRate(increase)}/秒`);
      spawnPurchaseEffects(upgrade, event);
      window.setTimeout(() => setPurchaseFlash(null), 1100);
      playSound("buy");

      return {
        ...current,
        muscle: clampScore(current.muscle - cost),
        upgrades: {
          ...current.upgrades,
          [upgrade.key]: level + 1,
        },
        lastSavedAt: Date.now(),
      };
    });
  };

  const buyPowerUpgrade = (powerUp: PowerUpgrade, event?: MouseEvent<HTMLElement>) => {
    setState((current) => {
      if (current.purchasedPowerUps.includes(powerUp.id) || current.muscle < powerUp.cost || !powerUp.unlock(current)) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash(`${powerUp.name}: ${getPowerUpgradeSummary(powerUp, current)}`);
      spawnPowerUpgradeEffects(powerUp, event);
      setSelectedOwnedPowerUpId(powerUp.id);
      window.setTimeout(() => setPurchaseFlash(null), 1100);
      playSound("buy");

      return {
        ...current,
        muscle: clampScore(current.muscle - powerUp.cost),
        purchasedPowerUps: [...current.purchasedPowerUps, powerUp.id],
        lastSavedAt: Date.now(),
      };
    });
  };

  const harvestMuscleCrystal = () => {
    const now = Date.now();
    setState((current) => {
      if (current.nextMuscleCrystalAt > now) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash("筋肉結晶 +1");
      window.setTimeout(() => setPurchaseFlash(null), 1200);
      playSound("buy");

      return {
        ...current,
        muscleCrystals: current.muscleCrystals + 1,
        nextMuscleCrystalAt: now + getCrystalGrowMs(current),
        lastSavedAt: now,
      };
    });
  };

  const buyLegacyUpgrade = (legacy: LegacyUpgrade) => {
    setState((current) => {
      if (current.legacyUpgrades.includes(legacy.id) || !legacy.unlock(current) || getAvailableLegacyPoints(current) < legacy.cost) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash(`${legacy.name}: ${legacy.effectLabel}`);
      window.setTimeout(() => setPurchaseFlash(null), 1400);
      playSound("buy");

      return {
        ...current,
        legacyUpgrades: [...current.legacyUpgrades, legacy.id],
        lastSavedAt: Date.now(),
      };
    });
  };

  const levelUpBuilding = (upgrade: Upgrade) => {
    setState((current) => {
      if (current.muscleCrystals <= 0 || current.upgrades[upgrade.key] <= 0) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash(`${upgrade.name} レベル +1`);
      window.setTimeout(() => setPurchaseFlash(null), 1200);
      playSound("buy");

      return {
        ...current,
        muscleCrystals: current.muscleCrystals - 1,
        buildingLevels: {
          ...current.buildingLevels,
          [upgrade.key]: current.buildingLevels[upgrade.key] + 1,
        },
        lastSavedAt: Date.now(),
      };
    });
  };

  const collectGoldenProtein = () => {
    if (!goldenProtein) return;
    const effect = pickGoldenEffect(state);
    const now = Date.now();
    let historyEntry: GoldenHistoryEntry = {
      id: `golden-${now}`,
      name: "ゴールデンプロテイン",
      detail: "効果を獲得しました。",
      createdAt: now,
    };

    if (effect === "lucky") {
      const bonus = Math.floor(
        Math.min(state.muscle * LUCKY_BANK_RATE + LUCKY_FLAT_BONUS, perSecond * LUCKY_CPS_SECONDS + LUCKY_FLAT_BONUS) *
          getGoldenMultiplier(state)
      );
      const safeBonus = Math.max(LUCKY_FLAT_BONUS, bonus);
      historyEntry = {
        ...historyEntry,
        name: "Lucky",
        detail: `+${formatNumber(safeBonus)} 筋肉`,
      };
      spawnClickEffects(safeBonus);
      setState((current) => ({
        ...current,
        muscle: clampScore(current.muscle + safeBonus),
        totalMuscle: clampScore(current.totalMuscle + safeBonus),
        goldenClicks: current.goldenClicks + 1,
        goldenHistory: [historyEntry, ...current.goldenHistory].slice(0, GOLDEN_HISTORY_LIMIT),
        lastSavedAt: now,
      }));
      setPurchaseFlash(`Lucky! +${formatNumber(safeBonus)}`);
    } else if (effect === "frenzy") {
      const buff: ActiveBuff = {
        id: `frenzy-${now}`,
        type: "frenzy",
        name: "パンプアップ",
        multiplier: FRENZY_MULTIPLIER,
        endAt: now + FRENZY_DURATION_MS,
      };
      historyEntry = {
        ...historyEntry,
        name: "パンプアップ",
        detail: `${FRENZY_MULTIPLIER}倍 / ${Math.round(FRENZY_DURATION_MS / 1000)}秒`,
      };
      setState((current) => ({
        ...current,
        activeBuffs: upsertBuff(current.activeBuffs, buff),
        goldenClicks: current.goldenClicks + 1,
        goldenHistory: [historyEntry, ...current.goldenHistory].slice(0, GOLDEN_HISTORY_LIMIT),
        lastSavedAt: now,
      }));
      setPurchaseFlash(`パンプアップ: ${FRENZY_MULTIPLIER}倍`);
    } else if (effect === "clickFrenzy") {
      const buff: ActiveBuff = {
        id: `click-frenzy-${now}`,
        type: "clickFrenzy",
        name: "鬼クリック",
        multiplier: CLICK_FRENZY_MULTIPLIER,
        endAt: now + CLICK_FRENZY_DURATION_MS,
      };
      historyEntry = {
        ...historyEntry,
        name: "鬼クリック",
        detail: `${CLICK_FRENZY_MULTIPLIER}倍 / ${Math.round(CLICK_FRENZY_DURATION_MS / 1000)}秒`,
      };
      setState((current) => ({
        ...current,
        activeBuffs: upsertBuff(current.activeBuffs, buff),
        goldenClicks: current.goldenClicks + 1,
        goldenHistory: [historyEntry, ...current.goldenHistory].slice(0, GOLDEN_HISTORY_LIMIT),
        lastSavedAt: now,
      }));
      setPurchaseFlash(`鬼クリック: ${CLICK_FRENZY_MULTIPLIER}倍`);
    } else if (effect === "buildingFrenzy") {
      const ownedBuildings = upgrades.filter((upgrade) => state.upgrades[upgrade.key] > 0);
      const target = ownedBuildings.length > 0 ? ownedBuildings[Math.floor(Math.random() * ownedBuildings.length)] : upgrades[0];
      const buff: ActiveBuff = {
        id: `building-frenzy-${now}`,
        type: "buildingFrenzy",
        name: `${target.name}暴走`,
        multiplier: BUILDING_FRENZY_MULTIPLIER,
        endAt: now + BUILDING_FRENZY_DURATION_MS,
        target: target.key,
      };
      historyEntry = {
        ...historyEntry,
        name: `${target.name}暴走`,
        detail: `${target.name} ${BUILDING_FRENZY_MULTIPLIER}倍 / ${Math.round(BUILDING_FRENZY_DURATION_MS / 1000)}秒`,
      };
      setState((current) => ({
        ...current,
        activeBuffs: upsertBuff(current.activeBuffs, buff),
        goldenClicks: current.goldenClicks + 1,
        goldenHistory: [historyEntry, ...current.goldenHistory].slice(0, GOLDEN_HISTORY_LIMIT),
        lastSavedAt: now,
      }));
      setPurchaseFlash(`${target.name}暴走: ${BUILDING_FRENZY_MULTIPLIER}倍`);
    } else {
      const jackpot = Math.max(777, Math.floor((perSecond * 3600 + state.muscle * 0.07 + 777) * getGoldenMultiplier(state)));
      historyEntry = {
        ...historyEntry,
        name: "レアプロテイン",
        detail: `+${formatNumber(jackpot)} 筋肉`,
      };
      spawnClickEffects(jackpot);
      setState((current) => ({
        ...current,
        muscle: clampScore(current.muscle + jackpot),
        totalMuscle: clampScore(current.totalMuscle + jackpot),
        goldenClicks: current.goldenClicks + 1,
        goldenHistory: [historyEntry, ...current.goldenHistory].slice(0, GOLDEN_HISTORY_LIMIT),
        lastSavedAt: now,
      }));
      setPurchaseFlash(`レアプロテイン! +${formatNumber(jackpot)}`);
    }
    setGoldenProtein(null);
    playSound("golden");
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const resetGame = () => {
    if (!window.confirm("マチョクリッカーの進行状況をリセットしますか？")) return;
    const nextState = {
      ...initialState,
      upgrades: { ...emptyUpgrades },
      buildingLevels: { ...emptyBuildingLevels },
      muscleCrystals: 0,
      nextMuscleCrystalAt: Date.now() + MUSCLE_CRYSTAL_GROW_MS,
      goldenClicks: 0,
      goldenHistory: [],
      legacyUpgrades: [],
      purchasedPowerUps: [],
      activeBuffs: [],
      prestigeLevel: 0,
      ascensionCount: 0,
      lastSavedAt: Date.now(),
    };
    setState(nextState);
    setCombo(0);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const manualSave = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
    setSaveMessage("保存しました。");
    window.setTimeout(() => setSaveMessage(""), 1800);
  };

  const exportSave = async () => {
    const saveText = btoa(unescape(encodeURIComponent(JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }))));
    try {
      await navigator.clipboard.writeText(saveText);
      setSaveMessage("セーブデータをコピーしました。");
    } catch {
      window.prompt("セーブデータをコピーしてください。", saveText);
      setSaveMessage("セーブデータを表示しました。");
    }
    window.setTimeout(() => setSaveMessage(""), 2200);
  };

  const importSave = () => {
    const saveText = window.prompt("インポートするセーブデータを貼り付けてください。");
    if (!saveText) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(saveText)))) as Partial<GameState>;
      const importedState: GameState = {
        ...initialState,
        ...parsed,
        muscle: typeof parsed.muscle === "number" ? clampScore(parsed.muscle) : 0,
        totalMuscle: typeof parsed.totalMuscle === "number" ? clampScore(parsed.totalMuscle) : 0,
        handMadeMuscle: typeof parsed.handMadeMuscle === "number" ? clampScore(parsed.handMadeMuscle) : 0,
        clickCount: typeof parsed.clickCount === "number" ? Math.max(0, Math.floor(parsed.clickCount)) : 0,
        upgrades: normalizeSavedUpgrades(parsed.upgrades),
        buildingLevels: normalizeSavedBuildingLevels(parsed.buildingLevels),
        muscleCrystals: typeof parsed.muscleCrystals === "number" ? Math.max(0, Math.floor(parsed.muscleCrystals)) : 0,
        nextMuscleCrystalAt:
          typeof parsed.nextMuscleCrystalAt === "number" ? parsed.nextMuscleCrystalAt : Date.now() + MUSCLE_CRYSTAL_GROW_MS,
        goldenClicks: typeof parsed.goldenClicks === "number" ? Math.max(0, Math.floor(parsed.goldenClicks)) : 0,
        goldenHistory: normalizeGoldenHistory(parsed.goldenHistory),
        legacyUpgrades: normalizeLegacyUpgrades(parsed.legacyUpgrades),
        purchasedPowerUps: Array.isArray(parsed.purchasedPowerUps)
          ? parsed.purchasedPowerUps.filter((id): id is string => typeof id === "string")
          : [],
        activeBuffs: [],
        prestigeLevel: typeof parsed.prestigeLevel === "number" ? Math.max(0, Math.floor(parsed.prestigeLevel)) : 0,
        ascensionCount: typeof parsed.ascensionCount === "number" ? Math.max(0, Math.floor(parsed.ascensionCount)) : 0,
        lastSavedAt: Date.now(),
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
      };
      setState(importedState);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
      setSaveMessage("インポートしました。");
    } catch {
      setSaveMessage("インポートに失敗しました。");
    }
    window.setTimeout(() => setSaveMessage(""), 2200);
  };

  const ascend = () => {
    if (pendingPrestige <= 0) return;
    if (!window.confirm(`仕上げ直しを実行して、永久倍率 +${pendingPrestige}% を獲得しますか？`)) return;

    const nextState: GameState = {
      ...initialState,
      muscle: getAscensionStartingMuscle(state),
      totalMuscle: state.totalMuscle,
      clickCount: 0,
      upgrades: { ...emptyUpgrades },
      buildingLevels: state.buildingLevels,
      muscleCrystals: state.muscleCrystals,
      nextMuscleCrystalAt: state.nextMuscleCrystalAt,
      goldenClicks: state.goldenClicks,
      goldenHistory: state.goldenHistory,
      legacyUpgrades: state.legacyUpgrades,
      purchasedPowerUps: [],
      activeBuffs: [],
      prestigeLevel: state.prestigeLevel + pendingPrestige,
      ascensionCount: state.ascensionCount + 1,
      lastSavedAt: Date.now(),
      unlockedAchievements: state.unlockedAchievements,
    };

    setState(nextState);
    setCombo(0);
    setPurchaseFlash(`仕上げ直し完了: 永久倍率 +${pendingPrestige}%`);
    window.setTimeout(() => setPurchaseFlash(null), 1600);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const submitRanking = async () => {
    setRankingMessage("");
    try {
      const response = await fetch("/api/macho-clicker/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          score: clampScore(state.totalMuscle),
        }),
      });

      const data = (await response.json()) as { items?: RankingEntry[]; error?: string };
      if (!response.ok) {
        setRankingMessage(data.error ?? "ランキング登録に失敗しました。");
        return;
      }

      setRankings(data.items ?? []);
      setRankingMessage("ランキングに登録しました。");
    } catch (error) {
      console.error("Failed to submit macho clicker ranking", error);
      setRankingMessage("ランキング登録に失敗しました。");
    }
  };

  return (
    <div
      className={`macho-game-shell min-h-dvh overflow-hidden bg-[#160D08] text-slate-900 ${
        reducedEffects ? "macho-reduced-effects" : ""
      }`}
      onPointerDown={unlockAudio}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,184,77,0.34),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(251,146,60,0.26),transparent_30%),linear-gradient(180deg,#FFF7EB_0%,#FDBA74_48%,#7C2D12_100%)]" />
      <header className="macho-game-nav sticky top-0 z-50 flex h-14 items-center justify-between border-b-4 border-[#7C2D12] bg-[#1F120A]/95 px-3 text-[#FFE7C2] shadow-2xl backdrop-blur md:px-5">
        <Link
          href="/"
          className="macho-game-button rounded-full border-2 border-[#FFB45D]/60 bg-[#7C2D12] px-4 py-2 text-xs font-black text-[#FFE7C2] transition hover:bg-[#9A3412] sm:text-sm"
        >
          ← トップへ戻る
        </Link>
        <div className="min-w-0 px-3 text-center">
          <div className="truncate text-base font-black tracking-tight sm:text-xl">マチョクリッカー</div>
          <div className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB45D] sm:block">Full Screen Gym Game</div>
        </div>
        <button
          type="button"
          onClick={() => setReducedEffects((current) => !current)}
          className="macho-game-button rounded-full border-2 border-[#FFB45D]/50 bg-[#2A140B] px-3 py-2 text-[11px] font-black text-[#FFE7C2] transition hover:bg-[#451A03] sm:px-4 sm:text-xs"
          aria-pressed={reducedEffects}
        >
          軽量 {reducedEffects ? "ON" : "OFF"}
        </button>
      </header>

      {achievementToast ? (
        <div className="macho-toast macho-achievement-flash fixed right-4 top-24 z-50 max-w-xs rounded-3xl border-2 border-[#FCD27B] bg-[#FFF7EB] px-5 py-4 text-[#7C2D12] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF8A23] text-2xl shadow-inner">★</div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Achievement</div>
              <div className="mt-1 text-lg font-black">{achievementToast.title}</div>
            </div>
          </div>
          <div className="mt-3 text-sm font-bold leading-6 text-[#9A3412]">{achievementToast.description}</div>
        </div>
      ) : null}

      {purchaseFlash ? (
        <div className="macho-toast fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {purchaseFlash}
        </div>
      ) : null}

      <main className="relative z-10 px-0 pb-0 pt-0">
        <div className="flex w-full max-w-none flex-col gap-0">
          <section className="macho-game-topbar macho-game-panel overflow-hidden border-b-4 border-[#7C2D12] bg-[#7C2D12] text-white shadow-2xl md:border-x-0 md:border-t-0">
            <div className="grid gap-px bg-[#FED7AA] lg:grid-cols-[420px_minmax(0,1fr)_390px]">
              <div className="bg-[#9A3412] px-5 py-4">
                <h1 className="text-3xl font-black tracking-tight text-[#FFE7C2]">マチョクリッカー</h1>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">
                  {bodyStage.label} / 肉体Lv {bodyPartAverageLevel}
                </div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="macho-ui-label">Current</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl" title={formatFullNumber(state.muscle)}>
                      {displayNumber(state.muscle)}
                    </div>
                  </div>
                  <div>
                    <div className="macho-ui-label">Per Second</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl">+{displayNumber(perSecond)}</div>
                  </div>
                  <div>
                    <div className="macho-ui-label">Total</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl" title={formatFullNumber(state.totalMuscle)}>
                      {displayNumber(state.totalMuscle)}
                    </div>
                  </div>
                  <div>
                    <div className="macho-ui-label">Crystal</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl">{formatFullNumber(state.muscleCrystals)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-[#FFB45D]">
                    次の称号: {nextGoal.title} / 永久倍率 +{state.prestigeLevel}%
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((current) => !current)}
                    className="macho-game-button rounded-full bg-[#7C2D12] px-3 py-1 text-[11px] font-black text-[#FFE7C2] transition"
                    aria-pressed={soundEnabled}
                  >
                    効果音 {soundEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FFB45D] to-[#FF5A1F]" style={{ width: `${titleProgress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black text-[#FFE7C2]">
                  <span>基礎CPS +{displayNumber(basePerSecond)}</span>
                  <button
                    type="button"
                    onClick={ascend}
                    disabled={pendingPrestige <= 0}
                    className="macho-game-button rounded-full bg-[#FF8A23] px-3 py-1 text-white transition disabled:bg-white/20 disabled:text-white/45"
                  >
                    仕上げ直し +{pendingPrestige}%
                  </button>
                </div>
              </div>
            </div>
            {activeBuffs.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-[#FED7AA] bg-[#2A140B] px-4 py-2">
                {activeBuffs.map((buff) => (
                  <span key={buff.id} className="rounded-full bg-[#FFE7C2] px-3 py-1 text-xs font-black text-[#7C2D12]">
                    {buff.name} x{buff.multiplier} 残り{Math.max(0, Math.ceil((buff.endAt - Date.now()) / 1000))}秒
                  </span>
                ))}
              </div>
            ) : null}
            <div className="relative flex items-center gap-4 overflow-hidden border-t border-[#FED7AA] bg-[#7C2D12] px-4 py-2">
              <span className="relative z-10 shrink-0 rounded bg-[#FF8A23] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] shadow-lg">
                Macho News
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div key={newsIndex} className="macho-news whitespace-nowrap text-sm font-bold text-orange-100">
                  {news}
                </div>
              </div>
            </div>
          </section>

          <nav
            className="macho-mobile-tabs sticky top-14 z-40 grid grid-cols-4 gap-2 border-b-4 border-[#7C2D12] bg-[#2A140B] p-2 shadow-2xl md:hidden"
            aria-label="マチョクリッカー画面切り替え"
          >
            {mobilePanels.map((panel) => (
              <button
                key={panel.key}
                type="button"
                onClick={() => setMobilePanel(panel.key)}
                className={`macho-mobile-tab rounded-2xl border-2 px-3 py-3 text-sm font-black transition ${
                  mobilePanel === panel.key
                    ? "macho-mobile-tab-active border-[#FFE7C2] bg-[#FF8A23] text-white shadow-[0_0_0_3px_rgba(255,138,35,0.28)]"
                    : "border-[#9A3412] bg-[#7C2D12] text-[#FFE7C2]"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </nav>

          <section className="macho-game-panel macho-main-grid grid min-h-[calc(100dvh-15rem)] overflow-hidden border-b-4 border-[#7C2D12] bg-[#7C2D12] shadow-2xl md:h-[calc(100dvh-12.75rem)] md:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] md:border-b-0 xl:grid-cols-[minmax(700px,920px)_minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(780px,1040px)_minmax(0,1fr)_420px]">
            <aside
              className={`relative min-h-[calc(100dvh-15rem)] flex-col items-center justify-between overflow-hidden border-b-4 border-[#7C2D12] bg-[#451A03] p-4 text-center sm:p-5 md:col-start-1 md:row-span-2 md:flex md:min-h-0 md:border-b-0 md:border-r-4 xl:col-auto xl:row-auto xl:flex xl:min-h-0 xl:border-b-0 xl:border-r-4 ${
                mobilePanel === "click" ? "flex" : "hidden"
              }`}
            >
              <Image
                src="/game/macho-clicker/backgrounds/click-gym-stage-v4.png"
                alt=""
                fill
                priority
                quality={78}
                sizes={clickStageImageSizes}
                className="macho-click-stage-bg z-0 object-cover"
              />
              <div className="macho-click-stage-glow pointer-events-none absolute inset-0 z-[1]" />
              <div className="macho-gym-light pointer-events-none absolute inset-x-0 top-0 z-[2] h-48" />
              <div className={`macho-click-foreground pointer-events-none absolute inset-0 z-[4] ${clickBurst ? "macho-click-foreground-hit" : ""}`}>
                <span className="macho-stage-floor-glow" />
                <span className="macho-stage-light-sweep" />
                <span className="macho-stage-floor-reflection" />
                <span className="macho-stage-equipment-shift" />
                <span className="macho-stage-dust-cloud macho-stage-dust-cloud-1" />
                <span className="macho-stage-dust-cloud macho-stage-dust-cloud-2" />
                <span className="macho-stage-dust-cloud macho-stage-dust-cloud-3" />
              </div>
              <div className="macho-gym-structure pointer-events-none absolute inset-0 z-[3]">
                <span className="macho-gym-mirror" />
                <span className="macho-gym-rack macho-gym-rack-left" />
                <span className="macho-gym-rack macho-gym-rack-right" />
                <span className="macho-gym-bench" />
                <span className="macho-gym-floor-line macho-gym-floor-line-1" />
                <span className="macho-gym-floor-line macho-gym-floor-line-2" />
              </div>
              {visibleAmbientItems.length > 0 ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {visibleAmbientItems.map((item) => (
                  <span
                    key={item.id}
                    className="macho-ambient-fall absolute -top-20 z-[2]"
                    style={
                      {
                        left: item.left,
                        width: item.size,
                        height: item.size,
                        animationDelay: item.delay,
                        animationDuration: item.duration,
                        opacity: item.opacity,
                      } as CSSProperties
                    }
                  >
                    <Image src={item.src} alt="" width={64} height={64} className="h-full w-full object-contain drop-shadow-xl" />
                  </span>
                ))}
              </div>
              ) : null}
              <div
                className={`macho-paper-card relative z-10 w-full rounded-2xl px-4 py-4 text-[#7C2D12] ${
                  purchasePulse ? "macho-counter-purchase" : ""
                }`}
              >
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Muscle Points</div>
                <div className="macho-counter mt-1 break-words text-4xl font-black tracking-tight sm:text-5xl" title={formatFullNumber(state.muscle)}>
                  {displayNumber(animatedMuscle)}
                </div>
                <div className="mt-2 grid gap-2 text-sm font-bold text-[#9A3412] sm:grid-cols-3">
                  <span>クリック +{displayNumber(animatedClickPower)}</span>
                  <span>毎秒 +{displayNumber(animatedPerSecond)}</span>
                  <span>COMBO {combo}</span>
                </div>
              </div>

              {floatingGains.map((item) => (
                <div
                  key={item.id}
                  className="macho-float pointer-events-none absolute z-40 text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(124,45,18,0.85)]"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  +{displayNumber(item.value)}
                </div>
              ))}

              {sparks.map((spark) => (
                <div
                  key={spark.id}
                  className="macho-spark pointer-events-none absolute z-30 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.85)]"
                  style={{
                    left: `${spark.x}%`,
                    top: `${spark.y}%`,
                    width: spark.size,
                    height: spark.size,
                    transform: `rotate(${spark.rotate}deg)`,
                  }}
                />
              ))}

              {purchaseFlights.map((flight) => (
                <span
                  key={flight.id}
                  className="macho-purchase-flight pointer-events-none fixed z-[80] flex h-16 w-16 items-center justify-center"
                  style={
                    {
                      left: flight.fromX,
                      top: flight.fromY,
                      "--flight-dx": `${flight.dx}px`,
                      "--flight-dy": `${flight.dy}px`,
                    } as CSSProperties
                  }
                >
                  <Image src={flight.src} alt="" width={64} height={64} className="h-16 w-16 object-contain drop-shadow-2xl" />
                </span>
              ))}

              {goldenProtein ? (
                <button
                  type="button"
                  onClick={collectGoldenProtein}
                  className="macho-golden macho-golden-alert absolute z-50 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-500 shadow-2xl"
                  style={{ left: `${goldenProtein.x}%`, top: `${goldenProtein.y}%` }}
                  aria-label="ゴールデンプロテインを獲得"
                >
                  <Image
                    src="/game/macho-clicker/icons/generated-v3/golden-protein.png"
                    alt=""
                    width={86}
                    height={86}
                    className="h-20 w-20 object-contain drop-shadow-xl"
                  />
                </button>
              ) : null}

              <div className="relative z-20 my-4 flex aspect-square w-full max-w-[860px] items-center justify-center overflow-visible sm:my-5">
                {clickBurst ? <span className="macho-click-ripple pointer-events-none absolute left-1/2 top-1/2 z-20" /> : null}
                {dumbbellOrbitItems.map((item) => (
                  <span
                    key={`dumbbell-orbit-${item.index}`}
                    className="macho-cursor pointer-events-none absolute left-1/2 top-1/2 z-40 flex items-center justify-center"
                    style={
                      {
                        width: item.size,
                        height: item.size,
                        "--orbit-radius": item.radius,
                        transform: `translate(-50%, -50%) rotate(${item.angle}deg) translate(var(--orbit-radius)) rotate(${-item.angle}deg)`,
                        animationDelay: `${(item.index % 10) * 0.06}s`,
                      } as CSSProperties
                    }
                  >
                    <Image
                      src="/game/macho-clicker/icons/generated-v3/dumbbell.png"
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-contain drop-shadow-xl"
                    />
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleClick}
                  className={`macho-character-button macho-breathe group relative z-30 flex w-[min(66vw,24rem)] items-end justify-center bg-transparent p-0 transition hover:scale-[1.05] active:scale-95 ${
                    clickBurst ? "macho-pop" : ""
                  }`}
                  aria-label="マチョ田をクリック"
                >
                  <Image
                    src={characterImageSrc}
                    alt="マチョ田をクリック"
                    width={280}
                    height={280}
                    priority
                    className="relative z-10 h-auto w-[min(60vw,24rem)] drop-shadow-[0_28px_30px_rgba(0,0,0,0.65)] transition duration-300 group-hover:scale-105"
                    style={{ transform: `scale(${bodyStage.scale})` }}
                  />
                </button>
              </div>

              <div className="relative z-10 grid w-full grid-cols-2 gap-3 text-left">
                <div className="macho-paper-card rounded-2xl px-4 py-3 text-[#7C2D12]">
                  <div className="text-xs font-black text-[#C2410C]">称号</div>
                  <div className="mt-1 text-xl font-black">{title}</div>
                </div>
                <div className="macho-paper-card rounded-2xl px-4 py-3 text-[#7C2D12]">
                  <div className="text-xs font-black text-[#C2410C]">クリック数</div>
                  <div className="mt-1 text-xl font-black">{formatFullNumber(state.clickCount)}</div>
                </div>
              </div>
              <div className="macho-paper-card relative z-10 mt-3 w-full rounded-2xl px-4 py-3 text-left text-[#7C2D12]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-[#C2410C]">部位成長</div>
                    <div className="mt-1 text-sm font-black text-[#7C2D12]">設備に連動して胸・背中・脚・肩・腕・腹筋が育ちます。</div>
                  </div>
                  <div className="rounded-full bg-[#7C2D12] px-3 py-1 text-xs font-black text-[#FFE7C2]">平均Lv {bodyPartAverageLevel}</div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {bodyPartProgress.map((part) => (
                    <div key={part.key} className="rounded-2xl border border-[#FCD27B] bg-white/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-black">
                        <span>{part.label}</span>
                        <span>Lv {part.level}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#FED7AA]">
                        <div className={`h-full rounded-full bg-gradient-to-r ${part.accent}`} style={{ width: `${part.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section
              className={`relative min-h-[calc(100dvh-15rem)] overflow-hidden border-b-4 border-[#7C2D12] bg-[linear-gradient(180deg,#FFF0D5_0%,#FDBA74_48%,#C2410C_100%)] md:col-start-2 md:row-start-1 md:block md:min-h-0 xl:col-auto xl:row-auto xl:block xl:min-h-0 xl:border-b-0 xl:border-r-4 ${
                mobilePanel === "gym" ? "block" : "hidden"
              }`}
            >
              <div className="absolute inset-x-0 top-0 z-10 border-b-4 border-[#7C2D12] bg-[#FFF7EB]/95 px-5 py-3 text-[#7C2D12] shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Machoda Gym</div>
                    <div className="text-xl font-black">ジム設備</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="rounded-full bg-[#FF8A23] px-4 py-2 text-sm font-black text-white">設備合計 {visualOwnedUpgradeCount}</div>
                    <div className="rounded-full bg-[#7C2D12] px-4 py-2 text-sm font-black text-white">設備Lv {totalBuildingLevel}</div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(124,45,18,0.7)_90%)]" />
              <div className="absolute inset-x-4 bottom-5 top-24 overflow-y-auto rounded-[28px] border-4 border-[#7C2D12] bg-[#2A140B] shadow-inner">
                <div className="grid auto-rows-[10.5rem] divide-y-2 divide-[#2A140B]">
                  {visualUpgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const buildingLevel = state.buildingLevels[upgrade.key];
                    const canLevelUp = state.muscleCrystals > 0 && level > 0;
                    const isBuildingFrenzyTarget = activeBuildingFrenzyTargets.includes(upgrade.key);
                    const visibleCount = getUpgradeVisibleCount(level);
                    return (
                      <div
                        key={upgrade.key}
                        data-upgrade-key={upgrade.key}
                        data-upgrade-tier={getUpgradeTier(upgrade.key)}
                        className={`relative grid min-h-0 grid-cols-[11.5rem_minmax(0,1fr)] items-stretch overflow-hidden bg-gradient-to-r ${
                          isBuildingFrenzyTarget ? "macho-building-boost" : ""
                        } macho-building-row ${recentlyPurchasedKey === upgrade.key ? "macho-building-purchased" : ""} ${getUpgradeSceneClass(upgrade.key)}`}
                        onMouseEnter={() => setHoveredGymUpgradeKey(upgrade.key)}
                        onMouseMove={updateTooltipPosition}
                        onMouseLeave={() => setHoveredGymUpgradeKey(null)}
                        onFocus={() => setHoveredGymUpgradeKey(upgrade.key)}
                        onBlur={() => setHoveredGymUpgradeKey(null)}
                      >
                        <Image
                          src={getUpgradeSceneImage(upgrade.key)}
                          alt=""
                          fill
                          quality={68}
                          sizes={buildingSceneImageSizes}
                          className="z-0 object-cover opacity-100"
                        />
                        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(42,20,11,0.30)_0%,rgba(42,20,11,0.06)_42%,rgba(42,20,11,0.22)_100%)]" />
                        <div className="macho-building-tier-aura pointer-events-none absolute inset-0 z-[2]" />
                        {isBuildingFrenzyTarget ? (
                          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_72%_50%,rgba(255,247,214,0.42),transparent_34%),linear-gradient(90deg,transparent,rgba(255,180,93,0.24),transparent)]" />
                        ) : null}
                        <div className="relative z-10 m-2 flex min-w-0 flex-col justify-between rounded-2xl border-2 border-[#FFB45D]/45 bg-[#2A140B]/88 px-3 py-3 text-[#FFE7C2] shadow-[0_10px_24px_rgba(42,20,11,0.55)] backdrop-blur-[1px]">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">{upgrade.label}</div>
                            <div className="mt-1 break-words text-sm font-black leading-tight">{upgrade.name}</div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-[#FF8A23] px-2 py-1 text-xs font-black text-white">所持 {level}</span>
                            <Image src={upgrade.spriteSrc} alt="" width={42} height={42} className="macho-building-icon h-8 w-8 object-contain drop-shadow-lg" />
                          </div>
                          <button
                            type="button"
                            onClick={() => levelUpBuilding(upgrade)}
                            disabled={!canLevelUp}
                            className="mt-2 rounded-xl border border-[#FFB45D]/50 bg-[#FFE7C2] px-2 py-1 text-xs font-black text-[#7C2D12] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            設備Lv.{buildingLevel} +1
                          </button>
                        </div>
                        <div className="macho-unit-field relative z-10 grid max-w-full grid-flow-col grid-rows-3 content-center gap-x-2 gap-y-2 overflow-hidden px-4 py-4 [grid-auto-columns:2rem] sm:[grid-auto-columns:2.25rem] 2xl:[grid-auto-columns:2.5rem]">
                          {Array.from({ length: visibleCount }, (_, index) => (
                            <div
                              key={`${upgrade.key}-unit-${index}`}
                              className={`macho-unit flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8 ${
                                recentlyPurchasedKey === upgrade.key && index === visibleCount - 1 ? "macho-unit-new" : ""
                              }`}
                              style={{ animationDelay: `${(index % 8) * 0.08}s` }}
                            >
                              <Image
                                src={upgrade.spriteSrc}
                                alt=""
                                width={32}
                                height={32}
                                className="h-7 w-7 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] sm:h-8 sm:w-8"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="absolute bottom-2 right-3 z-20">
                          {level > visibleCount ? (
                            <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-black text-[#7C2D12]">
                              +{level - visibleCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {hoveredGymUpgrade ? (
                <div
                  className="pointer-events-none fixed z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-left text-[#7C2D12] shadow-2xl xl:block"
                  style={tooltipStyle}
                >
                  <div className="flex items-center gap-3">
                    <Image src={hoveredGymUpgrade.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                    <div>
                      <div className="text-base font-black">{hoveredGymUpgrade.name}</div>
                      <div className="text-xs font-bold text-[#C2410C]">
                        所有数 {formatFullNumber(state.upgrades[hoveredGymUpgrade.key])}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-semibold leading-6">{hoveredGymUpgrade.description}</div>
                  <BuildingProductionDetails state={state} upgrade={hoveredGymUpgrade} />
                </div>
              ) : null}
            </section>

            <aside className={`${mobilePanel === "shop" ? "block" : "hidden"} macho-shop-shelf text-[#7C2D12] md:col-start-2 md:row-start-2 md:block xl:col-auto xl:row-auto xl:block xl:min-h-0`}>
              <div className="max-h-none overflow-y-visible p-4 md:max-h-full md:overflow-y-auto xl:sticky xl:top-0 xl:max-h-[calc(100dvh-12.75rem)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black text-[#7C2D12]">ショップ</h2>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-full border-2 border-[#FDBA74] px-3 py-1 text-xs font-bold text-[#9A3412] transition hover:bg-[#FFE7C2]"
                  >
                    リセット
                  </button>
                </div>
                <div className="macho-paper-card mb-5 rounded-2xl p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-[#7C2D12]">アップグレード</h3>
                    <span className="rounded-full bg-[#FFE7C2] px-2 py-1 text-xs font-black text-[#C2410C]">
                      {state.purchasedPowerUps.length}/{powerUpgrades.length}
                    </span>
                  </div>
                  {unlockedPowerUps.length === 0 ? (
                    <div className="rounded-xl bg-[#FFF4E7] px-3 py-3 text-xs font-bold text-[#9A3412]/70">
                      条件達成でアップグレードが解放されます。
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {unlockedPowerUps.map((powerUp) => {
                        const canBuyPowerUp = state.muscle >= powerUp.cost;
                        return (
                          <button
                            key={powerUp.id}
                            type="button"
                            onClick={(event) => {
                              if (canBuyPowerUp) buyPowerUpgrade(powerUp, event);
                            }}
                            aria-disabled={!canBuyPowerUp}
                            data-shop-state={canBuyPowerUp ? "purchasable" : "unavailable"}
                            onMouseEnter={() => setHoveredPowerUpId(powerUp.id)}
                            onMouseMove={updateTooltipPosition}
                            onMouseLeave={() => setHoveredPowerUpId(null)}
                            onFocus={() => setHoveredPowerUpId(powerUp.id)}
                            onBlur={() => setHoveredPowerUpId(null)}
                            className={`macho-shop-card macho-upgrade-slot relative flex h-16 items-center justify-center overflow-hidden rounded-2xl border-2 transition ${
                              canBuyPowerUp
                                ? "macho-shop-ready border-[#C2410C] bg-[#FFF4E7] shadow-[0_0_0_3px_rgba(255,138,35,0.22),0_10px_24px_rgba(194,65,12,0.2)] hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(255,138,35,0.35),0_16px_30px_rgba(194,65,12,0.28)]"
                                : "cursor-not-allowed border-[#FED7AA] bg-[#FFF4E7] grayscale opacity-45"
                            }`}
                          >
                            <span
                              className={`macho-state-chip absolute right-1 top-1 ${
                                canBuyPowerUp ? "macho-state-chip-ready" : "macho-state-chip-wait"
                              }`}
                              aria-hidden="true"
                            >
                              {canBuyPowerUp ? "✓" : "…"}
                            </span>
                            <Image src={powerUp.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {purchasedPowerUps.length > 0 ? (
                    <div className="mt-4 border-t border-[#FED7AA] pt-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#C2410C]">取得済み</div>
                        <div className="rounded-full bg-[#FFF4E7] px-2 py-1 text-[11px] font-black text-[#9A3412]">
                          直近 {recentPurchasedPowerUps.length}件
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {recentPurchasedPowerUps.map((powerUp) => (
                          <button
                            key={`owned-${powerUp.id}`}
                            type="button"
                            title={`${powerUp.name}: ${powerUp.effectLabel}`}
                            data-shop-state="owned"
                            onMouseEnter={() => setHoveredPowerUpId(powerUp.id)}
                            onMouseLeave={() => setHoveredPowerUpId(null)}
                            onFocus={() => setHoveredPowerUpId(powerUp.id)}
                            onBlur={() => setHoveredPowerUpId(null)}
                            onClick={() => setSelectedOwnedPowerUpId((current) => (current === powerUp.id ? null : powerUp.id))}
                            aria-pressed={selectedOwnedPowerUpId === powerUp.id}
                            className={`macho-shop-card macho-upgrade-slot relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#FDBA74] bg-[#FFE7C2] shadow-inner ${
                              recentlyPurchasedPowerUpId === powerUp.id ? "macho-powerup-owned-new" : ""
                            }`}
                          >
                            <span className="macho-state-chip macho-state-chip-owned absolute right-0.5 top-0.5" aria-hidden="true">
                              ✓
                            </span>
                            <Image src={powerUp.spriteSrc} alt="" width={34} height={34} className="h-8 w-8 object-contain" />
                          </button>
                        ))}
                        {hiddenPurchasedPowerUpCount > 0 ? (
                          <span className="macho-shop-card flex h-11 w-11 items-center justify-center rounded-xl border border-[#FDBA74] bg-[#FFF4E7] text-xs font-black text-[#9A3412] shadow-inner">
                            +{hiddenPurchasedPowerUpCount}
                          </span>
                        ) : null}
                      </div>
                      {selectedOwnedPowerUp ? (
                        <div className="mt-3 rounded-2xl border border-[#FDBA74] bg-[#FFF7EB] p-3 text-[#7C2D12] shadow-inner">
                          <div className="flex items-center gap-3">
                            <Image src={selectedOwnedPowerUp.spriteSrc} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
                            <div>
                              <div className="text-sm font-black">{selectedOwnedPowerUp.name}</div>
                              <div className="text-xs font-bold text-[#C2410C]">{selectedOwnedPowerUp.effectLabel}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs font-bold leading-5 text-[#9A3412]">{selectedOwnedPowerUp.description}</div>
                          <PowerUpgradeDetails state={state} powerUp={selectedOwnedPowerUp} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {nextShopGoal ? (
                  <div className="macho-paper-card mb-4 rounded-2xl p-3">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#C2410C]">次の目標</div>
                    <div className="mt-1 text-sm font-black">{nextShopGoal.upgrade.name}</div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7B374]">
                      <div
                        className="h-full rounded-full bg-[#FF8A23]"
                        style={{ width: `${getPurchaseProgress(state.muscle, nextShopGoal.cost)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs font-bold text-[#9A3412]">
                      あと {displayNumber(getShortage(state.muscle, nextShopGoal.cost))} 筋肉
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-3">
                  {upgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const buildingLevel = state.buildingLevels[upgrade.key];
                    const cost = getUpgradeCost(upgrade, level);
                    const canBuy = state.muscle >= cost;
                    const shortage = getShortage(state.muscle, cost);
                    const purchaseProgress = getPurchaseProgress(state.muscle, cost);
                    const unitProduction = getBuildingUnitProduction(state, upgrade);
                    const isBuildingFrenzyTarget = activeBuildingFrenzyTargets.includes(upgrade.key);

                    return (
                      <button
                        key={upgrade.key}
                        type="button"
                        onClick={(event) => buyUpgrade(upgrade, event)}
                        aria-disabled={!canBuy}
                        data-shop-state={canBuy ? "purchasable" : "unavailable"}
                        onMouseEnter={() => setHoveredShopUpgradeKey(upgrade.key)}
                        onMouseMove={updateTooltipPosition}
                        onMouseLeave={() => setHoveredShopUpgradeKey(null)}
                        onFocus={() => setHoveredShopUpgradeKey(upgrade.key)}
                        onBlur={() => setHoveredShopUpgradeKey(null)}
                        className={`macho-shop-card group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition ${
                          isBuildingFrenzyTarget ? "macho-building-boost" : ""
                        } ${recentlyPurchasedKey === upgrade.key ? "macho-shop-purchased" : ""} ${
                          canBuy
                            ? "macho-shop-ready border-[#C2410C] bg-white text-[#7C2D12] shadow-[0_0_0_3px_rgba(255,138,35,0.18),0_10px_24px_rgba(194,65,12,0.16)] hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(255,138,35,0.32),0_16px_32px_rgba(194,65,12,0.26)]"
                            : "border-[#FED7AA] bg-[#FFF4E7] text-[#9A3412]/62"
                        }`}
                      >
                        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[#E7B374]">
                          <span
                            className={`block h-full ${canBuy ? "bg-[#22C55E]" : "bg-[#FF8A23]"}`}
                            style={{ width: `${purchaseProgress}%` }}
                          />
                        </span>
                        <span
                          className={`macho-state-chip absolute right-2 top-2 ${
                            canBuy ? "macho-state-chip-ready" : "macho-state-chip-wait"
                          }`}
                          aria-hidden="true"
                        >
                          {canBuy ? "✓" : "…"}
                        </span>
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-inner ${
                              canBuy ? "border-[#C2410C] bg-[#FFE7C2]" : "border-[#FED7AA] bg-[#FFF4E7] grayscale"
                            }`}
                          >
                            <Image src={upgrade.spriteSrc} alt="" width={58} height={58} className="h-14 w-14 object-contain" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="font-black">{upgrade.name}</span>
                              <span className="rounded-full bg-[#7C2D12] px-2 py-1 text-xs font-black text-white">Lv.{level}</span>
                            </span>
                            <span className="mt-1 block text-xs font-bold text-[#9A3412]">
                              1個 +{formatRate(unitProduction)}/秒 / 設備Lv.{buildingLevel}
                            </span>
                            <span
                              className={`mt-3 block rounded-xl px-3 py-2 text-sm font-black ${
                                canBuy ? "bg-[#7C2D12] text-white" : "bg-[#D6A169] text-[#7C2D12]"
                              }`}
                            >
                              {canBuy ? "必要" : "あと"}: {displayNumber(canBuy ? cost : shortage)} 筋肉
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {mysteryShopItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-disabled="true"
                      data-shop-state="locked"
                      onMouseEnter={() => setHoveredMysteryId(item.id)}
                      onMouseMove={updateTooltipPosition}
                      onMouseLeave={() => setHoveredMysteryId(null)}
                      onFocus={() => setHoveredMysteryId(item.id)}
                      onBlur={() => setHoveredMysteryId(null)}
                      className="macho-shop-card group relative rounded-2xl border border-[#FED7AA] bg-[#3B1D0F] p-3 text-left text-[#FFE7C2]/70 transition"
                    >
                      <div className="flex items-start gap-3">
                        <span className="macho-locked-slot flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[#9A3412] bg-[#2A140B] text-3xl font-black shadow-inner">
                          ?
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="font-black">{item.name}</span>
                            <span className="rounded-full bg-[#7C2D12] px-2 py-1 text-xs font-black text-white">LOCK</span>
                          </span>
                          <span className="mt-3 block rounded-xl bg-[#7C2D12] px-3 py-2 text-sm font-black text-white/70">
                            必要: ？？？
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {hoveredShopUpgrade ? (
                  <div
                    className="pointer-events-none fixed z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block"
                    style={tooltipStyle}
                  >
                    <div className="flex items-center gap-3">
                      <Image src={hoveredShopUpgrade.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                      <div>
                        <div className="text-base font-black">{hoveredShopUpgrade.name}</div>
                        <div className="text-xs font-bold text-[#C2410C]">
                          所有数 {formatFullNumber(state.upgrades[hoveredShopUpgrade.key])}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-6">{hoveredShopUpgrade.description}</div>
                    <BuildingProductionDetails state={state} upgrade={hoveredShopUpgrade} />
                  </div>
                ) : null}
                {hoveredPowerUp ? (
                  <div
                    className="pointer-events-none fixed z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block"
                    style={tooltipStyle}
                  >
                    <div className="flex items-center gap-3">
                      <Image src={hoveredPowerUp.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                      <div>
                        <div className="text-base font-black">{hoveredPowerUp.name}</div>
                        <div className="text-xs font-bold text-[#C2410C]">{hoveredPowerUp.effectLabel}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-6">{hoveredPowerUp.description}</div>
                    <div className="mt-3 rounded-xl bg-[#FFE7C2] px-3 py-2 text-xs font-black">
                      必要: {displayNumber(hoveredPowerUp.cost)} 筋肉
                    </div>
                    <PowerUpgradeDetails state={state} powerUp={hoveredPowerUp} />
                  </div>
                ) : null}
                {hoveredMystery ? (
                  <div
                    className="pointer-events-none fixed z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block"
                    style={tooltipStyle}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A140B] text-2xl font-black text-[#FFE7C2]">
                        ?
                      </div>
                      <div>
                        <div className="text-base font-black">{hoveredMystery.name}</div>
                        <div className="text-xs font-bold text-[#C2410C]">{hoveredMystery.unlockHint}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-6">{hoveredMystery.description}</div>
                  </div>
                ) : null}
              </div>
            </aside>

            <section className={`${mobilePanel === "stats" ? "block" : "hidden"} bg-[#FFF7EB] p-4 text-[#7C2D12] md:hidden`}>
              <div className="rounded-3xl border-2 border-[#FDBA74] bg-white p-4 shadow-xl">
                <h2 className="text-2xl font-black">統計・セーブ</h2>
                <div className="mt-4 grid gap-3">
                  {[
                    ["現在", displayNumber(state.muscle)],
                    ["累計", displayNumber(state.totalMuscle)],
                    ["毎秒", `+${formatRate(perSecond)}`],
                    ["クリック", `+${displayNumber(clickPower)}`],
                    ["手作り筋肉", displayNumber(state.handMadeMuscle)],
                    ["クリック数", formatFullNumber(state.clickCount)],
                    ["設備数", formatFullNumber(ownedUpgradeCount)],
                    ["設備レベル", formatFullNumber(totalBuildingLevel)],
                    ["筋肉結晶", `${formatFullNumber(state.muscleCrystals)}個`],
                    ["遺産ポイント", `${formatFullNumber(availableLegacyPoints)} / ${formatFullNumber(state.prestigeLevel)}`],
                    ["実績", `${state.unlockedAchievements.length}/${achievements.length}`],
                    ["季節イベント", seasonalEvent.name],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#FFF4E7] px-4 py-3">
                      <div className="text-xs font-black text-[#C2410C]">{label}</div>
                      <div className="mt-1 break-words text-lg font-black">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-[#FFF4E7] p-4">
                  <div className="text-sm font-black text-[#7C2D12]">{proteinShakeName}</div>
                  <div className="macho-shake-meter mt-3" style={{ "--shake-level": `${proteinShakeLevel}%` } as CSSProperties}>
                    <div className="macho-shake-fill" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#9A3412]">
                    実績 {state.unlockedAchievements.length}/{achievements.length} / 実績サポート x
                    {achievementSupportMultiplier.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-[#FFF4E7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-[#7C2D12]">筋肉結晶</div>
                      <div className="mt-1 text-xs font-bold text-[#9A3412]">次の収穫: {getNextMuscleCrystalText(state.nextMuscleCrystalAt)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={harvestMuscleCrystal}
                      disabled={!canHarvestMuscleCrystal}
                      className="rounded-xl bg-[#FF8A23] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-[#D6A169]"
                    >
                      収穫
                    </button>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-[#FFF4E7] p-4">
                  <div className="text-sm font-black text-[#7C2D12]">表示設定</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNumberNotation("short")}
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        numberNotation === "short" ? "bg-[#FF8A23] text-white" : "bg-white text-[#7C2D12]"
                      }`}
                    >
                      英語
                    </button>
                    <button
                      type="button"
                      onClick={() => setNumberNotation("japanese")}
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        numberNotation === "japanese" ? "bg-[#FF8A23] text-white" : "bg-white text-[#7C2D12]"
                      }`}
                    >
                      日本語
                    </button>
                    <button
                      type="button"
                      onClick={() => setNumberNotation("full")}
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        numberNotation === "full" ? "bg-[#FF8A23] text-white" : "bg-white text-[#7C2D12]"
                      }`}
                    >
                      全桁
                    </button>
                    <button
                      type="button"
                      onClick={() => setReducedEffects((current) => !current)}
                      className={`col-span-3 rounded-xl px-3 py-2 text-xs font-black ${
                        reducedEffects ? "bg-[#7C2D12] text-white" : "bg-white text-[#7C2D12]"
                      }`}
                    >
                      軽量モード {reducedEffects ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button type="button" onClick={manualSave} className="rounded-2xl bg-[#7C2D12] px-3 py-3 text-xs font-black text-white">
                    保存
                  </button>
                  <button type="button" onClick={exportSave} className="rounded-2xl bg-[#FF8A23] px-3 py-3 text-xs font-black text-white">
                    Export
                  </button>
                  <button type="button" onClick={importSave} className="rounded-2xl bg-[#C2410C] px-3 py-3 text-xs font-black text-white">
                    Import
                  </button>
                </div>
                {saveMessage ? <p className="mt-3 text-sm font-bold text-[#C2410C]">{saveMessage}</p> : null}
              </div>
            </section>
          </section>

          <section className="macho-stats-panel hidden gap-4 rounded-[28px] border border-[#FCD27B]/60 bg-[#2A140B]/90 p-4 text-white shadow-2xl md:mx-2 md:grid md:grid-cols-4 xl:mx-3 xl:grid-cols-7">
            <div className="macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="macho-ui-label">Game Panels</div>
                  <div className="mt-1 text-sm font-bold text-white/70">
                    必要な情報だけ開けるように整理しました。普段は概要だけ見れば進行できます。
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 xl:w-[46rem] xl:grid-cols-6">
                  {desktopDetailPanels.map((panel) => (
                    <button
                      key={panel.key}
                      type="button"
                      onClick={() => setDesktopDetailPanel(panel.key)}
                      className={`macho-game-button rounded-2xl border px-3 py-3 text-left transition ${
                        desktopDetailPanel === panel.key
                          ? "border-[#FFB45D] bg-[#FF8A23] text-white shadow-[0_0_24px_rgba(255,138,35,0.28)]"
                          : "border-white/10 bg-white/10 text-white/75 hover:border-[#FFB45D] hover:bg-white/15"
                      }`}
                    >
                      <span className="block text-sm font-black">{panel.label}</span>
                      <span className="mt-1 block text-[10px] font-bold leading-4 opacity-75">{panel.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Achievements</div>
              <div className="macho-ui-number mt-1 text-2xl">{state.unlockedAchievements.length}/{achievements.length}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" || desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Protein Shake</div>
              <div className="mt-1 text-lg font-black">{proteinShakeName}</div>
              <div className="macho-shake-meter mt-3" style={{ "--shake-level": `${proteinShakeLevel}%` } as CSSProperties}>
                <div className="macho-shake-fill" />
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Upgrades</div>
              <div className="macho-ui-number mt-1 text-2xl">{ownedUpgradeCount}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" || desktopDetailPanel === "legacy" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Prestige</div>
              <div className="macho-ui-number mt-1 text-2xl">+{state.prestigeLevel}%</div>
              <div className="mt-1 text-xs font-bold text-white/70">未使用 {formatFullNumber(availableLegacyPoints)}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Hand-made</div>
              <div className="macho-ui-number mt-1 text-2xl">{displayNumber(state.handMadeMuscle)}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Ascensions</div>
              <div className="macho-ui-number mt-1 text-2xl">{formatFullNumber(state.ascensionCount)}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Season</div>
              <div className="mt-1 flex items-center gap-2 text-lg font-black">
                <span className="rounded-lg bg-[#FF8A23] px-2 py-1 text-xs text-white">{seasonalEvent.icon}</span>
                <span>{seasonalEvent.name}</span>
              </div>
              <div className="mt-1 text-xs font-bold text-white/70">{seasonalEvent.bonusLabel}</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" || desktopDetailPanel === "levels" ? "" : "hidden"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="macho-ui-label">Muscle Crystal</div>
                  <div className="macho-ui-number mt-1 text-2xl">{formatFullNumber(state.muscleCrystals)}個</div>
                  <div className="mt-1 text-xs font-bold text-white/70">次の収穫: {getNextMuscleCrystalText(state.nextMuscleCrystalAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={harvestMuscleCrystal}
                  disabled={!canHarvestMuscleCrystal}
                  className="macho-game-button rounded-2xl bg-[#FF8A23] px-4 py-3 text-sm font-black text-white transition disabled:bg-white/10 disabled:text-white/35"
                >
                  収穫
                </button>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" || desktopDetailPanel === "levels" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Building Level</div>
              <div className="macho-ui-number mt-1 text-2xl">{formatFullNumber(totalBuildingLevel)}</div>
              <div className="mt-1 text-xs font-bold text-white/70">設備Lv1ごとに対象設備 +1%</div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "overview" || desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Unlocked</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {achievements.slice(0, 6).map((achievement) => {
                  const unlocked = state.unlockedAchievements.includes(achievement.key);
                  return (
                    <span
                      key={achievement.key}
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        unlocked ? "bg-[#FF8A23] text-white" : "bg-white/10 text-white/35"
                      }`}
                    >
                      {unlocked ? achievement.title : "？？？"}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className={`macho-cat-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" || desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="flex items-start gap-3">
                <div className="macho-cat-icon" aria-hidden="true">
                  <span />
                </div>
                <div className="min-w-0">
                  <div className="macho-ui-label">Macho Cat Support</div>
                  <div className="mt-1 text-lg font-black text-[#FFE7C2]">
                    x{achievementSupportMultiplier.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}
                  </div>
                  <div className="mt-1 text-xs font-bold text-white/70">
                    取得済み {purchasedSupportPowerUps.length}/3 / 実績で毎秒生産を強化
                  </div>
                </div>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Achievement Categories</div>
              <div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-7">
                {achievementCategoryCounts.map((item) => (
                  <div key={item.category} className="macho-achievement-category rounded-2xl px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="macho-achievement-icon">{item.icon}</span>
                      <div>
                        <div className="macho-ui-label">{item.category}</div>
                        <div className="macho-ui-number mt-1 text-lg">
                          {item.unlocked}/{item.total}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "legacy" ? "" : "hidden"}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="macho-ui-label">Machoda Legacy</div>
                  <div className="mt-1 text-sm font-bold text-white/75">
                    仕上げ直しで得た永久倍率を使って、周回後も残る便利効果を解放します。
                  </div>
                </div>
                <div className="macho-dark-card rounded-2xl px-4 py-3 text-sm font-black text-[#FFE7C2]">
                  使用可能 {formatFullNumber(availableLegacyPoints)} / 合計 {formatFullNumber(state.prestigeLevel)}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {legacyUpgrades.map((legacy) => {
                  const purchased = state.legacyUpgrades.includes(legacy.id);
                  const unlocked = legacy.unlock(state);
                  const canBuy = !purchased && unlocked && availableLegacyPoints >= legacy.cost;
                  return (
                    <button
                      key={legacy.id}
                      type="button"
                      onClick={() => buyLegacyUpgrade(legacy)}
                      disabled={!canBuy}
                      data-shop-state={purchased ? "owned" : canBuy ? "purchasable" : "unavailable"}
                      className={`macho-game-button macho-shop-card rounded-2xl border px-4 py-4 text-left transition ${
                        purchased
                          ? "border-[#FFB45D] bg-[#FF8A23] text-white shadow-[0_0_24px_rgba(255,138,35,0.32)]"
                          : canBuy
                          ? "border-[#FFB45D] bg-[#1E1009] text-white hover:-translate-y-0.5 hover:border-white"
                          : "border-white/10 bg-[#1E1009]/70 text-white/45"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-base font-black">{purchased ? `${legacy.name} 済` : legacy.name}</div>
                        <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-black">{legacy.cost}</div>
                      </div>
                      <div className="mt-2 text-xs font-black text-[#FFE7C2]">{legacy.effectLabel}</div>
                      <div className="mt-2 text-xs font-bold leading-5 opacity-80">
                        {unlocked ? legacy.description : "永久倍率が足りると解放されます。"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "levels" ? "" : "hidden"}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="macho-ui-label">Building Levels</div>
                  <div className="mt-1 text-sm font-bold text-white/75">
                    筋肉結晶を1個使って、所有済み設備を1レベル上げられます。
                  </div>
                </div>
                <div className="grid max-h-72 flex-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-4">
                  {upgrades.map((upgrade) => {
                    const canLevelUp = state.muscleCrystals > 0 && state.upgrades[upgrade.key] > 0;
                    return (
                      <button
                        key={`building-level-${upgrade.key}`}
                        type="button"
                        onClick={() => levelUpBuilding(upgrade)}
                        disabled={!canLevelUp}
                        data-shop-state={canLevelUp ? "purchasable" : "unavailable"}
                        className="macho-game-button macho-shop-card flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1E1009] px-3 py-3 text-left transition hover:border-[#FFB45D] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Image src={upgrade.spriteSrc} alt="" width={38} height={38} className="h-9 w-9 object-contain" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{upgrade.name}</span>
                          <span className="mt-1 block text-xs font-bold text-white/70">
                            所持 {state.upgrades[upgrade.key]} / 設備Lv.{state.buildingLevels[upgrade.key]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-3 ${desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Golden History</div>
              <div className="mt-1 text-sm font-bold text-white/70">獲得回数 {formatFullNumber(state.goldenClicks)}回</div>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {state.goldenHistory.length === 0 ? (
                  <div className="macho-dark-card rounded-2xl px-4 py-3 text-sm font-bold text-white/55">
                    ゴールデンプロテインを取ると履歴が残ります。
                  </div>
                ) : (
                  state.goldenHistory.map((entry) => (
                    <div key={entry.id} className="macho-dark-card rounded-2xl px-4 py-3">
                      <div className="text-sm font-black">{entry.name}</div>
                      <div className="mt-1 text-xs font-bold text-white/70">{entry.detail}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-4 ${desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Achievement List</div>
              <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                {achievements.map((achievement) => {
                  const unlocked = state.unlockedAchievements.includes(achievement.key);
                  return (
                    <div
                      key={`achievement-list-${achievement.key}`}
                      data-shop-state={unlocked ? "owned" : "locked"}
                      className={`macho-shop-card rounded-2xl border px-4 py-3 ${
                        unlocked ? "border-[#FFB45D] bg-[#1E1009]" : "border-white/10 bg-[#1E1009]/70 text-white/45"
                      }`}
                    >
                      <div className="text-sm font-black">{unlocked ? achievement.title : "？？？"}</div>
                      <div className="mt-1 text-xs font-bold">{unlocked ? achievement.description : "条件達成で解放"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-7 ${desktopDetailPanel === "save" ? "" : "hidden"}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="macho-ui-label">Options / Save Data</div>
                  <div className="mt-1 text-sm font-bold text-white/80">
                    オートセーブ対応。必要なら手動保存・エクスポート・インポートできます。
                  </div>
                  {saveMessage ? <div className="mt-2 text-sm font-black text-[#FFE7C2]">{saveMessage}</div> : null}
                </div>
                <div className="grid grid-cols-2 gap-2 lg:w-[38rem] xl:grid-cols-5">
                  <button
                    type="button"
                    onClick={() =>
                      setNumberNotation((current) => (current === "short" ? "japanese" : current === "japanese" ? "full" : "short"))
                    }
                    className="macho-game-button rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    表示 {numberNotation === "short" ? "英語" : numberNotation === "japanese" ? "日本語" : "全桁"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReducedEffects((current) => !current)}
                    className="macho-game-button rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    軽量 {reducedEffects ? "ON" : "OFF"}
                  </button>
                  <button type="button" onClick={manualSave} className="macho-game-button rounded-2xl bg-[#7C2D12] px-4 py-3 text-sm font-black text-white transition hover:bg-[#9A3412]">
                    保存
                  </button>
                  <button type="button" onClick={exportSave} className="macho-game-button rounded-2xl bg-[#FF8A23] px-4 py-3 text-sm font-black text-white transition hover:bg-[#f57200]">
                    Export
                  </button>
                  <button type="button" onClick={importSave} className="macho-game-button rounded-2xl bg-[#C2410C] px-4 py-3 text-sm font-black text-white transition hover:bg-[#9A3412]">
                    Import
                  </button>
                </div>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "benchmarks" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Balance Benchmarks</div>
              <div className="mt-2 text-sm font-bold text-white/75">
                1秒1クリックで自動購入した場合の目安です。Cookie Clicker 実測値と比較して難易度調整に使います。
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-4">
                {balanceBenchmarks.map((benchmark) => {
                  const owned = getOwnedUpgradeCount(benchmark.upgrades);
                  const target = getCookieBenchmarkTarget(benchmark.minutes);
                  const perSecondStatus = target ? getRangeStatus(benchmark.perSecond, target.perSecondRange) : "-";
                  const ownedStatus = target ? getRangeStatus(owned, target.ownedRange) : "-";
                  return (
                    <div key={benchmark.minutes} className="macho-dark-card rounded-2xl px-4 py-3">
                      <div className="text-xs font-black text-[#FFB45D]">{benchmark.minutes}分</div>
                      <div className="mt-1 text-lg font-black">{displayNumber(benchmark.muscle)}</div>
                      <div className="mt-1 text-xs font-bold text-white/70">毎秒 +{displayNumber(benchmark.perSecond)}</div>
                      <div className="mt-1 text-xs font-bold text-white/70">設備 {owned}個</div>
                      {target ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-white/70">
                          <div className="font-black text-white">Cookie型目安</div>
                          <div>
                            毎秒 {formatRate(target.perSecondRange[0])}〜{formatRate(target.perSecondRange[1])}: {perSecondStatus}
                          </div>
                          <div>
                            設備 {target.ownedRange[0]}〜{target.ownedRange[1]}個: {ownedStatus}
                          </div>
                          <div className="mt-1 text-white/55">{target.focus}</div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="macho-dark-card rounded-2xl px-4 py-3">
                  <div className="text-sm font-black text-[#FFB45D]">建物購入数チェックポイント</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {buildingCountCheckpoints.map((checkpoint) => (
                      <div key={checkpoint.owned} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs font-black text-white/60">設備 {checkpoint.owned}個</div>
                        <div className="mt-1 text-base font-black text-white">
                          {checkpoint.minute === null ? `${BALANCE_MAX_MINUTES}分超` : `${checkpoint.minute}分`}
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-white/60">毎秒 +{displayNumber(checkpoint.perSecond)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="macho-dark-card rounded-2xl px-4 py-3">
                  <div className="text-sm font-black text-[#FFB45D]">倍率上限</div>
                  <div className="mt-3 space-y-2 text-xs font-bold leading-5 text-white/70">
                    <div>仕上げ直し: 最大 x{MAX_PRESTIGE_MULTIPLIER}</div>
                    <div>設備レベル: 1設備あたり最大 x{MAX_BUILDING_LEVEL_MULTIPLIER}</div>
                    <div>実績サポート: 最大 x{MAX_ACHIEVEMENT_SUPPORT_MULTIPLIER}</div>
                    <div>検証条件: 1秒{BALANCE_CLICKS_PER_SECOND}クリック / 自動購入</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="macho-ranking-panel mx-0 grid gap-6 rounded-[30px] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur md:mx-2 lg:grid-cols-[360px_1fr] xl:mx-3 sm:p-8">
            <div>
              <h2 className="text-2xl font-black text-[#7C2D12]">ランキング登録</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">累計筋肉ポイントをランキングに登録できます。</p>
              <div className="mt-5 flex flex-col gap-3">
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={12}
                  placeholder="ニックネーム"
                  className="rounded-2xl border border-[#FCD27B] px-4 py-3 text-sm text-slate-700 focus:border-[#FF8A23] focus:outline-none focus:ring-2 focus:ring-[#FF8A23]/30"
                />
                <button
                  type="button"
                  onClick={submitRanking}
                  disabled={state.totalMuscle <= 0}
                  className="rounded-2xl bg-[#FF8A23] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f57200] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ランキングに登録
                </button>
                {rankingMessage ? <p className="text-sm text-[#9A3412]">{rankingMessage}</p> : null}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#7C2D12]">全国マッチョランキング</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-[#FCD27B]">
                {rankings.length === 0 ? (
                  <div className="bg-[#FFF7EB] p-6 text-sm text-slate-600">まだランキングがありません。</div>
                ) : (
                  <ol className="divide-y divide-[#FCD27B] bg-white">
                    {rankings.slice(0, 10).map((entry, index) => (
                      <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE7C2] text-sm font-black text-[#9A3412]">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-700">{entry.nickname}</span>
                        </div>
                        <span className="text-sm font-black text-[#7C2D12]">{displayNumber(entry.score)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
