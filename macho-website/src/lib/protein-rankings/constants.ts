import type { RankingKey } from "@/lib/protein-rankings/types";

export const RAKUTEN_PROTEIN_GENRE_ID = "567603";
export const RAKUTEN_RANKING_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601";
export const RAKUTEN_RANKING_PAGES = 2;
export const RAKUTEN_RANKING_PAGE_SIZE = 30;
export const RAKUTEN_REQUEST_DELAY_MS = 450;
export const RAKUTEN_MAX_RETRIES = 3;
export const TOP_RANKING_LIMIT = 5;

export const MIN_REVIEW_COUNT = 5;
export const STRICT_MIN_REVIEW_COUNT = 30;

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
  "グミ",
  "ゼリー",
  "スープ",
  "クッキー",
  "パンケーキ",
  "シリアル",
] as const;

export const CHILDREN_EXCLUSION_KEYWORDS = [
  "ジュニア",
  "キッズ",
  "子供",
  "こども",
  "小学生",
  "中学生",
  "高校生",
  "成長期",
  "育ち盛り",
] as const;

export const BANNED_BRANDS = ["savas", "ザバス"] as const;

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
  "大豆プロテイン",
  "ホエイプロテイン",
  "ソイプロテイン",
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
  "妊活",
  "妊娠",
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
  "ウェイトダウン",
  "引き締め",
] as const;

export const TRUSTED_MALE_BRANDS = [
  "x-plosion",
  "xplosion",
  "エクスプロージョン",
  "be legend",
  "ビーレジェンド",
  "gold standard",
  "ゴールドスタンダード",
  "optimum nutrition",
  "valx",
  "winzone",
  "vitas",
  "myprotein",
  "マイプロテイン",
  "lyft",
  "リフト",
  "grong",
  "グロング",
  "fixit",
] as const;

export const MYBEST_MALE_URL = "https://my-best.com/3389";
export const MYBEST_FEMALE_URL = "https://my-best.com/23907";
export const MYBEST_SIGNAL_BONUS = 0.05;

export const TITLE_NOISE_PATTERNS = [
  /【[^】]*】/g,
  /\([^)]*\)/g,
  /（[^）]*）/g,
  /\[[^\]]*\]/g,
  /送料無料/g,
  /最安値挑戦中/g,
  /最安値/g,
  /ポイント\d+倍/g,
  /期間限定/g,
  /クーポン/g,
  /公式/g,
  /限定/g,
  /\d+(?:\.\d+)?\s?(?:kg|g)/gi,
  /\d+種(?:類)?/g,
  /フレーバー/g,
  /味/g,
  /セット/g,
  /まとめ買い/g,
  /大容量/g,
] as const;

export const RANKING_LABELS: Record<RankingKey, string> = {
  male: "男性向け最強プロテイン TOP5",
  female: "女性向け最強プロテイン TOP5",
};

export const RANKING_DESCRIPTIONS: Record<RankingKey, string> = {
  male:
    "楽天売上ランキングをベースに、レビュー、たんぱく質情報、価格バランスを見直して選んだ男性向け上位5商品です。",
  female:
    "楽天売上ランキングをベースに、レビュー、ソイ適性、女性向け訴求を見直して選んだ女性向け上位5商品です。",
};

export const MALE_WEIGHTS = {
  sales: 0.5,
  review: 0.2,
  protein: 0.15,
  cost: 0.1,
} as const;

export const FEMALE_WEIGHTS = {
  sales: 0.45,
  review: 0.2,
  suitability: 0.2,
  cost: 0.1,
} as const;

export const MAX_EXPERT_BONUS = 0.1;
