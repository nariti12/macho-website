import type { Metadata } from "next";
import Link from "next/link";

import { TorechaDocument } from "@/components/torecha-page-shell";
import { buildUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "トレチャ アカウント削除",
  description: "トレチャのアカウントと関連データの削除方法をご案内します。アプリを利用できない方は、お問い合わせから削除を申請できます。",
  alternates: { canonical: buildUrl("/apps/torecha/delete-account") },
};

const linkStyle = "font-bold text-[#ED1C24] underline underline-offset-4";

export default function TorechaDeleteAccountPage() {
  return (
    <TorechaDocument title="アカウント削除" lead="トレチャのアカウントと関連データの削除をご希望の方へ。アプリをアンインストールした後も、お問い合わせから申請できます。">
      <section>
        <h2>お問い合わせから申請する</h2>
        <p>件名を「トレチャ アカウント削除依頼」とし、本文にログインに使用したメールアドレスとログイン方法（Google または Apple）を記載してください。本人確認後に対応します。</p>
        <Link href="/contact" className="mt-5 inline-flex min-h-12 items-center justify-center border-2 border-[#171717] bg-[#171717] px-5 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED1C24]">お問い合わせへ</Link>
        <p className="mt-4 text-sm">Appleの「メールを非公開」を使用した場合は、登録された転送用アドレスをお知らせください。パスワードや認証コードは送らないでください。</p>
      </section>
      <section>
        <h2>削除する情報と対応期間</h2>
        <p>本人確認後、原則30日以内に対象アカウントと関連データを削除し、完了をお知らせします。</p>
        <ul className="mt-3"><li>ログインアカウント、オンラインバックアップ</li><li>サーバー上のAI処理記録・結果・利用回数の管理情報</li><li>アカウントに紐づくお問い合わせ・ジム追加申請・通知メール</li><li>運営者がRevenueCatで管理する購入状況データ</li></ul>
        <p className="mt-3">削除依頼と対応の記録は、完了後90日以内に削除します。法令などにより保持が必要な情報がある場合は、対象・理由・保持期間を個別にご案内します。</p>
      </section>
      <section>
        <h2>端末内の記録と定期購入</h2>
        <p>端末内の記録は遠隔で削除できません。アプリ内または端末の設定から削除してください。Google・Appleのアカウント自体や、ストアが管理する購入履歴は削除対象に含まれません。</p>
        <p className="mt-3 font-bold">アカウント削除では、トレチャ Plusの定期購入は解約されません。</p>
        <p className="mt-3">購入したストアで別途解約してください。手順は<Link href="/apps/torecha/support" className={linkStyle}>サポート</Link>に記載しています。</p>
      </section>
      <section>
        <h2>アプリ内から削除する場合</h2>
        <p>「設定」→「オンラインバックアップ」→「アカウントとクラウドデータを削除」から操作できます。購入状況管理データや通知メールも含めた削除は、上記のお問い合わせから申請してください。</p>
        <p className="mt-3"><Link href="/apps/torecha/privacy" className={linkStyle}>プライバシーポリシー</Link></p>
      </section>
    </TorechaDocument>
  );
}
