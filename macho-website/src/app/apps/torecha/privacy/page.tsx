import type { Metadata } from "next";
import Link from "next/link";

import { TorechaDocument } from "@/components/torecha-page-shell";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/apps/torecha/privacy");

export const metadata: Metadata = {
  title: "トレチャ プライバシーポリシー",
  description: "筋トレ記録アプリ「トレチャ」における利用者情報の取り扱いについて説明します。",
  alternates: { canonical: pageUrl },
};

export default function TorechaPrivacyPage() {
  return (
    <TorechaDocument title="プライバシーポリシー" lead="制定日：2026年9月6日。トレチャ（以下「本アプリ」）は、利用者の情報を以下の方針に基づき取り扱います。">
      <section><h2>1. 取得する情報</h2><ul><li>AppleまたはGoogleログインに必要な識別情報、メールアドレス等</li><li>トレーニング、体組成、食事、キャラクター、ジム利用に関する記録</li><li>ジムへの入退場判定に必要な位置情報</li><li>AI食事スキャンで利用者が送信した画像</li><li>購入状況、広告識別子、端末・アプリの動作情報</li></ul></section>
      <section><h2>2. 利用目的</h2><p>本アプリの機能提供、ジム入退場の自動記録、オンラインバックアップ、AIによる食事分析、課金状況の確認、広告配信、不具合調査およびセキュリティ確保のために利用します。</p></section>
      <section><h2>3. 外部サービス</h2><p>本アプリはFirebase、Google Sign-In、Sign in with Apple、Google AdMob、RevenueCat、OpenAI等を利用します。各サービスでは、それぞれのプライバシーポリシーに従って情報が処理されます。</p></section>
      <section><h2>4. 位置情報</h2><p>位置情報は、設定したジムへの入退場を判定するために利用します。許可された場合はバックグラウンド中にも判定を行います。利用者はiPhoneの設定から位置情報の許可を変更できます。</p></section>
      <section><h2>5. AI食事スキャン</h2><p>利用者が選択した食事画像は栄養情報を推定するために処理されます。結果は推定値であり、医療上の判断には利用できません。</p></section>
      <section><h2>6. オンラインバックアップ</h2><p>バックアップを有効にすると、アプリの記録をログインアカウントに関連付けてクラウドへ保存します。端末内の写真ファイル本体はバックアップ対象外です。</p></section>
      <section><h2>7. 広告と購入情報</h2><p>無料版ではGoogle AdMobによる広告を表示する場合があります。購入状況の確認にはApp StoreおよびRevenueCatを利用します。</p></section>
      <section><h2>8. 保存期間と削除</h2><p>情報は機能提供または法令上必要な期間保存します。利用者は本アプリのオンラインバックアップ画面からアカウントとクラウドデータを削除できます。端末内の記録とApp Storeの契約は、この操作では削除・解約されません。</p></section>
      <section><h2>9. ポリシーの変更</h2><p>法令や機能の変更に応じ、本ポリシーを改定する場合があります。重要な変更は本アプリまたは本ページでお知らせします。</p></section>
      <section><h2>10. お問い合わせ</h2><p>本ポリシーに関するお問い合わせは、<Link href="/contact" className="font-bold text-[#ED1C24] underline">マチョ田の部屋 お問い合わせフォーム</Link>からお願いします。</p></section>
    </TorechaDocument>
  );
}
