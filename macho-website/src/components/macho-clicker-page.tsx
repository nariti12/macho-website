"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";

const profileImageSrc = "/picture/ore.png";
const characterImageSrc = "/picture/man.png";
const STORAGE_KEY = "machoda:macho-clicker:v3";
const SAVE_INTERVAL_MS = 1000;
const GAME_TICK_MS = 100;
const NEWS_INTERVAL_MS = 18_000;
const OFFLINE_LIMIT_SECONDS = 60 * 60 * 8;
const MAX_SCORE = 999_999_999_999_999;

type UpgradeKey = "pushUp" | "abRoller" | "dumbbell" | "protein" | "chicken" | "benchPress" | "trainer" | "gym";

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
  goldenMultiplier?: number;
  unlock: (state: GameState) => boolean;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
  clickCount: number;
  upgrades: Record<UpgradeKey, number>;
  purchasedPowerUps: string[];
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

type Spark = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotate: number;
};

type MobilePanel = "click" | "gym" | "shop";

type SoundType = "click" | "buy" | "blocked" | "golden";

type Achievement = {
  key: string;
  title: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
};

type GoldenProtein = {
  id: number;
  x: number;
  y: number;
};

type MysteryShopItem = {
  id: string;
  name: string;
  description: string;
  unlockHint: string;
};

const upgrades: Upgrade[] = [
  {
    key: "pushUp",
    name: "ダンベル",
    label: "DB",
    icon: "➤",
    spriteSrc: "/game/macho-clicker/dumbbell.png",
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
    spriteSrc: "/game/macho-clicker/ab-roller.png",
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
    spriteSrc: "/game/macho-clicker/bench.png",
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
    spriteSrc: "/game/macho-clicker/protein.png",
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
    spriteSrc: "/game/macho-clicker/meal.png",
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
    spriteSrc: "/game/macho-clicker/bench.png",
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
    spriteSrc: "/game/macho-clicker/trainer.png",
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
    spriteSrc: "/game/macho-clicker/gym.png",
    description: "街ごと筋トレ空間に変える巨大施設です。",
    baseCost: 330000000,
    costRate: 1.15,
    perSecondBonus: 44000,
    accent: "from-[#FFB45D] to-[#7C2D12]",
  },
];

const visualUpgrades = upgrades.filter((upgrade) => upgrade.key !== "pushUp");

const emptyUpgrades: Record<UpgradeKey, number> = {
  pushUp: 0,
  abRoller: 0,
  dumbbell: 0,
  protein: 0,
  chicken: 0,
  benchPress: 0,
  trainer: 0,
  gym: 0,
};

const powerUpgrades: PowerUpgrade[] = [
  {
    id: "grip-gloves",
    name: "握力強化グローブ",
    description: "クリック時の筋肉ポイントが +1 されます。",
    cost: 100,
    spriteSrc: "/game/macho-clicker/dumbbell.png",
    effectLabel: "クリック +1",
    clickBonus: 1,
    unlock: (state) => state.totalMuscle >= 50,
  },
  {
    id: "roller-core",
    name: "腹筋ローラー改",
    description: "腹筋ローラー職人の毎秒生産が2倍になります。",
    cost: 1_000,
    spriteSrc: "/game/macho-clicker/ab-roller.png",
    effectLabel: "腹筋ローラー x2",
    target: "abRoller",
    buildingMultiplier: 2,
    unlock: (state) => state.upgrades.abRoller >= 1,
  },
  {
    id: "barbell-plates",
    name: "高重量プレート",
    description: "バーベル部隊の毎秒生産が2倍になります。",
    cost: 11_000,
    spriteSrc: "/game/macho-clicker/bench.png",
    effectLabel: "バーベル x2",
    target: "dumbbell",
    buildingMultiplier: 2,
    unlock: (state) => state.upgrades.dumbbell >= 1,
  },
  {
    id: "protein-blend",
    name: "黄金プロテイン配合",
    description: "ゴールデンプロテインの獲得ボーナスが2倍になります。",
    cost: 50_000,
    spriteSrc: "/game/macho-clicker/golden-protein.png",
    effectLabel: "黄金 x2",
    goldenMultiplier: 2,
    unlock: (state) => state.totalMuscle >= 10_000,
  },
  {
    id: "factory-line",
    name: "プロテイン自動ライン",
    description: "プロテイン工房の毎秒生産が2倍になります。",
    cost: 120_000,
    spriteSrc: "/game/macho-clicker/protein.png",
    effectLabel: "工房 x2",
    target: "protein",
    buildingMultiplier: 2,
    unlock: (state) => state.upgrades.protein >= 1,
  },
  {
    id: "meal-prep",
    name: "作り置き高たんぱく飯",
    description: "高たんぱく食堂の毎秒生産が2倍になります。",
    cost: 1_300_000,
    spriteSrc: "/game/macho-clicker/meal.png",
    effectLabel: "食堂 x2",
    target: "chicken",
    buildingMultiplier: 2,
    unlock: (state) => state.upgrades.chicken >= 1,
  },
];

const mysteryShopItems: MysteryShopItem[] = [
  {
    id: "mystery-equipment",
    name: "？？？",
    description: "まだ正体不明のジム設備です。さらに筋肉ポイントを稼ぐと、新しい設備を追加できる余地として残しています。",
    unlockHint: "未解放",
  },
];

const achievements: Achievement[] = [
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
];

const initialState: GameState = {
  muscle: 0,
  totalMuscle: 0,
  clickCount: 0,
  upgrades: emptyUpgrades,
  purchasedPowerUps: [],
  lastSavedAt: Date.now(),
  unlockedAchievements: [],
};

const clampScore = (value: number) => Math.min(MAX_SCORE, Math.max(0, value));

const formatNumber = (value: number) => Math.floor(value).toLocaleString("ja-JP");

const formatFullNumber = (value: number) => Math.floor(value).toLocaleString("ja-JP");

const formatRate = (value: number) =>
  value < 100 && !Number.isInteger(value)
    ? value.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : Math.floor(value).toLocaleString("ja-JP");

const getUpgradeCost = (upgrade: Upgrade, level: number) => Math.ceil(upgrade.baseCost * upgrade.costRate ** level);

const getShortage = (muscle: number, cost: number) => Math.max(0, cost - muscle);

const getUpgradeVisibleCount = (level: number) => Math.min(180, level);

const mobilePanels: { key: MobilePanel; label: string }[] = [
  { key: "click", label: "クリック" },
  { key: "shop", label: "ショップ" },
  { key: "gym", label: "ジム" },
];

const soundProfiles: Record<SoundType, { frequency: number; endFrequency: number; duration: number; gain: number; wave: OscillatorType }> = {
  click: { frequency: 220, endFrequency: 150, duration: 0.045, gain: 0.04, wave: "square" },
  buy: { frequency: 420, endFrequency: 760, duration: 0.12, gain: 0.055, wave: "triangle" },
  blocked: { frequency: 120, endFrequency: 80, duration: 0.12, gain: 0.04, wave: "sawtooth" },
  golden: { frequency: 660, endFrequency: 990, duration: 0.18, gain: 0.065, wave: "sine" },
};

const getDumbbellOrbitItems = (count: number) => {
  const ringCapacities = [18, 28, 40, 54, 72, 96];
  const items: { index: number; angle: number; radius: string; size: number }[] = [];
  let remaining = Math.min(308, count);
  let indexOffset = 0;

  for (let ringIndex = 0; ringIndex < ringCapacities.length && remaining > 0; ringIndex += 1) {
    const ringCount = Math.min(ringCapacities[ringIndex], remaining);
    const maxRadius = 13.8 + ringIndex * 1.8;
    const viewportRadius = 28 + ringIndex * 4.5;
    const radius = `clamp(${maxRadius - 1.6}rem, ${viewportRadius}vw, ${maxRadius}rem)`;
    const size = ringIndex < 2 ? 44 : 36;

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

const getClickPower = (state: GameState) =>
  1 +
  powerUpgrades.reduce(
    (total, powerUp) => total + (state.purchasedPowerUps.includes(powerUp.id) ? powerUp.clickBonus ?? 0 : 0),
    0
  );

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
  (upgrade.perSecondBonus ?? 0) * getBuildingMultiplierWithPendingPowerUp(state, upgrade.key, pendingPowerUp);

const getBuildingTotalProduction = (state: GameState, upgrade: Upgrade, pendingPowerUp?: PowerUpgrade) =>
  getBuildingUnitProduction(state, upgrade, pendingPowerUp) * state.upgrades[upgrade.key];

const getGoldenMultiplier = (state: GameState) =>
  powerUpgrades.reduce((total, powerUp) => {
    if (!state.purchasedPowerUps.includes(powerUp.id)) return total;
    return total * (powerUp.goldenMultiplier ?? 1);
  }, 1);

const getPerSecond = (state: GameState) =>
  upgrades.reduce(
    (total, upgrade) =>
      total + (upgrade.perSecondBonus ?? 0) * state.upgrades[upgrade.key] * getBuildingMultiplier(state, upgrade.key),
    0
  );

const getTitle = (totalMuscle: number) => {
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
  ];
  return goals.find((goal) => totalMuscle < goal.value) ?? goals[goals.length - 1];
};

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
  const lines = [
    "ジムの片隅で謎のクリック音が鳴り響いています。",
    "マチョ田、今日も腹筋ローラーを抱えて登場。",
    `${title} が街で少しずつ噂になっています。`,
    `現在の自動筋トレ効率は毎秒 ${formatRate(perSecond)} 筋肉です。`,
  ];

  if (state.totalMuscle >= 50_000) lines.push("近所のジムで『あの人、仕上がってない？』という声が増えています。");
  if (state.totalMuscle >= 1_000_000) lines.push("マチョ田級の肉体が完成しつつあります。もはや歩くパワーラックです。");
  if (Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 10) {
    lines.push("強化メニューの購入履歴が完全に筋トレ沼です。");
  }

  return lines;
};

const getPowerUpgradeSummary = (powerUp: PowerUpgrade, state: GameState) => {
  if (powerUp.clickBonus) {
    return `クリック +${formatNumber(powerUp.clickBonus)}`;
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

  return powerUp.effectLabel;
};

const BuildingProductionDetails = ({
  state,
  upgrade,
}: {
  state: GameState;
  upgrade: Upgrade;
}) => {
  const owned = state.upgrades[upgrade.key];
  const unitProduction = getBuildingUnitProduction(state, upgrade);
  const totalProduction = getBuildingTotalProduction(state, upgrade);
  const nextTotalProduction = totalProduction + unitProduction;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
      <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
        次の価格<br />{formatFullNumber(getUpgradeCost(upgrade, owned))}
      </div>
      <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
        1個あたり<br />+{formatRate(unitProduction)}/秒
      </div>
      <div className="col-span-2 rounded-xl bg-[#FFE7C2] px-3 py-2">
        合計生産<br />+{formatRate(totalProduction)}/秒
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

  if (powerUp.clickBonus) {
    const currentClick = getClickPower(state);
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          現在クリック<br />+{formatNumber(currentClick)}
        </div>
        <div className="rounded-xl bg-[#FFE7C2] px-3 py-2">
          購入後<br />+{formatNumber(currentClick + powerUp.clickBonus)}
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

const readSavedState = (): GameState => {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState, lastSavedAt: Date.now() };

    const saved = JSON.parse(raw) as Partial<GameState>;
    const normalized: GameState = {
      muscle: typeof saved.muscle === "number" ? clampScore(saved.muscle) : 0,
      totalMuscle: typeof saved.totalMuscle === "number" ? clampScore(saved.totalMuscle) : 0,
      clickCount: typeof saved.clickCount === "number" ? Math.max(0, Math.floor(saved.clickCount)) : 0,
      upgrades: normalizeSavedUpgrades(saved.upgrades),
      purchasedPowerUps: Array.isArray(saved.purchasedPowerUps)
        ? saved.purchasedPowerUps.filter((id): id is string => typeof id === "string")
        : [],
      lastSavedAt: typeof saved.lastSavedAt === "number" ? saved.lastSavedAt : Date.now(),
      unlockedAchievements: Array.isArray(saved.unlockedAchievements) ? saved.unlockedAchievements : [],
    };

    const offlineSeconds = Math.min(
      OFFLINE_LIMIT_SECONDS,
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
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [goldenProtein, setGoldenProtein] = useState<GoldenProtein | null>(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const [hoveredGymUpgradeKey, setHoveredGymUpgradeKey] = useState<UpgradeKey | null>(null);
  const [hoveredShopUpgradeKey, setHoveredShopUpgradeKey] = useState<UpgradeKey | null>(null);
  const [hoveredPowerUpId, setHoveredPowerUpId] = useState<string | null>(null);
  const [hoveredMysteryId, setHoveredMysteryId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("click");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const effectIdRef = useRef(0);
  const stateRef = useRef<GameState>(initialState);
  const audioContextRef = useRef<AudioContext | null>(null);
  const clickPower = useMemo(() => getClickPower(state), [state]);
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const title = getTitle(state.totalMuscle);
  const nextGoal = getNextTitleGoal(state.totalMuscle);
  const titleProgress = Math.min(100, Math.max(0, (state.totalMuscle / nextGoal.value) * 100));
  const ownedUpgradeCount = Object.values(state.upgrades).reduce((total, level) => total + level, 0);
  const visualOwnedUpgradeCount = visualUpgrades.reduce((total, upgrade) => total + state.upgrades[upgrade.key], 0);
  const newsLines = getNewsLines(state, title, perSecond);
  const news = newsLines[newsIndex % newsLines.length];
  const bodyStage = getBodyStage(state.totalMuscle);
  const dumbbellOrbitItems = useMemo(() => getDumbbellOrbitItems(state.upgrades.pushUp), [state.upgrades.pushUp]);
  const hoveredGymUpgrade = hoveredGymUpgradeKey ? upgrades.find((upgrade) => upgrade.key === hoveredGymUpgradeKey) ?? null : null;
  const hoveredShopUpgrade = hoveredShopUpgradeKey ? upgrades.find((upgrade) => upgrade.key === hoveredShopUpgradeKey) ?? null : null;
  const hoveredPowerUp = hoveredPowerUpId ? powerUpgrades.find((powerUp) => powerUp.id === hoveredPowerUpId) ?? null : null;
  const hoveredMystery = hoveredMysteryId ? mysteryShopItems.find((item) => item.id === hoveredMysteryId) ?? null : null;
  const unlockedPowerUps = powerUpgrades.filter(
    (powerUp) => powerUp.unlock(state) && !state.purchasedPowerUps.includes(powerUp.id)
  );

  useEffect(() => {
    setState(readSavedState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    if (!isLoaded || perSecond <= 0) return;

    const timer = window.setInterval(() => {
      const gain = perSecond * (GAME_TICK_MS / 1000);
      setState((current) => ({
        ...current,
        muscle: clampScore(current.muscle + gain),
        totalMuscle: clampScore(current.totalMuscle + gain),
        lastSavedAt: Date.now(),
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
    const spawn = () => {
      setGoldenProtein({
        id: Date.now(),
        x: 12 + Math.random() * 76,
        y: 14 + Math.random() * 62,
      });
      window.setTimeout(() => setGoldenProtein(null), 8500);
    };

    const initialTimer = window.setTimeout(spawn, 45000);
    const interval = window.setInterval(spawn, 90000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const newlyUnlocked = achievements.find(
      (achievement) => !state.unlockedAchievements.includes(achievement.key) && achievement.isUnlocked(state)
    );

    if (!newlyUnlocked) return;

    setState((current) => ({
      ...current,
      unlockedAchievements: [...current.unlockedAchievements, newlyUnlocked.key],
    }));
    setAchievementToast(newlyUnlocked);
    window.setTimeout(() => setAchievementToast(null), 3200);
  }, [state]);

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
      ...Array.from({ length: 7 }, (_, index) => ({
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

  const playSound = (type: SoundType) => {
    if (!soundEnabled || typeof window === "undefined") return;

    try {
      const AudioContextConstructor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        void context.resume();
      }

      const profile = soundProfiles[type];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = profile.wave;
      oscillator.frequency.setValueAtTime(profile.frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, now + profile.duration);
      gain.gain.setValueAtTime(profile.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + profile.duration);
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
      clickCount: current.clickCount + 1,
      lastSavedAt: Date.now(),
    }));
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    setState((current) => {
      const level = current.upgrades[upgrade.key];
      const cost = getUpgradeCost(upgrade, level);
      if (current.muscle < cost) {
        playSound("blocked");
        return current;
      }

      const increase = getBuildingUnitProduction(current, upgrade);
      setPurchaseFlash(`${upgrade.name} +${formatRate(increase)}/秒`);
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

  const buyPowerUpgrade = (powerUp: PowerUpgrade) => {
    setState((current) => {
      if (current.purchasedPowerUps.includes(powerUp.id) || current.muscle < powerUp.cost || !powerUp.unlock(current)) {
        playSound("blocked");
        return current;
      }

      setPurchaseFlash(`${powerUp.name}: ${getPowerUpgradeSummary(powerUp, current)}`);
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

  const collectGoldenProtein = () => {
    if (!goldenProtein) return;
    const bonus = Math.max(15, Math.floor((clickPower * 10 + perSecond * 60) * getGoldenMultiplier(state)));
    spawnClickEffects(bonus);
    setState((current) => ({
      ...current,
      muscle: clampScore(current.muscle + bonus),
      totalMuscle: clampScore(current.totalMuscle + bonus),
      lastSavedAt: Date.now(),
    }));
    setPurchaseFlash(`ゴールデンプロテイン +${formatNumber(bonus)}`);
    setGoldenProtein(null);
    playSound("golden");
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const resetGame = () => {
    if (!window.confirm("マチョクリッカーの進行状況をリセットしますか？")) return;
    const nextState = { ...initialState, upgrades: { ...emptyUpgrades }, purchasedPowerUps: [], lastSavedAt: Date.now() };
    setState(nextState);
    setCombo(0);
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
    <div className="min-h-screen overflow-hidden bg-[#FFF3DF] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,184,77,0.28),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(251,146,60,0.22),transparent_30%),linear-gradient(180deg,#FFF7EB_0%,#FDBA74_48%,#7C2D12_100%)]" />
      <SiteHeader profileImageSrc={profileImageSrc} />

      {achievementToast ? (
        <div className="macho-toast fixed right-4 top-24 z-50 max-w-xs rounded-3xl border border-[#FCD27B] bg-white px-5 py-4 shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">Achievement</div>
          <div className="mt-1 text-lg font-bold text-[#7C2D12]">{achievementToast.title}</div>
          <div className="mt-1 text-sm text-slate-600">{achievementToast.description}</div>
        </div>
      ) : null}

      {purchaseFlash ? (
        <div className="macho-toast fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-full bg-[#7C2D12] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {purchaseFlash}
        </div>
      ) : null}

      <main className="relative z-10 px-0 pb-12 pt-16">
        <div className="flex w-full max-w-none flex-col gap-2">
          <section className="overflow-hidden border-y-4 border-[#7C2D12] bg-[#7C2D12] text-white shadow-2xl">
            <div className="grid gap-px bg-[#FED7AA] lg:grid-cols-[420px_minmax(0,1fr)_390px]">
              <div className="bg-[#9A3412] px-5 py-4">
                <h1 className="text-3xl font-black tracking-tight text-[#FFE7C2]">マチョクリッカー</h1>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">{bodyStage.label}</div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Current</div>
                    <div className="mt-1 text-2xl font-black text-white">{formatFullNumber(state.muscle)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Per Second</div>
                    <div className="mt-1 text-2xl font-black text-white">+{formatRate(perSecond)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Total</div>
                    <div className="mt-1 text-2xl font-black text-white">{formatFullNumber(state.totalMuscle)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-[#FFB45D]">次の称号: {nextGoal.title}</div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((current) => !current)}
                    className="rounded-full border border-[#FED7AA]/60 px-3 py-1 text-[11px] font-black text-[#FFE7C2] transition hover:bg-[#7C2D12]"
                    aria-pressed={soundEnabled}
                  >
                    効果音 {soundEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FFB45D] to-[#FF5A1F]" style={{ width: `${titleProgress}%` }} />
                </div>
              </div>
            </div>
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

          <nav className="grid grid-cols-3 gap-2 border-x-4 border-[#7C2D12] bg-[#2A140B] p-2 xl:hidden" aria-label="マチョクリッカー画面切り替え">
            {mobilePanels.map((panel) => (
              <button
                key={panel.key}
                type="button"
                onClick={() => setMobilePanel(panel.key)}
                className={`rounded-2xl border-2 px-3 py-3 text-sm font-black transition ${
                  mobilePanel === panel.key
                    ? "border-[#FFE7C2] bg-[#FF8A23] text-white shadow-[0_0_0_3px_rgba(255,138,35,0.28)]"
                    : "border-[#9A3412] bg-[#7C2D12] text-[#FFE7C2]"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </nav>

          <section className="grid min-h-[calc(100vh-12rem)] overflow-hidden border-y-4 border-[#7C2D12] bg-[#7C2D12] shadow-2xl xl:grid-cols-[minmax(620px,760px)_minmax(0,1fr)_390px]">
            <aside
              className={`relative min-h-[calc(100vh-15rem)] flex-col items-center justify-between overflow-hidden border-b-4 border-[#7C2D12] bg-[radial-gradient(circle_at_center,#FFF0D5_0%,#FDBA74_54%,#B45309_100%)] p-4 text-center sm:p-5 xl:flex xl:min-h-[800px] xl:border-b-0 xl:border-r-4 ${
                mobilePanel === "click" ? "flex" : "hidden"
              }`}
            >
              <div className="relative z-10 w-full rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-4 text-[#7C2D12] shadow-xl">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">Muscle Points</div>
                <div className="mt-1 break-all text-4xl font-black sm:text-5xl">{formatFullNumber(state.muscle)}</div>
                <div className="mt-2 text-sm font-bold text-[#9A3412]">クリック: +{formatNumber(clickPower)} / COMBO {combo}</div>
              </div>

              {floatingGains.map((item) => (
                <div
                  key={item.id}
                  className="macho-float pointer-events-none absolute z-40 text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(124,45,18,0.85)]"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  +{formatNumber(item.value)}
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

              {goldenProtein ? (
                <button
                  type="button"
                  onClick={collectGoldenProtein}
                  className="macho-golden absolute z-50 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-500 shadow-2xl"
                  style={{ left: `${goldenProtein.x}%`, top: `${goldenProtein.y}%` }}
                  aria-label="ゴールデンプロテインを獲得"
                >
                  <Image
                    src="/game/macho-clicker/golden-protein.png"
                    alt=""
                    width={86}
                    height={86}
                    className="h-20 w-20 object-contain drop-shadow-xl"
                  />
                </button>
              ) : null}

              <div className="relative z-20 my-4 flex aspect-square w-full max-w-[760px] items-center justify-center overflow-visible sm:my-5">
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
                      src="/game/macho-clicker/dumbbell.png"
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
                  className={`macho-breathe group relative z-30 flex aspect-square w-[min(68vw,25rem)] items-center justify-center rounded-full border-[12px] shadow-[0_55px_110px_-35px_rgba(42,20,11,0.95)] transition hover:scale-[1.04] active:scale-95 ${bodyStage.ring} ${
                    clickBurst ? "macho-pop" : ""
                  }`}
                >
                  <span className="macho-shine absolute inset-0 rounded-full" />
                  <span className={`absolute inset-[-32px] rounded-full bg-white/40 blur-2xl transition ${bodyStage.aura}`} />
                  <Image
                    src={characterImageSrc}
                    alt="マチョ田をクリック"
                    width={280}
                    height={280}
                    priority
                    className="relative z-10 h-auto w-[min(48vw,19rem)] drop-shadow-2xl transition duration-300 group-hover:scale-105"
                    style={{ transform: `scale(${bodyStage.scale})` }}
                  />
                </button>
              </div>

              <div className="relative z-10 grid w-full grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-3 text-[#7C2D12] shadow-lg">
                  <div className="text-xs font-black text-[#C2410C]">称号</div>
                  <div className="mt-1 text-xl font-black">{title}</div>
                </div>
                <div className="rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-3 text-[#7C2D12] shadow-lg">
                  <div className="text-xs font-black text-[#C2410C]">クリック数</div>
                  <div className="mt-1 text-xl font-black">{formatFullNumber(state.clickCount)}</div>
                </div>
              </div>
            </aside>

            <section
              className={`relative min-h-[calc(100vh-15rem)] overflow-hidden border-b-4 border-[#7C2D12] bg-[linear-gradient(180deg,#FFF0D5_0%,#FDBA74_48%,#C2410C_100%)] xl:block xl:min-h-[560px] xl:border-b-0 xl:border-r-4 ${
                mobilePanel === "gym" ? "block" : "hidden"
              }`}
            >
              <div className="absolute inset-x-0 top-0 z-10 border-b-4 border-[#7C2D12] bg-[#FFF7EB]/95 px-5 py-3 text-[#7C2D12] shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Machoda Gym</div>
                    <div className="text-xl font-black">ジム設備</div>
                  </div>
                  <div className="rounded-full bg-[#FF8A23] px-4 py-2 text-sm font-black text-white">設備合計 {visualOwnedUpgradeCount}</div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(124,45,18,0.7)_90%)]" />
              <div className="absolute inset-x-4 bottom-5 top-24 overflow-hidden rounded-[28px] border-4 border-[#7C2D12] bg-[linear-gradient(180deg,rgba(255,247,235,0.92)_0%,rgba(255,237,213,0.76)_62%,rgba(154,52,18,0.72)_100%)] shadow-inner">
                <div className="grid h-full divide-y-2 divide-[#B45309]/35" style={{ gridTemplateRows: `repeat(${visualUpgrades.length}, minmax(0, 1fr))` }}>
                  {visualUpgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const visibleCount = getUpgradeVisibleCount(level);
                    return (
                      <div
                        key={upgrade.key}
                        className="relative flex min-h-0 items-center overflow-hidden px-3"
                        onMouseEnter={() => setHoveredGymUpgradeKey(upgrade.key)}
                        onMouseLeave={() => setHoveredGymUpgradeKey(null)}
                        onFocus={() => setHoveredGymUpgradeKey(upgrade.key)}
                        onBlur={() => setHoveredGymUpgradeKey(null)}
                      >
                        <div className="absolute left-3 top-1 z-10 rounded-full bg-[#7C2D12]/85 px-2 py-0.5 text-[10px] font-black text-[#FFE7C2]">
                          {upgrade.name} Lv.{level}
                        </div>
                        <div className="grid max-w-full grid-flow-col grid-rows-3 gap-x-1 gap-y-0.5 overflow-hidden pt-5 [grid-auto-columns:1.35rem] sm:[grid-auto-columns:1.55rem] 2xl:[grid-auto-columns:1.75rem]">
                          {Array.from({ length: visibleCount }, (_, index) => (
                            <div
                              key={`${upgrade.key}-unit-${index}`}
                              className="macho-unit flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6"
                              style={{ animationDelay: `${(index % 8) * 0.08}s` }}
                            >
                              <Image
                                src={upgrade.spriteSrc}
                                alt=""
                                width={32}
                                height={32}
                                className="h-5 w-5 object-contain drop-shadow-xl sm:h-6 sm:w-6"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="ml-2 shrink-0">
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
                <div className="pointer-events-none absolute right-8 top-28 z-40 w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-left text-[#7C2D12] shadow-2xl">
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

            <aside className={`${mobilePanel === "shop" ? "block" : "hidden"} bg-[#FFF7EB] text-[#7C2D12] xl:block`}>
              <div className="max-h-none overflow-y-visible p-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto">
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
                <div className="mb-5 rounded-2xl border-2 border-[#FDBA74] bg-white p-3">
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
                            onClick={() => {
                              if (canBuyPowerUp) buyPowerUpgrade(powerUp);
                            }}
                            aria-disabled={!canBuyPowerUp}
                            onMouseEnter={() => setHoveredPowerUpId(powerUp.id)}
                            onMouseLeave={() => setHoveredPowerUpId(null)}
                            onFocus={() => setHoveredPowerUpId(powerUp.id)}
                            onBlur={() => setHoveredPowerUpId(null)}
                            className={`relative flex h-16 items-center justify-center overflow-hidden rounded-2xl border-2 transition ${
                              canBuyPowerUp
                                ? "macho-shop-ready border-[#C2410C] bg-[#FFF4E7] shadow-[0_0_0_3px_rgba(255,138,35,0.22),0_10px_24px_rgba(194,65,12,0.2)] hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(255,138,35,0.35),0_16px_30px_rgba(194,65,12,0.28)]"
                                : "cursor-not-allowed border-[#FED7AA] bg-[#FFF4E7] grayscale opacity-45"
                            }`}
                          >
                            <Image src={powerUp.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  {upgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const cost = getUpgradeCost(upgrade, level);
                    const canBuy = state.muscle >= cost;
                    const shortage = getShortage(state.muscle, cost);

                    return (
                      <button
                        key={upgrade.key}
                        type="button"
                        onClick={() => buyUpgrade(upgrade)}
                        aria-disabled={!canBuy}
                        onMouseEnter={() => setHoveredShopUpgradeKey(upgrade.key)}
                        onMouseLeave={() => setHoveredShopUpgradeKey(null)}
                        onFocus={() => setHoveredShopUpgradeKey(upgrade.key)}
                        onBlur={() => setHoveredShopUpgradeKey(null)}
                        className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                          canBuy
                            ? "macho-shop-ready border-[#C2410C] bg-white text-[#7C2D12] shadow-[0_0_0_3px_rgba(255,138,35,0.18),0_10px_24px_rgba(194,65,12,0.16)] hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(255,138,35,0.32),0_16px_32px_rgba(194,65,12,0.26)]"
                            : "cursor-not-allowed border-[#FED7AA] bg-[#FFF4E7] text-[#9A3412]/45 grayscale"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[#FED7AA] bg-[#FFF4E7] shadow-inner"
                          >
                            <Image src={upgrade.spriteSrc} alt="" width={58} height={58} className="h-14 w-14 object-contain" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="font-black">{upgrade.name}</span>
                              <span className="rounded-full bg-[#7C2D12] px-2 py-1 text-xs font-black text-white">Lv.{level}</span>
                            </span>
                            <span
                              className={`mt-3 block rounded-xl px-3 py-2 text-sm font-black ${
                                canBuy ? "bg-[#7C2D12] text-white" : "bg-[#D6A169] text-[#7C2D12]"
                              }`}
                            >
                              {canBuy ? "必要" : "あと"}: {formatFullNumber(canBuy ? cost : shortage)} 筋肉
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
                      onMouseEnter={() => setHoveredMysteryId(item.id)}
                      onMouseLeave={() => setHoveredMysteryId(null)}
                      onFocus={() => setHoveredMysteryId(item.id)}
                      onBlur={() => setHoveredMysteryId(null)}
                      className="group relative rounded-2xl border border-[#FED7AA] bg-[#3B1D0F] p-3 text-left text-[#FFE7C2]/70 transition"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[#9A3412] bg-[#2A140B] text-3xl font-black shadow-inner">
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
                  <div className="pointer-events-none fixed right-[410px] top-28 z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block">
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
                  <div className="pointer-events-none fixed right-[410px] top-28 z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block">
                    <div className="flex items-center gap-3">
                      <Image src={hoveredPowerUp.spriteSrc} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                      <div>
                        <div className="text-base font-black">{hoveredPowerUp.name}</div>
                        <div className="text-xs font-bold text-[#C2410C]">{hoveredPowerUp.effectLabel}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-6">{hoveredPowerUp.description}</div>
                    <div className="mt-3 rounded-xl bg-[#FFE7C2] px-3 py-2 text-xs font-black">
                      必要: {formatFullNumber(hoveredPowerUp.cost)} 筋肉
                    </div>
                    <PowerUpgradeDetails state={state} powerUp={hoveredPowerUp} />
                  </div>
                ) : null}
                {hoveredMystery ? (
                  <div className="pointer-events-none fixed right-[410px] top-28 z-50 hidden w-80 rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB] p-4 text-[#7C2D12] shadow-2xl xl:block">
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
          </section>

          <section className="grid gap-4 rounded-[28px] border border-[#FCD27B]/60 bg-[#2A140B]/90 p-4 text-white shadow-2xl md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">Achievements</div>
              <div className="mt-1 text-2xl font-black">{state.unlockedAchievements.length}/{achievements.length}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">Upgrades</div>
              <div className="mt-1 text-2xl font-black">{ownedUpgradeCount}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">Unlocked</div>
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
          </section>

          <section className="grid gap-6 rounded-[36px] border border-white/40 bg-white/90 p-6 shadow-2xl backdrop-blur lg:grid-cols-[360px_1fr] sm:p-8">
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
                        <span className="text-sm font-black text-[#7C2D12]">{formatNumber(entry.score)}</span>
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
