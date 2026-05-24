# マチョ田の部屋 サイト仕様

## 目的

`macho-website` は、筋トレ情報、実体験ベースのおすすめ商品、計算ツール、ブログ、ミニゲームをまとめた Next.js App Router 製サイトです。デザインはオレンジ基調で、共通ヘッダー、角丸カード、商品カード、外部ECボタンを中心に構成しています。

## 技術スタック

- フレームワーク: `Next.js 15`
- UI: `React 19`, `Tailwind CSS 4`
- ホスティング: `Vercel`
- CMS: `microCMS`
- DB: `Supabase`
- メール送信: `Resend`
- 計測: `Google Analytics`, `Google Tag Manager`
- アフィリエイト: 楽天アフィリエイト, Amazonアソシエイト

## 主要ルート

| ルート | 役割 | 主な実装 |
| --- | --- | --- |
| `/` | トップページ。メニュー導線とBlog最新6件を表示 | `src/components/home-page.tsx` |
| `/blog` | microCMS のブログ一覧 | `src/app/blog/page.tsx` |
| `/blog/[id]` | ブログ詳細。通常本文と吹き出しブロックに対応 | `src/app/blog/[id]/page.tsx` |
| `/macho-clicker` | マチョクリッカーゲーム | `src/components/macho-clicker-page.tsx` |
| `/menu` | マチョ田の筋トレメニュー | `src/app/menu/page.tsx` |
| `/intake-calculator` | 1日摂取カロリー/たんぱく質計算機 | `src/app/intake-calculator/_components/intake-calculator.tsx` |
| `/supplements-ranking` | おすすめプロテイン/クレアチン | `src/components/supplements-top-page.tsx` |
| `/supplements-top3` | 旧URLから `/supplements-ranking` へリダイレクト | `src/app/supplements-top3/page.tsx` |
| `/training-wear` | おすすめトレーニングシューズ | `src/app/training-wear/page.tsx` |
| `/training-gear` | おすすめトレーニングギア | `src/app/training-gear/page.tsx` |
| `/profile` | プロフィール | `src/app/profile/page.tsx` |
| `/contact` | お問合せフォーム | `src/app/contact/page.tsx` |
| `/privacy` | プライバシーポリシー | `src/app/privacy/page.tsx` |

## トップページ

- メニュー導線は `src/components/home-page.tsx` の `menuItems` で管理します。
- Blogセクションは `/api/blogs` から最新6件を取得します。
- Blogカードの日付は `publishedAt` を使い、ラベルは `公開日` です。
- 構造化データは `WebSite` と `Organization` を出力します。SNSは X のみを `sameAs` に含めます。

## ブログ

- データソースは `microCMS` の `blogs` API です。
- 一覧は `publishedAt` 降順で表示します。
- 詳細ページは次の本文構造に対応します。
  - `content2` がある場合: 繰り返しフィールドとして本文ブロック/吹き出しブロックを描画
  - `content2` がない場合: `richEditor` / `content` / `body` を通常本文として描画
- microCMS Webhook から `/api/revalidate` を呼ぶと `blog-list` と該当記事タグを再検証します。

## おすすめプロテイン/クレアチン

- ページ: `/supplements-ranking`
- プロテインは現在 `X-PLOSION` と `Gold Standard` の TOP2 を表示対象にしています。
- 表示名、コメント、美味しさ、成分評価、Amazon検索URL、楽天検索URLは固定設定です。
- プロテインの商品情報は Supabase の `rankings` / `products` / `product_metrics` を読み込みます。
- 日次 Cron は停止済みです。`vercel.json` に Cron 設定はありません。
- 必要な場合のみ `/api/cron/protein-rankings` を手動実行してDBを更新します。
- クレアチンは `INNOCECT` と `Nature In` の TOP2 を固定表示します。

詳細は `docs/protein-rankings.md` を参照してください。

## おすすめ商品ページ

- `/training-wear` はトレーニングシューズTOP5を静的定義します。
- `/training-gear` はトレーニングベルトとパワーグリップを静的定義します。
- 楽天URLは `buildRakutenAffiliateUrl`、Amazon URLは `buildAmazonAffiliateUrl` でアフィリエイトURLに変換します。
- Amazonのタグは `src/lib/protein-rankings/links.ts` の `AMAZON_ASSOCIATE_TAG` で管理します。

## マチョクリッカー

- ページ: `/macho-clicker`
- 状態はブラウザの `localStorage` に保存します。
- ランキングは `/api/macho-clicker/rankings` 経由で Supabase の `macho_clicker_scores` に保存します。
- ゲーム画像は `public/game/macho-clicker/` 配下のPNGを使います。
- Supabase環境変数がない場合、ランキング取得は空配列を返します。

## API

| API | Method | 役割 |
| --- | --- | --- |
| `/api/blogs` | `GET` | トップページ用のBlog最新6件を取得 |
| `/api/blogs/[id]` | `GET` | Blog詳細取得 |
| `/api/revalidate` | `POST` | microCMS Webhook用の再検証 |
| `/api/contact` | `POST` | Resendでお問い合わせメール送信 |
| `/api/macho-clicker/rankings` | `GET`, `POST` | マチョクリッカーランキング取得/登録 |
| `/api/cron/protein-rankings` | `GET`, `POST` | プロテインランキングの手動更新 |

## データベース

Supabase migration は `supabase/migrations/` にあります。

- `products`: 楽天由来の商品基本情報
- `product_metrics`: 抽出した内容量、たんぱく質情報、分類情報
- `rankings`: 表示用ランキング
- `expert_signals`: 将来拡張用の専門家加点
- `macho_clicker_scores`: マチョクリッカーランキング

## 環境変数

`.env.example` を最新の入口にします。

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- microCMS: `MICROCMS_API_KEY`, `MICROCMS_BASE_URL`, `MICROCMS_REVALIDATE_SECRET`
- Resend: `RESEND_API_KEY`
- Google: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`
- 楽天: `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY`, `RAKUTEN_AFFILIATE_ID`, `RAKUTEN_SITE_ORIGIN`
- 手動更新API: `CRON_SECRET`

## デプロイ/運用

- Vercel に GitHub `main` ブランチを連携してデプロイします。
- `vercel.json` は現在 `{}` で、日次 Cron は使っていません。
- プロテインDBを更新したい場合だけ、手動で `/api/cron/protein-rankings` を実行します。
- 通常確認コマンド:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 構成図

draw.io で開く構成図は `docs/architecture.drawio` です。
