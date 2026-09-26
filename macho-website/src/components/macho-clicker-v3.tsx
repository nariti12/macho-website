"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyTap,
  buyEquipment,
  buyTraining,
  createTapGame,
  EQUIPMENT,
  LEGACY_SAVE_KEY,
  levelProgress,
  migrateLegacyTapSave,
  normalizeTapSave,
  TAP_SAVE_KEY,
  tapPower,
  trainingCost,
  type EquipmentId,
  type TapGameSave,
} from "@/lib/macho-clicker/tap-game";
import styles from "./macho-clicker-v3.module.css";

const asset = (name: string) => `/game/macho-clicker/v3/${name}`;
const compact = new Intl.NumberFormat("ja-JP", { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("ja-JP");
const pointText = (value: number) => value < 10_000 ? number.format(value) : compact.format(value);

const positions: Record<EquipmentId, string> = {
  dumbbells: styles.dumbbells,
  barbell: styles.barbell,
  bench: styles.bench,
  plateTree: styles.plateTree,
  powerRack: styles.powerRack,
  punchingBag: styles.punchingBag,
  rower: styles.rower,
  trainingMachine: styles.trainingMachine,
  treadmill: styles.treadmill,
  proteinWorkshop: styles.proteinWorkshop,
  ultimateTrainer: styles.ultimateTrainer,
  gymRenovation: styles.gymRenovation,
  devilDumbbells: styles.devilDumbbells,
  devilAltar: styles.devilAltar,
  devilPowerRack: styles.devilPowerRack,
  energyCore: styles.energyCore,
};

type Overlay = "shop" | "menu" | "ranking" | "reset" | null;
type SoundKind = "click" | "buy" | "evolution";
type RankingItem = { id: string; playerId: string; nickname: string; taps: number; updatedAt: string };
const RANKING_PLAYER_KEY = "machoda:macho-clicker:ranking-player";
const RANKING_NAME_KEY = "machoda:macho-clicker:ranking-name";

const soundFiles: Record<SoundKind, string> = {
  click: "/sounds/macho-clicker/click.wav",
  buy: "/sounds/macho-clicker/buy.wav",
  evolution: "/sounds/macho-clicker/evolution.wav",
};

const parseSaved = (raw: string | null): unknown => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export function MachoClickerV3() {
  const [game, setGame] = useState<TapGameSave>(createTapGame);
  const gameRef = useRef(game);
  const [loaded, setLoaded] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notice, setNotice] = useState("");
  const [levelUp, setLevelUp] = useState(false);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const [legacyMigrated, setLegacyMigrated] = useState(false);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingSubmitting, setRankingSubmitting] = useState(false);
  const [rankingAvailable, setRankingAvailable] = useState(false);
  const [rankingMessage, setRankingMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [rankingPlayerId, setRankingPlayerId] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundBuffersRef = useRef<Partial<Record<SoundKind, AudioBuffer>>>({});
  const characterRef = useRef<HTMLSpanElement | null>(null);
  const floatersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const floaterIndex = useRef(0);
  const activePointer = useRef<number | null>(null);

  const sync = useCallback((next: TapGameSave) => {
    gameRef.current = next;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setGame(gameRef.current);
      });
    }
  }, []);

  const showNotice = useCallback((message: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 2400);
  }, []);

  useEffect(() => {
    try {
      const parsed = normalizeTapSave(parseSaved(localStorage.getItem(TAP_SAVE_KEY)));
      if (parsed) {
        gameRef.current = parsed;
        setGame(parsed);
      } else {
        const migrated = migrateLegacyTapSave(parseSaved(localStorage.getItem(LEGACY_SAVE_KEY)));
        if (migrated) {
          gameRef.current = migrated;
          setGame(migrated);
          localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(migrated));
          setLegacyMigrated(true);
        }
      }
      setLegacyAvailable(Boolean(localStorage.getItem(LEGACY_SAVE_KEY)));
      setNickname(localStorage.getItem(RANKING_NAME_KEY) ?? "");
      const savedPlayerId = localStorage.getItem(RANKING_PLAYER_KEY);
      if (savedPlayerId) setRankingPlayerId(savedPlayerId);
    } catch {
      // A damaged local save never prevents the game from opening.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const context = new AudioContext();
    audioRef.current = context;
    (Object.entries(soundFiles) as [SoundKind, string][]).forEach(async ([kind, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (!cancelled) soundBuffersRef.current[kind] = buffer;
      } catch {
        // Sound is optional and should not block the game.
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = () => localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(gameRef.current));
    const interval = window.setInterval(save, 1000);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", save);
      save();
    };
  }, [loaded]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (levelTimer.current) clearTimeout(levelTimer.current);
    void audioRef.current?.close();
  }, []);

  useEffect(() => {
    if (!overlay) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [overlay]);

  const playSound = useCallback((kind: SoundKind) => {
    if (!gameRef.current.soundEnabled) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume();
      const buffer = soundBuffersRef.current[kind];
      if (buffer) {
        const source = context.createBufferSource();
        const volume = context.createGain();
        source.buffer = buffer;
        source.playbackRate.value = kind === "click" ? .96 + (gameRef.current.taps % 5) * .02 : 1;
        volume.gain.value = kind === "click" ? .32 : .55;
        source.connect(volume).connect(context.destination);
        source.start();
        return;
      }
      const frequency = kind === "click" ? 310 : kind === "buy" ? 540 : 670;
      const duration = kind === "click" ? .06 : .14;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.65), context.currentTime + duration);
      volume.gain.setValueAtTime(kind === "click" ? .035 : .055, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(volume).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Audio is optional; taps must remain responsive if playback is blocked.
    }
  }, []);

  const animateTap = useCallback((gain: number) => {
    if (gameRef.current.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const character = characterRef.current;
    if (character) {
      character.getAnimations().forEach((animation) => animation.cancel());
      character.animate(
        [{ transform: "scale(1) translateY(0)" }, { transform: "scale(.94, .97) translateY(8px)", offset: 0.35 }, { transform: "scale(1.025) translateY(-4px)", offset: 0.7 }, { transform: "scale(1) translateY(0)" }],
        { duration: 230, easing: "ease-out" },
      );
    }
    const floater = floatersRef.current[floaterIndex.current % floatersRef.current.length];
    floaterIndex.current += 1;
    if (floater) {
      floater.textContent = `+${pointText(gain)} P`;
      floater.style.left = `${42 + (floaterIndex.current * 17) % 30}%`;
      floater.style.top = `${31 + (floaterIndex.current * 11) % 24}%`;
      floater.getAnimations().forEach((animation) => animation.cancel());
      floater.animate(
        [{ opacity: 0, transform: "translateY(14px) scale(.7)" }, { opacity: 1, transform: "translateY(0) scale(1.1)", offset: .18 }, { opacity: 0, transform: "translateY(-72px) scale(1)" }],
        { duration: 680, easing: "ease-out" },
      );
    }
  }, []);

  const tap = useCallback(() => {
    if (!loaded) return;
    const before = gameRef.current;
    const previousLevel = levelProgress(before.taps).level;
    const gain = tapPower(before);
    const next = applyTap(before);
    sync(next);
    animateTap(gain);
    playSound("click");
    const nextLevel = levelProgress(next.taps).level;
    if (nextLevel > previousLevel) {
      showNotice(`Lv ${nextLevel}！ マチョ田が成長した`);
      setLevelUp(true);
      if (levelTimer.current) clearTimeout(levelTimer.current);
      levelTimer.current = setTimeout(() => setLevelUp(false), 1600);
      playSound("evolution");
    }
  }, [animateTap, loaded, playSound, showNotice, sync]);

  const purchase = (id: EquipmentId) => {
    const previousPower = tapPower(gameRef.current);
    const next = buyEquipment(gameRef.current, id);
    if (!next) return;
    sync(next);
    const item = EQUIPMENT.find((candidate) => candidate.id === id);
    showNotice(`${item?.name ?? "器具"}を設置！ 1タップ +${tapPower(next) - previousPower} P`);
    playSound("buy");
    setOverlay(null);
  };

  const purchaseTraining = () => {
    const previousPower = tapPower(gameRef.current);
    const next = buyTraining(gameRef.current);
    if (!next) return;
    sync(next);
    showNotice(`タップ強化 Lv ${next.trainingLevel}！ 1タップ +${tapPower(next) - previousPower} P`);
    playSound("buy");
  };

  const toggleSetting = (key: "soundEnabled" | "reducedMotion") => {
    sync({ ...gameRef.current, [key]: !gameRef.current[key] });
  };

  const openRanking = async () => {
    setOverlay("ranking");
    setRankingLoading(true);
    setRankingMessage("");
    try {
      const response = await fetch("/api/macho-clicker/tap-rankings", { cache: "no-store" });
      const data = await response.json() as { items?: RankingItem[]; available?: boolean; error?: string };
      if (!response.ok || !data.available) throw new Error(data.error ?? "ランキングは準備中です。");
      setRankings(Array.isArray(data.items) ? data.items : []);
      setRankingAvailable(true);
    } catch (error) {
      setRankingAvailable(false);
      setRankingMessage(error instanceof Error ? error.message : "ランキングを取得できませんでした。");
    } finally {
      setRankingLoading(false);
    }
  };

  const submitRanking = async () => {
    const cleanName = nickname.trim();
    if (!cleanName || gameRef.current.taps < 1 || !rankingAvailable) return;
    setRankingSubmitting(true);
    setRankingMessage("");
    try {
      const playerId = rankingPlayerId || crypto.randomUUID();
      const response = await fetch("/api/macho-clicker/tap-rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, nickname: cleanName, taps: gameRef.current.taps }),
      });
      const data = await response.json() as { items?: RankingItem[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "登録できませんでした。");
      localStorage.setItem(RANKING_PLAYER_KEY, playerId);
      localStorage.setItem(RANKING_NAME_KEY, cleanName);
      setRankingPlayerId(playerId);
      setRankings(Array.isArray(data.items) ? data.items : []);
      setRankingMessage("記録を登録しました！");
    } catch (error) {
      setRankingMessage(error instanceof Error ? error.message : "登録できませんでした。");
    } finally {
      setRankingSubmitting(false);
    }
  };

  const restartGame = () => {
    const fresh = createTapGame();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    gameRef.current = fresh;
    setGame(fresh);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (levelTimer.current) clearTimeout(levelTimer.current);
    setNotice("");
    setLevelUp(false);
    setOverlay(null);
    setRankingPlayerId("");
    try {
      localStorage.setItem(TAP_SAVE_KEY, JSON.stringify(fresh));
      localStorage.removeItem(RANKING_PLAYER_KEY);
    } catch {
      // The new run is still usable when browser storage is unavailable.
    }
  };

  const progress = levelProgress(game.taps);
  const power = tapPower(game);
  const tapsUntilPurchase = (cost: number) => Math.ceil(Math.max(0, cost - game.points) / power);
  const nextTrainingPower = game.trainingLevel < 120 ? tapPower({ ...game, trainingLevel: game.trainingLevel + 1 }) : power;
  const nextItem = EQUIPMENT.find((item) => !game.owned.includes(item.id));
  const revealedEquipment = EQUIPMENT.filter((item) => game.owned.includes(item.id) || item.id === nextItem?.id);
  const nextItemIndex = nextItem ? EQUIPMENT.findIndex((item) => item.id === nextItem.id) : -1;
  const mysteryEquipment = nextItemIndex >= 0
    ? EQUIPMENT.slice(nextItemIndex + 1).find((item) => !game.owned.includes(item.id))
    : undefined;
  const sceneEquipment = EQUIPMENT.filter((item, index) =>
    item.id !== "gymRenovation" && game.owned.includes(item.id) &&
    !EQUIPMENT.slice(index + 1).some((later) => later.zone === item.zone && game.owned.includes(later.id)),
  );
  const renovated = game.owned.includes("gymRenovation");
  const nextCharacter = progress.level < 100 ? levelProgress(Math.max(game.taps, 0) + progress.remaining).character : undefined;

  return (
    <div className={`${styles.shell} macho-game-shell`} data-testid="macho-v3-game">
      <header className={styles.header}>
        <Link href="/" className={styles.backLink} aria-label="ホームへ戻る">‹</Link>
        <div className={`${styles.progressBlock} ${levelUp ? styles.levelFlash : ""}`}>
          <div className={styles.progressHeading}>
            <div className={styles.levelBadge}><small>レベル</small><strong key={progress.level}>{progress.level}</strong></div>
            <div className={styles.progressDetails}>
              <div className={styles.progressLabels}>
                <strong>{levelUp ? "レベルアップ！" : progress.level === 100 ? "最高レベル！" : `次 Lv ${progress.level + 1}`}</strong>
                <span>{progress.level === 100 ? "100 / 100" : `${Math.round(progress.percent)}%`}</span>
              </div>
              <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)} aria-label="次のレベルまでの進捗">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <div className={styles.progressFoot}>{progress.level === 100 ? "全レベル達成" : `あと ${number.format(progress.remaining)} タップ`}</div>
            </div>
          </div>
        </div>
        <div className={styles.stats}>
          <div><small>所持ポイント</small><strong data-testid="macho-points">{pointText(game.points)} <span>P</span></strong></div>
          <div><small>1タップで</small><strong data-testid="macho-tap-power">+{pointText(power)} <span>P</span></strong></div>
        </div>
        <button className={styles.rankingButton} onClick={() => void openRanking()} aria-label="ランキングを開く" title="ランキング">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 14v5M8 21h8M9 19h6" /></svg>
        </button>
        <button className={styles.menuButton} onClick={() => setOverlay("menu")} aria-label="ゲームメニューを開く">☰</button>
      </header>

      <main className={styles.layout}>
        <div className={styles.scene} data-testid="macho-gym-scene">
          <picture className={styles.background}>
            <source media="(min-width: 800px)" srcSet={asset(renovated ? "legend-gym-desktop.webp" : "empty-gym-desktop.webp")} />
            <img src={asset(renovated ? "legend-gym-mobile.webp" : "empty-gym-mobile.webp")} alt="" draggable={false} />
          </picture>
          <div className={styles.sceneShade} aria-hidden="true" />
          {sceneEquipment.map((item) => (
            <span key={item.id} className={`${styles.prop} ${positions[item.id]}`} data-testid={`gym-${item.id}`} aria-label={`${item.name}を設置済み`}>
              <Image src={asset(item.image)} alt="" fill sizes="(max-width: 700px) 45vw, 25vw" unoptimized draggable={false} />
            </span>
          ))}
          <button
            className={styles.characterButton}
            data-testid="macho-character-button"
            aria-label="マチョ田をクリック"
            onPointerDown={(event) => {
              if (event.button !== 0 || activePointer.current !== null) return;
              activePointer.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              tap();
            }}
            onPointerUp={(event) => { if (activePointer.current === event.pointerId) activePointer.current = null; }}
            onPointerCancel={(event) => { if (activePointer.current === event.pointerId) activePointer.current = null; }}
            onLostPointerCapture={(event) => { if (activePointer.current === event.pointerId) activePointer.current = null; }}
            onClick={(event) => { if (event.detail === 0) tap(); }}
          >
            <span ref={characterRef} className={styles.characterInner}>
              <Image
                key={progress.character.imageSrc}
                src={progress.character.imageSrc}
                alt=""
                width={768}
                height={1230}
                priority
                unoptimized
                draggable={false}
                className="macho-character-image"
              />
            </span>
          </button>
          <div className={styles.floaters} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <span key={index} ref={(node) => { floatersRef.current[index] = node; }} />)}
          </div>
          {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
        </div>

        <aside className={`${styles.shop} ${overlay === "shop" ? styles.shopOpen : ""}`} aria-label="ショップ">
          <div className={styles.shopHeader}>
            <h2>ショップ</h2>
            <button className={styles.mobileClose} onClick={() => setOverlay(null)} aria-label="ショップを閉じる">×</button>
          </div>
          <div className={styles.shopWallet}><span>所持 <strong title={`${number.format(game.points)} P`}>{number.format(game.points)} P</strong></span><span>1タップ <strong>+{number.format(power)} P</strong></span></div>
          <div className={styles.shopScroll}>
            <div className={styles.shopSectionLabel}>タップ強化</div>
            <button className={`${styles.trainingCard} ${game.points < trainingCost(game.trainingLevel) ? styles.cannotAfford : ""}`} onClick={purchaseTraining} disabled={game.points < trainingCost(game.trainingLevel) || game.trainingLevel >= 120}>
              <span className={styles.trainingIcon}><Image src={asset("tap-upgrade.webp")} alt="" fill sizes="64px" unoptimized /></span>
              <span className={styles.cardText}><strong>タップ強化 Lv {game.trainingLevel}</strong><span className={styles.cardCost}>{game.trainingLevel >= 120 ? "強化完了" : `${number.format(trainingCost(game.trainingLevel))} P`}</span><small>{game.trainingLevel >= 120 ? "MAX" : game.points >= trainingCost(game.trainingLevel) ? "強化できる" : `あと ${number.format(tapsUntilPurchase(trainingCost(game.trainingLevel)))} タップ`}</small>{game.trainingLevel < 120 ? <span className={styles.cardMeter} aria-hidden="true"><span style={{ width: `${Math.min(100, game.points / trainingCost(game.trainingLevel) * 100)}%` }} /></span> : null}</span>
              <span className={styles.cardMeta}><strong>+{number.format(nextTrainingPower - power)} P</strong><small>1タップあたり</small></span>
            </button>
            <div className={styles.shopSectionLabel}>ジム設備 <span>{game.owned.length} 設置</span></div>
            {revealedEquipment.map((item) => {
              const owned = game.owned.includes(item.id);
              const itemPower = owned
                ? power - tapPower({ ...game, owned: game.owned.filter((id) => id !== item.id) })
                : tapPower({ ...game, owned: [...game.owned, item.id] }) - power;
              return (
                <button key={item.id} className={`${styles.shopCard} ${owned ? styles.owned : ""} ${!owned && game.points < item.cost ? styles.cannotAfford : ""}`} onClick={() => purchase(item.id)} disabled={owned || game.points < item.cost} data-testid={`shop-${item.id}`}>
                  <span className={styles.shopImage}><Image src={asset(item.image)} alt="" fill sizes="64px" unoptimized /></span>
                  <span className={styles.cardText}><strong>{item.name}</strong><span className={styles.cardCost}>{owned ? "設置済み" : `${number.format(item.cost)} P`}</span>{!owned ? <><small>{game.points >= item.cost ? "購入できる" : `あと ${number.format(tapsUntilPurchase(item.cost))} タップ`}</small><span className={styles.cardMeter} aria-hidden="true"><span style={{ width: `${Math.min(100, game.points / item.cost * 100)}%` }} /></span></> : null}</span>
                  <span className={styles.cardMeta}><strong>+{pointText(itemPower)} P</strong><small>1タップあたり</small></span>
                </button>
              );
            })}
            {mysteryEquipment ? <div className={`${styles.shopCard} ${styles.mysteryCard}`} data-testid="shop-mystery" aria-label={`${nextItem?.name ?? "現在の設備"}を購入すると次の設備を公開`}>
              <span className={`${styles.shopImage} ${styles.mysteryImage}`} aria-hidden="true">?</span>
              <span className={styles.cardText}><strong>？？？</strong></span>
              <span className={styles.cardMeta}><strong>次</strong><small>購入後に公開</small></span>
            </div> : null}
          </div>
        </aside>
      </main>

      <nav className={styles.mobileDock} aria-label="ゲーム操作">
        <button onClick={() => setOverlay("shop")}>ショップを開く <span>{nextItem ? "●" : "✓"}</span></button>
      </nav>

      {overlay === "menu" ? (
        <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay(null); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="ゲームメニュー">
            <div className={styles.modalTitle}><h2>ゲームメニュー</h2><button onClick={() => setOverlay(null)} aria-label="閉じる">×</button></div>
            <p>タップ数でレベルとマチョ田の姿が変わります。タップで貯めたPを使い、設備を順番に購入できます。設備を増やすと1タップの獲得Pが増え、同じ場所の器具は新しいものに進化します。放置中は増えません。</p>
            <dl>
              <div><dt>現在のレベル</dt><dd>Lv {progress.level} / 100</dd></div>
              <div><dt>累計タップ</dt><dd>{number.format(game.taps)}</dd></div>
              <div><dt>累計獲得ポイント</dt><dd>{number.format(game.totalPoints)}</dd></div>
              <div><dt>設置済み器具</dt><dd>{game.owned.length} / {EQUIPMENT.length}</dd></div>
              {nextCharacter && nextCharacter.level > progress.character.level ? <div><dt>次の見た目</dt><dd>Lv {nextCharacter.level}</dd></div> : null}
            </dl>
            <button className={styles.settingButton} onClick={() => toggleSetting("soundEnabled")}>効果音 {game.soundEnabled ? "ON" : "OFF"}</button>
            <button className={styles.settingButton} onClick={() => toggleSetting("reducedMotion")}>軽量モード {game.reducedMotion ? "ON" : "OFF"}</button>
            <button className={styles.resetEntry} onClick={() => setOverlay("reset")}>最初から始める</button>
            {legacyAvailable ? <p className={styles.legacyNote}>
              {legacyMigrated ? "旧記録から累計タップと購入済み器具を引き継ぎました。" : "以前のゲームのセーブデータは、このブラウザに残しています。"}
              自動生産で得たポイントは新しいゲームには加算されません。旧セーブは保持しています。
            </p> : null}
          </section>
        </div>
      ) : null}

      {overlay === "reset" ? (
        <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay("menu"); }}>
          <section className={`${styles.modal} ${styles.resetDialog}`} role="alertdialog" aria-modal="true" aria-label="最初から始める確認">
            <h2>最初から始めますか？</h2>
            <p>この端末のレベル・P・設備・タップ数を初期化します。元には戻せません。登録済みのランキング記録は残ります。</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setOverlay("menu")} autoFocus>キャンセル</button>
              <button className={styles.confirmReset} onClick={restartGame}>初期化して始める</button>
            </div>
          </section>
        </div>
      ) : null}

      {overlay === "ranking" ? (
        <div className={styles.rankingBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay(null); }}>
          <section className={styles.rankingPanel} role="dialog" aria-modal="true" aria-label="累計タップランキング">
            <div className={styles.rankingHeader}>
              <div><small>累計タップ数</small><h2>ランキング</h2></div>
              <div className={styles.rankingHeaderActions}>
                <button onClick={() => void openRanking()} aria-label="ランキングを更新">↻</button>
                <button onClick={() => setOverlay(null)} aria-label="ランキングを閉じる">×</button>
              </div>
            </div>
            <div className={styles.rankingSelf}><span>あなたの記録</span><strong>{number.format(game.taps)} <small>タップ</small></strong><span>Lv {progress.level}</span></div>
            <div className={styles.rankingList} data-testid="tap-ranking-list">
              {rankingLoading ? <p className={styles.rankingState}>ランキングを読み込み中…</p>
                : !rankingAvailable ? <p className={styles.rankingState}>{rankingMessage || "ランキングは準備中です。"}</p>
                  : rankings.length === 0 ? <p className={styles.rankingState}>まだ記録がありません。最初の登録をどうぞ！</p>
                    : <ol>{rankings.map((item, index) => <li key={item.id} className={item.playerId === rankingPlayerId ? styles.myRank : ""}>
                      <span className={styles.rankNumber}>{index + 1}</span><span className={styles.rankName}>{item.nickname}</span><strong>{number.format(item.taps)} <small>タップ</small></strong>
                    </li>)}</ol>}
            </div>
            <form className={styles.rankingForm} onSubmit={(event) => { event.preventDefault(); void submitRanking(); }}>
              <label htmlFor="ranking-nickname">自分の記録を登録</label>
              <div><input id="ranking-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={12} placeholder="名前（12文字まで）" autoComplete="nickname" /><button type="submit" disabled={!rankingAvailable || rankingSubmitting || game.taps < 1 || !nickname.trim()}>{rankingSubmitting ? "登録中…" : "登録する"}</button></div>
              {rankingAvailable && rankingMessage ? <p role="status">{rankingMessage}</p> : null}
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
