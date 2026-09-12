import type { Metadata } from "next";
import Link from "next/link";

import { TorechaDocument } from "@/components/torecha-page-shell";
import { buildUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "トレチャ サポート",
  description: "トレチャの使い方、オンラインバックアップ、アカウント削除、お問い合わせの案内です。",
  alternates: { canonical: buildUrl("/apps/torecha/support") },
};

export default function TorechaSupportPage() {
  return (
    <TorechaDocument title="サポート" lead="トレチャの設定、データ、アカウントについてのご案内です。">
      <section><h2>位置情報とジムの自動記録</h2><p>ジムへの入退場をアプリを閉じている間も記録するには、iPhoneの「設定」からトレチャの位置情報を「常に」に設定し、正確な位置情報を有効にしてください。</p></section>
      <section><h2>オンラインバックアップ</h2><p>設定画面の「オンラインバックアップ」からAppleまたはGoogleでログインすると、トレチャ Plusでバックアップを利用できます。復元すると端末内の対象記録がクラウド上の記録で置き換わります。写真ファイル本体は復元されません。</p></section>
      <section><h2>アカウントを削除する</h2><ol className="space-y-2 pl-5 [&_li]:list-decimal"><li>トレチャを開きます。</li><li>ホーム画面の設定を開きます。</li><li>「オンラインバックアップ」を開きます。</li><li>「アカウントとクラウドデータを削除」を選択します。</li><li>本人確認を完了し、削除を確定します。</li></ol><p className="mt-3">アカウント削除ではクラウドデータを削除します。端末内の記録は残り、App Storeのサブスクリプションは自動解約されません。</p></section>
      <section><h2>サブスクリプションの解約</h2><p>iPhoneの「設定」→ Apple Account →「サブスクリプション」からトレチャを選択して解約できます。</p></section>
      <section><h2>お問い合わせ</h2><p>解決しない場合は、利用端末、iOSバージョン、発生した操作を添えて<Link href="/contact" className="font-bold text-[#ED1C24] underline">お問い合わせフォーム</Link>からご連絡ください。</p></section>
    </TorechaDocument>
  );
}
