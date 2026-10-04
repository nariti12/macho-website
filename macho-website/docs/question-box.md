# 匿名質問箱

## 概要

`/questions` は、名前・メールアドレス・ログインなしでマチョ田へ質問を送信できるページです。運営者が回答して `published` に変更した質問だけを、質問と回答のセットで公開します。

プロフィール画像はサイト共通の `public/picture/ore.png` を使用します。

## 画面と導線

- トップページの共通ヘッダーに `/questions` への質問箱CTAを表示します。
  - デスクトップ: `Contact` から間隔を空け、Profileと同じ追従領域に表示
  - モバイル: 画面右下に固定表示
- `/questions` の上部にプロフィール画像、説明、匿名質問フォームを表示します。
- 公開済みの質問は公開日の新しい順で表示します。
- 初期表示は10件で、`もっと見る` ごとに10件追加します。

## 投稿フロー

1. ユーザーが質問本文、任意の写真1枚、Cloudflare Turnstileのトークンを `/api/questions` に送信
2. APIが送信元、本文サイズ、ハニーポット、レート制限、Turnstileを検証
3. 写真があれば検証・再エンコードして非公開Storageへ保存し、Supabaseの `questions` に `pending` で保存
4. `RESEND_API_KEY` が設定されていれば、運営者へ新着通知を送信
5. 運営者がSupabase Dashboardで回答を入力し、`status` を `published` に変更
6. DBトリガーが `answered_at` と `published_at` を設定し、公開一覧へ反映

通知メールが失敗しても、Supabaseへの保存が成功していればユーザーには受付完了を返します。

## 回答・公開手順

Supabase DashboardのTable Editorで `questions` を開きます。

1. `status = pending` の行を選ぶ
2. `answer` に回答を入力
3. 公開する場合は `status` を `published` にして保存
4. 公開しない場合は `rejected`、公開後に取り下げる場合は `archived` に変更

`published` には空の回答を設定できません。未回答質問はブラウザから直接取得できず、質問一覧にも表示されません。

### 写真を付けて回答する

初回のみ `supabase/migrations/20261004090000_add_question_answer_images.sql` を適用します。
`questions.answer_image_url` と、回答写真用の公開Storageバケット `question-answers` が作成されます。

1. Supabase Dashboard → Storage → `question-answers` を開く
2. 公開する写真をアップロードする（JPEG / PNG / WebP、1枚10 MiBまで）
3. 写真のメニューから **Get URL** で公開URLをコピーする
4. Table Editor → `questions` で該当の質問を開く
5. `answer` に回答文、`answer_image_url` にコピーしたURLを入力する
6. `status` を `published` にして保存する
7. `/questions` を開き、回答文と写真が表示されることを確認する

写真は回答文の下に縦横比を保って表示され、タップすると別タブで元の写真を開きます。
画像なしの場合は `answer_image_url` を `NULL` のままにします。公開済みの回答にも写真を追加できます。
ファイル名の末尾は `.jpg` / `.jpeg` / `.png` / `.webp` にしてください。HEICの写真はJPEG等に変換してからアップロードします。
表示できるのは、このSupabaseプロジェクトの `question-answers` バケットにある写真だけです。

このバケットにアップロードした写真はURLを知っている人なら閲覧できます。
公開してよい回答写真だけを置いてください。回答を `archived` にしても写真そのものは残るため、
写真も取り下げる場合はStorageから該当ファイルを削除します。
この公開バケットは運営者の回答写真専用です。ユーザーからの添付写真は、別の非公開バケットに保管します。

### ユーザーが添付した写真を確認する

`20261004110000_add_question_submission_images.sql` により、`questions.question_image_path` と非公開バケット `question-images` を追加します。

- 投稿フォームからJPEG・PNG・WebPの静止画を1枚、3 MiBまで添付できます。プレビューと取り外しが可能です。
- サーバーで実際の画像形式と画素数（最大2400万画素）を検証し、長辺1600px以内のWebPへ変換します。撮影情報・位置情報等のメタデータと元のファイル名は保持しません。
- 運営者はTable Editorの `question_image_path` をコピーし、Storage → `question-images` で同じファイル名を探してプレビューできます。画像付きの質問は通知メールにもその旨を記載します。
- 内容と写真を確認したうえで `answer` を入力し、`status` を `published` にすると、質問文の下に添付写真が表示されます。**質問の公開は添付写真の公開も含みます。**
- 写真を掲載せず質問だけに回答する場合は、公開前に `question_image_path` を `NULL` にします。不要な写真はStorageから削除できます。
- `pending` / `rejected` / `archived` の写真はサイトの画像配信APIから取得できません。非公開バケットへの直接アクセスも許可しません。
- 公開を取り下げると画像配信も停止します。配信レスポンスは `no-store` です。ただし公開中に閲覧者が保存した写真まで取り消すことはできません。
- DB保存に失敗した場合はアップロードした画像を削除します。削除失敗はサーバーログに記録するため、必要に応じて孤立ファイルをStorageから削除します。

既存のCAPTCHAと送信回数制限は画像付き投稿にも適用します。公開画像配信は保存URLを露出せず、`/api/questions/{id}/image` で毎回公開状態を確認します。

画像欄のマイグレーション適用前でも、従来の文字だけの回答は表示できます。

### 画像表示の検証

`npx playwright test --config playwright.questions.config.ts` で、ローカルのSupabase代替サーバーを使って
スマホ・PCの写真表示、タップによる拡大、文字だけの回答、未公開質問の除外、外部画像URLの拒否、
マイグレーション適用前の互換性を確認できます。本番の質問データは変更しません。

## 連続投稿・大量送信対策

対策は単一機能に依存せず、次の層で行います。

- Vercel Firewallの自動DDoS緩和
- 同一オリジンとFetch Metadataの確認
- 8 KiB（JSON）または3 MiB + 32 KiB（画像付きフォーム）を上限としたストリーム読み込み
- 隠し入力によるハニーポット
- Cloudflare Turnstileのサーバー側Siteverify検証
- HMAC化した送信元IPによるSupabaseの原子的レート制限
- 未回答データの非公開とRLS

レート制限値:

| 対象 | 上限 |
| --- | --- |
| 同一送信元のAPI試行 | 1分12回 |
| サイト全体のAPI試行 | 1分240回 |
| 同一送信元の質問受付 | 1分1件 |
| 同一送信元の質問受付 | 1時間5件 |
| 同一送信元の質問受付 | 1日15件 |
| サイト全体の質問受付 | 1分30件 |

IPアドレスはそのまま保存せず、`QUESTION_RATE_LIMIT_SECRET` を使ったHMAC-SHA256だけを保存します。2日を超えたレート制限用バケットは、次回の質問箱API利用時に削除します。

大規模な攻撃が発生した場合は、Vercel DashboardのFirewallからAttack Challenge Modeや `/api/questions` を対象としたWAFルールを追加します。アプリ内レート制限は、Vercelのプラットフォーム保護を置き換えるものではありません。

## Supabase

Migration:

```text
supabase/migrations/20260725090000_add_anonymous_questions.sql
```

追加される主なDB要素:

- `questions`: 質問、回答、公開状態
- `question_rate_limit_buckets`: 短期間の回数制限
- `consume_question_rate_limit`: 原子的に回数を消費するRPC
- `set_question_timestamps`: 公開日時を設定するトリガー

両テーブルはRLSを有効化し、`anon` と `authenticated` から権限を剥奪します。Next.jsサーバーだけが `SUPABASE_SERVICE_ROLE_KEY` を使用します。

## 環境変数

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
QUESTION_NOTIFICATION_EMAIL=
QUESTION_RATE_LIMIT_SECRET=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
TURNSTILE_ALLOWED_HOSTNAMES=www.machoda.com
```

- `QUESTION_RATE_LIMIT_SECRET`: `openssl rand -hex 32` などで生成した32文字以上の推測困難な値
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: ブラウザに表示するTurnstileサイトキー
- `TURNSTILE_SECRET_KEY`: Siteverify専用の秘密キー。ブラウザへ公開しない
- `TURNSTILE_ALLOWED_HOSTNAMES`: Siteverify応答で許可するホスト名。複数の場合はカンマ区切り
- `QUESTION_NOTIFICATION_EMAIL`: 質問通知先。未設定時は既存の運営者メールを使用

本番環境では、レート制限秘密値またはTurnstileキーが未設定の場合、投稿APIは安全のため `503` を返します。

## 確認項目

- 同じ送信元から1分以内に2件送ると2件目が `429` になる
- 不正または再利用済みTurnstileトークンが `403` になる
- `pending` の質問が公開ページに出ない
- `answer` と `published` を設定した質問だけが表示される
- `rejected` / `archived` が表示されない
- 通知失敗時にも保存済み質問が失われない
