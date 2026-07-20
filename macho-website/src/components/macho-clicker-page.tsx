"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePressActivation } from "@/hooks/use-press-activation";

const finalCharacterImageSrc = "/picture/man.png";
const STORAGE_KEY = "machoda:macho-clicker:v3";
const PREFERENCES_KEY = "machoda:macho-clicker:preferences:v1";
const ONBOARDING_KEY = "machoda:macho-clicker:onboarding:v1";
const SAVE_INTERVAL_MS = 1000;
const GAME_TICK_MS = 50;
const NUMBER_ANIMATION_MS = 420;
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
const GOLDEN_HISTORY_LIMIT = 12;
const LEGACY_STARTING_MUSCLE = 100;
const FOCUS_MAX_CHARGES = 3;
const FOCUS_RECHARGE_MS = 30 * 60 * 1000;
const FOCUS_DURATION_MS = 5 * 60 * 1000;
const FOCUS_PRODUCTION_MULTIPLIER = 1.5;
const FLOATING_GAIN_LIMIT = 28;
const SPARK_LIMIT = 96;

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
  productionMultiplier?: number;
  clickBonus?: number;
  clickMultiplier?: number;
  clickCpsPercent?: number;
  goldenMultiplier?: number;
  goldenSpawnMultiplier?: number;
  goldenDurationMultiplier?: number;
  achievementSupportRate?: number;
  unlock: (state: GameState) => boolean;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
  handMadeMuscle: number;
  clickCount: number;
  bodyEvolutionStage: number;
  upgrades: Record<UpgradeKey, number>;
  buildingLevels: Record<UpgradeKey, number>;
  muscleCrystals: number;
  crystalResearch: string[];
  nextMuscleCrystalAt: number;
  focusCharges: number;
  focusChargeUpdatedAt: number;
  goldenClicks: number;
  goldenHistory: GoldenHistoryEntry[];
  legacyUpgrades: string[];
  purchasedPowerUps: string[];
  activeBuffs: ActiveBuff[];
  prestigeLevel: number;
  ascensionCount: number;
  playStartedAt: number;
  lastSavedAt: number;
  unlockedAchievements: string[];
  dailyTrainingPlanId: TrainingPlanId | null;
  dailyTrainingDate: string | null;
  dailySupplementIds: SupplementId[];
  dailySupplementDate: string | null;
  dailyConditionId: DailyConditionId | null;
  dailyConditionDate: string | null;
};

type RankingEntry = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
};

type TooltipPosition = {
  x: number;
  y: number;
};

type GamePreferences = {
  soundEnabled: boolean;
  reducedEffects: boolean;
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
type DesktopDetailPanel = "overview" | "daily" | "achievements" | "legacy" | "levels" | "stats" | "save";
type GameOverlay = "menu" | "achievements" | "community" | null;

type SoundType = "click" | "buy" | "blocked" | "achievement" | "goldenSpawn" | "goldenCollect";

type NumberNotation = "short" | "japanese" | "full";
type EffectDensity = "low" | "normal" | "high";
type EquipmentDisplayMode = "compact" | "normal" | "dense";

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
  variant: LimitedEvent["id"] | "standard";
};

type ActiveBuff = {
  id: string;
  type: "frenzy" | "clickFrenzy" | "buildingFrenzy" | "focus";
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

type SeasonalTheme = {
  shellClass: string;
  stageLabel: string;
  accentClass: string;
};

type LimitedEvent = {
  id: "newYear" | "valentine" | "halloween" | "christmas";
  name: string;
  description: string;
  icon: string;
  productionMultiplier: number;
  clickMultiplier: number;
  bonusLabel: string;
  goldenLabel: string;
};

const goldenVariantDetails: Record<GoldenProtein["variant"], { badge: string; className: string }> = {
  standard: { badge: "", className: "macho-golden-standard" },
  newYear: { badge: "初", className: "macho-golden-new-year" },
  valentine: { badge: "♥", className: "macho-golden-valentine" },
  halloween: { badge: "☾", className: "macho-golden-halloween" },
  christmas: { badge: "★", className: "macho-golden-christmas" },
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

type BodyPartKey = "chest" | "back" | "legs" | "shoulders" | "arms" | "abs";
type TrainingPlanId = "chest" | "back" | "legs" | "shoulders" | "arms" | "abs" | "off";
type SupplementId = "protein" | "creatine" | "preworkout";
type DailyConditionId = "normal" | "drunk" | "hangover";

type TrainingPlan = {
  id: TrainingPlanId;
  label: string;
  description: string;
  targetParts: BodyPartKey[];
  multiplier: number;
  bonusLabel: string;
};

type SupplementDefinition = {
  id: SupplementId;
  label: string;
  description: string;
  productionMultiplier: number;
  clickMultiplier: number;
  bonusLabel: string;
};

type DailyConditionDefinition = {
  id: DailyConditionId;
  label: string;
  description: string;
  productionMultiplier: number;
  clickMultiplier: number;
  bonusLabel: string;
};

type GoldenEffect = {
  id: "lucky" | "frenzy" | "clickFrenzy" | "buildingFrenzy" | "jackpot";
  weight: number;
  unlock?: (state: GameState) => boolean;
};

type LegacyUpgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effectLabel: string;
  unlock: (state: GameState) => boolean;
};

type CrystalResearch = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effectLabel: string;
  icon: string;
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
    spriteSrc: "/game/macho-clicker/icons/macho-cat.svg",
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

const trainingPlans: TrainingPlan[] = [
  {
    id: "chest",
    label: "胸の日",
    description: "ベンチプレス中心。胸と腕の伸びを少し後押しします。",
    targetParts: ["chest", "arms"],
    multiplier: 1.04,
    bonusLabel: "胸・腕成長 + 生産 +4%",
  },
  {
    id: "back",
    label: "背中の日",
    description: "デッドリフトとローイング。背中と腹筋の伸びを少し後押しします。",
    targetParts: ["back", "abs"],
    multiplier: 1.04,
    bonusLabel: "背中・腹筋成長 + 生産 +4%",
  },
  {
    id: "legs",
    label: "脚の日",
    description: "スクワット中心。脚と肩の伸びを少し後押しします。",
    targetParts: ["legs", "shoulders"],
    multiplier: 1.04,
    bonusLabel: "脚・肩成長 + 生産 +4%",
  },
  {
    id: "shoulders",
    label: "肩の日",
    description: "サイドレイズ中心。肩と腕の伸びを少し後押しします。",
    targetParts: ["shoulders", "arms"],
    multiplier: 1.035,
    bonusLabel: "肩・腕成長 + 生産 +3.5%",
  },
  {
    id: "arms",
    label: "腕の日",
    description: "二頭筋と三頭筋。腕の伸びを重点的に後押しします。",
    targetParts: ["arms"],
    multiplier: 1.03,
    bonusLabel: "腕成長 + 生産 +3%",
  },
  {
    id: "abs",
    label: "腹筋ローラーの日",
    description: "マチョ田らしい腹筋ローラー特化。腹筋の伸びを重点的に後押しします。",
    targetParts: ["abs"],
    multiplier: 1.03,
    bonusLabel: "腹筋成長 + 生産 +3%",
  },
  {
    id: "off",
    label: "オフ or 有酸素",
    description: "回復もトレーニング。生産は少しだけ下がる代わりに全身がじわっと伸びます。",
    targetParts: ["chest", "back", "legs", "shoulders", "arms", "abs"],
    multiplier: 0.98,
    bonusLabel: "全身成長 / 生産 -2%",
  },
];

const supplementDefinitions: SupplementDefinition[] = [
  {
    id: "protein",
    label: "プロテイン",
    description: "長期の土台。筋肉ポイントの自動生産を少し伸ばします。",
    productionMultiplier: 1.025,
    clickMultiplier: 1,
    bonusLabel: "自動生産 +2.5%",
  },
  {
    id: "creatine",
    label: "クレアチン",
    description: "パワーの底上げ。クリックと自動生産の両方を少し伸ばします。",
    productionMultiplier: 1.02,
    clickMultiplier: 1.04,
    bonusLabel: "クリック +4% / 自動生産 +2%",
  },
  {
    id: "preworkout",
    label: "プレワークアウト",
    description: "短期集中用。クリック時の伸びを大きめに上げます。",
    productionMultiplier: 1,
    clickMultiplier: 1.08,
    bonusLabel: "クリック +8%",
  },
];

const dailyConditionDefinitions: DailyConditionDefinition[] = [
  {
    id: "normal",
    label: "通常運転",
    description: "今日は普通にトレーニングできます。余計な補正はありません。",
    productionMultiplier: 1,
    clickMultiplier: 1,
    bonusLabel: "補正なし",
  },
  {
    id: "drunk",
    label: "飲酒テンション",
    description: "変なテンションでクリックは少し伸びますが、自動生産は少し落ちます。",
    productionMultiplier: 0.97,
    clickMultiplier: 1.04,
    bonusLabel: "クリック +4% / 自動生産 -3%",
  },
  {
    id: "hangover",
    label: "二日酔い",
    description: "マチョ田らしいネタ状態。全体的に弱りますが、回復のありがたみが分かります。",
    productionMultiplier: 0.9,
    clickMultiplier: 0.95,
    bonusLabel: "クリック -5% / 自動生産 -10%",
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
    spriteSrc: "/game/macho-clicker/icons/macho-cat.svg",
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
    id: "golden-scout",
    name: "ゴールデン探索隊",
    description: "ゴールデンプロテインの出現間隔が少し短くなります。見つける回数を増やすための中盤強化です。",
    cost: 3_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "黄金の出現間隔 -12%",
    goldenSpawnMultiplier: 0.88,
    unlock: (state) => state.goldenClicks >= 3 && getPerSecond(state) >= 100,
  },
  {
    id: "golden-shaker",
    name: "黄金シェイカー",
    description: "ゴールデンプロテインで得られる即時報酬をさらに増やします。",
    cost: 25_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "黄金報酬 x1.5",
    goldenMultiplier: 1.5,
    unlock: (state) => state.goldenClicks >= 10 && state.totalMuscle >= 5_000_000,
  },
  {
    id: "pump-timer",
    name: "パンプタイマー",
    description: "ゴールデンプロテイン由来のパンプアップ効果が長く続きます。",
    cost: 250_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "黄金効果時間 x1.25",
    goldenDurationMultiplier: 1.25,
    unlock: (state) => state.goldenClicks >= 25 && getPerSecond(state) >= 10_000,
  },
  {
    id: "golden-lab-pass",
    name: "黄金ラボ会員証",
    description: "ゴールデンプロテインの報酬と出現頻度をまとめて強化します。",
    cost: 5_000_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/golden-protein.png",
    effectLabel: "黄金報酬 x1.5 / 出現間隔 -8%",
    goldenMultiplier: 1.5,
    goldenSpawnMultiplier: 0.92,
    unlock: (state) => state.goldenClicks >= 50 && state.totalMuscle >= 1_000_000_000,
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
    spriteSrc: "/game/macho-clicker/icons/macho-cat.svg",
    effectLabel: "実績1個ごとに +0.5%",
    achievementSupportRate: 0.005,
    unlock: (state) => state.unlockedAchievements.length >= 50,
  },
  {
    id: "season-winter-bulk-meal",
    name: "冬の増量ミール",
    description: "冬の増量期だけ解放される限定アップグレード。買うと以後も全体生産が少し伸びます。",
    cost: 1_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/high-protein-meal.png",
    effectLabel: "全体生産 x1.04",
    productionMultiplier: 1.04,
    unlock: (state) => getSeasonalEvent().id === "winter" && state.totalMuscle >= 250_000,
  },
  {
    id: "season-spring-gym-pass",
    name: "春の入会パス",
    description: "春だけ出る限定アップグレード。新規トレーニーの勢いで全体生産を少し伸ばします。",
    cost: 750_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/gym.png",
    effectLabel: "全体生産 x1.03",
    productionMultiplier: 1.03,
    unlock: (state) => getSeasonalEvent().id === "spring" && state.totalMuscle >= 100_000,
  },
  {
    id: "season-summer-cutting-tank",
    name: "夏の仕上げタンクトップ",
    description: "夏だけ出る限定アップグレード。クリックのキレと全体生産を少し伸ばします。",
    cost: 900_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/final-macho.png",
    effectLabel: "クリック x1.05 / 全体生産 x1.02",
    clickMultiplier: 1.05,
    productionMultiplier: 1.02,
    unlock: (state) => getSeasonalEvent().id === "summer" && state.totalMuscle >= 150_000,
  },
  {
    id: "season-autumn-bulk-pass",
    name: "秋のバルク予約券",
    description: "秋だけ出る限定アップグレード。重量を伸ばす季節の恒久ボーナスです。",
    cost: 850_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/barbell-rack.png",
    effectLabel: "全体生産 x1.035",
    productionMultiplier: 1.035,
    unlock: (state) => getSeasonalEvent().id === "autumn" && state.totalMuscle >= 150_000,
  },
  {
    id: "silent-pump-protocol",
    name: "静寂のパンプ法",
    description: "クリックを抑えて自動生産を育てた人だけが見つけられる隠しアップグレードです。",
    cost: 5_000_000,
    spriteSrc: "/game/macho-clicker/icons/generated-v3/muscle-console.png",
    effectLabel: "全体生産 x1.02",
    productionMultiplier: 1.02,
    unlock: (state) => state.unlockedAchievements.includes("shadow-low-click"),
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
const isV2CorePowerUpgrade = (powerUp: PowerUpgrade) =>
  !powerUp.achievementSupportRate && !powerUp.id.startsWith("season-");

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
  {
    key: "shadow-low-click",
    category: "隠し",
    title: "静かなる増量",
    description: "100クリック以下で累計1 million筋肉ポイントに到達",
    isUnlocked: (state) => state.totalMuscle >= 1_000_000 && state.clickCount <= 100,
  },
  {
    key: "shadow-speed-run",
    category: "隠し",
    title: "10分パンプ",
    description: "プレイ開始10分以内に累計100,000筋肉ポイントへ到達",
    isUnlocked: (state) => state.totalMuscle >= 100_000 && Date.now() - state.playStartedAt <= 10 * 60 * 1000,
  },
  {
    key: "shadow-hangover",
    category: "隠し",
    title: "二日酔いでもやる",
    description: "二日酔いの日に500回クリックした",
    isUnlocked: (state) => getActiveDailyCondition(state)?.id === "hangover" && state.clickCount >= 500,
  },
  {
    key: "shadow-crystal-hoarder",
    category: "隠し",
    title: "結晶コレクター",
    description: "筋肉結晶を10個ためた",
    isUnlocked: (state) => state.muscleCrystals >= 10,
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
  {
    key: "limited-new-year",
    category: "隠し",
    title: "初パンプ",
    description: "初パンプ祭の期間にプレイした",
    isUnlocked: () => getLimitedEvent()?.id === "newYear",
  },
  {
    key: "limited-valentine",
    category: "隠し",
    title: "甘党トレーニー",
    description: "チョコパンプ週間の期間にプレイした",
    isUnlocked: () => getLimitedEvent()?.id === "valentine",
  },
  {
    key: "limited-halloween",
    category: "隠し",
    title: "夜ジムの住人",
    description: "ハロウィン増量祭の期間にプレイした",
    isUnlocked: () => getLimitedEvent()?.id === "halloween",
  },
  {
    key: "limited-christmas",
    category: "隠し",
    title: "ホリデーパンプ",
    description: "クリスマス増量期の期間にプレイした",
    isUnlocked: () => getLimitedEvent()?.id === "christmas",
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
  bodyEvolutionStage: 0,
  upgrades: emptyUpgrades,
  buildingLevels: emptyBuildingLevels,
  muscleCrystals: 0,
  crystalResearch: [],
  nextMuscleCrystalAt: Date.now() + MUSCLE_CRYSTAL_GROW_MS,
  focusCharges: FOCUS_MAX_CHARGES,
  focusChargeUpdatedAt: Date.now(),
  goldenClicks: 0,
  goldenHistory: [],
  legacyUpgrades: [],
  purchasedPowerUps: [],
  activeBuffs: [],
  prestigeLevel: 0,
  ascensionCount: 0,
  playStartedAt: Date.now(),
  lastSavedAt: Date.now(),
  unlockedAchievements: [],
  dailyTrainingPlanId: null,
  dailyTrainingDate: null,
  dailySupplementIds: [],
  dailySupplementDate: null,
  dailyConditionId: null,
  dailyConditionDate: null,
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

const crystalResearches: CrystalResearch[] = [
  {
    id: "crystal-incubator",
    name: "結晶培養器",
    description: "筋肉結晶の成長時間をさらに短縮します。設備レベルを上げるための結晶を集めやすくなります。",
    cost: 1,
    effectLabel: "結晶の成長時間 -10%",
    icon: "培",
    unlock: (state) => state.muscleCrystals >= 1 || state.ascensionCount >= 1,
  },
  {
    id: "crystal-golden-lens",
    name: "黄金レンズ",
    description: "ゴールデンプロテインを見つけやすくする結晶研究です。",
    cost: 2,
    effectLabel: "黄金の出現間隔 -8%",
    icon: "金",
    unlock: (state) => state.goldenClicks >= 3 || state.ascensionCount >= 1,
  },
  {
    id: "crystal-training-log",
    name: "トレーニング記録帳",
    description: "積み重ねた研究記録を自動生産へ還元します。",
    cost: 3,
    effectLabel: "全体生産 x1.05",
    icon: "記",
    unlock: (state) => state.unlockedAchievements.length >= 10 || state.ascensionCount >= 1,
  },
  {
    id: "crystal-focus-room",
    name: "気合い注入ルーム",
    description: "設備Lv.1で解放されるミニゲームです。チャージを使い、短時間だけ全体生産を高めます。",
    cost: 2,
    effectLabel: "気合い注入を解放",
    icon: "喝",
    unlock: (state) => Object.values(state.buildingLevels).some((level) => level >= 1),
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
  if (safeValue >= 1e93) return safeValue.toExponential(3).replace("e+", "e");

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

const formatDateTime = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) return "未保存";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safeSeconds / 86_400);
  const hours = Math.floor((safeSeconds % 86_400) / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);

  if (days > 0) return `${days}日 ${hours}時間`;
  if (hours > 0) return `${hours}時間 ${minutes}分`;
  return `${minutes}分`;
};

const japaneseNumberUnits = [
  { value: 1e16, name: "京" },
  { value: 1e12, name: "兆" },
  { value: 1e8, name: "億" },
  { value: 1e4, name: "万" },
] as const;

const formatJapaneseNumber = (value: number) => {
  const safeValue = Math.max(0, value);
  if (safeValue < 10_000) return Math.floor(safeValue).toLocaleString("ja-JP");
  if (safeValue >= 1e20) return safeValue.toExponential(3).replace("e+", "e");

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

const getGoldenSpawnMultiplier = (state: GameState) =>
  powerUpgrades.reduce(
    (total, powerUp) =>
      state.purchasedPowerUps.includes(powerUp.id) ? total * (powerUp.goldenSpawnMultiplier ?? 1) : total,
    (hasLegacyUpgrade(state, "golden-beacon") ? 0.85 : 1) * (state.crystalResearch.includes("crystal-golden-lens") ? 0.92 : 1)
  );

const getCrystalGrowMs = (state: GameState) => {
  const legacyMs = hasLegacyUpgrade(state, "crystal-gym") ? 20 * 60 * 60 * 1000 : MUSCLE_CRYSTAL_GROW_MS;
  return state.crystalResearch.includes("crystal-incubator") ? legacyMs * 0.9 : legacyMs;
};

const getGoldenSpawnMinMs = (state: GameState) => GOLDEN_SPAWN_MIN_MS * getGoldenSpawnMultiplier(state);

const getGoldenSpawnMaxMs = (state: GameState) => GOLDEN_SPAWN_MAX_MS * getGoldenSpawnMultiplier(state);

const getGoldenDurationMultiplier = (state: GameState) =>
  powerUpgrades.reduce(
    (total, powerUp) =>
      state.purchasedPowerUps.includes(powerUp.id) ? total * (powerUp.goldenDurationMultiplier ?? 1) : total,
    1
  );

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

const rechargeFocusCharges = (state: GameState, now = Date.now()): GameState => {
  if (state.focusCharges >= FOCUS_MAX_CHARGES) {
    return state.focusChargeUpdatedAt === now ? state : { ...state, focusChargeUpdatedAt: now };
  }

  const elapsed = Math.max(0, now - state.focusChargeUpdatedAt);
  const recovered = Math.floor(elapsed / FOCUS_RECHARGE_MS);
  if (recovered <= 0) return state;

  const nextCharges = Math.min(FOCUS_MAX_CHARGES, state.focusCharges + recovered);
  return {
    ...state,
    focusCharges: nextCharges,
    focusChargeUpdatedAt:
      nextCharges >= FOCUS_MAX_CHARGES ? now : state.focusChargeUpdatedAt + recovered * FOCUS_RECHARGE_MS,
  };
};

const getNextFocusChargeText = (state: GameState) => {
  if (state.focusCharges >= FOCUS_MAX_CHARGES) return "満タン";
  const remainingMs = Math.max(0, FOCUS_RECHARGE_MS - (Date.now() - state.focusChargeUpdatedAt));
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `あと${minutes}分`;
};

const getPrestigeMultiplier = (state: GameState) => Math.min(MAX_PRESTIGE_MULTIPLIER, 1 + state.prestigeLevel * PRESTIGE_BONUS_RATE);

const getFrenzyMultiplier = (state: GameState) =>
  getActiveBuffs(state).reduce(
    // V2 keeps only golden-event frenzy in the core economy. The old focus
    // minigame remains in save data but no longer changes production.
    (total, buff) => (buff.type === "frenzy" ? total * buff.multiplier : total),
    1
  );

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

const getTokyoMonthDay = (date = new Date()) => {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const valueFor = (type: "month" | "day") => Number(values.find((value) => value.type === type)?.value ?? 0);
  return { month: valueFor("month"), day: valueFor("day") };
};

const getLimitedEvent = (date = new Date()): LimitedEvent | null => {
  const { month, day } = getTokyoMonthDay(date);

  if (month === 1 && day <= 7) {
    return {
      id: "newYear",
      name: "初パンプ祭",
      description: "新年の初トレーニング期間。気合いで生産とクリックが少し伸びます。",
      icon: "初",
      productionMultiplier: 1.05,
      clickMultiplier: 1.08,
      bonusLabel: "生産 +5% / クリック +8%",
      goldenLabel: "お年玉プロテイン",
    };
  }
  if (month === 2 && day >= 10 && day <= 14) {
    return {
      id: "valentine",
      name: "チョコパンプ週間",
      description: "甘いものも筋肉へ還元する期間。クリック効率が少し伸びます。",
      icon: "CHO",
      productionMultiplier: 1.03,
      clickMultiplier: 1.1,
      bonusLabel: "生産 +3% / クリック +10%",
      goldenLabel: "チョコプロテイン",
    };
  }
  if (month === 10 && day >= 25 && day <= 31) {
    return {
      id: "halloween",
      name: "ハロウィン増量祭",
      description: "夜のジムに特別なプロテインが出現する期間です。",
      icon: "HAL",
      productionMultiplier: 1.06,
      clickMultiplier: 1.04,
      bonusLabel: "生産 +6% / クリック +4%",
      goldenLabel: "パンプキンプロテイン",
    };
  }
  if (month === 12 && day >= 20 && day <= 25) {
    return {
      id: "christmas",
      name: "クリスマス増量期",
      description: "チキンとケーキをトレーニングへ還元する特別期間です。",
      icon: "XMAS",
      productionMultiplier: 1.08,
      clickMultiplier: 1.05,
      bonusLabel: "生産 +8% / クリック +5%",
      goldenLabel: "ホリデープロテイン",
    };
  }
  return null;
};

const getSeasonalTheme = (event: SeasonalEvent): SeasonalTheme => {
  switch (event.id) {
    case "winter":
      return {
        shellClass: "macho-season-winter",
        stageLabel: "増量期ジム",
        accentClass: "from-sky-200 via-white to-blue-500",
      };
    case "spring":
      return {
        shellClass: "macho-season-spring",
        stageLabel: "入会キャンペーン",
        accentClass: "from-lime-200 via-emerald-200 to-pink-400",
      };
    case "summer":
      return {
        shellClass: "macho-season-summer",
        stageLabel: "仕上げ期ジム",
        accentClass: "from-cyan-200 via-blue-300 to-orange-400",
      };
    case "autumn":
    default:
      return {
        shellClass: "macho-season-autumn",
        stageLabel: "バルク期ジム",
        accentClass: "from-amber-200 via-orange-300 to-red-600",
      };
  }
};

const mobilePanels: { key: MobilePanel; label: string }[] = [
  { key: "click", label: "鍛える" },
  { key: "gym", label: "設備" },
  { key: "shop", label: "ショップ" },
];

const desktopDetailPanels: { key: DesktopDetailPanel; label: string; icon: string }[] = [
  { key: "overview", label: "概要", icon: "◎" },
  { key: "daily", label: "日課", icon: "日" },
  { key: "achievements", label: "実績", icon: "★" },
  { key: "legacy", label: "遺産", icon: "転" },
  { key: "levels", label: "設備Lv", icon: "晶" },
  { key: "stats", label: "統計", icon: "Σ" },
  { key: "save", label: "保存", icon: "保" },
];

const soundFiles: Record<SoundType, string> = {
  click: "/sounds/macho-clicker/click.wav",
  buy: "/sounds/macho-clicker/buy.wav",
  blocked: "/sounds/macho-clicker/blocked.wav",
  achievement: "/sounds/macho-clicker/achievement.wav",
  goldenSpawn: "/sounds/macho-clicker/golden-spawn.wav",
  goldenCollect: "/sounds/macho-clicker/golden-collect.wav",
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
    if (!isV2CorePowerUpgrade(powerUp) || !state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total + (powerUp.clickBonus ?? 0);
  }, 1);
  const clickMultiplier = powerUpgrades.reduce((total, powerUp) => {
    if (!isV2CorePowerUpgrade(powerUp) || !state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.clickMultiplier ?? 1);
  }, 1);
  const cpsClickBonus = powerUpgrades.reduce((total, powerUp) => {
    if (!isV2CorePowerUpgrade(powerUp) || !state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total + getPerSecond(state) * (powerUp.clickCpsPercent ?? 0);
  }, 0);

  // Daily condition, supplements and limited events are paused in V2 until
  // their choices and costs are redesigned around the core loop.
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

const getPowerUpgradeProductionMultiplier = (state: GameState) =>
  powerUpgrades.reduce((total, powerUp) => {
    if (!isV2CorePowerUpgrade(powerUp) || !state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.productionMultiplier ?? 1);
  }, 1);

const getTodayKey = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

const getActiveTrainingPlan = (state: GameState) => {
  if (!state.dailyTrainingPlanId || state.dailyTrainingDate !== getTodayKey()) return null;
  return trainingPlans.find((plan) => plan.id === state.dailyTrainingPlanId) ?? null;
};

const getActiveSupplements = (state: GameState) => {
  if (state.dailySupplementDate !== getTodayKey()) return [];
  return supplementDefinitions.filter((supplement) => state.dailySupplementIds.includes(supplement.id));
};

const getActiveDailyCondition = (state: GameState) => {
  if (!state.dailyConditionId || state.dailyConditionDate !== getTodayKey()) return null;
  return dailyConditionDefinitions.find((condition) => condition.id === state.dailyConditionId) ?? null;
};

const getBasePerSecond = (state: GameState) =>
  upgrades.reduce((total, upgrade) => total + getBuildingUnitProduction(state, upgrade) * state.upgrades[upgrade.key], 0);

const getPerSecond = (state: GameState) =>
  getBasePerSecond(state) *
  getPrestigeMultiplier(state) *
  getLegacyProductionMultiplier(state) *
  getFrenzyMultiplier(state) *
  getPowerUpgradeProductionMultiplier(state);

const getOwnedUpgradeCount = (upgradeCounts: Record<UpgradeKey, number>) =>
  Object.values(upgradeCounts).reduce((total, level) => total + level, 0);

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

const bodyEvolutionStages = [
  {
    stage: 0,
    label: "生活崩壊期",
    requirement: 0,
    imageSrc: "/picture/macho-evolution/v2/stage-00-life-collapse.png",
    change: "ここからトレーニング生活が始まる",
    ring: "border-white/60 bg-[#FFE7C2]",
    scale: 0.94,
    aura: "opacity-10",
  },
  {
    stage: 1,
    label: "入会決意",
    requirement: 500,
    imageSrc: "/picture/macho-evolution/v2/stage-01-gym-decision.png",
    change: "ジムバッグを持ち、入会を決意する",
    ring: "border-white/70 bg-[#FFD89A]",
    scale: 0.96,
    aura: "opacity-25",
  },
  {
    stage: 2,
    label: "初トレーニング",
    requirement: 5_000,
    imageSrc: "/picture/macho-evolution/v2/stage-02-first-training.png",
    change: "トレーニングウェアへ着替える",
    ring: "border-white/70 bg-[#FFC46F]",
    scale: 0.98,
    aura: "opacity-40",
  },
  {
    stage: 3,
    label: "三日坊主突破",
    requirement: 25_000,
    imageSrc: "/picture/macho-evolution/v2/stage-03-habit-formed.png",
    change: "姿勢と清潔感が少し改善する",
    ring: "border-white/80 bg-[#FFB45D]",
    scale: 1,
    aura: "opacity-48",
  },
  {
    stage: 4,
    label: "細マッチョ期",
    requirement: 50_000,
    imageSrc: "/picture/macho-evolution/stage-2-athletic.png",
    change: "腹部が締まり、胸と腕に輪郭が出る",
    ring: "border-white/80 bg-[#FFB45D]",
    scale: 1.01,
    aura: "opacity-55",
  },
  {
    stage: 5,
    label: "筋トレ中級マッチョ",
    requirement: 100_000,
    imageSrc: "/picture/macho-evolution/stage-2-athletic.png",
    change: "肩幅と全身の厚みが増える",
    ring: "border-orange-100 bg-[#FFA33D]",
    scale: 1.03,
    aura: "opacity-66",
  },
  {
    stage: 6,
    label: "ゴリマッチョ目前",
    requirement: 250_000,
    imageSrc: "/picture/macho-evolution/stage-3-muscular.png",
    change: "胸・肩・脚が大きく発達する",
    ring: "border-orange-100 bg-[#FF9D2E]",
    scale: 1.05,
    aura: "opacity-75",
  },
  {
    stage: 7,
    label: "マチョ田級",
    requirement: 1_000_000,
    imageSrc: finalCharacterImageSrc,
    change: "専用ウェアと伝説の風格を得る",
    ring: "border-red-100 bg-[#FF8A23]",
    scale: 1.08,
    aura: "opacity-84",
  },
  {
    stage: 8,
    label: "完成形マチョ",
    requirement: 10_000_000,
    imageSrc: finalCharacterImageSrc,
    change: "マチョ田の最終形態へ到達する",
    ring: "border-red-100 bg-[#FF6A1A]",
    scale: 1.12,
    aura: "opacity-95",
  },
] as const;

const getUnlockedBodyEvolutionStage = (totalMuscle: number) =>
  bodyEvolutionStages.reduce((highest, stage) => (totalMuscle >= stage.requirement ? stage.stage : highest), 0);

const getBodyStage = (stage: number) =>
  bodyEvolutionStages.find((candidate) => candidate.stage === stage) ?? bodyEvolutionStages[0];

const getNewsLines = (state: GameState, title: string, perSecond: number) => {
  const seasonalEvent = getSeasonalEvent();
  const limitedEvent = getLimitedEvent();
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

  if (limitedEvent) {
    lines.unshift(`${limitedEvent.name} 開催中。${limitedEvent.description} ${limitedEvent.bonusLabel}`);
    lines.push(`${limitedEvent.goldenLabel}がジムのどこかに現れるかもしれません。`);
  }

  if (state.totalMuscle >= 50_000) lines.push("近所のジムで『あの人、仕上がってない？』という声が増えています。");
  if (state.totalMuscle >= 1_000_000) lines.push("マチョ田級の肉体が完成しつつあります。もはや歩くパワーラックです。");
  if (state.totalMuscle >= 1_000_000_000) lines.push("筋肉ポイントが billion に到達。街のジムがざわついています。");
  if (state.totalMuscle >= 1_000_000_000_000) lines.push("筋肉ポイントが trillion に到達。もはや単位が現実離れしています。");
  if (state.prestigeLevel > 0) lines.push(`仕上げ直しの効果で永久倍率が +${state.prestigeLevel}% になっています。`);
  if (state.activeBuffs.length > 0) lines.push("ゴールデン効果発動中。今すぐクリックする価値があります。");
  if (state.goldenClicks >= 1) lines.push(`ゴールデンプロテインを ${formatFullNumber(state.goldenClicks)} 回獲得。次の出現に備えてください。`);
  if (state.unlockedAchievements.length >= 10) {
    lines.push(`実績 ${formatFullNumber(state.unlockedAchievements.length)} 個を解除。プロテインシェイクが少し濃くなっています。`);
  }
  if (state.purchasedPowerUps.length >= 5) {
    lines.push(`強化 ${formatFullNumber(state.purchasedPowerUps.length)} 個を取得。ジムの自動化が進んでいます。`);
  }
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
    const labels = [`黄金報酬 x${powerUp.goldenMultiplier}`];
    if (powerUp.goldenSpawnMultiplier) labels.push(`出現間隔 -${Math.round((1 - powerUp.goldenSpawnMultiplier) * 100)}%`);
    return labels.join(" / ");
  }

  if (powerUp.goldenSpawnMultiplier) {
    return `黄金の出現間隔 -${Math.round((1 - powerUp.goldenSpawnMultiplier) * 100)}%`;
  }

  if (powerUp.goldenDurationMultiplier) {
    return `黄金効果時間 x${powerUp.goldenDurationMultiplier}`;
  }

  if (powerUp.productionMultiplier) {
    const before = getPerSecond(state);
    const after = before * powerUp.productionMultiplier;
    return `全体生産 +${formatRate(Math.max(0, after - before))}/秒`;
  }

  if (powerUp.achievementSupportRate) {
    const bonus = state.unlockedAchievements.length * powerUp.achievementSupportRate * 100;
    return `実績ボーナス +${bonus.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
  }

  return powerUp.effectLabel;
};

const getNextShopGoal = (state: GameState) =>
  upgrades
    .filter(
      (upgrade, index) => index === 0 || state.upgrades[upgrade.key] > 0 || state.totalMuscle >= upgrade.baseCost
    )
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

  if (powerUp.productionMultiplier) {
    const before = getPerSecond(state);
    const after = before * powerUp.productionMultiplier;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          現在毎秒<br />+{formatRate(before)}
        </div>
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          購入後<br />+{formatRate(after)}
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

const normalizeCrystalResearch = (value?: string[]) =>
  Array.isArray(value)
    ? value.filter((id) => crystalResearches.some((research) => research.id === id))
    : [];

const normalizeTrainingPlanId = (value: unknown): TrainingPlanId | null =>
  trainingPlans.some((plan) => plan.id === value) ? (value as TrainingPlanId) : null;

const normalizeTrainingDate = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

const normalizeSupplementIds = (value: unknown): SupplementId[] =>
  Array.isArray(value)
    ? value.filter((id): id is SupplementId => supplementDefinitions.some((supplement) => supplement.id === id))
    : [];

const normalizeDailyConditionId = (value: unknown): DailyConditionId | null =>
  dailyConditionDefinitions.some((condition) => condition.id === value) ? (value as DailyConditionId) : null;

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
      bodyEvolutionStage:
        typeof saved.bodyEvolutionStage === "number"
          ? Math.max(0, Math.min(bodyEvolutionStages.length - 1, Math.floor(saved.bodyEvolutionStage)))
          : getUnlockedBodyEvolutionStage(typeof saved.totalMuscle === "number" ? saved.totalMuscle : 0),
      upgrades: normalizeSavedUpgrades(saved.upgrades),
      buildingLevels: normalizeSavedBuildingLevels(saved.buildingLevels),
      muscleCrystals: typeof saved.muscleCrystals === "number" ? Math.max(0, Math.floor(saved.muscleCrystals)) : 0,
      crystalResearch: normalizeCrystalResearch(saved.crystalResearch),
      nextMuscleCrystalAt:
        typeof saved.nextMuscleCrystalAt === "number" ? saved.nextMuscleCrystalAt : Date.now() + MUSCLE_CRYSTAL_GROW_MS,
      focusCharges:
        typeof saved.focusCharges === "number"
          ? Math.max(0, Math.min(FOCUS_MAX_CHARGES, Math.floor(saved.focusCharges)))
          : FOCUS_MAX_CHARGES,
      focusChargeUpdatedAt:
        typeof saved.focusChargeUpdatedAt === "number" ? saved.focusChargeUpdatedAt : Date.now(),
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
              (buff.type === "frenzy" ||
                buff.type === "clickFrenzy" ||
                buff.type === "buildingFrenzy" ||
                buff.type === "focus") &&
              typeof buff.name === "string" &&
              typeof buff.multiplier === "number" &&
              typeof buff.endAt === "number" &&
              buff.endAt > Date.now()
          )
        : [],
      prestigeLevel: typeof saved.prestigeLevel === "number" ? Math.max(0, Math.floor(saved.prestigeLevel)) : 0,
      ascensionCount: typeof saved.ascensionCount === "number" ? Math.max(0, Math.floor(saved.ascensionCount)) : 0,
      playStartedAt: typeof saved.playStartedAt === "number" ? saved.playStartedAt : Date.now(),
      lastSavedAt: typeof saved.lastSavedAt === "number" ? saved.lastSavedAt : Date.now(),
      unlockedAchievements: Array.isArray(saved.unlockedAchievements) ? saved.unlockedAchievements : [],
      dailyTrainingPlanId: normalizeTrainingPlanId(saved.dailyTrainingPlanId),
      dailyTrainingDate: normalizeTrainingDate(saved.dailyTrainingDate),
      dailySupplementIds: normalizeSupplementIds(saved.dailySupplementIds),
      dailySupplementDate: normalizeTrainingDate(saved.dailySupplementDate),
      dailyConditionId: normalizeDailyConditionId(saved.dailyConditionId),
      dailyConditionDate: normalizeTrainingDate(saved.dailyConditionDate),
    };

    const offlineSeconds = Math.min(
      getOfflineLimitSeconds(normalized),
      Math.max(0, Math.floor((Date.now() - normalized.lastSavedAt) / 1000))
    );
    const recharged = rechargeFocusCharges(normalized, Date.now());
    const offlineGain = getPerSecond(recharged) * offlineSeconds;

    return {
      ...recharged,
      muscle: clampScore(recharged.muscle + offlineGain),
      totalMuscle: clampScore(recharged.totalMuscle + offlineGain),
      bodyEvolutionStage: Math.min(
        recharged.bodyEvolutionStage,
        getUnlockedBodyEvolutionStage(clampScore(recharged.totalMuscle + offlineGain))
      ),
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
  const [combo, setCombo] = useState(0);
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
  const [gameOverlay, setGameOverlay] = useState<GameOverlay>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.35);
  const [soundVolume, setSoundVolume] = useState(0.46);
  const [notificationVolume, setNotificationVolume] = useState(0.52);
  const [numberNotation, setNumberNotation] = useState<NumberNotation>("short");
  const [reducedEffects, setReducedEffects] = useState(false);
  const [effectDensity, setEffectDensity] = useState<EffectDensity>("normal");
  const [backgroundAnimationEnabled, setBackgroundAnimationEnabled] = useState(true);
  const [equipmentDisplayMode, setEquipmentDisplayMode] = useState<EquipmentDisplayMode>("normal");
  const [saveMessage, setSaveMessage] = useState("");
  const [exportedSaveText, setExportedSaveText] = useState("");
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<number | null>(null);
  const [evolutionFlash, setEvolutionFlash] = useState(false);
  const [ascensionModalOpen, setAscensionModalOpen] = useState(false);
  const effectIdRef = useRef(0);
  const stateRef = useRef<GameState>(initialState);
  const lastTickAtRef = useRef(Date.now());
  const soundRefs = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});
  const clickSoundPoolRef = useRef<HTMLAudioElement[]>([]);
  const clickSoundPoolIndexRef = useRef(0);
  const lastSoundAtRef = useRef<Partial<Record<SoundType, number>>>({});
  const characterButtonRef = useRef<HTMLButtonElement>(null);
  const clickRippleRef = useRef<HTMLSpanElement>(null);
  const comboRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const hasPlayerInteractedRef = useRef(false);
  const pendingManualClicksRef = useRef({ gain: 0, count: 0 });
  const clickAnimationFrameRef = useRef<number | null>(null);
  const touchGainSideRef = useRef(0);
  const floatingGainPoolRef = useRef<Array<HTMLDivElement | null>>([]);
  const sparkPoolRef = useRef<Array<HTMLDivElement | null>>([]);
  const nextFloatingGainSlotRef = useRef(0);
  const nextSparkSlotRef = useRef(0);
  const clickPower = useMemo(() => getClickPower(state), [state]);
  const clickPowerRef = useRef(clickPower);
  clickPowerRef.current = clickPower;
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const activeBuffs = getActiveBuffs(state);
  const activeBuildingFrenzyTargets = activeBuffs.flatMap((buff) =>
    buff.type === "buildingFrenzy" && buff.target ? [buff.target] : []
  );
  const pendingPrestige = getPendingPrestige(state);
  const seasonalEvent = getSeasonalEvent();
  const limitedEvent = getLimitedEvent();
  const goldenVariant = goldenProtein ? goldenVariantDetails[goldenProtein.variant] : goldenVariantDetails.standard;
  const seasonalTheme = getSeasonalTheme(seasonalEvent);
  const activeTrainingPlan = getActiveTrainingPlan(state);
  const activeSupplements = getActiveSupplements(state);
  const activeDailyCondition = getActiveDailyCondition(state);
  const proteinShakeLevel = getProteinShakeLevel(state.unlockedAchievements.length);
  const proteinShakeName = getProteinShakeName(state.unlockedAchievements.length);
  const achievementSupportMultiplier = getAchievementSupportMultiplier(state);
  const achievementAuraTier = Math.min(4, Math.floor(state.unlockedAchievements.length / 25));
  const title = getTitle(state.totalMuscle);
  const nextGoal = getNextTitleGoal(state.totalMuscle);
  const unlockedBodyEvolutionStage = getUnlockedBodyEvolutionStage(state.totalMuscle);
  const canBodyEvolve = state.bodyEvolutionStage < unlockedBodyEvolutionStage;
  const upcomingBodyStage =
    state.bodyEvolutionStage < bodyEvolutionStages.length - 1 ? getBodyStage(state.bodyEvolutionStage + 1) : null;
  const nextBodyStage = canBodyEvolve ? upcomingBodyStage : null;
  const titleProgress = Math.min(100, Math.max(0, (state.totalMuscle / nextGoal.value) * 100));
  const ownedUpgradeCount = Object.values(state.upgrades).reduce((total, level) => total + level, 0);
  const totalBuildingLevel = Object.values(state.buildingLevels).reduce((total, level) => total + level, 0);
  const advancedSystemsUnlocked = state.prestigeLevel > 0 || state.totalMuscle >= 1_000_000_000_000;
  const legacyPanelsVisible = state.totalMuscle < 0;
  const focusGymAvailable = totalBuildingLevel >= 1;
  const focusGymUnlocked = state.crystalResearch.includes("crystal-focus-room");
  const activeFocusBuff = activeBuffs.find((buff) => buff.type === "focus") ?? null;
  const visualOwnedUpgradeCount = visualUpgrades.reduce((total, upgrade) => total + state.upgrades[upgrade.key], 0);
  const visibleGymUpgrades = visualUpgrades.filter((upgrade) => state.upgrades[upgrade.key] > 0);
  const newsLines = getNewsLines(state, title, perSecond);
  const news = newsLines[newsIndex % newsLines.length];
  const bodyStage = getBodyStage(state.bodyEvolutionStage);
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
    (powerUp) => isV2CorePowerUpgrade(powerUp) && powerUp.unlock(state) && !state.purchasedPowerUps.includes(powerUp.id)
  );
  const purchasedPowerUps = powerUpgrades.filter(
    (powerUp) => isV2CorePowerUpgrade(powerUp) && state.purchasedPowerUps.includes(powerUp.id)
  );
  const recentPurchasedPowerUps = purchasedPowerUps.slice(-6).reverse();
  const hiddenPurchasedPowerUpCount = Math.max(0, purchasedPowerUps.length - recentPurchasedPowerUps.length);
  const displayNumber = (value: number) => formatDisplayNumber(value, numberNotation);
  const displayEquipmentLimit = equipmentDisplayMode === "compact" ? 24 : equipmentDisplayMode === "normal" ? 48 : 96;
  const animatedMuscle = useAnimatedNumber(state.muscle);
  const animatedPerSecond = useAnimatedNumber(perSecond);
  const animatedClickPower = useAnimatedNumber(clickPower);
  const nextShopGoal = getNextShopGoal(state);
  const firstLockedUpgradeIndex = upgrades.findIndex(
    (upgrade, index) => index > 0 && state.upgrades[upgrade.key] === 0 && state.totalMuscle < upgrade.baseCost
  );
  const visibleShopUpgrades = upgrades.filter(
    (upgrade, index) =>
      index === 0 ||
      state.upgrades[upgrade.key] > 0 ||
      state.totalMuscle >= upgrade.baseCost ||
      (firstLockedUpgradeIndex >= 0 && index <= firstLockedUpgradeIndex + 1)
  );
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
  const totalPlaySeconds = Math.max(0, Math.floor((Date.now() - state.playStartedAt) / 1000));
  const buildingStats = upgrades.map((upgrade) => {
    const owned = state.upgrades[upgrade.key];
    const totalProduction = getBuildingTotalProduction(state, upgrade);
    return {
      upgrade,
      owned,
      totalProduction,
      unitProduction: getBuildingUnitProduction(state, upgrade),
      percentage: perSecond > 0 ? Math.min(100, (totalProduction / perSecond) * 100) : 0,
    };
  });
  const tooltipStyle: CSSProperties = {
    left: Math.max(16, tooltipPosition.x - 360),
    top: Math.max(96, tooltipPosition.y - 28),
  };
  const onboardingStep = !isLoaded || onboardingComplete
    ? null
    : state.upgrades.pushUp > 0
      ? 2
      : state.clickCount > 0
        ? 1
        : 0;

  useEffect(() => {
    const savedState = readSavedState();
    setState(savedState);
    const onboardingWasCompleted = window.localStorage.getItem(ONBOARDING_KEY) === "complete";
    const isEstablishedSave = savedState.totalMuscle >= 100 || getOwnedUpgradeCount(savedState.upgrades) >= 2;
    setOnboardingComplete(onboardingWasCompleted || isEstablishedSave);
    try {
      const rawPreferences = window.localStorage.getItem(PREFERENCES_KEY);
      if (rawPreferences) {
        const preferences = JSON.parse(rawPreferences) as Partial<GamePreferences>;
        setSoundEnabled(preferences.soundEnabled ?? true);
        setReducedEffects(preferences.reducedEffects ?? false);
      }
    } catch {
      setSoundEnabled(true);
    }
    lastTickAtRef.current = Date.now();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || onboardingComplete || onboardingStep !== 1 || state.muscle < upgrades[0].baseCost) return;
    setMobilePanel("shop");
  }, [isLoaded, onboardingComplete, onboardingStep, state.muscle]);

  useEffect(() => {
    if (!isLoaded || onboardingComplete || onboardingStep !== 2) return;
    setMobilePanel("click");
  }, [isLoaded, onboardingComplete, onboardingStep]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sounds = Object.fromEntries(
      Object.entries(soundFiles).map(([type, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = type === "click" || type === "buy" || type === "blocked" ? soundVolume : notificationVolume;
        return [type, audio];
      })
    ) as Record<SoundType, HTMLAudioElement>;

    soundRefs.current = sounds;
    clickSoundPoolRef.current = Array.from({ length: 8 }, () => {
      const audio = new Audio(soundFiles.click);
      audio.preload = "auto";
      audio.volume = soundVolume;
      return audio;
    });
    clickSoundPoolIndexRef.current = 0;
  }, [notificationVolume, soundVolume]);

  useEffect(() => {
    if (!isLoaded) return;
    const preferences: GamePreferences = { soundEnabled, reducedEffects };
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [isLoaded, reducedEffects, soundEnabled]);

  useEffect(
    () => () => {
      if (clickAnimationFrameRef.current !== null) window.cancelAnimationFrame(clickAnimationFrameRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: now }));
      setLastAutoSaveAt(now);
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
      setState((current) => {
        const refreshed = rechargeFocusCharges(current, now);
        return {
        ...refreshed,
        muscle: clampScore(refreshed.muscle + gain),
        totalMuscle: clampScore(refreshed.totalMuscle + gain),
        activeBuffs: getActiveBuffs(refreshed),
        lastSavedAt: now,
      };
      });
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
        variant: getLimitedEvent()?.id ?? "standard",
      });
      if (soundEnabled) {
        const audio = soundRefs.current.goldenSpawn;
        if (audio) {
          const sound = audio.cloneNode(true) as HTMLAudioElement;
          sound.volume = audio.volume;
          void sound.play();
        }
      }
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
  }, [goldenSpawnMaxMs, goldenSpawnMinMs, soundEnabled]);

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
    if (hasPlayerInteractedRef.current) {
      setAchievementToast(newlyUnlocked[0]);
    }
    if (hasPlayerInteractedRef.current && soundEnabled) {
      const audio = soundRefs.current.achievement;
      if (audio) {
        const sound = audio.cloneNode(true) as HTMLAudioElement;
        sound.volume = audio.volume;
        void sound.play();
      }
    }
    if (hasPlayerInteractedRef.current) {
      window.setTimeout(() => setAchievementToast(null), 3200);
    }
  }, [state, soundEnabled]);

  const spawnClickEffects = (value: number, pointerType = "system") => {
    const sparkCount = reducedEffects ? 0 : effectDensity === "low" ? 3 : effectDensity === "high" ? 12 : 7;
    const gainX = pointerType === "touch"
      ? touchGainSideRef.current++ % 2 === 0
        ? 18 + Math.random() * 10
        : 72 + Math.random() * 10
      : 36 + Math.random() * 28;
    const gainSlot = nextFloatingGainSlotRef.current++ % FLOATING_GAIN_LIMIT;
    const gainElement = floatingGainPoolRef.current[gainSlot];
    if (gainElement) {
      gainElement.getAnimations().forEach((animation) => animation.cancel());
      gainElement.textContent = `+${displayNumber(value)}`;
      gainElement.style.left = `${gainX}%`;
      gainElement.style.top = `${26 + Math.random() * 30}%`;
      gainElement.animate(
        [
          { opacity: 0, transform: "translate(-50%, 0) scale(0.85)" },
          { opacity: 1, offset: 0.15 },
          { opacity: 0, transform: "translate(-50%, -5rem) scale(1.18)" },
        ],
        { duration: reducedEffects ? 420 : 950, easing: "ease-out", fill: "forwards" }
      );
    }

    for (let index = 0; index < sparkCount; index += 1) {
      const sparkSlot = nextSparkSlotRef.current++ % SPARK_LIMIT;
      const sparkElement = sparkPoolRef.current[sparkSlot];
      if (!sparkElement) continue;
      const rotate = Math.random() * 360;
      const size = 6 + Math.random() * 10;
      sparkElement.getAnimations().forEach((animation) => animation.cancel());
      sparkElement.style.left = `${20 + Math.random() * 60}%`;
      sparkElement.style.top = `${18 + Math.random() * 62}%`;
      sparkElement.style.width = `${size}px`;
      sparkElement.style.height = `${size}px`;
      sparkElement.animate(
        [
          { opacity: 1, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(0.25)` },
          { opacity: 0, transform: `translate(-50%, -50%) rotate(${rotate + 90}deg) scale(1.9)` },
        ],
        { duration: 760, easing: "ease-out", fill: "forwards" }
      );
    }

    scheduleClickFrame();
  };

  const scheduleClickFrame = () => {
    if (clickAnimationFrameRef.current !== null) return;
    clickAnimationFrameRef.current = window.requestAnimationFrame(() => {
      clickAnimationFrameRef.current = null;

      const pendingClicks = pendingManualClicksRef.current;
      pendingManualClicksRef.current = { gain: 0, count: 0 };
      if (pendingClicks.count > 0) {
        setState((current) => ({
          ...current,
          muscle: clampScore(current.muscle + pendingClicks.gain),
          totalMuscle: clampScore(current.totalMuscle + pendingClicks.gain),
          handMadeMuscle: clampScore(current.handMadeMuscle + pendingClicks.gain),
          clickCount: current.clickCount + pendingClicks.count,
          lastSavedAt: Date.now(),
        }));
        setCombo(comboRef.current);
      }

    });
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
    clickSoundPoolRef.current.forEach((audio) => audio.load());
  };

  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;

    try {
      const now = Date.now();
      const cooldown = type === "click" ? 55 : 110;
      if (now - (lastSoundAtRef.current[type] ?? 0) < cooldown) return;
      lastSoundAtRef.current[type] = now;

      const baseAudio = soundRefs.current[type];
      if (!baseAudio) return;

      const pool = type === "click" ? clickSoundPoolRef.current : [];
      const sound =
        pool.length > 0
          ? pool[clickSoundPoolIndexRef.current++ % pool.length]
          : (baseAudio.cloneNode(true) as HTMLAudioElement);
      sound.volume = baseAudio.volume;
      sound.currentTime = 0;
      void sound.play().catch(() => {
        // Browsers can reject playback before the first trusted interaction.
      });
    } catch (error) {
      console.error("Failed to play macho clicker sound", error);
    }
  };

  const animateCharacterClick = () => {
    clickRippleRef.current?.getAnimations().forEach((animation) => animation.cancel());
    clickRippleRef.current?.animate(
      [
        { opacity: 0.72, transform: "translate(-50%, -50%) scale(0.5)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
      ],
      { duration: reducedEffects ? 220 : 450, easing: "ease-out" }
    );
  };

  const handleClick = (pointerType: string) => {
    hasPlayerInteractedRef.current = true;
    const now = Date.now();
    comboRef.current = now - lastClickAtRef.current < 800 ? Math.min(99, comboRef.current + 1) : 1;
    lastClickAtRef.current = now;
    const gain = clickPowerRef.current;
    pendingManualClicksRef.current.gain = clampScore(pendingManualClicksRef.current.gain + gain);
    pendingManualClicksRef.current.count += 1;
    spawnClickEffects(gain, pointerType);
    animateCharacterClick();
  };

  const characterPressHandlers = usePressActivation({
    targetRef: characterButtonRef,
    onPressStart: () => {
      unlockAudio();
      playSound("click");
    },
    onActivate: handleClick,
  });

  const updateTooltipPosition = (event: MouseEvent<HTMLElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const buyUpgrade = (upgrade: Upgrade, event?: MouseEvent<HTMLElement>) => {
    hasPlayerInteractedRef.current = true;
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
    hasPlayerInteractedRef.current = true;
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

  const buyCrystalResearch = (research: CrystalResearch) => {
    setState((current) => {
      const purchased = current.crystalResearch.includes(research.id);
      if (purchased || !research.unlock(current) || current.muscleCrystals < research.cost) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash(`${research.name}: ${research.effectLabel}`);
      window.setTimeout(() => setPurchaseFlash(null), 1400);
      playSound("buy");

      return {
        ...current,
        muscleCrystals: current.muscleCrystals - research.cost,
        crystalResearch: [...current.crystalResearch, research.id],
        lastSavedAt: Date.now(),
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

  const activateFocusGym = () => {
    setState((current) => {
      const refreshed = rechargeFocusCharges(current);
      if (!refreshed.crystalResearch.includes("crystal-focus-room") || refreshed.focusCharges <= 0) {
        playSound("blocked");
        return refreshed;
      }

      const now = Date.now();
      const buff: ActiveBuff = {
        id: `focus-${now}`,
        type: "focus",
        name: "気合い注入",
        multiplier: FOCUS_PRODUCTION_MULTIPLIER,
        endAt: now + FOCUS_DURATION_MS,
      };
      playSound("buy");
      setPurchaseFlash(`気合い注入: 毎秒生産 x${FOCUS_PRODUCTION_MULTIPLIER}`);
      window.setTimeout(() => setPurchaseFlash(null), 1600);

      return {
        ...refreshed,
        focusCharges: refreshed.focusCharges - 1,
        focusChargeUpdatedAt: refreshed.focusCharges >= FOCUS_MAX_CHARGES ? now : refreshed.focusChargeUpdatedAt,
        activeBuffs: upsertBuff(refreshed.activeBuffs, buff),
        lastSavedAt: now,
      };
    });
  };

  const collectGoldenProtein = () => {
    if (!goldenProtein) return;
    const effect = pickGoldenEffect(state);
    const now = Date.now();
    const goldenDurationMultiplier = getGoldenDurationMultiplier(state);
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
        endAt: now + FRENZY_DURATION_MS * goldenDurationMultiplier,
      };
      historyEntry = {
        ...historyEntry,
        name: "パンプアップ",
        detail: `${FRENZY_MULTIPLIER}倍 / ${Math.round((FRENZY_DURATION_MS * goldenDurationMultiplier) / 1000)}秒`,
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
        endAt: now + CLICK_FRENZY_DURATION_MS * goldenDurationMultiplier,
      };
      historyEntry = {
        ...historyEntry,
        name: "鬼クリック",
        detail: `${CLICK_FRENZY_MULTIPLIER}倍 / ${Math.round((CLICK_FRENZY_DURATION_MS * goldenDurationMultiplier) / 1000)}秒`,
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
        endAt: now + BUILDING_FRENZY_DURATION_MS * goldenDurationMultiplier,
        target: target.key,
      };
      historyEntry = {
        ...historyEntry,
        name: `${target.name}暴走`,
        detail: `${target.name} ${BUILDING_FRENZY_MULTIPLIER}倍 / ${Math.round((BUILDING_FRENZY_DURATION_MS * goldenDurationMultiplier) / 1000)}秒`,
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
    playSound("goldenCollect");
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const selectTrainingPlan = (plan: TrainingPlan) => {
    const today = getTodayKey();
    setState((current) => ({
      ...current,
      dailyTrainingPlanId: plan.id,
      dailyTrainingDate: today,
      lastSavedAt: Date.now(),
    }));
    setPurchaseFlash(`${plan.label}: ${plan.bonusLabel}`);
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const toggleSupplement = (supplement: SupplementDefinition) => {
    const today = getTodayKey();
    setState((current) => {
      const currentIds = current.dailySupplementDate === today ? current.dailySupplementIds : [];
      const active = currentIds.includes(supplement.id);
      return {
        ...current,
        dailySupplementIds: active ? currentIds.filter((id) => id !== supplement.id) : [...currentIds, supplement.id],
        dailySupplementDate: today,
        lastSavedAt: Date.now(),
      };
    });
    setPurchaseFlash(`${supplement.label}: ${supplement.bonusLabel}`);
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const selectDailyCondition = (condition: DailyConditionDefinition) => {
    const today = getTodayKey();
    setState((current) => ({
      ...current,
      dailyConditionId: condition.id,
      dailyConditionDate: today,
      lastSavedAt: Date.now(),
    }));
    setPurchaseFlash(`${condition.label}: ${condition.bonusLabel}`);
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const evolveBody = () => {
    if (!canBodyEvolve || !nextBodyStage) return;

    setEvolutionFlash(true);
    setPurchaseFlash(`進化: ${nextBodyStage.label}`);
    playSound("buy");
    setState((current) => ({
      ...current,
      bodyEvolutionStage: Math.min(getUnlockedBodyEvolutionStage(current.totalMuscle), current.bodyEvolutionStage + 1),
      lastSavedAt: Date.now(),
    }));
    window.setTimeout(() => setEvolutionFlash(false), 1200);
    window.setTimeout(() => setPurchaseFlash(null), 1600);
  };

  const shareResult = async () => {
    const text = `マチョクリッカーで「${title}」まで到達。累計筋肉ポイント ${formatFullNumber(state.totalMuscle)}、毎秒 +${formatRate(
      perSecond
    )} 筋肉。https://www.machoda.com/macho-clicker`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "マチョクリッカー", text, url: "https://www.machoda.com/macho-clicker" });
        setSaveMessage("共有画面を開きました。");
      } else {
        await navigator.clipboard.writeText(text);
        setSaveMessage("共有テキストをコピーしました。");
      }
    } catch {
      window.prompt("共有テキストをコピーしてください。", text);
      setSaveMessage("共有テキストを表示しました。");
    }
    window.setTimeout(() => setSaveMessage(""), 2200);
  };

  const resetGame = () => {
    if (!window.confirm("マチョクリッカーの進行状況をリセットしますか？")) return;
    const nextState = {
      ...initialState,
      upgrades: { ...emptyUpgrades },
      buildingLevels: { ...emptyBuildingLevels },
      muscleCrystals: 0,
      crystalResearch: [],
      nextMuscleCrystalAt: Date.now() + MUSCLE_CRYSTAL_GROW_MS,
      focusCharges: FOCUS_MAX_CHARGES,
      focusChargeUpdatedAt: Date.now(),
      goldenClicks: 0,
      goldenHistory: [],
      legacyUpgrades: [],
      purchasedPowerUps: [],
      activeBuffs: [],
      prestigeLevel: 0,
      ascensionCount: 0,
      playStartedAt: Date.now(),
      lastSavedAt: Date.now(),
    };
    setState(nextState);
    setCombo(0);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const manualSave = () => {
    const now = Date.now();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: now }));
    setLastAutoSaveAt(now);
    setSaveMessage("保存しました。");
    window.setTimeout(() => setSaveMessage(""), 1800);
  };

  const exportSave = async () => {
    const saveText = btoa(unescape(encodeURIComponent(JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }))));
    setExportedSaveText(saveText);
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
    if (!window.confirm("現在のセーブデータを上書きします。インポートを続けますか？")) return;
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
        bodyEvolutionStage:
          typeof parsed.bodyEvolutionStage === "number"
            ? Math.max(0, Math.min(bodyEvolutionStages.length - 1, Math.floor(parsed.bodyEvolutionStage)))
            : getUnlockedBodyEvolutionStage(typeof parsed.totalMuscle === "number" ? parsed.totalMuscle : 0),
        upgrades: normalizeSavedUpgrades(parsed.upgrades),
        buildingLevels: normalizeSavedBuildingLevels(parsed.buildingLevels),
        muscleCrystals: typeof parsed.muscleCrystals === "number" ? Math.max(0, Math.floor(parsed.muscleCrystals)) : 0,
        crystalResearch: normalizeCrystalResearch(parsed.crystalResearch),
        nextMuscleCrystalAt:
          typeof parsed.nextMuscleCrystalAt === "number" ? parsed.nextMuscleCrystalAt : Date.now() + MUSCLE_CRYSTAL_GROW_MS,
        focusCharges:
          typeof parsed.focusCharges === "number"
            ? Math.max(0, Math.min(FOCUS_MAX_CHARGES, Math.floor(parsed.focusCharges)))
            : FOCUS_MAX_CHARGES,
        focusChargeUpdatedAt:
          typeof parsed.focusChargeUpdatedAt === "number" ? parsed.focusChargeUpdatedAt : Date.now(),
        goldenClicks: typeof parsed.goldenClicks === "number" ? Math.max(0, Math.floor(parsed.goldenClicks)) : 0,
        goldenHistory: normalizeGoldenHistory(parsed.goldenHistory),
        legacyUpgrades: normalizeLegacyUpgrades(parsed.legacyUpgrades),
        purchasedPowerUps: Array.isArray(parsed.purchasedPowerUps)
          ? parsed.purchasedPowerUps.filter((id): id is string => typeof id === "string")
          : [],
        activeBuffs: [],
        prestigeLevel: typeof parsed.prestigeLevel === "number" ? Math.max(0, Math.floor(parsed.prestigeLevel)) : 0,
        ascensionCount: typeof parsed.ascensionCount === "number" ? Math.max(0, Math.floor(parsed.ascensionCount)) : 0,
        playStartedAt: typeof parsed.playStartedAt === "number" ? parsed.playStartedAt : Date.now(),
        lastSavedAt: Date.now(),
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
        dailyTrainingPlanId: normalizeTrainingPlanId(parsed.dailyTrainingPlanId),
        dailyTrainingDate: normalizeTrainingDate(parsed.dailyTrainingDate),
        dailySupplementIds: normalizeSupplementIds(parsed.dailySupplementIds),
        dailySupplementDate: normalizeTrainingDate(parsed.dailySupplementDate),
        dailyConditionId: normalizeDailyConditionId(parsed.dailyConditionId),
        dailyConditionDate: normalizeTrainingDate(parsed.dailyConditionDate),
      };
      setState(importedState);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
      setSaveMessage("インポートしました。");
    } catch {
      setSaveMessage("インポートに失敗しました。");
    }
    window.setTimeout(() => setSaveMessage(""), 2200);
  };

  const openAscensionModal = () => {
    if (pendingPrestige <= 0) {
      setPurchaseFlash("仕上げ直しには累計 1 trillion 筋肉ポイントが必要です。");
      window.setTimeout(() => setPurchaseFlash(null), 1800);
      return;
    }
    setAscensionModalOpen(true);
  };

  const ascend = () => {
    if (pendingPrestige <= 0) return;

    const nextState: GameState = {
      ...initialState,
      muscle: getAscensionStartingMuscle(state),
      totalMuscle: state.totalMuscle,
      clickCount: 0,
      bodyEvolutionStage: state.bodyEvolutionStage,
      upgrades: { ...emptyUpgrades },
      buildingLevels: state.buildingLevels,
      muscleCrystals: state.muscleCrystals,
      crystalResearch: state.crystalResearch,
      nextMuscleCrystalAt: state.nextMuscleCrystalAt,
      focusCharges: state.focusCharges,
      focusChargeUpdatedAt: state.focusChargeUpdatedAt,
      goldenClicks: state.goldenClicks,
      goldenHistory: state.goldenHistory,
      legacyUpgrades: state.legacyUpgrades,
      purchasedPowerUps: [],
      activeBuffs: [],
      prestigeLevel: state.prestigeLevel + pendingPrestige,
      ascensionCount: state.ascensionCount + 1,
      playStartedAt: state.playStartedAt,
      lastSavedAt: Date.now(),
      unlockedAchievements: state.unlockedAchievements,
      dailyTrainingPlanId: state.dailyTrainingPlanId,
      dailyTrainingDate: state.dailyTrainingDate,
      dailySupplementIds: state.dailySupplementIds,
      dailySupplementDate: state.dailySupplementDate,
      dailyConditionId: state.dailyConditionId,
      dailyConditionDate: state.dailyConditionDate,
    };

    setState(nextState);
    setCombo(0);
    setAscensionModalOpen(false);
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
          playSeconds: totalPlaySeconds,
          clickCount: state.clickCount,
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

  const completeOnboarding = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "complete");
    setOnboardingComplete(true);
  };

  return (
    <div
      className={`macho-game-shell macho-achievement-aura-${achievementAuraTier} ${seasonalTheme.shellClass} min-h-dvh overflow-hidden bg-[#160D08] text-slate-900 ${
        reducedEffects ? "macho-reduced-effects" : ""
      }`}
      onPointerDown={unlockAudio}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,184,77,0.34),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(251,146,60,0.26),transparent_30%),linear-gradient(180deg,#FFF7EB_0%,#FDBA74_48%,#7C2D12_100%)]" />
      <header className="macho-game-nav sticky top-0 z-50 flex h-14 items-center justify-between border-b-4 border-[#7C2D12] bg-[#1F120A]/95 px-3 text-[#FFE7C2] shadow-2xl backdrop-blur md:px-5">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => window.location.assign("/")}
          className="macho-game-button min-h-11 rounded-full border-2 border-[#FFB45D]/60 bg-[#7C2D12] px-4 py-2 text-xs font-black text-[#FFE7C2] transition hover:bg-[#9A3412] sm:text-sm"
        >
          ← トップへ戻る
        </button>
        <div className="min-w-0 px-3 text-center">
          <div className="truncate text-base font-black tracking-tight sm:text-xl">マチョクリッカー</div>
          <div className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB45D] sm:block">Full Screen Gym Game</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGameOverlay("achievements")}
            className="macho-game-button flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-[#FFB45D]/50 bg-[#2A140B] px-3 text-sm font-black text-[#FFE7C2] transition hover:bg-[#451A03]"
            aria-label="実績を開く"
          >
            ★<span className="ml-1 hidden sm:inline">実績</span>
          </button>
          <button
            type="button"
            onClick={() => setGameOverlay("menu")}
            className="macho-game-button flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-[#FFB45D]/50 bg-[#2A140B] px-3 text-sm font-black text-[#FFE7C2] transition hover:bg-[#451A03]"
            aria-label="ゲームメニューを開く"
          >
            ☰<span className="ml-1 hidden sm:inline">メニュー</span>
          </button>
        </div>
      </header>

      {gameOverlay ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#080604]/80 p-3 pt-20 backdrop-blur-sm sm:p-6 sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-label={gameOverlay === "menu" ? "ゲームメニュー" : gameOverlay === "achievements" ? "実績" : "ランキング"}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setGameOverlay(null);
          }}
        >
          <section className="w-full max-w-3xl overflow-hidden rounded-[28px] border-2 border-[#FCD27B]/70 bg-[#20120B] text-[#FFF7EB] shadow-[0_32px_100px_rgba(0,0,0,0.72)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#2A140B] px-5 py-4 sm:px-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB45D]">
                  {gameOverlay === "menu" ? "Game Menu" : gameOverlay === "achievements" ? "Achievements" : "Community"}
                </div>
                <h2 className="mt-1 text-2xl font-black">
                  {gameOverlay === "menu" ? "メニュー" : gameOverlay === "achievements" ? "実績" : "全国マッチョランキング"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGameOverlay(null)}
                className="macho-game-button flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-black text-white transition hover:bg-white/20"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {gameOverlay === "menu" ? (
              <div className="grid gap-5 p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["現在", displayNumber(state.muscle)],
                    ["毎秒", `+${displayNumber(perSecond)}`],
                    ["累計", displayNumber(state.totalMuscle)],
                    ["クリック", formatFullNumber(state.clickCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FFB45D]">{label}</div>
                      <div className="mt-1 break-words text-xl font-black text-white">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((current) => !current)}
                    className="macho-game-button flex min-h-12 items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left font-black text-white transition hover:bg-white/10"
                    aria-pressed={soundEnabled}
                  >
                    <span>効果音</span><span className="text-[#FFB45D]">{soundEnabled ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReducedEffects((current) => !current)}
                    className="macho-game-button flex min-h-12 items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left font-black text-white transition hover:bg-white/10"
                    aria-pressed={reducedEffects}
                  >
                    <span>軽量モード</span><span className="text-[#FFB45D]">{reducedEffects ? "ON" : "OFF"}</span>
                  </button>
                </div>

                <div>
                  <div className="mb-2 text-xs font-black text-white/65">数字の表示</div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ["short", "英語単位"],
                      ["japanese", "日本語単位"],
                      ["full", "全桁"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNumberNotation(value)}
                        className={`macho-game-button min-h-11 rounded-xl border px-3 py-2 text-xs font-black transition ${
                          numberNotation === value
                            ? "border-[#FFB45D] bg-[#FF8A23] text-white"
                            : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={manualSave} className="macho-game-button min-h-11 rounded-xl bg-[#7C2D12] px-3 py-2 text-xs font-black text-white">保存</button>
                  <button type="button" onClick={exportSave} className="macho-game-button min-h-11 rounded-xl bg-[#C2410C] px-3 py-2 text-xs font-black text-white">書き出し</button>
                  <button type="button" onClick={importSave} className="macho-game-button min-h-11 rounded-xl bg-[#9A3412] px-3 py-2 text-xs font-black text-white">読み込み</button>
                </div>
                {saveMessage ? <p className="text-sm font-bold text-[#FFD58A]">{saveMessage}</p> : null}

                <div className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
                  <button type="button" onClick={() => setGameOverlay("achievements")} className="macho-game-button min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left font-black text-white hover:bg-white/10">
                    実績を見る <span className="ml-2 text-[#FFB45D]">{state.unlockedAchievements.length}/{achievements.length}</span>
                  </button>
                  <button type="button" onClick={() => setGameOverlay("community")} className="macho-game-button min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left font-black text-white hover:bg-white/10">
                    ランキングを見る
                  </button>
                </div>
              </div>
            ) : null}

            {gameOverlay === "achievements" ? (
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white/70">遊んだ記録として獲得した実績です。</p>
                  <span className="rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-black text-white">
                    {state.unlockedAchievements.length}/{achievements.length}
                  </span>
                </div>
                <div className="grid max-h-[60dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {achievements.map((achievement) => {
                    const unlocked = state.unlockedAchievements.includes(achievement.key);
                    return (
                      <div key={`overlay-${achievement.key}`} className={`rounded-2xl border px-4 py-3 ${unlocked ? "border-[#FFB45D]/60 bg-[#FF8A23]/15" : "border-white/10 bg-white/[0.03] opacity-45"}`}>
                        <div className="text-sm font-black text-white">{unlocked ? achievement.title : "???"}</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-white/60">{unlocked ? achievement.description : "ゲームを進めると解放されます。"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {gameOverlay === "community" ? (
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[16rem_1fr]">
                <div>
                  <p className="text-sm font-bold leading-6 text-white/65">累計筋肉ポイントを登録できます。</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      maxLength={12}
                      placeholder="ニックネーム"
                      className="min-h-12 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#FFB45D]"
                    />
                    <button type="button" onClick={submitRanking} disabled={state.totalMuscle <= 0} className="macho-game-button min-h-12 rounded-2xl bg-[#FF8A23] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                      ランキングに登録
                    </button>
                    {rankingMessage ? <p className="text-sm font-bold text-[#FFD58A]">{rankingMessage}</p> : null}
                  </div>
                </div>
                <ol className="max-h-[60dvh] divide-y divide-white/10 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                  {rankings.length === 0 ? (
                    <li className="p-5 text-sm font-bold text-white/55">まだランキングがありません。</li>
                  ) : rankings.slice(0, 10).map((entry, index) => (
                    <li key={`overlay-ranking-${entry.id}`} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-black text-white">{index + 1}</span>
                        <span className="truncate font-bold text-white/85">{entry.nickname}</span>
                      </span>
                      <span className="shrink-0 text-sm font-black text-[#FFD58A]">{displayNumber(entry.score)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {achievementToast ? (
        <div className="macho-toast macho-achievement-flash relative z-50 mx-3 my-3 rounded-3xl border-2 border-[#FCD27B] bg-[#FFF7EB] px-4 py-3 text-[#7C2D12] shadow-2xl sm:fixed sm:right-4 sm:top-24 sm:mx-0 sm:my-0 sm:max-w-xs sm:px-5 sm:py-4">
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

      {ascensionModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#080604]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ascension-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAscensionModalOpen(false);
          }}
        >
          <section className="macho-ascension-modal w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-[#FCD27B] bg-[#20120B] text-[#FFF7EB] shadow-[0_32px_100px_rgba(0,0,0,0.68)]">
            <div className="border-b border-[#FCD27B]/30 bg-[linear-gradient(135deg,#6A1E0D,#B84A13_55%,#2A140B)] px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="macho-ui-label text-[#FFD58A]">Legacy Ascension</div>
                  <h2 id="ascension-title" className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">仕上げ直し</h2>
                  <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-white/80">
                    現在の設備をリセットして、次の周回を永久的に強くします。周回するほど、より速くジムを育てられます。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAscensionModalOpen(false)}
                  className="macho-game-button rounded-full border border-white/20 bg-black/20 px-3 py-2 text-sm font-black text-white/85 hover:bg-white/10"
                  aria-label="仕上げ直し画面を閉じる"
                >
                  閉じる
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-[#FFE0A6]/40 bg-black/20 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFD58A]">獲得する永久倍率</div>
                  <div className="mt-1 text-3xl font-black text-white">+{pendingPrestige}%</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">仕上げ直し後</div>
                  <div className="mt-1 text-xl font-black text-white">永久倍率 +{state.prestigeLevel + pendingPrestige}%</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">周回数</div>
                  <div className="mt-1 text-xl font-black text-white">{state.ascensionCount + 1} 周目</div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <div className="rounded-2xl border border-emerald-200/20 bg-emerald-950/35 p-4">
                <div className="text-sm font-black text-emerald-200">残るもの</div>
                <ul className="mt-3 space-y-2 text-sm font-bold leading-5 text-white/80">
                  <li>永久倍率、マチョ田の遺産</li>
                  <li>筋肉結晶、設備レベル、体型進化</li>
                  <li>実績、ゴールデン履歴、累計筋肉ポイント</li>
                  <li>今日選んだトレーニングとサプリ</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-200/20 bg-rose-950/30 p-4">
                <div className="text-sm font-black text-rose-200">リセットされるもの</div>
                <ul className="mt-3 space-y-2 text-sm font-bold leading-5 text-white/80">
                  <li>所持筋肉ポイントと設備の所持数</li>
                  <li>通常アップグレードと一時バフ</li>
                  <li>手動クリック数と現在の連打コンボ</li>
                  <li>開始時ポイントは遺産で増やせます</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="text-xs font-bold leading-5 text-white/60">
                累計 {displayNumber(state.totalMuscle)} 筋肉から、今回 +{pendingPrestige}% の永久倍率を獲得します。
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAscensionModalOpen(false)}
                  className="macho-game-button rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
                >
                  まだ鍛える
                </button>
                <button
                  type="button"
                  onClick={ascend}
                  className="macho-game-button rounded-2xl bg-[#FF8A23] px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(255,138,35,0.38)] transition hover:bg-[#FF9C41]"
                >
                  仕上げ直しを実行
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <main className="relative z-10 px-0 pb-0 pt-0">
        <div className="flex w-full max-w-none flex-col gap-0">
          <section className="macho-game-topbar macho-game-panel overflow-hidden border-b-4 border-[#7C2D12] bg-[#7C2D12] text-white shadow-2xl md:border-x-0 md:border-t-0">
            <div className="grid gap-px bg-[#FED7AA] sm:grid-cols-[minmax(0,0.8fr)_minmax(18rem,1.2fr)] lg:grid-cols-[320px_minmax(0,1fr)_280px]">
              <div className="bg-[#9A3412] px-5 py-4">
                <h1 className="text-3xl font-black tracking-tight text-[#FFE7C2]">マチョクリッカー</h1>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">
                  {bodyStage.label}
                </div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="macho-ui-label">筋肉ポイント</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl" title={formatFullNumber(state.muscle)}>
                      {displayNumber(state.muscle)}
                    </div>
                  </div>
                  <div>
                    <div className="macho-ui-label">毎秒</div>
                    <div className="macho-counter macho-ui-number mt-1 text-2xl">+{displayNumber(perSecond)}</div>
                  </div>
                </div>
              </div>
              <div className="hidden bg-[#9A3412] px-5 py-4 lg:flex lg:flex-col lg:justify-center">
                <div className="text-xs font-black text-[#FFB45D]">次の目標</div>
                <div className="mt-1 truncate text-sm font-black text-[#FFE7C2]">{nextShopGoal?.upgrade.name ?? nextGoal.title}</div>
                {nextShopGoal ? (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[#FFB45D]" style={{ width: `${getPurchaseProgress(state.muscle, nextShopGoal.cost)}%` }} />
                  </div>
                ) : null}
                {pendingPrestige > 0 ? (
                  <button
                    type="button"
                    onClick={openAscensionModal}
                    className="macho-game-button mt-2 rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-black text-white transition"
                  >
                    仕上げ直し +{pendingPrestige}%
                  </button>
                ) : null}
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
                <div
                  key={newsIndex}
                  className="macho-news whitespace-nowrap text-sm font-bold text-orange-100"
                  onAnimationIteration={() => setNewsIndex((current) => current + 1)}
                >
                  {news}
                </div>
              </div>
            </div>
          </section>

          <nav
            className="macho-mobile-tabs sticky top-14 z-40 grid grid-cols-3 gap-2 border-b-4 border-[#7C2D12] bg-[#2A140B] p-2 shadow-2xl md:hidden"
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
                } ${onboardingStep === 1 && state.muscle >= upgrades[0].baseCost && panel.key === "shop" ? "macho-guide-target" : ""}`}
              >
                {panel.label}
              </button>
            ))}
          </nav>

          <section className="macho-game-panel macho-main-grid grid min-h-[calc(100dvh-15rem)] overflow-hidden border-b-4 border-[#7C2D12] bg-[#7C2D12] shadow-2xl md:h-[calc(100dvh-12.75rem)] md:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] md:border-b-0 xl:grid-cols-[minmax(620px,1.3fr)_minmax(260px,0.7fr)_360px] 2xl:grid-cols-[minmax(780px,1040px)_minmax(320px,1fr)_400px]">
            <aside
              className={`macho-click-stage relative min-h-[calc(100dvh-15rem)] flex-col items-center justify-between overflow-hidden border-b-4 border-[#7C2D12] bg-[#451A03] p-4 text-center sm:p-5 md:col-start-1 md:row-span-2 md:flex md:min-h-0 md:border-b-0 md:border-r-4 xl:col-auto xl:row-auto xl:flex xl:min-h-0 xl:border-b-0 xl:border-r-4 ${
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
              <div className="macho-season-stage-overlay pointer-events-none absolute inset-0 z-[2]" />
              <div className="macho-gym-light pointer-events-none absolute inset-x-0 top-0 z-[2] h-48" />
              <div
                className={`macho-click-foreground pointer-events-none absolute inset-0 z-[4] ${
                  backgroundAnimationEnabled && !reducedEffects ? "" : "hidden"
                }`}
              >
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
              {backgroundAnimationEnabled && visibleAmbientItems.length > 0 ? (
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
              <div className="relative z-20 mt-3 w-full">
                <div className={`macho-evolution-card ${canBodyEvolve ? "macho-evolution-ready" : ""}`}>
                  {upcomingBodyStage ? (
                    <div className="macho-evolution-preview" aria-hidden="true">
                      <Image
                        src={upcomingBodyStage.imageSrc}
                        alt=""
                        width={56}
                        height={84}
                        className={`h-16 w-11 object-contain transition duration-300 ${
                          canBodyEvolve ? "drop-shadow-lg" : "brightness-0 opacity-45"
                        }`}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C2410C]">Body Evolution</div>
                    <div className="mt-1 text-sm font-black text-[#7C2D12]">
                      現在: {bodyStage.label}
                    </div>
                    <div className="mt-1 text-xs font-bold text-[#9A3412]">
                      {upcomingBodyStage ? `次: ${upcomingBodyStage.label}` : "最終進化済み"}
                    </div>
                    {upcomingBodyStage ? (
                      <>
                        <div className="mt-1 text-[11px] font-semibold leading-4 text-[#9A3412]/85">{upcomingBodyStage.change}</div>
                        <div className="mt-1 text-[11px] font-black text-[#C2410C]">
                          {canBodyEvolve
                            ? "進化できます"
                            : `あと ${displayNumber(Math.max(0, upcomingBodyStage.requirement - state.totalMuscle))} 筋肉`}
                        </div>
                      </>
                    ) : null}
                  </div>
                  {upcomingBodyStage ? (
                    <button
                      type="button"
                      onClick={evolveBody}
                      disabled={!canBodyEvolve}
                      className="macho-evolution-button"
                    >
                      {canBodyEvolve ? "進化する" : "待機"}
                    </button>
                  ) : null}
                </div>
              </div>

              {onboardingStep !== null ? (
                <div data-testid="macho-onboarding-card" className="macho-onboarding-card relative z-30 mt-3 w-full max-w-md rounded-2xl border-2 border-[#FFB45D] bg-[#20120B]/95 px-4 py-3 text-left text-white shadow-2xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB45D]">はじめの3ステップ {onboardingStep + 1}/3</div>
                  <div className="mt-1 text-sm font-black leading-6">
                    {onboardingStep === 0
                      ? "マチョ田を押して、筋肉ポイントを増やす。"
                      : onboardingStep === 1
                        ? state.muscle < upgrades[0].baseCost
                          ? `${displayNumber(upgrades[0].baseCost)}ポイントまでマチョ田を押す。`
                          : "ショップでダンベルを1個買う。"
                        : `毎秒 +${formatRate(perSecond)}。これで放置中も筋肉が増えます。`}
                  </div>
                  {onboardingStep === 2 ? (
                    <button
                      type="button"
                      onClick={completeOnboarding}
                      className="macho-game-button mt-3 min-h-11 w-full rounded-xl bg-[#FF8A23] px-4 py-2 text-sm font-black text-white transition hover:bg-[#FF9C41]"
                    >
                      トレーニング開始
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div data-testid="macho-floating-gain-pool" aria-hidden="true">
                {Array.from({ length: FLOATING_GAIN_LIMIT }, (_, slot) => (
                  <div
                    key={slot}
                    ref={(element) => {
                      floatingGainPoolRef.current[slot] = element;
                    }}
                    data-effect-slot="gain"
                    className="macho-float pointer-events-none absolute z-40 text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(124,45,18,0.85)]"
                  />
                ))}
              </div>

              <div data-testid="macho-spark-pool" aria-hidden="true">
                {Array.from({ length: SPARK_LIMIT }, (_, slot) => (
                <div
                  key={slot}
                  ref={(element) => {
                    sparkPoolRef.current[slot] = element;
                  }}
                  data-effect-slot="spark"
                  className="macho-spark pointer-events-none absolute z-30 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.85)]"
                />
                ))}
              </div>

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
                  className={`macho-golden macho-golden-alert ${goldenVariant.className} absolute z-50 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-500 shadow-2xl`}
                  style={{ left: `${goldenProtein.x}%`, top: `${goldenProtein.y}%` }}
                  aria-label={`${limitedEvent?.goldenLabel ?? "ゴールデンプロテイン"}を獲得`}
                >
                  <Image
                    src="/game/macho-clicker/icons/generated-v3/golden-protein.png"
                    alt=""
                    width={86}
                    height={86}
                    className="h-20 w-20 object-contain drop-shadow-xl"
                  />
                  {goldenVariant.badge ? (
                    <span className="macho-golden-season-badge" aria-hidden="true">{goldenVariant.badge}</span>
                  ) : null}
                </button>
              ) : null}

              <div className="pointer-events-none absolute right-4 top-28 z-30 hidden w-56 space-y-2 text-left lg:block">
                {limitedEvent ? (
                  <div className="rounded-2xl border border-yellow-100/60 bg-[#2A140B]/90 px-3 py-2 text-[#FFF4D4] shadow-xl backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-200">Limited Event</div>
                    <div className="mt-1 text-sm font-black">{limitedEvent.name}</div>
                    <div className="mt-1 text-[11px] font-bold text-white/75">{limitedEvent.bonusLabel}</div>
                  </div>
                ) : null}
                {activeBuffs.map((buff) => (
                  <div key={`click-buff-${buff.id}`} className="rounded-2xl border border-[#FCD27B]/60 bg-[#2A140B]/88 px-3 py-2 text-[#FFE7C2] shadow-xl backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Golden Effect</div>
                    <div className="mt-1 text-sm font-black">
                      {buff.name} x{buff.multiplier}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-white/70">残り{Math.max(0, Math.ceil((buff.endAt - Date.now()) / 1000))}秒</div>
                  </div>
                ))}
              </div>

              <div className={`relative z-20 my-4 flex aspect-square w-full max-w-[860px] items-center justify-center overflow-visible sm:my-5 ${
                evolutionFlash ? "macho-evolution-flash" : ""
              }`}>
                <span
                  ref={clickRippleRef}
                  className="macho-click-ripple pointer-events-none absolute left-1/2 top-1/2 z-20 opacity-0"
                />
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
                  ref={characterButtonRef}
                  type="button"
                  {...characterPressHandlers}
                  data-testid="macho-character-button"
                  className={`macho-character-button macho-breathe group relative z-30 flex w-[min(66vw,24rem)] touch-manipulation items-end justify-center bg-transparent p-0 transition hover:scale-[1.05] ${
                    onboardingStep === 0 || (onboardingStep === 1 && state.muscle < upgrades[0].baseCost)
                      ? "macho-guide-target"
                      : ""
                  }`}
                  aria-label="マチョ田をクリック"
                >
                  <Image
                    src={bodyStage.imageSrc}
                    alt="マチョ田をクリック"
                    width={280}
                    height={280}
                    priority
                    draggable={false}
                    className="relative z-10 h-auto w-[min(60vw,24rem)] drop-shadow-[0_28px_30px_rgba(0,0,0,0.65)] transition duration-300 group-hover:scale-105"
                    style={{ transform: `scale(${bodyStage.scale})` }}
                  />
                </button>
              </div>

              <div className="macho-paper-card relative z-10 rounded-full px-4 py-2 text-sm font-black text-[#7C2D12]">
                クリック数 <span data-testid="macho-click-count">{formatFullNumber(state.clickCount)}</span>
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
                    {advancedSystemsUnlocked ? (
                      <div className="rounded-full bg-[#7C2D12] px-4 py-2 text-sm font-black text-white">設備Lv {totalBuildingLevel}</div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(124,45,18,0.7)_90%)]" />
              <div className="absolute inset-x-4 bottom-5 top-24 overflow-y-auto rounded-[28px] border-4 border-[#7C2D12] bg-[#2A140B] shadow-inner">
                {visibleGymUpgrades.length === 0 ? (
                  <Image
                    src="/game/macho-clicker/scenes/generated-v5/huge-gym-hall.png"
                    alt=""
                    fill
                    quality={68}
                    sizes="(min-width: 1280px) 28vw, (min-width: 768px) 40vw, 100vw"
                    className="object-cover opacity-75"
                  />
                ) : null}
                <div className="grid auto-rows-[10.5rem] divide-y-2 divide-[#2A140B]">
                  {visibleGymUpgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const buildingLevel = state.buildingLevels[upgrade.key];
                    const canLevelUp = state.muscleCrystals > 0 && level > 0;
                    const isBuildingFrenzyTarget = activeBuildingFrenzyTargets.includes(upgrade.key);
                    const visibleCount = Math.min(getUpgradeVisibleCount(level), displayEquipmentLimit);
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
                          {advancedSystemsUnlocked ? (
                            <button
                              type="button"
                              onClick={() => levelUpBuilding(upgrade)}
                              disabled={!canLevelUp}
                              className="mt-2 rounded-xl border border-[#FFB45D]/50 bg-[#FFE7C2] px-2 py-1 text-xs font-black text-[#7C2D12] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              設備Lv.{buildingLevel} +1
                            </button>
                          ) : null}
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
                  {onboardingStep === 1 && state.muscle >= upgrades[0].baseCost ? (
                    <div data-testid="macho-onboarding-shop-card" className="macho-onboarding-card rounded-2xl border-2 border-[#FFB45D] bg-[#20120B] px-4 py-3 text-white shadow-xl">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB45D]">はじめの3ステップ 2/3</div>
                      <div className="mt-1 text-sm font-black">ダンベルを1個買う。</div>
                    </div>
                  ) : null}
                  {visibleShopUpgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const buildingLevel = state.buildingLevels[upgrade.key];
                    const isUnlocked = upgrade.key === upgrades[0].key || level > 0 || state.totalMuscle >= upgrade.baseCost;
                    const cost = getUpgradeCost(upgrade, level);
                    const canBuy = state.muscle >= cost;
                    const shortage = getShortage(state.muscle, cost);
                    const purchaseProgress = getPurchaseProgress(state.muscle, cost);
                    const unitProduction = getBuildingUnitProduction(state, upgrade);
                    const isBuildingFrenzyTarget = activeBuildingFrenzyTargets.includes(upgrade.key);

                    if (!isUnlocked) {
                      return (
                        <div
                          key={`locked-${upgrade.key}`}
                          className="macho-shop-card relative overflow-hidden rounded-2xl border-2 border-[#67422E] bg-[#241812] p-3 text-left text-white/45"
                          aria-label="未解放の設備"
                        >
                          <div className="flex items-center gap-3">
                            <span className="macho-locked-slot flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/10 bg-black/30 text-3xl font-black shadow-inner">
                              ?
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-lg font-black tracking-[0.18em]">???</span>
                              <span className="mt-2 block text-xs font-bold leading-5 text-white/45">筋肉ポイントを増やすと正体が分かります。</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

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
                        } ${onboardingStep === 1 && canBuy && upgrade.key === upgrades[0].key ? "macho-guide-target" : ""}`}
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
                              1個 +{formatRate(unitProduction)}/秒{advancedSystemsUnlocked ? ` / 設備Lv.${buildingLevel}` : ""}
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
                  {advancedSystemsUnlocked ? mysteryShopItems.map((item) => (
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
                  )) : null}
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

            {mobilePanel === "stats" ? (
            <section className="bg-[#FFF7EB] p-4 text-[#7C2D12] md:hidden">
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
                    ...(limitedEvent ? [["限定イベント", limitedEvent.name]] : []),
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
                  <div className="text-sm font-black text-[#7C2D12]">結晶研究</div>
                  <div className="mt-1 text-xs font-bold text-[#9A3412]">設備レベル以外にも使える、仕上げ直し後も残る研究です。</div>
                  <div className="mt-3 grid gap-2">
                    {crystalResearches.map((research) => {
                      const owned = state.crystalResearch.includes(research.id);
                      const unlocked = research.unlock(state);
                      const canBuy = !owned && unlocked && state.muscleCrystals >= research.cost;
                      return (
                        <button
                          key={`mobile-${research.id}`}
                          type="button"
                          onClick={() => buyCrystalResearch(research)}
                          disabled={!canBuy}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            owned
                              ? "border-cyan-500 bg-cyan-50 text-cyan-950"
                              : canBuy
                              ? "border-cyan-300 bg-white text-[#7C2D12] shadow-sm"
                              : "border-[#FED7AA] bg-white/50 text-[#9A3412]/55"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2 text-sm font-black">
                            <span>{research.icon} {research.name}</span>
                            <span>{owned ? "研究済み" : `${research.cost}晶`}</span>
                          </span>
                          <span className="mt-1 block text-xs font-bold">{unlocked ? research.effectLabel : "進行で解放"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-cyan-950">気合い注入</div>
                      <div className="mt-1 text-xs font-bold text-cyan-800">
                        {!focusGymAvailable
                          ? "設備Lv.1で解放"
                          : !focusGymUnlocked
                          ? "結晶研究で解放"
                          : activeFocusBuff
                          ? `x${FOCUS_PRODUCTION_MULTIPLIER} 発動中`
                          : `${state.focusCharges}/${FOCUS_MAX_CHARGES}チャージ / ${getNextFocusChargeText(state)}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={activateFocusGym}
                      disabled={!focusGymUnlocked || state.focusCharges <= 0}
                      className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-cyan-200"
                    >
                      注入
                    </button>
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
            ) : null}
          </section>

          {legacyPanelsVisible ? (
            <>
          <section className="macho-stats-panel hidden gap-4 rounded-[28px] border border-[#FCD27B]/60 bg-[#2A140B]/90 p-4 text-white shadow-2xl md:mx-2 md:grid md:grid-cols-4 xl:mx-3 xl:grid-cols-7">
            <div className="macho-panel-dock md:col-span-4 xl:col-span-7">
              {desktopDetailPanels.map((panel) => (
                <button
                  key={panel.key}
                  type="button"
                  onClick={() => setDesktopDetailPanel(panel.key)}
                  className={`macho-panel-tab ${desktopDetailPanel === panel.key ? "macho-panel-tab-active" : ""}`}
                >
                  <span className="macho-panel-tab-icon">{panel.icon}</span>
                  <span>{panel.label}</span>
                </button>
              ))}
            </div>
            <div className={`macho-status-hero md:col-span-2 xl:col-span-3 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div>
                <div className="macho-ui-label">Next Goal</div>
                <div className="mt-1 text-2xl font-black text-[#FFE7C2]">{nextGoal.title}</div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FFB45D] to-[#FF5A1F]" style={{ width: `${titleProgress}%` }} />
                </div>
              </div>
              <div className="macho-status-medal">
                <span>{Math.floor(titleProgress)}%</span>
              </div>
            </div>
            <div className={`macho-visual-panel md:col-span-2 xl:col-span-4 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div className="macho-visual-orbit">
                <Image src={bodyStage.imageSrc} alt="" width={120} height={120} className="relative z-10 h-24 w-24 object-contain drop-shadow-2xl" />
                <Image src="/game/macho-clicker/icons/generated-v3/dumbbell.png" alt="" width={44} height={44} className="macho-orbit-icon macho-orbit-icon-1" />
                <Image src="/game/macho-clicker/icons/generated-v3/protein-workshop.png" alt="" width={44} height={44} className="macho-orbit-icon macho-orbit-icon-2" />
                <Image src="/game/macho-clicker/icons/generated-v3/golden-protein.png" alt="" width={44} height={44} className="macho-orbit-icon macho-orbit-icon-3" />
              </div>
              <div className="min-w-0">
                <div className="macho-ui-label">Now Training</div>
                <div className="mt-1 text-2xl font-black text-[#FFE7C2]">{title}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="macho-mini-meter">
                    <span>設備</span>
                    <strong>{formatFullNumber(ownedUpgradeCount)}</strong>
                  </div>
                  <div className="macho-mini-meter">
                    <span>実績</span>
                    <strong>{state.unlockedAchievements.length}</strong>
                  </div>
                  <div className="macho-mini-meter">
                    <span>黄金</span>
                    <strong>{formatFullNumber(state.goldenClicks)}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className={`macho-status-hero md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" || desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div>
                <div className="macho-ui-label">Protein Shake</div>
                <div className="mt-1 text-xl font-black text-[#FFE7C2]">{proteinShakeName}</div>
                <div className="macho-shake-meter mt-3" style={{ "--shake-level": `${proteinShakeLevel}%` } as CSSProperties}>
                  <div className="macho-shake-fill" />
                </div>
              </div>
              <div className="macho-status-medal">
                <span>{state.unlockedAchievements.length}/{achievements.length}</span>
              </div>
            </div>
            <div className={`macho-status-hero md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
              <div>
                <div className="macho-ui-label">Season</div>
                <div className="mt-1 text-xl font-black text-[#FFE7C2]">{seasonalEvent.name}</div>
                <div className="mt-1 text-xs font-bold text-white/70">{seasonalEvent.bonusLabel}</div>
              </div>
              <div className={`macho-season-badge bg-gradient-to-br ${seasonalTheme.accentClass}`}>{seasonalEvent.icon}</div>
            </div>
            {limitedEvent ? (
              <div className={`macho-status-hero md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "overview" ? "" : "hidden"}`}>
                <div>
                  <div className="macho-ui-label">Limited Event</div>
                  <div className="mt-1 text-xl font-black text-[#FFF2C5]">{limitedEvent.name}</div>
                  <div className="mt-1 text-xs font-bold text-white/70">{limitedEvent.bonusLabel}</div>
                </div>
                <div className="macho-season-badge bg-gradient-to-br from-yellow-100 via-amber-400 to-orange-600 text-[#5B2109]">{limitedEvent.icon}</div>
              </div>
            ) : null}
            <div className={`macho-visual-panel md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "daily" ? "" : "hidden"}`}>
              <div className="macho-daily-stage">
                <Image
                  src={activeTrainingPlan?.id === "off" ? "/game/macho-clicker/icons/generated-v3/high-protein-meal.png" : "/game/macho-clicker/icons/generated-v3/dumbbell.png"}
                  alt=""
                  width={92}
                  height={92}
                  className="h-20 w-20 object-contain drop-shadow-2xl"
                />
                <Image src="/game/macho-clicker/icons/generated-v3/protein-workshop.png" alt="" width={76} height={76} className="h-16 w-16 object-contain drop-shadow-2xl" />
                <Image src="/game/macho-clicker/icons/generated-v3/trainer.png" alt="" width={76} height={76} className="h-16 w-16 object-contain drop-shadow-2xl" />
              </div>
              <div className="min-w-0">
                <div className="macho-ui-label">Daily Setup</div>
                <div className="mt-1 text-2xl font-black text-[#FFE7C2]">
                  {activeTrainingPlan ? activeTrainingPlan.label : "今日のメニューを選択"}
                </div>
                <div className="mt-2 text-sm font-bold leading-6 text-white/72">
                  日課は毎日リセットされる小さなボーナスです。選ぶだけで今日の遊び方が少し変わります。
                </div>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3 ${desktopDetailPanel === "daily" ? "" : "hidden"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="macho-ui-label">Today Training</div>
                  <div className="mt-1 text-lg font-black">{activeTrainingPlan ? activeTrainingPlan.label : "未選択"}</div>
                  <div className="mt-1 text-xs font-bold text-white/70">
                    {activeTrainingPlan ? activeTrainingPlan.bonusLabel : "今日のメニューを選ぶと、部位成長と生産に小さなボーナスが入ります。"}
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#FFE7C2]">
                  {state.dailyTrainingDate === getTodayKey() ? "本日分" : "未設定"}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {trainingPlans.map((plan) => {
                  const selected = activeTrainingPlan?.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => selectTrainingPlan(plan)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#FFE7C2] bg-[#FF8A23] text-white shadow-[0_0_0_3px_rgba(255,138,35,0.22)]"
                          : "border-white/10 bg-black/20 text-white/80 hover:border-[#FFB45D] hover:bg-white/10"
                      }`}
                    >
                      <div className="text-sm font-black">{plan.label}</div>
                      <div className="mt-1 text-[11px] font-bold leading-5 opacity-75">{plan.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3 ${desktopDetailPanel === "daily" ? "" : "hidden"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="macho-ui-label">Supplement Stack</div>
                  <div className="mt-1 text-lg font-black">
                    {activeSupplements.length > 0 ? activeSupplements.map((supplement) => supplement.label).join(" / ") : "未使用"}
                  </div>
                  <div className="mt-1 text-xs font-bold text-white/70">
                    プロテインは長期の生産、クレアチンは底上げ、プレワークアウトはクリック寄りに効きます。
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#FFE7C2]">
                  {state.dailySupplementDate === getTodayKey() ? `${activeSupplements.length}種類` : "未設定"}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {supplementDefinitions.map((supplement) => {
                  const selected = activeSupplements.some((active) => active.id === supplement.id);
                  return (
                    <button
                      key={supplement.id}
                      type="button"
                      onClick={() => toggleSupplement(supplement)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#FFE7C2] bg-[#FF8A23] text-white shadow-[0_0_0_3px_rgba(255,138,35,0.22)]"
                          : "border-white/10 bg-black/20 text-white/80 hover:border-[#FFB45D] hover:bg-white/10"
                      }`}
                    >
                      <div className="text-sm font-black">{supplement.label}</div>
                      <div className="mt-1 text-[11px] font-bold leading-5 opacity-75">{supplement.description}</div>
                      <div className="mt-2 rounded-full bg-black/20 px-2 py-1 text-[10px] font-black">{supplement.bonusLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3 ${desktopDetailPanel === "daily" ? "" : "hidden"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="macho-ui-label">Machoda Event</div>
                  <div className="mt-1 text-lg font-black">{activeDailyCondition ? activeDailyCondition.label : "未設定"}</div>
                  <div className="mt-1 text-xs font-bold text-white/70">
                    飲酒テンションや二日酔いなど、マチョ田らしい日替わり状態を選べます。
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#FFE7C2]">
                  {state.dailyConditionDate === getTodayKey() ? "本日分" : "未設定"}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {dailyConditionDefinitions.map((condition) => {
                  const selected = activeDailyCondition?.id === condition.id;
                  return (
                    <button
                      key={condition.id}
                      type="button"
                      onClick={() => selectDailyCondition(condition)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#FFE7C2] bg-[#FF8A23] text-white shadow-[0_0_0_3px_rgba(255,138,35,0.22)]"
                          : "border-white/10 bg-black/20 text-white/80 hover:border-[#FFB45D] hover:bg-white/10"
                      }`}
                    >
                      <div className="text-sm font-black">{condition.label}</div>
                      <div className="mt-1 text-[11px] font-bold leading-5 opacity-75">{condition.description}</div>
                      <div className="mt-2 rounded-full bg-black/20 px-2 py-1 text-[10px] font-black">{condition.bonusLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-4 ${desktopDetailPanel === "save" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Machoda Links</div>
              <div className="mt-1 text-lg font-black">筋トレ情報と連携</div>
              <div className="mt-1 text-xs font-bold text-white/70">ゲームの邪魔にならないよう、必要な時だけ関連ページへ移動できます。</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link href="/supplements-ranking" className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-black text-white/85 transition hover:border-[#FFB45D] hover:bg-white/10">
                  おすすめサプリ
                </Link>
                <Link href="/training-gear" className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-black text-white/85 transition hover:border-[#FFB45D] hover:bg-white/10">
                  トレーニングギア
                </Link>
                <Link href="/training-faq" className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-black text-white/85 transition hover:border-[#FFB45D] hover:bg-white/10">
                  筋トレFAQ
                </Link>
              </div>
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-3 ${desktopDetailPanel === "save" ? "" : "hidden"}`}>
              <div className="macho-ui-label">Share</div>
              <div className="mt-1 text-lg font-black">今の結果を共有</div>
              <div className="mt-1 text-xs font-bold text-white/70">称号、累計筋肉ポイント、毎秒生産を共有用テキストにします。</div>
              <button
                type="button"
                onClick={shareResult}
                className="macho-game-button mt-4 rounded-2xl bg-[#FF8A23] px-4 py-3 text-sm font-black text-white transition hover:bg-[#f57200]"
              >
                共有テキストを作成
              </button>
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
            <div className={`macho-dark-card rounded-2xl px-4 py-3 ${desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
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
            <div className={`macho-cat-card rounded-2xl px-4 py-3 md:col-span-2 xl:col-span-2 ${desktopDetailPanel === "achievements" ? "" : "hidden"}`}>
              <div className="flex items-start gap-3">
                <div className="macho-cat-icon-v2" aria-hidden="true">
                  <Image src="/game/macho-clicker/icons/macho-cat.svg" alt="" width={64} height={64} className="h-full w-full object-contain" />
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
              <div className="macho-panel-scene-header">
                <div className="macho-panel-scene-icon">
                  <Image src="/game/macho-clicker/icons/generated-v3/golden-protein.png" alt="" width={64} height={64} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <div className="macho-ui-label">Achievement Room</div>
                  <div className="mt-1 text-xl font-black text-[#FFE7C2]">実績を集めてシェイクを濃くする</div>
                </div>
              </div>
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
              <div className="macho-panel-scene-header">
                <div className="macho-panel-scene-icon">
                  <Image src="/game/macho-clicker/icons/generated-v3/macho-portal.png" alt="" width={64} height={64} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <div className="macho-ui-label">Legacy Room</div>
                  <div className="mt-1 text-xl font-black text-[#FFE7C2]">仕上げ直しで恒久強化を取る</div>
                </div>
              </div>
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
              <div className="macho-panel-scene-header">
                <div className="macho-panel-scene-icon">
                  <Image src="/game/macho-clicker/icons/generated-v3/nutrition-lab.png" alt="" width={64} height={64} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <div className="macho-ui-label">Crystal Lab</div>
                  <div className="mt-1 text-xl font-black text-[#FFE7C2]">筋肉結晶で設備を育てる</div>
                </div>
              </div>
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
              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="macho-ui-label">Crystal Research</div>
                    <div className="mt-1 text-base font-black text-[#FFE7C2]">設備レベル以外にも、結晶を長期研究へ使える</div>
                    <div className="mt-1 text-xs font-bold text-white/65">研究は仕上げ直し後も残ります。</div>
                  </div>
                  <div className="rounded-full bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100">
                    所持結晶 {formatFullNumber(state.muscleCrystals)}個
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {crystalResearches.map((research) => {
                    const owned = state.crystalResearch.includes(research.id);
                    const unlocked = research.unlock(state);
                    const canBuy = !owned && unlocked && state.muscleCrystals >= research.cost;
                    return (
                      <button
                        key={research.id}
                        type="button"
                        onClick={() => buyCrystalResearch(research)}
                        disabled={!canBuy}
                        data-shop-state={owned ? "owned" : canBuy ? "purchasable" : "unavailable"}
                        className={`macho-game-button macho-shop-card rounded-2xl border p-4 text-left transition ${
                          owned
                            ? "border-cyan-200/60 bg-cyan-300/15 text-cyan-50"
                            : canBuy
                            ? "border-cyan-200/60 bg-slate-950/40 text-white hover:-translate-y-0.5"
                            : "border-white/10 bg-black/20 text-white/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100/30 bg-cyan-300/10 text-lg font-black text-cyan-100">
                            {research.icon}
                          </span>
                          <span className="rounded-full bg-black/20 px-2 py-1 text-xs font-black">{owned ? "研究済み" : `${research.cost}晶`}</span>
                        </div>
                        <div className="mt-3 text-base font-black">{research.name}</div>
                        <div className="mt-1 text-xs font-black text-cyan-100">{research.effectLabel}</div>
                        <div className="mt-2 text-xs font-bold leading-5 opacity-80">
                          {unlocked ? research.description : "結晶や周回の進行で解放されます。"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="macho-focus-minigame mt-5 overflow-hidden rounded-3xl border border-cyan-200/35 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,rgba(8,47,73,0.88),rgba(15,23,42,0.96))] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="macho-ui-label">Mini Game / Focus Room</div>
                      <div className="mt-1 text-lg font-black text-cyan-50">気合い注入</div>
                      <div className="mt-1 text-xs font-bold leading-5 text-cyan-50/70">
                        {!focusGymAvailable
                          ? "いずれかの設備をLv.1にすると研究が解放されます。"
                          : !focusGymUnlocked
                          ? "筋肉結晶2個で「気合い注入ルーム」を研究してください。"
                          : `30分で1チャージ回復。5分間、毎秒生産がx${FOCUS_PRODUCTION_MULTIPLIER}になります。`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-cyan-100">気合い {state.focusCharges}/{FOCUS_MAX_CHARGES}</div>
                        <div className="mt-1 text-[11px] font-bold text-cyan-100/65">
                          {activeFocusBuff
                            ? `発動中 あと${Math.max(1, Math.ceil((activeFocusBuff.endAt - Date.now()) / 60_000))}分`
                            : getNextFocusChargeText(state)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={activateFocusGym}
                        disabled={!focusGymUnlocked || state.focusCharges <= 0}
                        className="macho-game-button rounded-2xl border border-cyan-100/50 bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none"
                      >
                        気合い注入
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2" aria-label={`気合いチャージ ${state.focusCharges}`}>
                    {Array.from({ length: FOCUS_MAX_CHARGES }, (_, index) => (
                      <span
                        key={`focus-charge-${index}`}
                        className={`h-2 rounded-full transition ${index < state.focusCharges ? "bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.7)]" : "bg-white/10"}`}
                      />
                    ))}
                  </div>
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
              <div className="macho-panel-scene-header">
                <div className="macho-panel-scene-icon">
                  <Image src="/game/macho-clicker/icons/generated-v3/muscle-console.png" alt="" width={64} height={64} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <div className="macho-ui-label">Control Console</div>
                  <div className="mt-1 text-xl font-black text-[#FFE7C2]">保存・表示・共有をまとめて管理</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="macho-ui-label">Options / Save Data</div>
                  <div className="mt-1 text-sm font-bold text-white/80">
                    オートセーブ対応。必要なら手動保存・エクスポート・インポートできます。
                  </div>
                  <div className="mt-2 grid gap-1 text-xs font-bold text-white/60 sm:grid-cols-2">
                    <span>開始: {formatDateTime(state.playStartedAt)}</span>
                    <span>最終保存: {formatDateTime(lastAutoSaveAt ?? state.lastSavedAt)}</span>
                    <span>プレイ時間: {formatDuration(totalPlaySeconds)}</span>
                    <span>現在の表記: {numberNotation === "short" ? "英語単位" : numberNotation === "japanese" ? "日本語単位" : "全桁表示"}</span>
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
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="macho-option-box">
                  <div className="macho-ui-label">Sound</div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((current) => !current)}
                    className="macho-game-button mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    効果音 {soundEnabled ? "ON" : "OFF"}
                  </button>
                  <label className="mt-3 block text-xs font-black text-white/70">
                    BGM音量 {Math.round(bgmVolume * 100)}%
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgmVolume}
                      onChange={(event) => setBgmVolume(Number(event.target.value))}
                      className="mt-2 w-full accent-[#FF8A23]"
                    />
                  </label>
                  <label className="mt-3 block text-xs font-black text-white/70">
                    クリック音量 {Math.round(soundVolume * 100)}%
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(event) => setSoundVolume(Number(event.target.value))}
                      className="mt-2 w-full accent-[#FF8A23]"
                    />
                  </label>
                  <label className="mt-3 block text-xs font-black text-white/70">
                    通知音量 {Math.round(notificationVolume * 100)}%
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={notificationVolume}
                      onChange={(event) => setNotificationVolume(Number(event.target.value))}
                      className="mt-2 w-full accent-[#FF8A23]"
                    />
                  </label>
                </div>
                <div className="macho-option-box">
                  <div className="macho-ui-label">Visual Effects</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["low", "normal", "high"] as const).map((density) => (
                      <button
                        key={density}
                        type="button"
                        onClick={() => setEffectDensity(density)}
                        className={`macho-game-button rounded-xl px-3 py-2 text-xs font-black ${
                          effectDensity === density ? "bg-[#FF8A23] text-white" : "bg-white/10 text-white/75"
                        }`}
                      >
                        {density === "low" ? "少" : density === "normal" ? "標準" : "多"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBackgroundAnimationEnabled((current) => !current)}
                    className="macho-game-button mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    背景アニメ {backgroundAnimationEnabled ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReducedEffects((current) => !current)}
                    className="macho-game-button mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    軽量モード {reducedEffects ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="macho-option-box">
                  <div className="macho-ui-label">Equipment View</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["compact", "normal", "dense"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEquipmentDisplayMode(mode)}
                        className={`macho-game-button rounded-xl px-3 py-2 text-xs font-black ${
                          equipmentDisplayMode === mode ? "bg-[#FF8A23] text-white" : "bg-white/10 text-white/75"
                        }`}
                      >
                        {mode === "compact" ? "少" : mode === "normal" ? "標準" : "多"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl bg-black/20 px-4 py-3 text-xs font-bold leading-5 text-white/65">
                    設備アイコンは最大 {displayEquipmentLimit} 個まで表示します。多すぎる場合は残数表示にまとめます。
                  </div>
                </div>
              </div>
              {exportedSaveText ? (
                <div className="mt-5">
                  <div className="macho-ui-label">Exported Save</div>
                  <textarea
                    readOnly
                    value={exportedSaveText}
                    className="mt-2 h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-xs text-white/80 outline-none"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
              ) : null}
            </div>
            <div className={`macho-dark-card rounded-2xl px-4 py-3 md:col-span-4 xl:col-span-7 ${desktopDetailPanel === "stats" ? "" : "hidden"}`}>
              <div className="macho-panel-scene-header">
                <div className="macho-panel-scene-icon">
                  <Image src="/game/macho-clicker/icons/generated-v3/cortex-trainer.png" alt="" width={64} height={64} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <div className="macho-ui-label">Stats Board</div>
                  <div className="mt-1 text-xl font-black text-[#FFE7C2]">細かい数字はここで確認</div>
                </div>
              </div>
              <div className="macho-ui-label">Stats</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                  ["累計", displayNumber(state.totalMuscle)],
                  ["現在", displayNumber(state.muscle)],
                  ["毎秒", `+${displayNumber(perSecond)}`],
                  ["クリック", formatFullNumber(state.clickCount)],
                  ["手動獲得", displayNumber(state.handMadeMuscle)],
                  ["自動獲得", displayNumber(Math.max(0, state.totalMuscle - state.handMadeMuscle))],
                  ["設備数", formatFullNumber(ownedUpgradeCount)],
                  ["設備Lv", formatFullNumber(totalBuildingLevel)],
                  ["実績", `${state.unlockedAchievements.length}/${achievements.length}`],
                  ["ゴールデン", `${formatFullNumber(state.goldenClicks)}回`],
                  ["仕上げ直し", `${formatFullNumber(state.ascensionCount)}回`],
                  ["永久倍率", `+${formatFullNumber(state.prestigeLevel)}%`],
                  ["筋肉結晶", `${formatFullNumber(state.muscleCrystals)}個`],
                  ["開始日", formatDateTime(state.playStartedAt)],
                  ["プレイ時間", formatDuration(totalPlaySeconds)],
                  ["最終保存", formatDateTime(lastAutoSaveAt ?? state.lastSavedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="macho-stat-tile">
                    <div className="macho-ui-label">{label}</div>
                    <div className="macho-ui-number mt-1 break-words text-xl">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="macho-ui-label">Building Production</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {buildingStats.map(({ upgrade, owned, totalProduction, unitProduction, percentage }) => (
                    <div key={`stat-building-${upgrade.key}`} className="macho-building-stat-card">
                      <div className="flex items-center gap-3">
                        <Image src={upgrade.spriteSrc} alt="" width={42} height={42} className="h-10 w-10 object-contain" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-[#FFE7C2]">{upgrade.name}</div>
                          <div className="mt-1 text-xs font-bold text-white/55">所持 {formatFullNumber(owned)} / 1個 +{formatRate(unitProduction)}/秒</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#FF8A23]" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="mt-2 text-xs font-black text-white/75">合計 +{formatRate(totalProduction)}/秒</div>
                    </div>
                  ))}
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
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
