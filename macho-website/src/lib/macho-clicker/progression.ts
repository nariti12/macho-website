const FINAL_CHARACTER_IMAGE_SRC = "/picture/man.png";

export type BodyEvolutionStage = {
  stage: number;
  label: string;
  requirement: number;
  imageSrc: string;
  change: string;
  ring: string;
  scale: number;
  aura: string;
};

export const BODY_EVOLUTION_STAGES = [
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
    imageSrc: FINAL_CHARACTER_IMAGE_SRC,
    change: "専用ウェアと伝説の風格を得る",
    ring: "border-red-100 bg-[#FF8A23]",
    scale: 1.08,
    aura: "opacity-84",
  },
  {
    stage: 8,
    label: "完成形マチョ",
    requirement: 10_000_000,
    imageSrc: FINAL_CHARACTER_IMAGE_SRC,
    change: "マチョ田の最終形態へ到達する",
    ring: "border-red-100 bg-[#FF6A1A]",
    scale: 1.12,
    aura: "opacity-95",
  },
] as const satisfies readonly BodyEvolutionStage[];

export const getUnlockedBodyEvolutionStage = (totalMuscle: number) =>
  BODY_EVOLUTION_STAGES.reduce(
    (highest, stage) => (totalMuscle >= stage.requirement ? stage.stage : highest),
    0
  );

export const getBodyStage = (stage: number) =>
  BODY_EVOLUTION_STAGES.find((candidate) => candidate.stage === stage) ??
  BODY_EVOLUTION_STAGES[0];
