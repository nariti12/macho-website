export type UpgradeKey =
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

export type Upgrade = {
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

export const MACHO_BUILDINGS: Upgrade[] = [
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
    baseCost: 1_100,
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
    baseCost: 12_000,
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
    baseCost: 130_000,
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
    baseCost: 1_400_000,
    costRate: 1.15,
    perSecondBonus: 1_400,
    accent: "from-[#FDE68A] to-[#EA580C]",
  },
  {
    key: "trainer",
    name: "専属トレーナー",
    label: "COACH",
    icon: "T",
    spriteSrc: "/game/macho-clicker/icons/macho-cat.svg",
    description: "フォーム改善で筋肉生産を加速します。",
    baseCost: 20_000_000,
    costRate: 1.15,
    perSecondBonus: 7_800,
    accent: "from-[#FDBA74] to-[#9A3412]",
  },
  {
    key: "gym",
    name: "巨大ジム",
    label: "GYM",
    icon: "G",
    spriteSrc: "/game/macho-clicker/icons/generated-v3/gym.png",
    description: "街ごと筋トレ空間に変える巨大施設です。",
    baseCost: 330_000_000,
    costRate: 1.15,
    perSecondBonus: 44_000,
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
