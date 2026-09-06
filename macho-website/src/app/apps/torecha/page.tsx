import type { Metadata } from "next";
import Link from "next/link";
import { Bot, ChartNoAxesCombined, Cloud, Dumbbell, MapPinCheck, ShieldCheck } from "lucide-react";

import { TorechaPageShell } from "@/components/torecha-page-shell";
import { buildUrl } from "@/lib/seo";

const pageUrl = buildUrl("/apps/torecha");

export const metadata: Metadata = {
  title: "トレチャ｜筋トレ記録アプリ",
  description: "ジムの入退場、筋トレ、体組成、食事をひとつにつなぐトレーニング記録アプリ「トレチャ」の公式ページです。",
  alternates: { canonical: pageUrl },
  openGraph: { title: "トレチャ｜筋トレ記録アプリ", description: "筋トレの継続を、記録しやすく楽しく。", url: pageUrl, type: "website" },
};

const features = [
  { icon: MapPinCheck, title: "ジムを自動記録", body: "設定したジムへの入退場を位置情報から判定し、滞在時間を記録します。" },
  { icon: Dumbbell, title: "トレーニング記録", body: "重量・回数・メモをセットごとに保存。過去の記録や成長もすぐ確認できます。" },
  { icon: ChartNoAxesCombined, title: "体組成と分析", body: "体重や体脂肪率などを残し、トレーニング記録と一緒に振り返れます。" },
  { icon: Bot, title: "AI食事スキャン", body: "プレミアムでは食事写真からカロリーと主要栄養素の目安を確認できます。" },
  { icon: Cloud, title: "オンラインバックアップ", body: "AppleまたはGoogleでログインし、大切な記録をクラウドへ保存できます。" },
  { icon: ShieldCheck, title: "自分で管理", body: "アプリ内からアカウントとクラウドデータを削除できます。" },
];

export default function TorechaPage() {
  return (
    <TorechaPageShell>
      <main>
        <section className="overflow-hidden bg-[radial-gradient(circle_at_80%_10%,#ff757a_0,transparent_32%),linear-gradient(145deg,#ED1C24_0%,#B8060D_100%)] px-5 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-white/75">TRAINING CHAT</p>
              <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">筋トレの継続を、<br />もっと楽しく。</h1>
              <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/85 sm:text-lg">ジム、トレーニング、体組成、食事の記録をひとつに。キャラクターと一緒に成長できる筋トレ記録アプリ「トレチャ」。</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <span className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#C90B12]">App Storeで近日公開</span>
                <Link href="/apps/torecha/support" className="rounded-full border border-white/50 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10">サポートを見る</Link>
              </div>
            </div>
            <div className="mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center rounded-[34%] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
              <Dumbbell className="h-40 w-40 text-white sm:h-52 sm:w-52" strokeWidth={1.35} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-black tracking-[0.2em] text-[#ED1C24]">FEATURES</p>
            <h2 className="mt-3 text-center text-3xl font-black sm:text-4xl">記録が続くための機能</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_20px_55px_-42px_rgba(0,0,0,0.5)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE8E9] text-[#ED1C24]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center rounded-[28px] bg-[#171717] px-6 py-10 text-center text-white sm:px-10">
            <h2 className="text-2xl font-black">トレチャについてのお問い合わせ</h2>
            <p className="mt-3 text-sm leading-7 text-white/65">不具合、データ、アカウント削除などはサポートページからご確認ください。</p>
            <Link href="/apps/torecha/support" className="mt-6 rounded-full bg-[#ED1C24] px-7 py-3 text-sm font-black transition hover:bg-[#FF343A]">サポートページへ</Link>
          </div>
        </section>
      </main>
    </TorechaPageShell>
  );
}
