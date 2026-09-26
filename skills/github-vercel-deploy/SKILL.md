---
name: github-vercel-deploy
description: GitHub 連携の Vercel サイトを本番へ反映し、対象コミットと公開画面を確認するときに使う。コード変更や本番デプロイの依頼に適用する。
---

# GitHub Vercel Deploy

このリポジトリでは Git ルートが `macho/`、Next.js アプリが `macho-website/` にある。Vercel のプロジェクト情報は `macho-website/.vercel/project.json` にある。

## 本番反映

1. `git status --short`、現在のブランチ、`origin/main` との差分、Vercel の接続先を確認する。別作業の未コミット変更を巻き込まない。
2. 変更対象のファイルを明示してステージする。画像・マイグレーション・参照先の素材・削除ファイルも確認し、`.env.local` や鍵を除外する。`git add .` は使わない。
3. `macho-website/` で対象の lint、ゲームの動作テスト、`npm run build` を実行する。DB 変更があれば適用状況と本番の環境変数を確認する。
4. `origin/main` に今回と無関係な差分やブランチの分岐がある場合、今回のコミットだけを `origin/main` から作った作業ブランチへ移す。既存作業をリセットしない。
5. ユーザーが本番反映を依頼している場合に、確認済みのコミットを `main` へ push する。push 前に `git diff --cached --stat` とコミット内容を確認する。
6. GitHub 連携による Vercel の本番デプロイを追い、Source SHA、ビルド結果、本番 URL の主要画面と API 応答を確認する。必要な環境変数や外部サービスの接続エラーを切り分ける。

一時的な失敗は原因を確認してから修正する。無制限に再 push や再デプロイを繰り返さない。

## 報告

ブランチ、コミット SHA、Vercel の結果と URL、確認した画面・テスト、残る外部サービスの制約を簡潔に伝える。
