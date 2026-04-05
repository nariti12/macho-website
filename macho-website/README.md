## Overview

`macho-website` は Next.js App Router ベースのサイトです。`/supplements-top3` では、楽天売上ランキングを母集団に再選抜した「男性向け最強プロテイン TOP5 / 女性向け最強プロテイン TOP5」を表示します。ページ表示時は Supabase に保存済みのランキングのみを読み込みます。

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

1. `/api/cron/protein-rankings` が楽天ランキング API からプロテイン genre の上位商品を取得
2. 商品名から内容量、たんぱく質量、女性向け/美容系キーワードを正規表現ベースで抽出
3. `SAVAS / ザバス`、シェイカー、バーなどの除外ルールを適用
4. 男性向け / 女性向けのスコアを計算
5. Supabase の `products` / `product_metrics` / `rankings` に保存
6. `/supplements-top3` は保存済みデータを表示

男性向けは楽天順位を主軸に、レビュー、たんぱく質情報、価格妥当性を補助にして再選抜します。女性向けは楽天順位を主軸に、レビュー、ソイ適性、女性向けキーワードを補助にして再選抜します。

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
