## Overview

`macho-website` は Next.js App Router ベースのサイトです。`/supplements-ranking` では、「おすすめプロテイン TOP5」を表示します。ページ表示時は Supabase に保存済みのランキングのみを読み込みます。

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

## Ranking Update Flow

表示ページは保存済みランキングだけを読み込みます。外部モールへのアクセスは cron 側に限定しています。

1. `/api/cron/protein-rankings` が楽天の商品検索 API から固定5ブランドの商品情報を取得
2. 内容量を抽出して `1kgあたり` の価格を計算
3. 固定順のおすすめプロテイン TOP5 を作成
4. Supabase の `products` / `product_metrics` / `rankings` に保存
5. `/supplements-ranking` は保存済みデータを表示

固定の5ブランドを次の順で表示します。

1. `X-PLOSION`
2. `Gold Standard`
3. `be LEGEND`
4. `myprotein`
5. `WINZONE`

取得できなかったブランドは楽天検索導線で補完し、TOP5が欠けないようにしています。

## Vercel Cron

`vercel.json` に日次 cron を追加しています。

```json
{
  "crons": [
    {
      "path": "/api/cron/protein-rankings",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Vercel では `CRON_SECRET` を設定すると、Cron Job 実行時に `Authorization: Bearer <CRON_SECRET>` が自動付与されます。ローカルで手動実行する場合は次のように叩けます。

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/protein-rankings
```

## Verification

最低限の静的チェック:

```bash
npm run lint
npx tsc --noEmit
```

運用前には migration 適用後に cron を一度手動実行し、ランキング表示を確認してください。
