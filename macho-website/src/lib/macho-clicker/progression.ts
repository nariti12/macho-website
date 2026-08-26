import { MACHO_CHARACTER_STAGES } from "../characters/macho-face2";

export type BodyEvolutionStage = {
  stage: number;
  level: number;
  label: string;
  requirement: number;
  imageSrc: string;
  change: string;
};

// Preserve early milestones and the final requirement while adopting the
// approved 12-asset Lv1–100 catalogue.
const STAGE_DETAILS: Record<number, { label: string; requirement: number; change: string }> = {
  1: { label: "トレーニング開始", requirement: 0, change: "細身の身体からスタート" },
  5: { label: "筋肉の芽", requirement: 500, change: "肩と腕に筋肉の輪郭が出る" },
  10: { label: "初心者卒業", requirement: 5_000, change: "胸・腹・脚が引き締まる" },
  20: { label: "中級トレーニー", requirement: 25_000, change: "全身の筋肉が一段階発達する" },
  30: { label: "胸板覚醒", requirement: 100_000, change: "胸板と腕に厚みが増す" },
  40: { label: "上級マッチョ", requirement: 1_000_000, change: "肩・背中・脚に力強さが増す" },
  50: { label: "ブランド代表形態", requirement: 7_000_000, change: "マチョ田のブランド代表形態へ" },
  60: { label: "限界突破", requirement: 20_000_000, change: "人の限界を超えた筋肉へ成長する" },
  70: { label: "異次元の入口", requirement: 70_000_000, change: "身体に異次元の力が宿る" },
  80: { label: "超越マッチョ", requirement: 250_000_000, change: "さらに力強い異形の身体へ" },
  90: { label: "伝説のマチョ田", requirement: 1_000_000_000, change: "伝説級の肉体へ到達する" },
  100: { label: "最終形態", requirement: 2_500_000_000, change: "異次元の最終形態へ進化する" },
};

export const BODY_EVOLUTION_STAGES: readonly BodyEvolutionStage[] = MACHO_CHARACTER_STAGES.map(
  (asset, stage) => ({ ...asset, stage, ...STAGE_DETAILS[asset.level] }),
);
export const FINAL_BODY_EVOLUTION_STAGE = BODY_EVOLUTION_STAGES.length - 1;

export const getUnlockedBodyEvolutionStage = (totalMuscle: number) =>
  BODY_EVOLUTION_STAGES.reduce(
    (highest, stage) => (totalMuscle >= stage.requirement ? stage.stage : highest),
    0,
  );

export const getBodyStage = (stage: number) =>
  BODY_EVOLUTION_STAGES.find((candidate) => candidate.stage === stage) ?? BODY_EVOLUTION_STAGES[0];

// Old saves store an index into the 20-stage catalogue, not a level.
export const migrateLegacyBodyEvolutionStage = (stage: number) => {
  const oldRequirements = [
    0, 500, 5_000, 25_000, 50_000, 100_000, 250_000, 1_000_000, 2_000_000, 4_000_000,
    7_000_000, 10_000_000, 20_000_000, 40_000_000, 70_000_000, 100_000_000,
    250_000_000, 500_000_000, 1_000_000_000, 2_500_000_000,
  ];
  const index = Number.isFinite(stage) ? Math.max(0, Math.min(19, Math.floor(stage))) : 0;
  return getUnlockedBodyEvolutionStage(oldRequirements[index]);
};
