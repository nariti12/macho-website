"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";

const profileImageSrc = "/picture/ore.png";
const STORAGE_KEY = "machoda:macho-clicker:v3";
const SAVE_INTERVAL_MS = 1000;
const OFFLINE_LIMIT_SECONDS = 60 * 60 * 8;
const MAX_SCORE = 999_999_999_999_999;

type UpgradeKey = "pushUp" | "abRoller" | "dumbbell" | "protein" | "chicken" | "benchPress" | "trainer" | "gym";

type Upgrade = {
  key: UpgradeKey;
  name: string;
  label: string;
  icon: string;
  description: string;
  baseCost: number;
  costRate: number;
  perSecondBonus?: number;
  accent: string;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
  clickCount: number;
  upgrades: Record<UpgradeKey, number>;
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

const upgrades: Upgrade[] = [
  {
    key: "pushUp",
    name: "補助カーソル",
    label: "CURSOR",
    icon: "➤",
    description: "10秒に1回、代わりにクリックしてくれます。",
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
    description: "腹筋ローラーを転がし続ける職人です。",
    baseCost: 100,
    costRate: 1.15,
    perSecondBonus: 1,
    accent: "from-[#FED7AA] to-[#EA580C]",
  },
  {
    key: "dumbbell",
    name: "ダンベル部隊",
    label: "DB",
    icon: "D",
    description: "黙々とダンベルを上げ続ける部隊です。",
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
    description: "街ごと筋トレ空間に変える巨大施設です。",
    baseCost: 330000000,
    costRate: 1.15,
    perSecondBonus: 44000,
    accent: "from-[#FFB45D] to-[#7C2D12]",
  },
];

const equipmentPositions = [
  { x: 8, y: 22 },
  { x: 19, y: 38 },
  { x: 33, y: 25 },
  { x: 47, y: 43 },
  { x: 62, y: 24 },
  { x: 76, y: 39 },
  { x: 88, y: 21 },
  { x: 12, y: 64 },
  { x: 28, y: 78 },
  { x: 44, y: 64 },
  { x: 60, y: 80 },
  { x: 78, y: 63 },
  { x: 91, y: 78 },
  { x: 22, y: 18 },
  { x: 70, y: 16 },
  { x: 38, y: 82 },
  { x: 55, y: 60 },
  { x: 84, y: 52 },
];

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
  lastSavedAt: Date.now(),
  unlockedAchievements: [],
};

const clampScore = (value: number) => Math.min(MAX_SCORE, Math.max(0, value));

const formatNumber = (value: number) => {
  const rounded = Math.floor(value);
  if (rounded >= 1_000_000_000_000) return `${(rounded / 1_000_000_000_000).toFixed(2)}兆`;
  if (rounded >= 100_000_000) return `${(rounded / 100_000_000).toFixed(2)}億`;
  if (rounded >= 10_000) return `${(rounded / 10_000).toFixed(1)}万`;
  return rounded.toLocaleString("ja-JP");
};

const getUpgradeCost = (upgrade: Upgrade, level: number) => Math.ceil(upgrade.baseCost * upgrade.costRate ** level);

const getClickPower = () => 1;

const getPerSecond = (state: GameState) =>
  upgrades.reduce((total, upgrade) => total + (upgrade.perSecondBonus ?? 0) * state.upgrades[upgrade.key], 0);

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

const getNews = (state: GameState, title: string, perSecond: number) => {
  const lines = [
    "ジムの片隅で謎のクリック音が鳴り響いています。",
    "マチョ田、今日も腹筋ローラーを抱えて登場。",
    `${title} が街で少しずつ噂になっています。`,
    `現在の自動筋トレ効率は毎秒 ${formatNumber(perSecond)} 筋肉です。`,
  ];

  if (state.totalMuscle >= 50_000) lines.push("近所のジムで『あの人、仕上がってない？』という声が増えています。");
  if (state.totalMuscle >= 1_000_000) lines.push("マチョ田級の肉体が完成しつつあります。もはや歩くパワーラックです。");
  if (Object.values(state.upgrades).reduce((total, level) => total + level, 0) >= 10) {
    lines.push("強化メニューの購入履歴が完全に筋トレ沼です。");
  }

  return lines[Math.floor(state.totalMuscle / 250 + Date.now() / 7000) % lines.length];
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
  const effectIdRef = useRef(0);
  const clickPower = useMemo(() => getClickPower(), []);
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const title = getTitle(state.totalMuscle);
  const nextGoal = getNextTitleGoal(state.totalMuscle);
  const titleProgress = Math.min(100, Math.max(0, (state.totalMuscle / nextGoal.value) * 100));
  const ownedUpgradeCount = Object.values(state.upgrades).reduce((total, level) => total + level, 0);
  const news = getNews(state, title, perSecond);
  const bodyStage = getBodyStage(state.totalMuscle);
  const cursorCount = Math.min(36, state.upgrades.pushUp);
  const equipmentTiles = useMemo(
    () =>
      upgrades
        .filter((upgrade) => upgrade.key !== "pushUp")
        .flatMap((upgrade, upgradeIndex) =>
          Array.from({ length: Math.min(18, state.upgrades[upgrade.key]) }, (_, index) => ({
            id: `${upgrade.key}-${index}`,
            icon: upgrade.icon,
            color: upgrade.accent,
            x: equipmentPositions[(index + upgradeIndex * 4) % equipmentPositions.length].x,
            y: equipmentPositions[(index + upgradeIndex * 4) % equipmentPositions.length].y,
            delay: ((index + upgradeIndex) % 6) * 0.12,
          }))
        ),
    [state.upgrades]
  );

  useEffect(() => {
    setState(readSavedState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
  }, [isLoaded, state]);

  useEffect(() => {
    if (!isLoaded || perSecond <= 0) return;

    const timer = window.setInterval(() => {
      setState((current) => ({
        ...current,
        muscle: clampScore(current.muscle + perSecond),
        totalMuscle: clampScore(current.totalMuscle + perSecond),
        lastSavedAt: Date.now(),
      }));
    }, SAVE_INTERVAL_MS);

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

  const handleClick = () => {
    const now = Date.now();
    const nextCombo = now - lastClickAt < 800 ? Math.min(99, combo + 1) : 1;
    const gain = clickPower;

    setCombo(nextCombo);
    setLastClickAt(now);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 140);
    spawnClickEffects(gain);

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
      if (current.muscle < cost) return current;

      setPurchaseFlash(upgrade.name);
      window.setTimeout(() => setPurchaseFlash(null), 1100);

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

  const collectGoldenProtein = () => {
    if (!goldenProtein) return;
    const bonus = Math.max(15, Math.floor(clickPower * 10 + perSecond * 60));
    spawnClickEffects(bonus);
    setState((current) => ({
      ...current,
      muscle: clampScore(current.muscle + bonus),
      totalMuscle: clampScore(current.totalMuscle + bonus),
      lastSavedAt: Date.now(),
    }));
    setPurchaseFlash(`ゴールデンプロテイン +${formatNumber(bonus)}`);
    setGoldenProtein(null);
    window.setTimeout(() => setPurchaseFlash(null), 1400);
  };

  const resetGame = () => {
    if (!window.confirm("マチョクリッカーの進行状況をリセットしますか？")) return;
    const nextState = { ...initialState, upgrades: { ...emptyUpgrades }, lastSavedAt: Date.now() };
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
          {purchaseFlash} を強化しました
        </div>
      ) : null}

      <main className="relative z-10 px-3 pb-20 pt-20 sm:px-5">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
          <section className="overflow-hidden rounded-[22px] border-4 border-[#7C2D12] bg-[#7C2D12] text-white shadow-2xl">
            <div className="grid gap-px bg-[#FED7AA] lg:grid-cols-[360px_minmax(0,1fr)_360px]">
              <div className="bg-[#9A3412] px-5 py-4">
                <h1 className="text-3xl font-black tracking-tight text-[#FFE7C2]">マチョクリッカー</h1>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">{bodyStage.label}</div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Current</div>
                    <div className="mt-1 text-2xl font-black text-white">{formatNumber(state.muscle)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Per Second</div>
                    <div className="mt-1 text-2xl font-black text-white">+{formatNumber(perSecond)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB45D]">Total</div>
                    <div className="mt-1 text-2xl font-black text-white">{formatNumber(state.totalMuscle)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#9A3412] px-5 py-4">
                <div className="text-xs font-black text-[#FFB45D]">次の称号: {nextGoal.title}</div>
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
                <div className="macho-news whitespace-nowrap text-sm font-bold text-orange-100">{news}</div>
              </div>
            </div>
          </section>

          <section className="grid min-h-[740px] overflow-hidden rounded-[28px] border-4 border-[#7C2D12] bg-[#7C2D12] shadow-2xl xl:grid-cols-[360px_minmax(0,1fr)_390px]">
            <aside className="relative flex min-h-[560px] flex-col items-center justify-between overflow-hidden border-b-4 border-[#7C2D12] bg-[radial-gradient(circle_at_center,#FFF0D5_0%,#FDBA74_54%,#B45309_100%)] p-5 text-center xl:border-b-0 xl:border-r-4">
              <div className="relative z-10 w-full rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-4 text-[#7C2D12] shadow-xl">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB45D]">Muscle Points</div>
                <div className="mt-1 text-5xl font-black">{formatNumber(state.muscle)}</div>
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
                  className="macho-golden absolute z-50 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-200 via-orange-300 to-yellow-500 text-[10px] font-black leading-tight text-[#7C2D12] shadow-2xl"
                  style={{ left: `${goldenProtein.x}%`, top: `${goldenProtein.y}%` }}
                >
                  GOLDEN
                  <br />
                  PROTEIN
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleClick}
                className={`macho-breathe group relative z-20 my-8 flex aspect-square w-64 max-w-full items-center justify-center rounded-full border-[12px] shadow-[0_55px_110px_-35px_rgba(42,20,11,0.95)] transition hover:scale-[1.04] active:scale-95 sm:w-80 ${bodyStage.ring} ${
                  clickBurst ? "macho-pop" : ""
                }`}
              >
                {Array.from({ length: cursorCount }, (_, index) => {
                  const angle = (360 / Math.max(1, cursorCount)) * index - 90;
                  return (
                    <span
                      key={`cursor-${index}`}
                      className="macho-cursor pointer-events-none absolute left-1/2 top-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FF8A23] text-lg font-black text-white shadow-lg"
                      style={{
                        transform: `rotate(${angle}deg) translate(168px) rotate(${-angle}deg)`,
                        animationDelay: `${(index % 8) * 0.08}s`,
                      }}
                    >
                      ➤
                    </span>
                  );
                })}
                <span className="macho-shine absolute inset-0 rounded-full" />
                <span className={`absolute inset-[-32px] rounded-full bg-white/40 blur-2xl transition ${bodyStage.aura}`} />
                <span
                  className="relative z-10 block transition duration-300 group-hover:scale-105"
                  style={{ transform: `scale(${bodyStage.scale})` }}
                >
                  <span aria-label="マチョ田をクリック" className="pixel-machoda" />
                </span>
              </button>

              <div className="relative z-10 grid w-full grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-3 text-[#7C2D12] shadow-lg">
                  <div className="text-xs font-black text-[#C2410C]">称号</div>
                  <div className="mt-1 text-xl font-black">{title}</div>
                </div>
                <div className="rounded-2xl border-2 border-[#7C2D12] bg-[#FFF7EB]/95 px-4 py-3 text-[#7C2D12] shadow-lg">
                  <div className="text-xs font-black text-[#C2410C]">クリック数</div>
                  <div className="mt-1 text-xl font-black">{formatNumber(state.clickCount)}</div>
                </div>
              </div>
            </aside>

            <section className="relative min-h-[560px] overflow-hidden border-b-4 border-[#7C2D12] bg-[linear-gradient(180deg,#FFF0D5_0%,#FDBA74_48%,#C2410C_100%)] xl:border-b-0 xl:border-r-4">
              <div className="absolute inset-x-0 top-0 z-10 border-b-4 border-[#7C2D12] bg-[#FFF7EB]/95 px-5 py-3 text-[#7C2D12] shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Machoda Gym</div>
                    <div className="text-xl font-black">ジム設備</div>
                  </div>
                  <div className="rounded-full bg-[#FF8A23] px-4 py-2 text-sm font-black text-white">強化合計 {ownedUpgradeCount}</div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent_0%,rgba(124,45,18,0.7)_90%)]" />
              <div className="absolute inset-x-4 bottom-5 top-24 overflow-hidden rounded-[28px] border-4 border-[#7C2D12] bg-[linear-gradient(180deg,rgba(255,247,235,0.92)_0%,rgba(255,237,213,0.76)_62%,rgba(154,52,18,0.72)_100%)] shadow-inner">
                <div className="absolute inset-x-0 top-1/3 border-t-4 border-[#B45309]/45" />
                <div className="absolute inset-x-0 top-2/3 border-t-4 border-[#B45309]/45" />
                {equipmentTiles.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-lg font-black text-[#9A3412]/55">
                    ショップで強化を買うと、ここに設備が増えます
                  </div>
                ) : null}
                {equipmentTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className={`macho-helper absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br ${tile.color} text-2xl font-black text-white shadow-xl`}
                    style={{
                      left: `${tile.x}%`,
                      top: `${tile.y}%`,
                      animationDelay: `${tile.delay}s`,
                    }}
                  >
                    {tile.icon}
                  </div>
                ))}
              </div>
            </section>

            <aside className="bg-[#FFF7EB] text-[#7C2D12]">
              <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto p-4">
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
                <div className="grid gap-3">
                  {upgrades.map((upgrade) => {
                    const level = state.upgrades[upgrade.key];
                    const cost = getUpgradeCost(upgrade, level);
                    const canBuy = state.muscle >= cost;

                    return (
                      <button
                        key={upgrade.key}
                        type="button"
                        onClick={() => buyUpgrade(upgrade)}
                        disabled={!canBuy}
                        className={`group rounded-2xl border p-3 text-left transition ${
                          canBuy
                            ? "border-[#C2410C] bg-white text-[#7C2D12] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,138,35,0.25)]"
                            : "border-[#FED7AA] bg-[#FFF4E7] text-[#9A3412]/45"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br ${upgrade.accent} text-white shadow-lg`}
                          >
                            <span className="text-2xl font-black leading-none">{upgrade.icon}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="font-black">{upgrade.name}</span>
                              <span className="rounded-full bg-[#7C2D12] px-2 py-1 text-xs font-black text-white">Lv.{level}</span>
                            </span>
                            <span className="mt-3 block rounded-xl bg-[#7C2D12] px-3 py-2 text-sm font-black text-white">
                              必要: {formatNumber(cost)} 筋肉
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
