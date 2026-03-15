import type { RankingKey } from "@/lib/protein-rankings/types";

export const PROTEIN_SEARCH_QUERIES = [
  "プロテイン",
  "ホエイプロテイン",
  "ソイプロテイン",
  "女性 プロテイン",
  "ダイエット プロテイン",
] as const;

export const RAKUTEN_SEARCH_PAGES = 2;
export const RAKUTEN_SEARCH_HITS = 30;
export const TOP_RANKING_LIMIT = 5;

export const MIN_REVIEW_COUNT = 5;
export const MIN_REVIEW_AVERAGE = 3.8;

export const BANNED_PRODUCT_KEYWORDS = [
  "シェイカー",
  "プロテインバー",
  "バー",
  "サンプル",
  "お試し",
  "空容器",
  "ボトル",
  "スプーン",
  "ケース",
  "クレアチン",
  "bcaa",
  "eaa",
  "アミノ酸",
  "マルチビタミン",
  "青汁",
] as const;

export const LIKELY_PROTEIN_KEYWORDS = [
  "プロテイン",
  "protein",
  "ホエイ",
  "whey",
  "ソイ",
  "soy",
  "wpi",
  "wpc",
  "カゼイン",
] as const;

export const WOMEN_KEYWORDS = [
  "女性",
  "レディース",
  "ソイ",
  "植物性",
  "置き換え",
  "ダイエット",
  "美容",
  "すっきり",
  "引き締め",
] as const;

export const BEAUTY_KEYWORDS = [
  "鉄",
  "ビタミン",
  "乳酸菌",
  "食物繊維",
  "葉酸",
  "コラーゲン",
  "ヒアルロン酸",
  "イソフラボン",
] as const;

export const DIET_KEYWORDS = [
  "ダイエット",
  "置き換え",
  "糖質オフ",
  "低糖質",
  "脂質オフ",
  "カロリーオフ",
] as const;

export const RANKING_LABELS: Record<RankingKey, string> = {
  "cost-performance": "コスパ最強プロテイン TOP5",
  composition: "成分最強プロテイン TOP5",
  women: "女性向け最強プロテイン TOP5",
};

export const RANKING_DESCRIPTIONS: Record<RankingKey, string> = {
  "cost-performance":
    "価格・レビュー信頼度・楽天内での見つかりやすさをもとに、迷ったら選びやすいコスパ重視の上位5商品です。",
  composition:
    "たんぱく質含有率を中心に、WPI/WPC 判定とレビュー信頼度を加味して選んだ成分重視の上位5商品です。",
  women:
    "ソイや美容成分、ダイエット向けキーワード、レビュー信頼度をもとに女性視点で選びやすい上位5商品です。",
};

export const COST_PERFORMANCE_WEIGHTS = {
  cost: 0.5,
  review: 0.3,
  popularity: 0.2,
} as const;

export const COMPOSITION_WEIGHTS = {
  purity: 0.7,
  review: 0.2,
  typeBonus: 0.1,
} as const;

export const WOMEN_WEIGHTS = {
  suitability: 0.4,
  review: 0.35,
  cost: 0.15,
  beauty: 0.1,
} as const;

export const MAX_EXPERT_BONUS = 0.1;
