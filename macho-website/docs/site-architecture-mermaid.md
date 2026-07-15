# マチョ田の部屋 Mermaid 構成図

最終更新: 2026-07-15

巨大な1枚図にすると読みづらいため、まず全体像を小さく示し、その下に詳細図を分けています。

## 全体構成

```mermaid
flowchart LR
  user[ユーザー] --> vercel[Vercel<br/>Next.js App Router]

  vercel --> pages[画面ページ<br/>src/app/**/page.tsx]
  vercel --> api[API<br/>src/app/api/**/route.ts]
  vercel --> cron[Vercel Cron]

  pages --> assets[静的アセット<br/>public/]
  pages --> affiliate[外部ECリンク<br/>楽天 / Amazon / iHerb]
  pages --> analytics[GA4<br/>affiliate_click]
  pages --> api

  api --> microcms[microCMS<br/>Blog]
  api --> supabase[(Supabase<br/>DB)]
  api --> resend[Resend<br/>お問い合わせ]
  api --> rakuten[Rakuten API<br/>価格 / サプリ更新]

  cron --> api
```

## 画面ページ構成

```mermaid
flowchart TB
  layout[src/app/layout.tsx<br/>共通レイアウト / SEO / 計測タグ]

  layout --> home["/<br/>トップページ"]
  layout --> blogList["/blog<br/>ブログ一覧"]
  layout --> blogDetail["/blog/[id]<br/>ブログ詳細"]
  layout --> profile["/profile<br/>プロフィール"]
  layout --> menu["/menu<br/>マチョ田の筋トレメニュー"]
  layout --> calculator["/intake-calculator<br/>計算機"]
  layout --> supplements["/supplements-ranking<br/>おすすめサプリ"]
  layout --> shoes["/training-wear<br/>おすすめトレーニングシューズ"]
  layout --> gear["/training-gear<br/>おすすめトレーニングギア"]
  layout --> faq["/training-faq<br/>筋トレFAQ"]
  layout --> clicker["/macho-clicker<br/>マチョクリッカー"]
  layout --> contact["/contact<br/>お問い合わせ"]
  layout --> privacy["/privacy<br/>プライバシーポリシー"]

  home --> homeComponent[src/components/home-page.tsx]
  supplements --> supplementsComponent[src/components/supplements-top-page.tsx]
  clicker --> clickerComponent[src/components/macho-clicker-page.tsx]
  layout --> header[src/components/site-header.tsx]
```

## Blog / CMS 構成

```mermaid
flowchart LR
  home[トップページ<br/>Blog最新表示] --> blogLib[src/lib/blogs.ts<br/>サーバー取得 / 正規化]
  apiBlogs["/api/blogs"] --> blogLib
  blogList["/blog"] --> microcms[microCMS<br/>blogs API]
  blogDetail["/blog/[id]"] --> microcms

  blogLib --> microcms

  microcmsWebhook[microCMS Webhook] --> revalidate["/api/revalidate"]
  revalidate --> nextCache[Next.js Cache<br/>blog-list / blog-detail 再検証]
```

## おすすめサプリ / 価格更新構成

```mermaid
flowchart TB
  supplementsPage["/supplements-ranking"] --> supplementsComponent[src/components/supplements-top-page.tsx]
  supplementsComponent --> supabase[(Supabase)]
  supplementsComponent --> rakutenLink[楽天アフィリエイトリンク]
  supplementsComponent --> amazonLink[Amazonアソシエイトリンク]
  supplementsComponent --> iherbLink[iHerbリンク]

  cron[Vercel Cron<br/>毎週日曜 18:00 UTC] --> cronApi["/api/cron/protein-rankings"]
  manual[手動 curl 実行] --> cronApi

  cronApi --> service[src/lib/protein-rankings/service.ts]
  service --> rakutenClient[src/lib/protein-rankings/rakuten-client.ts]
  service --> extractor[src/lib/protein-rankings/extractors.ts]
  service --> scoring[src/lib/protein-rankings/scoring.ts]
  service --> repository[src/lib/protein-rankings/repository.ts]

  rakutenClient --> rakutenApi[Rakuten API]
  repository --> supabase

  supabase --> products[products]
  supabase --> metrics[product_metrics]
  supabase --> rankings[rankings]
```

## トレーニングシューズ / ギア構成

```mermaid
flowchart TB
  shoes["/training-wear<br/>おすすめトレーニングシューズ"]
  gear["/training-gear<br/>おすすめトレーニングギア"]

  shoes --> staticDataShoes[ページ内の固定ランキング定義]
  gear --> staticDataGear[ページ内の固定ランキング定義]

  staticDataShoes --> priceLib[src/lib/rakuten-price.ts]
  staticDataGear --> priceLib
  priceLib --> rakutenApi[Rakuten API<br/>参考価格取得]

  shoes --> rakutenAffiliate[楽天アフィリエイトリンク]
  shoes --> amazonAffiliate[Amazonアソシエイトリンク]
  gear --> rakutenAffiliate
  gear --> amazonAffiliate

  shoes --> affiliateLink[src/components/affiliate-link.tsx]
  gear --> affiliateLink
  affiliateLink --> ga4[GA4 affiliate_click]

  cronShoes[Vercel Cron<br/>毎週日曜 18:10 UTC] --> shoes
  cronGear[Vercel Cron<br/>毎週日曜 18:20 UTC] --> gear
```

## マチョクリッカー構成

```mermaid
flowchart TB
  clickerPage["/macho-clicker"] --> clickerComponent[src/components/macho-clicker-page.tsx]

  clickerComponent --> localStorage[Browser localStorage<br/>ゲーム進行保存]
  clickerComponent --> assets[public/game/macho-clicker<br/>背景 / アイコン / 進化キャラ / 効果音]
  clickerComponent --> rankingApi["/api/macho-clicker/rankings"]

  rankingApi --> supabase[(Supabase)]
  supabase --> scores[macho_clicker_scores]
```

## お問い合わせ / 計測 / 静的アセット

```mermaid
flowchart LR
  contactPage["/contact"] --> contactApi["/api/contact"]
  contactApi --> resend[Resend<br/>メール送信]

  layout[src/app/layout.tsx] --> ga[Google Analytics]
  layout --> gtm[Google Tag Manager]
  layout --> adsense[Google AdSense]

  productPages[おすすめ商品ページ] --> affiliateLink[affiliate-link.tsx<br/>外部ECクリック計測]
  productPages --> itemList[ItemList JSON-LD]

  pages[各ページ] --> picture[public/picture<br/>プロフィール / 商品補助画像]
  pages --> favicon[public/icon.png<br/>favicon]
```

## 補足

- 画面ルートは `src/app/**/page.tsx`、API は `src/app/api/**/route.ts` に対応しています。
- `/supplements-top3` は旧URL互換用で、現在の表示先は `/supplements-ranking` です。
- サプリDB更新は Vercel Cron から `/api/cron/protein-rankings` を呼び、楽天APIで取得した情報を Supabase に保存します。
- トレーニングシューズとトレーニングギアは静的定義を中心に、楽天URLがある商品の参考価格だけ `rakuten-price.ts` で取得します。
- マチョクリッカーのゲーム進行はブラウザの `localStorage`、ランキングだけ Supabase に保存します。
