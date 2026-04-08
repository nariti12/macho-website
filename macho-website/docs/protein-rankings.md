# Protein Rankings

## 概要

`/supplements-ranking` は、「おすすめプロテイン TOP5」を表示するページです。固定の5ブランドを優先順で表示し、表示時は Supabase に保存済みのランキングだけを読み込みます。

## データソース

- 楽天の商品検索 API
- 対象ブランド:
  - `X-PLOSION`
  - `Gold Standard`
  - `be LEGEND`
  - `myprotein`
  - `WINZONE`

## 更新フロー

1. `src/app/api/cron/protein-rankings/route.ts` が cron リクエストを受ける
2. `src/lib/protein-rankings/rakuten-client.ts` が固定5ブランドの商品情報を順番に取得する
3. `src/lib/protein-rankings/extractors.ts` が内容量を抽出し、1kgあたり価格計算に使う
4. `src/lib/protein-rankings/scoring.ts` が固定順位の TOP5 を作る
5. `src/lib/protein-rankings/repository.ts` が `products` / `product_metrics` / `rankings` に保存する
6. cron 成功後に `/supplements-ranking` を再生成する

## スコア方針

### おすすめプロテイン

- 固定順:
  1. `X-PLOSION`
  2. `Gold Standard`
  3. `be LEGEND`
  4. `myprotein`
  5. `WINZONE`
- 各ブランドについて、取得できた商品の中から代表商品を1件採用する
- 取得できないブランドは楽天検索導線のフォールバック行を作り、TOP5を必ず表示する
- 表示名、コメント、美味しさ、成分評価は固定表示にする

## 表示方針

- 商品名は固定表示:
  - `X-PLOSION（エクスプロージョン）`
  - `Gold Standard（ゴールドスタンダード）`
  - `be LEGEND（ビーレジェンド）`
  - `Myprotein（マイプロテイン）`
  - `WINZONE（ウィンゾーン）`
- コメントは固定表示
- `レビュー` は `4.48点/5点（レビュー数2171件）` 形式
- `1kgあたり` は取得した価格と内容量から計算
- `美味しさ` と `成分` は `◎ / 〇 / △` で固定表示

## 運用メモ

- 必須 env:
  - `RAKUTEN_APPLICATION_ID`
  - `RAKUTEN_ACCESS_KEY`
  - `RAKUTEN_AFFILIATE_ID`
  - `CRON_SECRET`
  - Supabase 接続情報
- cron は `vercel.json` で日次実行
- 手動実行:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.machoda.com/api/cron/protein-rankings
```
