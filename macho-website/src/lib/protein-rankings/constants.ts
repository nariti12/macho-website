import type { RankingKey } from "@/lib/protein-rankings/types";

export const RAKUTEN_RANKING_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601";
export const RAKUTEN_PUBLIC_RANKING_URL = "https://ranking.rakuten.co.jp/daily/567603/";
export const RAKUTEN_RANKING_PAGES = 1;
export const RAKUTEN_RANKING_PAGE_SIZE = 80;
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
  "小学生",
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
] as const;

export const MALE_FIXED_BRAND_ORDER = [
  "x-plosion",
  "gold standard",
  "be legend",
  "myprotein",
  "winzone",
] as const;

export const MALE_FIXED_BRAND_CONFIG: Record<
  (typeof MALE_FIXED_BRAND_ORDER)[number],
  {
    label: string;
    aliases: string[];
    fallbackTitle: string;
    fallbackSearchTerm: string;
  }
> = {
  "x-plosion": {
    label: "X-PLOSION",
    aliases: ["x-plosion", "xplosion", "エクスプロージョン"],
    fallbackTitle: "X-PLOSION ホエイプロテイン",
    fallbackSearchTerm: "X-PLOSION ホエイプロテイン",
  },
  "gold standard": {
    label: "Gold Standard",
    aliases: ["gold standard", "ゴールドスタンダード", "optimum nutrition", "オン"],
    fallbackTitle: "Gold Standard 100% Whey",
    fallbackSearchTerm: "Gold Standard 100% Whey",
  },
  "be legend": {
    label: "be LEGEND",
    aliases: ["be legend", "ビーレジェンド", "belegend"],
    fallbackTitle: "be LEGEND ホエイプロテイン",
    fallbackSearchTerm: "be LEGEND ホエイプロテイン",
  },
  myprotein: {
    label: "myprotein",
    aliases: ["myprotein", "マイプロテイン", "impact whey", "impact ホエイ"],
    fallbackTitle: "myprotein Impact ホエイプロテイン",
    fallbackSearchTerm: "myprotein Impact ホエイプロテイン",
  },
  winzone: {
    label: "WINZONE",
    aliases: ["winzone", "ウィンゾーン", "日本新薬"],
    fallbackTitle: "WINZONE ホエイプロテイン",
    fallbackSearchTerm: "WINZONE ホエイプロテイン",
  },
};

export const MALE_FIXED_COMMENTS: Record<(typeof MALE_FIXED_BRAND_ORDER)[number], string> = {
  "x-plosion":
    "大容量でも続けやすい価格帯が強みで、味も極端に外しにくい定番として1位に固定しています。",
  "gold standard":
    "価格は高めですが、成分設計の安心感と味の評価が強く、王道の2位として固定しています。",
  "be legend":
    "フレーバーの選びやすさと飲みやすさが強みで、大きな弱点が少ない無難枠として3位に置いています。",
  myprotein:
    "価格と知名度は強い一方で、味は好みが分かれやすい前提で4位に固定しています。",
  winzone:
    "味の主張がはっきりして好みは分かれますが、ハマる人には刺さる定番として5位に残しています。",
};

export const MYBEST_MALE_URL = "https://my-best.com/3389";
export const MYBEST_FEMALE_URL = "https://my-best.com/23907";
export const MYBEST_MALE_SIGNAL_BONUS = 0.12;
export const MYBEST_FEMALE_SIGNAL_BONUS = 0.14;

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
  male: "おすすめプロテイン TOP5",
  female: "女性向け最強プロテイン TOP5",
};

export const RANKING_DESCRIPTIONS: Record<RankingKey, string> = {
  male:
    "定番ブランドの中から、今おすすめしやすいプロテインを5つに絞って掲載しています。",
  female:
    "楽天売上ランキングをベースに、レビュー、女性向け訴求、my-best掲載を見直して選んだ女性向け上位5商品です。",
};

export const MALE_WEIGHTS = {
  sales: 0.7,
  review: 0.15,
} as const;

export const FEMALE_WEIGHTS = {
  sales: 0.5,
  review: 0.25,
  suitability: 0.15,
} as const;

export const MAX_EXPERT_BONUS = 0.15;
