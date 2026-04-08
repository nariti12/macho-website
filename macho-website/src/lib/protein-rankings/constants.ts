import type { RankingKey } from "@/lib/protein-rankings/types";

export const RAKUTEN_RANKING_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601";
export const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";
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
    displayName: string;
    aliases: string[];
    fallbackTitle: string;
    fallbackSearchTerm: string;
    fallbackImagePath: string;
    tasteRating: "◎" | "〇" | "△";
    formulaRating: "◎" | "〇" | "△";
  }
> = {
  "x-plosion": {
    label: "X-PLOSION",
    displayName: "X-PLOSION（エクスプロージョン）",
    aliases: ["x-plosion", "xplosion", "エクスプロージョン"],
    fallbackTitle: "X-PLOSION ホエイプロテイン",
    fallbackSearchTerm: "X-PLOSION ホエイプロテイン",
    fallbackImagePath: "/images/protein/xplosion.svg",
    tasteRating: "〇",
    formulaRating: "〇",
  },
  "gold standard": {
    label: "Gold Standard",
    displayName: "Gold Standard（ゴールドスタンダード）",
    aliases: ["gold standard", "ゴールドスタンダード", "optimum nutrition"],
    fallbackTitle: "Gold Standard 100% Whey",
    fallbackSearchTerm: "Gold Standard 100% Whey",
    fallbackImagePath: "/images/protein/gold-standard.svg",
    tasteRating: "◎",
    formulaRating: "◎",
  },
  "be legend": {
    label: "be LEGEND",
    displayName: "be LEGEND（ビーレジェンド）",
    aliases: ["be legend", "ビーレジェンド", "belegend"],
    fallbackTitle: "be LEGEND ホエイプロテイン",
    fallbackSearchTerm: "be LEGEND ホエイプロテイン",
    fallbackImagePath: "/images/protein/be-legend.svg",
    tasteRating: "〇",
    formulaRating: "〇",
  },
  myprotein: {
    label: "myprotein",
    displayName: "Myprotein（マイプロテイン）",
    aliases: ["myprotein", "マイプロテイン", "impact whey", "impact ホエイ"],
    fallbackTitle: "myprotein Impact ホエイプロテイン",
    fallbackSearchTerm: "myprotein Impact ホエイプロテイン",
    fallbackImagePath: "/images/protein/myprotein.svg",
    tasteRating: "△",
    formulaRating: "◎",
  },
  winzone: {
    label: "WINZONE",
    displayName: "WINZONE（ウィンゾーン）",
    aliases: ["winzone", "ウィンゾーン", "日本新薬"],
    fallbackTitle: "WINZONE ホエイプロテイン",
    fallbackSearchTerm: "WINZONE ホエイプロテイン",
    fallbackImagePath: "/images/protein/winzone.svg",
    tasteRating: "〇",
    formulaRating: "〇",
  },
};

export const MALE_FIXED_COMMENTS: Record<(typeof MALE_FIXED_BRAND_ORDER)[number], string> = {
  "x-plosion":
    "総合的にみて現状で一番良いプロテイン。味と成分がバランスよく、かつコスパ最強なので、これを買っておけば間違いはないです。",
  "gold standard":
    "世界No1プロテインです。成分、味ともに最強ですが、その分他の国産プロテインと比べると高いです。",
  "be legend":
    "バランス良く無難なプロテインです。味は全体的に割と甘い印象です。",
  myprotein:
    "成分はかなり優秀なんですが、味ははっきり言ってまずいです。個人の感想ではなく、皆言ってます。",
  winzone:
    "味がめっちゃ濃いので濃い味好きな人はハマるかも。少し高めです。",
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
  male: "",
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
