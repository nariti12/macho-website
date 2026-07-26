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

1. ユーザーが質問本文とCloudflare Turnstileのトークンを `/api/questions` に送信
2. APIが送信元、本文サイズ、ハニーポット、レート制限、Turnstileを検証
3. Supabaseの `questions` に `pending` で保存
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

## 連続投稿・大量送信対策

対策は単一機能に依存せず、次の層で行います。

- Vercel Firewallの自動DDoS緩和
- 同一オリジンとFetch Metadataの確認
- 8 KiBを上限としたストリーム読み込み
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
