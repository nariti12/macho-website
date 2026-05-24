## Overview

`macho-website` は Next.js App Router ベースの筋トレ情報サイトです。トップページから、ブログ、筋トレメニュー、計算機、おすすめ商品、ミニゲームへ遷移します。

仕様把握は以下を入口にしてください。

- 全体仕様: `docs/site-spec.md`
- プロテイン/クレアチン仕様: `docs/protein-rankings.md`
- 構成図: `docs/architecture.drawio`

## Getting Started

依存関係を入れて、開発サーバーを起動します。

```bash
npm install
npm run dev
```

`http://localhost:3000` を開くとサイトを確認できます。

## Environment Variables

`.env.example` をもとに以下を設定してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MICROCMS_API_KEY`
- `MICROCMS_BASE_URL`
- `MICROCMS_REVALIDATE_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GTM_ID`
- `RAKUTEN_APPLICATION_ID`
- `RAKUTEN_ACCESS_KEY`
- `RAKUTEN_AFFILIATE_ID`
- `RAKUTEN_SITE_ORIGIN`
- `CRON_SECRET`

## Supabase Migration

ランキング保存用のテーブルは以下の migration で追加・更新しています。

- `supabase/migrations/20260314120000_add_protein_rankings.sql`
- `supabase/migrations/20260405133000_refactor_protein_rankings_for_sales.sql`

```bash
supabase db push
```

対象テーブル:

- `products`
- `product_metrics`
- `rankings`
- `expert_signals`

`expert_signals` は将来の専門家加点用の拡張ポイントで、初期版では未使用です。

## Ranking Data

プロテイン表示は Supabase に保存済みのランキングを読み込みます。現在は日次 Cron を停止しており、必要な場合だけ手動更新します。

1. `/api/cron/protein-rankings` を手動実行すると、楽天の商品検索 API から固定ブランドの商品情報を取得
2. 内容量を抽出して `1kgあたり` の価格を計算
3. 固定順のおすすめプロテインを作成
4. Supabase の `products` / `product_metrics` / `rankings` に保存
5. `/supplements-ranking` は保存済みデータを表示

固定ブランドは次の順で扱います。

1. `X-PLOSION`
2. `Gold Standard`
3. `be LEGEND`
4. `WINZONE`
5. `myprotein`

現在のページでは `X-PLOSION` と `Gold Standard` を表示対象にしています。

## Manual Ranking Update

日次 Cron は停止しています。`vercel.json` には Cron 設定を置いていません。

```json
{}
```

ランキングを手動更新する場合は、`CRON_SECRET` を使って次のように叩きます。

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/protein-rankings
```

## Verification

最低限の静的チェック:

```bash
npm run lint
npx tsc --noEmit
```

ランキングDBを更新したい場合は、migration 適用後に手動更新APIを一度実行し、表示を確認してください。
