import type { Metadata } from "next";
import Link from "next/link";

import { TorechaDocument } from "@/components/torecha-page-shell";
import { buildUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "トレチャ 利用規約",
  description: "筋トレ記録アプリ「トレチャ」の利用条件です。",
  alternates: { canonical: buildUrl("/apps/torecha/terms") },
};

export default function TorechaTermsPage() {
  return (
    <TorechaDocument title="利用規約" lead="制定日：2026年9月6日。本規約は、トレチャの利用条件を定めるものです。">
      <section><h2>1. 本規約への同意</h2><p>利用者は、本アプリを利用することで本規約とプライバシーポリシーに同意したものとみなされます。</p></section>
      <section><h2>2. アカウント</h2><p>オンラインバックアップ等のアカウント機能には、AppleまたはGoogleによる本人認証を利用します。利用者は自身の認証情報を適切に管理してください。</p></section>
      <section><h2>3. 記録・AI推定値</h2><p>本アプリが表示する消費量、栄養、RMその他の数値は記録支援のための目安です。医療、診断、治療または専門家の助言を代替するものではありません。</p></section>
      <section><h2>4. 有料機能</h2><p>有料機能の価格、期間および無料体験は購入画面に表示します。サブスクリプションはApp Storeの設定から解約でき、期限までに解約しない場合は自動更新されます。</p></section>
      <section><h2>5. 禁止事項</h2><ul><li>法令または公序良俗に反する行為</li><li>本アプリまたは第三者の権利を侵害する行為</li><li>不正アクセス、解析妨害、機能制限の回避</li><li>第三者になりすます行為</li></ul></section>
      <section><h2>6. サービスの変更・停止</h2><p>保守、障害、法令対応その他必要な場合、事前の通知なく本アプリの全部または一部を変更・停止することがあります。</p></section>
      <section><h2>7. 免責</h2><p>本アプリの利用により生じた損害について、適用法令で認められる範囲で責任を負わないものとします。本アプリの継続提供や記録の完全な保存を保証するものではありません。</p></section>
      <section><h2>8. お問い合わせ</h2><p>本規約に関するお問い合わせは<Link href="/contact" className="font-bold text-[#ED1C24] underline">お問い合わせフォーム</Link>からお願いします。</p></section>
    </TorechaDocument>
  );
}
