"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { SiteHeader } from "@/components/site-header";

const profileImageSrc = "/picture/ore.png";
const characterImageSrc = "/picture/man.png";
const STORAGE_KEY = "machoda:macho-clicker:v2";
const SAVE_INTERVAL_MS = 1000;
const OFFLINE_LIMIT_SECONDS = 60 * 60 * 8;
const MAX_SCORE = 999_999_999_999_999;

type UpgradeKey = "pushUp" | "abRoller" | "dumbbell" | "protein" | "chicken" | "benchPress" | "trainer" | "gym";

type Upgrade = {
  key: UpgradeKey;
  name: string;
  label: string;
  description: string;
  baseCost: number;
  costRate: number;
  clickBonus?: number;
  perSecondBonus?: number;
  accent: string;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
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

type PanelTab = "stats" | "upgrades" | "achievements";

type GoldenProtein = {
  id: number;
  x: number;
  y: number;
};

const upgrades: Upgrade[] = [
  {
    key: "pushUp",
    name: "腕立て伏せ",
    label: "PUSH",
    description: "クリック1回の筋肉ポイントが増えます。",
    baseCost: 20,
    costRate: 1.17,
    clickBonus: 1,
    accent: "from-orange-300 to-orange-500",
  },
  {
    key: "abRoller",
    name: "腹筋ローラー",
    label: "ABS",
    description: "マチョ田の魂。クリック力が大きく伸びます。",
    baseCost: 90,
    costRate: 1.2,
    clickBonus: 4,
    accent: "from-amber-300 to-yellow-500",
  },
  {
    key: "dumbbell",
    name: "ダンベル購入",
    label: "DB",
    description: "クリック力と自動筋トレが少し伸びます。",
    baseCost: 220,
    costRate: 1.22,
    clickBonus: 8,
    perSecondBonus: 1,
    accent: "from-stone-300 to-stone-500",
  },
  {
    key: "protein",
    name: "プロテイン補給",
    label: "PRO",
    description: "放置中も筋肉ポイントを稼ぎます。",
    baseCost: 520,
    costRate: 1.24,
    perSecondBonus: 6,
    accent: "from-sky-300 to-blue-500",
  },
  {
    key: "chicken",
    name: "高たんぱく飯",
    label: "MEAL",
    description: "筋肉の材料を増やして自動獲得を底上げします。",
    baseCost: 1200,
    costRate: 1.25,
    perSecondBonus: 16,
    accent: "from-red-300 to-rose-500",
  },
  {
    key: "benchPress",
    name: "ベンチプレス",
    label: "BENCH",
    description: "胸トレの王道。クリック力が一気に伸びます。",
    baseCost: 3500,
    costRate: 1.27,
    clickBonus: 55,
    perSecondBonus: 22,
    accent: "from-lime-300 to-green-500",
  },
  {
    key: "trainer",
    name: "専属トレーナー",
    label: "COACH",
    description: "フォーム改善で全体効率が上がります。",
    baseCost: 12000,
    costRate: 1.29,
    clickBonus: 180,
    perSecondBonus: 90,
    accent: "from-violet-300 to-purple-500",
  },
  {
    key: "gym",
    name: "ジム買収",
    label: "GYM",
    description: "本格的に自動筋トレが加速します。",
    baseCost: 45000,
    costRate: 1.31,
    clickBonus: 650,
    perSecondBonus: 550,
    accent: "from-orange-400 to-red-600",
  },
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
    description: "クリック力が100を超えた",
    isUnlocked: (state) => getClickPower(state) >= 100,
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
  upgrades: emptyUpgrades,
  lastSavedAt: Date.now(),
  unlockedAchievements: [],
};

const clampScore = (value: number) => Math.min(MAX_SCORE, Math.max(0, Math.floor(value)));

const formatNumber = (value: number) => {
  const rounded = Math.floor(value);
  if (rounded >= 1_000_000_000_000) return `${(rounded / 1_000_000_000_000).toFixed(2)}兆`;
  if (rounded >= 100_000_000) return `${(rounded / 100_000_000).toFixed(2)}億`;
  if (rounded >= 10_000) return `${(rounded / 10_000).toFixed(1)}万`;
  return rounded.toLocaleString("ja-JP");
};

const getUpgradeCost = (upgrade: Upgrade, level: number) => Math.floor(upgrade.baseCost * upgrade.costRate ** level);

const getClickPower = (state: GameState) =>
  1 +
  upgrades.reduce((total, upgrade) => total + (upgrade.clickBonus ?? 0) * state.upgrades[upgrade.key], 0);

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
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("machoda:macho-clicker:v1");
    if (!raw) return { ...initialState, lastSavedAt: Date.now() };

    const saved = JSON.parse(raw) as Partial<GameState>;
    const normalized: GameState = {
      muscle: typeof saved.muscle === "number" ? clampScore(saved.muscle) : 0,
      totalMuscle: typeof saved.totalMuscle === "number" ? clampScore(saved.totalMuscle) : 0,
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
  const [activePanel, setActivePanel] = useState<PanelTab>("stats");
  const [goldenProtein, setGoldenProtein] = useState<GoldenProtein | null>(null);
  const effectIdRef = useRef(0);
  const clickPower = useMemo(() => getClickPower(state), [state]);
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const title = getTitle(state.totalMuscle);
  const nextGoal = getNextTitleGoal(state.totalMuscle);
  const titleProgress = Math.min(100, Math.max(0, (state.totalMuscle / nextGoal.value) * 100));
  const ownedUpgradeCount = Object.values(state.upgrades).reduce((total, level) => total + level, 0);
  const unlockedAchievementCount = state.unlockedAchievements.length;
  const news = getNews(state, title, perSecond);

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

    const initialTimer = window.setTimeout(spawn, 8000);
    const interval = window.setInterval(spawn, 26000);

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
    const comboBonus = nextCombo >= 10 ? Math.floor(clickPower * 0.1) : 0;
    const gain = clickPower + comboBonus;

    setCombo(nextCombo);
    setLastClickAt(now);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 140);
    spawnClickEffects(gain);

    setState((current) => ({
      ...current,
      muscle: clampScore(current.muscle + gain),
      totalMuscle: clampScore(current.totalMuscle + gain),
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
    const bonus = Math.max(777, Math.floor(clickPower * 77 + perSecond * 20));
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
    <div className="min-h-screen overflow-hidden bg-[#2A140B] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,184,77,0.32),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,90,31,0.2),transparent_28%),linear-gradient(180deg,#FCC081_0%,#F79A3E_45%,#2A140B_100%)]" />
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

      <main className="relative z-10 px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="relative overflow-hidden rounded-[36px] border border-white/40 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="absolute right-6 top-6 hidden rounded-full bg-[#7C2D12] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white sm:block">
              Click Training
            </div>
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Macho Clicker
              </span>
              <h1 className="text-4xl font-black tracking-tight text-[#7C2D12] sm:text-6xl">マチョクリッカー</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                クリックで筋肉ポイントを稼ぎ、強化メニューでトレーニング効率を上げていく放置系ミニゲームです。
                進行状況はこの端末に自動保存されます。
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[26px] border border-white/35 bg-[#2A140B]/90 px-5 py-3 text-white shadow-2xl">
            <div className="flex items-center gap-4">
              <span className="shrink-0 rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
                Macho News
              </span>
              <div className="macho-news whitespace-nowrap text-sm font-bold text-orange-100">{news}</div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
            <aside className="order-2 rounded-[32px] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur xl:order-1">
              <h2 className="text-xl font-black text-[#7C2D12]">現在の肉体</h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl bg-[#FFF4E7] px-4 py-4">
                  <div className="text-xs font-bold text-[#C2410C]">筋肉ポイント</div>
                  <div className="mt-1 text-3xl font-black text-[#7C2D12]">{formatNumber(state.muscle)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-inner">
                    <div className="text-xs font-bold text-[#C2410C]">クリック</div>
                    <div className="mt-1 text-xl font-black text-[#7C2D12]">+{formatNumber(clickPower)}</div>
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-inner">
                    <div className="text-xs font-bold text-[#C2410C]">毎秒</div>
                    <div className="mt-1 text-xl font-black text-[#7C2D12]">+{formatNumber(perSecond)}</div>
                  </div>
                </div>
                <div className="rounded-3xl bg-[#7C2D12] px-4 py-4 text-white">
                  <div className="text-xs font-bold text-orange-200">称号</div>
                  <div className="mt-1 text-2xl font-black">{title}</div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-[#FF8A23]" style={{ width: `${titleProgress}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-orange-100">次: {nextGoal.title} / {formatNumber(nextGoal.value)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-inner">
                    <div className="text-xs font-bold text-[#C2410C]">強化合計</div>
                    <div className="mt-1 text-xl font-black text-[#7C2D12]">{ownedUpgradeCount}</div>
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-inner">
                    <div className="text-xs font-bold text-[#C2410C]">実績解除</div>
                    <div className="mt-1 text-xl font-black text-[#7C2D12]">{unlockedAchievementCount}</div>
                  </div>
                </div>
                <div className="rounded-3xl bg-white px-4 py-4 shadow-inner">
                  <div className="text-xs font-bold text-[#C2410C]">実績</div>
                  <div className="mt-2 text-2xl font-black text-[#7C2D12]">
                    {state.unlockedAchievements.length}/{achievements.length}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {achievements.map((achievement) => {
                      const unlocked = state.unlockedAchievements.includes(achievement.key);
                      return (
                        <div
                          key={achievement.key}
                          className={`rounded-2xl px-3 py-2 text-xs ${
                            unlocked ? "bg-[#FFE7C2] font-bold text-[#9A3412]" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {achievement.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            <div className="order-1 rounded-[40px] border border-white/45 bg-white/90 p-5 text-center shadow-2xl backdrop-blur sm:p-8 xl:order-2">
              <div className="relative mx-auto flex min-h-[480px] max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_center,#FFE7C2_0%,#FFB45D_42%,#7C2D12_100%)] p-6 shadow-inner">
                <div className="macho-orbit absolute inset-10 rounded-full border border-white/35" />
                <div className="macho-orbit absolute inset-20 rounded-full border border-white/25 [animation-direction:reverse]" />
                <div className="absolute left-6 top-6 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#7C2D12]">
                  COMBO {combo}
                </div>
                <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/80 px-4 py-3 text-sm font-bold text-[#7C2D12] shadow-lg">
                  累計 {formatNumber(state.totalMuscle)} 筋肉ポイント
                </div>

                {floatingGains.map((item) => (
                  <div
                    key={item.id}
                    className="macho-float pointer-events-none absolute z-30 text-3xl font-black text-white drop-shadow-[0_3px_0_rgba(124,45,18,0.7)]"
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  >
                    +{formatNumber(item.value)}
                  </div>
                ))}

                {sparks.map((spark) => (
                  <div
                    key={spark.id}
                    className="macho-spark pointer-events-none absolute z-20 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.85)]"
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
                    className="macho-golden absolute z-40 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-200 via-orange-300 to-yellow-500 text-[10px] font-black leading-tight text-[#7C2D12] shadow-2xl"
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
                  className={`macho-breathe group relative z-10 flex aspect-square w-64 max-w-full items-center justify-center rounded-full border-[12px] border-white/70 bg-[#FF8A23] shadow-[0_45px_100px_-35px_rgba(42,20,11,0.9)] transition hover:scale-[1.03] active:scale-95 sm:w-80 ${
                    clickBurst ? "macho-pop" : ""
                  }`}
                >
                  <span className="macho-shine absolute inset-0 rounded-full" />
                  <Image
                    src={characterImageSrc}
                    alt="マチョ田をクリック"
                    width={260}
                    height={260}
                    priority
                    className="relative z-10 h-auto w-48 drop-shadow-2xl transition group-hover:scale-105 sm:w-60"
                  />
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[28px] border border-[#FCD27B] bg-white shadow-xl">
                <div className="grid grid-cols-3 bg-[#7C2D12] text-xs font-black text-white">
                  {([
                    ["stats", "Stats"],
                    ["upgrades", "Upgrades"],
                    ["achievements", "Achievements"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActivePanel(key)}
                      className={`px-3 py-3 transition ${activePanel === key ? "bg-[#FF8A23]" : "hover:bg-white/10"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="min-h-52 bg-[#FFF7EB] p-5 text-left">
                  {activePanel === "stats" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                        <div className="text-xs font-black text-[#C2410C]">累計筋肉</div>
                        <div className="mt-1 text-xl font-black text-[#7C2D12]">{formatNumber(state.totalMuscle)}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                        <div className="text-xs font-black text-[#C2410C]">現在筋肉</div>
                        <div className="mt-1 text-xl font-black text-[#7C2D12]">{formatNumber(state.muscle)}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                        <div className="text-xs font-black text-[#C2410C]">クリック力</div>
                        <div className="mt-1 text-xl font-black text-[#7C2D12]">+{formatNumber(clickPower)}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                        <div className="text-xs font-black text-[#C2410C]">毎秒生産</div>
                        <div className="mt-1 text-xl font-black text-[#7C2D12]">+{formatNumber(perSecond)}</div>
                      </div>
                    </div>
                  ) : null}

                  {activePanel === "upgrades" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {upgrades.map((upgrade) => (
                        <div key={upgrade.key} className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-black text-[#7C2D12]">{upgrade.name}</div>
                            <div className="rounded-full bg-[#FFE7C2] px-2 py-1 text-xs font-black text-[#C2410C]">
                              Lv.{state.upgrades[upgrade.key]}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            次の価格: {formatNumber(getUpgradeCost(upgrade, state.upgrades[upgrade.key]))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {activePanel === "achievements" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {achievements.map((achievement) => {
                        const unlocked = state.unlockedAchievements.includes(achievement.key);
                        return (
                          <div
                            key={achievement.key}
                            className={`rounded-2xl px-4 py-3 shadow-inner ${
                              unlocked ? "bg-white text-[#7C2D12]" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <div className="font-black">{unlocked ? achievement.title : "？？？"}</div>
                            <div className="mt-1 text-xs">{unlocked ? achievement.description : "条件達成で解除"}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="order-3 rounded-[32px] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-black text-[#7C2D12]">強化メニュー</h2>
              <div className="mt-5 flex max-h-[720px] flex-col gap-3 overflow-y-auto pr-1">
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
                      className={`group rounded-3xl border p-4 text-left transition ${
                        canBuy
                          ? "border-[#FF8A23] bg-white hover:-translate-y-0.5 hover:shadow-xl"
                          : "border-[#FCD27B] bg-slate-50 opacity-70"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${upgrade.accent} text-[11px] font-black text-white shadow-lg`}
                        >
                          {upgrade.label}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="font-black text-[#7C2D12]">{upgrade.name}</span>
                            <span className="rounded-full bg-[#FFE7C2] px-3 py-1 text-xs font-black text-[#C2410C]">
                              Lv.{level}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{upgrade.description}</span>
                          <span className="mt-3 block text-sm font-black text-[#9A3412]">必要: {formatNumber(cost)} 筋肉</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 rounded-3xl bg-[#FFF4E7] px-4 py-3 text-sm text-[#7C2D12]">
                強化合計: <span className="font-black">{ownedUpgradeCount}</span>
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="mt-4 w-full rounded-2xl border border-[#FCD27B] px-4 py-3 text-sm font-semibold text-[#9A3412] transition hover:bg-[#FFF4E7]"
              >
                進行状況をリセット
              </button>
            </aside>
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
