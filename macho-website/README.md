## Overview

`macho-website` は Next.js App Router ベースのサイトです。今回、`/supplements-top3` に「プロテイン/サプリ 最強TOP5」ページを実装し、楽天 API から候補商品を収集して Supabase に保存したランキングを表示する構成を追加しています。

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
- `CRON_SECRET`

## Supabase Migration

ランキング保存用のテーブルは `supabase/migrations/20260314120000_add_protein_rankings.sql` で追加しています。

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

表示ページは保存済みランキングだけを読み込みます。楽天 API への直接アクセスは cron 側に限定しています。

1. `/api/cron/protein-rankings` が楽天 API から候補商品を取得
2. 商品名や説明から内容量、たんぱく質量、女性向け/美容系キーワードを正規表現ベースで抽出
3. 除外ルールとスコア計算を適用
4. Supabase の `products` / `product_metrics` / `rankings` に保存
5. `/supplements-top3` は保存済みデータを表示

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
```

運用前には migration 適用後に cron を一度手動実行し、ランキング表示を確認してください。
