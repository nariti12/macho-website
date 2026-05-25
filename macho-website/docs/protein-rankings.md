# Protein Rankings

## 概要

`/supplements-ranking` は、「おすすめプロテイン/クレアチン/プレワークアウト」を表示するページです。プロテインは固定ブランドを優先順で扱い、表示時は Supabase に保存済みのランキングを読み込みます。

## データソース

- 楽天の商品検索 API
- 対象ブランド:
  - `Verifyst`
  - `X-PLOSION`
  - `Gold Standard`

## 更新フロー

1. `src/app/api/cron/protein-rankings/route.ts` が手動更新または Vercel Cron のリクエストを受ける
2. `src/lib/protein-rankings/rakuten-client.ts` が固定3ブランドの商品情報を順番に取得する
3. `src/lib/protein-rankings/extractors.ts` が内容量を抽出し、1kgあたり価格計算に使う
4. `src/lib/protein-rankings/scoring.ts` が固定順位のランキングを作る
5. `src/lib/protein-rankings/repository.ts` が `products` / `product_metrics` / `rankings` に保存する
6. 更新成功後に `/supplements-ranking` を再生成する

## スコア方針

### おすすめプロテイン

- 固定順:
  1. `Verifyst`
  2. `X-PLOSION`
  3. `Gold Standard`
- 各ブランドについて、取得できた商品の中から代表商品を1件採用する
- 取得できないブランドは楽天検索導線のフォールバック行を作る
- 表示名、コメント、美味しさ、成分評価は固定表示にする
- 現在のページでは上記3ブランドを表示する

## 表示方針

- 商品名は固定表示:
  - `Verifyst（ベリフィスト）`
  - `X-PLOSION（エクスプロージョン）`
  - `Gold Standard（ゴールドスタンダード）`
- コメントは固定表示
- `レビュー` は `4.48点/5点` 形式
- `1kgあたり` は取得した価格と内容量から計算
- `美味しさ` と `成分` は `◎ / 〇 / △` で固定表示
- クレアチンは `INNOCECT` と `Nature In` の固定 TOP2
- プレワークアウトは `PRE-X` の固定表示

## 運用メモ

- 必須 env:
  - `RAKUTEN_APPLICATION_ID`
  - `RAKUTEN_ACCESS_KEY`
  - `RAKUTEN_AFFILIATE_ID`
  - `CRON_SECRET`
  - Supabase 接続情報
- Vercel Cron は週1回、日曜18:00 UTC（月曜03:00 JST）に実行する
- 手動実行:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.machoda.com/api/cron/protein-rankings
```
