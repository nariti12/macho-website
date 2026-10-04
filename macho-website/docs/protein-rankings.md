# Protein Rankings

## 概要

`/supplements-ranking` は、「おすすめプロテイン/クレアチン/プレワークアウト」を表示するページです。プロテインは固定ブランドを優先順で扱い、表示時は Supabase に保存済みのランキングを読み込みます。

## データソース

- 楽天の商品検索 API `2026-07-01`
- 対象ブランド:
  - `Verifyst`
  - `X-PLOSION`
  - `Gold Standard`

## 更新フロー

1. `src/app/api/cron/protein-rankings/route.ts` が手動更新または Vercel Cron のリクエストを受ける
2. `src/lib/protein-rankings/rakuten-client.ts` が固定3ブランドの商品情報を順番に取得する
3. 商品コード、必須キーワード、指定容量を照合し、容量違い・ソイ/ホエイ違いを除外する
4. `src/lib/protein-rankings/extractors.ts` が内容量を抽出し、1kgあたり価格計算に使う
5. `src/lib/protein-rankings/scoring.ts` が固定順位のランキングを作る
6. `src/lib/protein-rankings/repository.ts` が `products` / `product_metrics` / `rankings` にupsertする
7. 更新成功後に `/supplements-ranking` を再生成する

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
- `参考価格（1kg）` は取得した価格と内容量から計算
- `美味しさ` と `成分` は `◎ / 〇 / △` で固定表示
- クレアチンは `INNOCECT` と `Nature In` の固定 TOP2
- プレワークアウトは1位 `GORILLA MODE BASE（ゴリラモードベース）`、2位 `Kaged Elite（ケージド エリート）` の固定 TOP2
- APIや商品ページの一時障害では既存ランキングを削除せず、最後に正常取得した価格を保持する
- 14日以上更新できていないプロテイン価格は数値を出さず、販売ページで最新価格を確認する表示へ切り替える
- INNOCECTとNature InはAmazon商品ページの通常購入価格を週次キャッシュで取得する
- Amazon価格を取得できない場合は、最後に確認した参考価格を表示する

## 2026-10-04の価格確認

プロテインは本番の手動更新APIから楽天の商品検索APIで再取得し、Supabaseへ保存しました。表示は保存済みの価格と容量から1kgあたりに換算し、取得できない場合だけ参考価格を使います。
クレアチンはAmazonの同一ASINの商品ページで通常購入（`NEW`）の価格を確認しました。定期購入（`SNS`）、クーポン、ポイント還元は含めません。

| 商品 | 容量 | 商品価格 | 1kgあたり | 確認先 |
| --- | --- | --- | --- | --- |
| Verifyst ホエイ | 3kg | 12,053円 | 4,018円 | [楽天](https://item.rakuten.co.jp/verifyst/v00130/) |
| X-PLOSION ホエイ・ミルクチョコレート | 3kg | 13,790円 | 4,597円 | [楽天](https://item.rakuten.co.jp/x-plosion/10000019/) |
| Gold Standard・ストロベリーバナナ | 2.27kg | 14,580円 | 6,423円 | [楽天](https://item.rakuten.co.jp/iherb-official/27513/) |
| INNOCECT クレアチン | 1kg | 2,170円 | 2,170円 | [Amazon](https://www.amazon.co.jp/dp/B0DHTBTPJQ) |
| Nature In クレアチン | 1kg | 2,490円 | 2,490円 | [Amazon](https://www.amazon.co.jp/dp/B0FY5PBSM1) |

クレアチンの最後に確認した参考価格を変更するとキャッシュキーも変わり、以前の価格キャッシュを使わず再取得します。

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
