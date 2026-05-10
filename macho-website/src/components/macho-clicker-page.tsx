"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";

const profileImageSrc = "/picture/ore.png";
const characterImageSrc = "/picture/man.png";
const STORAGE_KEY = "machoda:macho-clicker:v1";
const SAVE_INTERVAL_MS = 1000;
const OFFLINE_LIMIT_SECONDS = 60 * 60 * 8;
const MAX_SCORE = 999_999_999_999_999;

type UpgradeKey = "pushUp" | "dumbbell" | "protein" | "gym";

type Upgrade = {
  key: UpgradeKey;
  name: string;
  description: string;
  baseCost: number;
  costRate: number;
  clickBonus?: number;
  perSecondBonus?: number;
};

type GameState = {
  muscle: number;
  totalMuscle: number;
  upgrades: Record<UpgradeKey, number>;
  lastSavedAt: number;
};

type RankingEntry = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
};

const upgrades: Upgrade[] = [
  {
    key: "pushUp",
    name: "腕立て伏せ",
    description: "クリック1回の筋肉ポイントが増えます。",
    baseCost: 25,
    costRate: 1.18,
    clickBonus: 1,
  },
  {
    key: "dumbbell",
    name: "ダンベル購入",
    description: "クリック力と自動筋トレが少し伸びます。",
    baseCost: 150,
    costRate: 1.22,
    clickBonus: 3,
    perSecondBonus: 1,
  },
  {
    key: "protein",
    name: "プロテイン補給",
    description: "放置中も筋肉ポイントを稼ぎます。",
    baseCost: 450,
    costRate: 1.25,
    perSecondBonus: 5,
  },
  {
    key: "gym",
    name: "ジム契約",
    description: "本格的に自動筋トレが加速します。",
    baseCost: 1800,
    costRate: 1.28,
    perSecondBonus: 25,
  },
];

const initialState: GameState = {
  muscle: 0,
  totalMuscle: 0,
  upgrades: {
    pushUp: 0,
    dumbbell: 0,
    protein: 0,
    gym: 0,
  },
  lastSavedAt: Date.now(),
};

const clampScore = (value: number) => Math.min(MAX_SCORE, Math.max(0, Math.floor(value)));

const formatNumber = (value: number) => Math.floor(value).toLocaleString("ja-JP");

const getUpgradeCost = (upgrade: Upgrade, level: number) => Math.floor(upgrade.baseCost * upgrade.costRate ** level);

const getClickPower = (state: GameState) =>
  1 +
  upgrades.reduce((total, upgrade) => total + (upgrade.clickBonus ?? 0) * state.upgrades[upgrade.key], 0);

const getPerSecond = (state: GameState) =>
  upgrades.reduce((total, upgrade) => total + (upgrade.perSecondBonus ?? 0) * state.upgrades[upgrade.key], 0);

const getTitle = (totalMuscle: number) => {
  if (totalMuscle >= 1_000_000) return "マチョ田級";
  if (totalMuscle >= 250_000) return "ゴリマッチョ";
  if (totalMuscle >= 50_000) return "細マッチョ";
  if (totalMuscle >= 5_000) return "筋トレ中級者";
  if (totalMuscle >= 500) return "初心者トレーニー";
  return "入会したて";
};

const readSavedState = (): GameState => {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState, lastSavedAt: Date.now() };

    const saved = JSON.parse(raw) as Partial<GameState>;
    const normalized: GameState = {
      muscle: typeof saved.muscle === "number" ? clampScore(saved.muscle) : 0,
      totalMuscle: typeof saved.totalMuscle === "number" ? clampScore(saved.totalMuscle) : 0,
      upgrades: {
        pushUp: saved.upgrades?.pushUp ?? 0,
        dumbbell: saved.upgrades?.dumbbell ?? 0,
        protein: saved.upgrades?.protein ?? 0,
        gym: saved.upgrades?.gym ?? 0,
      },
      lastSavedAt: typeof saved.lastSavedAt === "number" ? saved.lastSavedAt : Date.now(),
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
  const clickPower = useMemo(() => getClickPower(state), [state]);
  const perSecond = useMemo(() => getPerSecond(state), [state]);
  const title = getTitle(state.totalMuscle);

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

  const handleClick = () => {
    setState((current) => ({
      ...current,
      muscle: clampScore(current.muscle + clickPower),
      totalMuscle: clampScore(current.totalMuscle + clickPower),
      lastSavedAt: Date.now(),
    }));
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    setState((current) => {
      const level = current.upgrades[upgrade.key];
      const cost = getUpgradeCost(upgrade, level);
      if (current.muscle < cost) return current;

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

  const resetGame = () => {
    if (!window.confirm("マチョクリッカーの進行状況をリセットしますか？")) return;
    const nextState = { ...initialState, lastSavedAt: Date.now() };
    setState(nextState);
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
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="overflow-hidden rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Macho Clicker
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">マチョクリッカー</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-700">
                クリックで筋肉ポイントを稼ぎ、トレーニングを強化してマチョ田級を目指すミニゲームです。
                進行状況はこの端末に自動保存されます。
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[32px] bg-white/95 p-6 text-center shadow-2xl sm:p-8">
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-[#FFF4E7] px-4 py-3">
                  <div className="text-xs font-semibold text-[#C2410C]">筋肉ポイント</div>
                  <div className="mt-1 text-2xl font-bold text-[#7C2D12]">{formatNumber(state.muscle)}</div>
                </div>
                <div className="rounded-3xl bg-[#FFF4E7] px-4 py-3">
                  <div className="text-xs font-semibold text-[#C2410C]">クリック力</div>
                  <div className="mt-1 text-2xl font-bold text-[#7C2D12]">+{formatNumber(clickPower)}</div>
                </div>
                <div className="rounded-3xl bg-[#FFF4E7] px-4 py-3">
                  <div className="text-xs font-semibold text-[#C2410C]">自動筋トレ</div>
                  <div className="mt-1 text-2xl font-bold text-[#7C2D12]">+{formatNumber(perSecond)}/秒</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClick}
                className="group mx-auto flex aspect-square w-56 max-w-full items-center justify-center rounded-full border-8 border-[#FFE7C2] bg-[#FF8A23] shadow-[0_25px_80px_-30px_rgba(124,45,18,0.8)] transition active:scale-95 sm:w-72"
              >
                <Image
                  src={characterImageSrc}
                  alt="マチョ田をクリック"
                  width={220}
                  height={220}
                  priority
                  className="h-auto w-40 transition group-hover:scale-105 sm:w-52"
                />
              </button>

              <div className="mt-6 rounded-3xl bg-[#FFF7EB] px-5 py-4">
                <div className="text-sm font-semibold text-[#C2410C]">現在の称号</div>
                <div className="mt-1 text-2xl font-bold text-[#7C2D12]">{title}</div>
                <div className="mt-2 text-sm text-slate-600">累計 {formatNumber(state.totalMuscle)} 筋肉ポイント</div>
              </div>
            </div>

            <aside className="rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8">
              <h2 className="text-2xl font-bold text-[#7C2D12]">強化メニュー</h2>
              <div className="mt-5 flex flex-col gap-4">
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
                      className={`rounded-3xl border p-4 text-left transition ${
                        canBuy
                          ? "border-[#FF8A23] bg-[#FFF4E7] hover:-translate-y-0.5 hover:shadow-lg"
                          : "border-[#FCD27B] bg-slate-50 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#7C2D12]">{upgrade.name}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-600">{upgrade.description}</div>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C2410C]">Lv.{level}</span>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[#9A3412]">必要: {formatNumber(cost)} 筋肉</div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="mt-5 w-full rounded-2xl border border-[#FCD27B] px-4 py-3 text-sm font-semibold text-[#9A3412] transition hover:bg-[#FFF4E7]"
              >
                進行状況をリセット
              </button>
            </aside>
          </section>

          <section className="grid gap-6 rounded-[32px] bg-white/95 p-6 shadow-2xl lg:grid-cols-[360px_1fr] sm:p-8">
            <div>
              <h2 className="text-2xl font-bold text-[#7C2D12]">ランキング登録</h2>
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
              <h2 className="text-2xl font-bold text-[#7C2D12]">全国マッチョランキング</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-[#FCD27B]">
                {rankings.length === 0 ? (
                  <div className="bg-[#FFF7EB] p-6 text-sm text-slate-600">まだランキングがありません。</div>
                ) : (
                  <ol className="divide-y divide-[#FCD27B] bg-white">
                    {rankings.slice(0, 10).map((entry, index) => (
                      <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE7C2] text-sm font-bold text-[#9A3412]">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-700">{entry.nickname}</span>
                        </div>
                        <span className="text-sm font-bold text-[#7C2D12]">{formatNumber(entry.score)}</span>
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
