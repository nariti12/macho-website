# Protein Rankings

## 概要

`/supplements-ranking` は、「おすすめプロテイン TOP5」を表示するページです。固定の定番5ブランドを優先順で表示し、表示時は Supabase に保存済みのランキングだけを読み込み、外部取得は cron 更新時に限定しています。

## データソース

- 楽天の公開ランキングページ
- 失敗時は楽天ランキング API (`period=realtime`)
- genre: `567603`

Amazon は現時点では使いません。公開ページ取得が不安定で、日次運用の失敗要因になりやすいためです。

## 更新フロー

1. `src/app/api/cron/protein-rankings/route.ts` が cron リクエストを受ける
2. `src/lib/protein-rankings/extractors.ts` がソイ / ホエイ、女性向けキーワードを抽出する
3. `src/lib/protein-rankings/filters.ts` が `SAVAS / ザバス`、比較不向き商品、子供向け商品を除外する
4. `src/lib/protein-rankings/mybest-client.ts` が `my-best` の男性向け記事から掲載商品タイトルを拾い、補助加点へ変換する
5. `src/lib/protein-rankings/scoring.ts` がおすすめプロテイン TOP5 を計算する
6. `src/lib/protein-rankings/repository.ts` が `products` / `product_metrics` / `rankings` に保存する
7. cron 成功後に `/supplements-ranking` を `revalidatePath` で再生成する

## スコア方針

### おすすめプロテイン

- 固定順:
  1. `X-PLOSION`
  2. `Gold Standard`
  3. `be LEGEND`
  4. `myprotein`
  5. `WINZONE`
- 各ブランドについて、取得できた商品の中で最も上位の商品を採用する
- 取得できないブランドは楽天検索導線のフォールバック行を作り、TOP5を必ず表示する

## 除外ルール

- `SAVAS / ザバス`
- シェイカー
- プロテインバー
- サンプル / お試し
- `ジュニア / キッズ / 小学生 / 成長期` などの子供向け商品
- 明らかな非プロテイン商品
- レビュー件数が極端に少ない商品

補足:

- おすすめプロテイン TOP5 は定番ブランド一致を優先し、女性向けランキングは現在表示していない

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
