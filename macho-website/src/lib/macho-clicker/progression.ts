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

export const FINAL_BODY_EVOLUTION_STAGE = 19;

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
    label: "食生活改善",
    requirement: 50_000,
    imageSrc: "/picture/macho-evolution/v2/stage-04-diet-improvement.png",
    change: "腹部がわずかに締まり、表情が明るくなる",
    ring: "border-white/80 bg-[#FFB45D]",
    scale: 1.01,
    aura: "opacity-55",
  },
  {
    stage: 5,
    label: "脱メタボ開始",
    requirement: 100_000,
    imageSrc: "/picture/macho-evolution/v2/stage-05-training-wear.png",
    change: "清潔なトレーニングウェアへ着替える",
    ring: "border-orange-100 bg-[#FFA33D]",
    scale: 1.02,
    aura: "opacity-66",
  },
  {
    stage: 6,
    label: "筋肉の芽",
    requirement: 250_000,
    imageSrc: "/picture/macho-evolution/v2/stage-06-muscle-sprout.png",
    change: "肩と上腕に最初の筋肉の輪郭が出る",
    ring: "border-orange-100 bg-[#FF9D2E]",
    scale: 1.03,
    aura: "opacity-75",
  },
  {
    stage: 7,
    label: "初心者卒業",
    requirement: 1_000_000,
    imageSrc: "/picture/macho-evolution/v2/stage-07-beginner-graduate.png",
    change: "背筋が伸び、胸を張った姿勢に自信が出る",
    ring: "border-red-100 bg-[#FF8A23]",
    scale: 1.04,
    aura: "opacity-84",
  },
  {
    stage: 8,
    label: "細マッチョ入口",
    requirement: 2_000_000,
    imageSrc: "/picture/macho-evolution/v2/stage-08-lean-muscle-entry.png",
    change: "腹部が締まり、胸に最初の輪郭が出る",
    ring: "border-red-100 bg-[#FF7F20]",
    scale: 1.05,
    aura: "opacity-87",
  },
  {
    stage: 9,
    label: "中級トレーニー",
    requirement: 4_000_000,
    imageSrc: "/picture/macho-evolution/v2/stage-09-intermediate-trainee.png",
    change: "肩幅と脚が一段階発達する",
    ring: "border-red-100 bg-[#FF741D]",
    scale: 1.06,
    aura: "opacity-90",
  },
  {
    stage: 10,
    label: "胸板覚醒",
    requirement: 7_000_000,
    imageSrc: "/picture/macho-evolution/v2/stage-10-chest-awakening.png",
    change: "胸板と上腕三頭筋が厚くなる",
    ring: "border-red-100 bg-[#FF6A1A]",
    scale: 1.07,
    aura: "opacity-93",
  },
  {
    stage: 11,
    label: "逆三角形",
    requirement: 10_000_000,
    imageSrc: "/picture/macho-evolution/v2/stage-11-v-shape.png",
    change: "広背筋と肩が育ち、逆三角形が際立つ",
    ring: "border-red-100 bg-[#FF5F17]",
    scale: 1.08,
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
