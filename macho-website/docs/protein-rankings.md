# Protein Rankings

## 概要

`/supplements-top3` は、楽天売上ランキングを母集団にした男女別のプロテインランキングページです。表示時は Supabase に保存済みのランキングだけを読み込み、外部取得は cron 更新時に限定しています。

## データソース

- 楽天ランキング API
- genre: `567603`
- period: `daily`

Amazon は現時点では使いません。公開ページ取得が不安定で、日次運用の失敗要因になりやすいためです。

## 更新フロー

1. `src/app/api/cron/protein-rankings/route.ts` が cron リクエストを受ける
2. `src/lib/protein-rankings/rakuten-client.ts` が楽天ランキング API から上位商品を取得し、男性向けの定番ブランド候補を楽天 Item Search API で少数補完する
3. `src/lib/protein-rankings/extractors.ts` が内容量、たんぱく質量、ソイ / ホエイ、女性向けキーワードを抽出する
4. `src/lib/protein-rankings/filters.ts` が `SAVAS / ザバス`、比較不向き商品、子供向け商品を除外する
5. `src/lib/protein-rankings/mybest-client.ts` が `my-best` の男性向け / 女性向け記事から掲載商品タイトルを拾い、補助加点へ変換する
6. `src/lib/protein-rankings/scoring.ts` が男性向け / 女性向けのスコアを計算する
7. `src/lib/protein-rankings/repository.ts` が `products` / `product_metrics` / `rankings` に保存する
8. cron 成功後に `/supplements-top3` を `revalidatePath` で再生成する

## スコア方針

### 男性向け

- 楽天順位: 60%
- レビュー信頼度: 25%
- たんぱく質情報: 10%
- 価格妥当性: 5%

補足:

- `ソイ` は男性向けでは弱く扱う
- `女性` `レディース` 訴求が強い商品は候補から外しやすくする
- `X-PLOSION` `be LEGEND` `Gold Standard` などの定番ブランドは小さく加点する

### 女性向け

- 楽天順位: 55%
- レビュー信頼度: 20%
- 女性向け適合度: 20%
- 価格妥当性: 5%

補足:

- `ソイ` は女性向けで優先
- `女性` `美容` `ダイエット` `置き換え` `鉄` `ビタミン` `乳酸菌` `食物繊維` などを補助的に加点する
- 訴求だけに引っ張られすぎないよう、レビューと売上を主軸に残す

## 除外ルール

- `SAVAS / ザバス`
- シェイカー
- プロテインバー
- サンプル / お試し
- `ジュニア / キッズ / 小学生 / 成長期` などの子供向け商品
- 明らかな非プロテイン商品
- レビュー件数が極端に少ない商品

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
