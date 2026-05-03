import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildUrl } from "@/lib/seo";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/menu");

type TrainingDay = {
  day: string;
  title: string;
  isOff?: boolean;
  exercises?: string[];
};

const weeklyMenu: TrainingDay[] = [
  {
    day: "月曜日",
    title: "オフ",
    isOff: true,
  },
  {
    day: "火曜日",
    title: "背中 + 三頭筋",
    exercises: [
      "デッドリフト 7回 × 5set",
      "ラットプルダウン 9回 × 3set",
      "ケーブルロー 12回 × 3set",
      "トライセプスエクステンション 10回 × 3set",
      "腹筋ローラー 10回 × 3set",
    ],
  },
  {
    day: "水曜日",
    title: "オフ",
    isOff: true,
  },
  {
    day: "木曜日",
    title: "胸 + 二頭筋",
    exercises: [
      "ベンチプレス 9回 × 5set",
      "インクラインダンベルベンチプレス 9回 × 3set",
      "マシンペックフライ 12回 × 3set",
      "インクラインダンベルカール 12回 × 3set",
      "腹筋ローラー 10回 × 3set",
    ],
  },
  {
    day: "金曜日",
    title: "オフ",
    isOff: true,
  },
  {
    day: "土曜日",
    title: "脚 + 肩 + 三頭筋",
    exercises: [
      "スクワット 7回 × 5set",
      "ダンベルショルダープレス 9回 × 3set",
      "ダンベルサイドレイズ 20回 × 3set",
      "ダンベルリアレイズ 15回 × 3set",
      "ケーブルプレスダウン 12回 × 3set",
      "腹筋ローラー 10回 × 3set",
    ],
  },
  {
    day: "日曜日",
    title: "胸 + 二頭筋",
    exercises: [
      "ベンチプレス 9回 × 5set",
      "マシンインクラインプレス 12回 × 3set",
      "ダンベルフライ 12回 × 3set",
      "インクラインダンベルカール 12回 × 3set",
      "腹筋ローラー 10回 × 3set",
    ],
  },
];

export const metadata: Metadata = {
  title: "マチョ田の筋トレメニュー｜マチョ田の部屋",
  description:
    "マチョ田が実際に週4回ジムで行っている筋トレメニュー。胸を週2回鍛える分割法と各種目の回数・セット数を紹介します。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "マチョ田の筋トレメニュー｜マチョ田の部屋",
    description:
      "マチョ田が実際に週4回ジムで行っている筋トレメニュー。胸を週2回鍛える分割法と各種目の回数・セット数を紹介します。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "マチョ田の筋トレメニュー｜マチョ田の部屋",
    description:
      "マチョ田が実際に週4回ジムで行っている筋トレメニュー。胸を週2回鍛える分割法と各種目の回数・セット数を紹介します。",
  },
};

export default function MenuPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-4 pb-20 pt-20 sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="rounded-[32px] bg-white/95 p-8 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-4 text-slate-800">
              <span className="inline-flex w-fit rounded-full bg-[#FFE7C2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                Training Menu
              </span>
              <h1 className="text-3xl font-bold text-[#7C2D12] sm:text-4xl">
                マチョ田の筋トレメニュー
              </h1>
              <div className="max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                <p>
                  マチョ田は、週4回ジムでトレーニングをしています。メニューは分割法で組んでおり、各部位ごとに上部・中部・下部をしっかりと鍛えられるように意識したメニューとなっています。胸については、特に重点的に鍛えているため、週2回は胸トレの日を設けています。また、腹筋ローラーが大好きで、すべてのトレーニング日に取り入れています。トレーニング時間は大体1時間〜1時間30分ぐらいです。
                </p>
              </div>
              <div className="rounded-2xl border border-[#FCD27B] bg-[#FFF7EB] px-4 py-3 text-sm font-semibold leading-6 text-[#9A3412]">
                ※マチョ田は腰痛持ちのため、デッドリフトとスクワットはハーフで実施しています。
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            {weeklyMenu.map((menu) => (
              <article
                key={menu.day}
                className={`rounded-[28px] border p-6 shadow-xl ${
                  menu.isOff
                    ? "border-white/70 bg-white/70"
                    : "border-[#FCD27B] bg-white/95"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#C2410C]">{menu.day}</p>
                    <h2 className="mt-1 text-2xl font-bold text-[#7C2D12]">{menu.title}</h2>
                  </div>
                  {menu.isOff ? (
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                      OFF
                    </span>
                  ) : null}
                </div>

                {menu.exercises ? (
                  <ul className="mt-5 grid gap-3">
                    {menu.exercises.map((exercise) => (
                      <li
                        key={exercise}
                        className="rounded-2xl bg-[#FFF7EB] px-4 py-3 text-sm font-semibold leading-6 text-slate-700"
                      >
                        {exercise}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
