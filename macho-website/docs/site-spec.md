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
| `/supplements-ranking` | おすすめサプリ | `src/components/supplements-top-page.tsx` |
| `/supplements-top3` | 旧URLから `/supplements-ranking` へリダイレクト | `src/app/supplements-top3/page.tsx` |
| `/training-wear` | おすすめトレーニングシューズ | `src/app/training-wear/page.tsx` |
| `/training-gear` | おすすめトレーニングギア | `src/app/training-gear/page.tsx` |
| `/profile` | プロフィール | `src/app/profile/page.tsx` |
| `/contact` | お問合せフォーム | `src/app/contact/page.tsx` |
| `/privacy` | プライバシーポリシー | `src/app/privacy/page.tsx` |

## トップページ

- メニュー導線は `src/components/home-page.tsx` の `menuItems` で管理します。
- Blogセクションは `src/lib/blogs.ts` を通じてサーバー側で最新6件を取得し、初期HTMLに含めます。
- `/api/blogs` も同じ `src/lib/blogs.ts` を利用し、Blogカードの正規化処理を共通化しています。
- Blogカードの日付は `publishedAt` を使い、ラベルは `公開日` です。
- 構造化データは `WebSite` と `Organization` を出力します。SNSは X のみを `sameAs` に含めます。

## ブログ

- データソースは `microCMS` の `blogs` API です。
- 一覧は `publishedAt` 降順で表示します。
- 詳細ページは次の本文構造に対応します。
  - `content2` がある場合: 繰り返しフィールドとして本文ブロック/吹き出しブロック/「今日の気づき」ブロックを描画
  - 吹き出しブロックのカスタムフィールドIDは `talkText`
  - 「今日の気づき」ブロックのカスタムフィールドIDは `todayInsight`。内部のリッチエディタのフィールドIDは `text`
  - 日ごとの記録内で「気づき」を繰り返す場合は、本文リッチエディタのカスタムclass `today-insight` を利用する。本文を分割せず、選択した文章だけを専用枠で表示できる
  - `content2` がない場合: `richEditor` / `content` / `body` を通常本文として描画
- 詳細ページには公開日、更新日、プロフィールへ遷移する著者表示、関連記事を表示します。
- 構造化データは `Article` と `BreadcrumbList` を出力します。
- microCMS Webhook から `/api/revalidate` を呼ぶと `blog-list` と該当記事タグを再検証します。

## おすすめサプリ

- ページ: `/supplements-ranking`
- プロテインは現在 `Verifyst`、`X-PLOSION`、`Gold Standard` の TOP3 を表示対象にしています。
- 表示名、コメント、美味しさ、成分評価、Amazon検索URL、楽天検索URLは固定設定です。
- プロテインの商品情報は Supabase の `rankings` / `products` / `product_metrics` を読み込みます。
- Vercel Cron で週1回 `/api/cron/protein-rankings` を実行してDBを更新します。
- 必要な場合は `/api/cron/protein-rankings` を手動実行してDBを更新します。
- クレアチンは `INNOCECT` と `Nature In` の TOP2 を固定表示します。
- プレワークアウトは `Kaged（ケージド）` を固定表示します。
- クレアチンはAmazon商品ページの通常購入価格を週次キャッシュで取得し、取得失敗時は最後に確認した参考価格を表示します。
- iHerb商品の価格は表示しません。
- ランキングごとの `ItemList` 構造化データを出力します。

詳細は `docs/protein-rankings.md` を参照してください。

## おすすめ商品ページ

- `/training-wear` はトレーニングシューズTOP5を静的定義します。
- `/training-gear` はトレーニングベルトとパワーグリップを静的定義します。
- 楽天検索URLがある商品は楽天APIから参考価格を取得し、週次再検証で更新します。
- Amazon / 公式サイトのみの商品は固定価格を表示します。
- 楽天URLは `buildRakutenAffiliateUrl`、Amazon URLは `buildAmazonAffiliateUrl` でアフィリエイトURLに変換します。
- Amazonのタグは `src/lib/protein-rankings/links.ts` の `AMAZON_ASSOCIATE_TAG` で管理します。
- 各ページに `ItemList` 構造化データを出力します。

## アフィリエイト計測

- 外部ECボタンは `src/components/affiliate-link.tsx` を共通利用します。
- クリック時にGA4へ `affiliate_click` イベントを送信します。
- イベントには購入先、商品名、順位、ページパス、配置、遷移先URLを含めます。
- GA4側の確認方法と日常運用は `docs/site-growth-operations.md` を参照してください。

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
- `vercel.json` に週次 Cron を設定しています。
- プロテインDBを今すぐ更新したい場合は、手動で `/api/cron/protein-rankings` を実行します。
- 通常確認コマンド:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 構成図

draw.io で開く構成図は `docs/architecture.drawio` です。

Mermaid で確認できる構成図は `docs/site-architecture-mermaid.md` です。
