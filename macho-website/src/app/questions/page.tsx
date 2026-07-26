import type { Metadata } from "next";
import Image from "next/image";

import { QuestionForm } from "@/components/question-form";
import { QuestionsFeed } from "@/components/questions-feed";
import { SiteHeader } from "@/components/site-header";
import { fetchPublishedQuestions } from "@/lib/questions";
import { buildUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/questions");

export const metadata: Metadata = {
  title: "マチョ田の質問箱｜匿名で質問する",
  description:
    "マチョ田に筋トレや食事などの質問を匿名で送れる質問箱です。回答済みの質問とマチョ田の回答もまとめて読めます。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "マチョ田の質問箱｜匿名で質問する",
    description:
      "名前やログインなしでマチョ田に匿名質問。回答済みの質問と回答も掲載しています。",
    url: pageUrl,
    type: "website",
    images: [
      {
        url: buildUrl(profileImageSrc),
        width: 800,
        height: 800,
        alt: "マチョ田のプロフィール写真",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "マチョ田の質問箱｜匿名で質問する",
    description: "名前やログインなしでマチョ田に匿名で質問できます。",
    images: [buildUrl(profileImageSrc)],
  },
};

export default async function QuestionsPage() {
  const questions = await fetchPublishedQuestions(50).catch((error) => {
    console.error("Failed to render published questions", error);
    return [];
  });

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <div className="min-h-screen bg-[#FCC081]">
      <SiteHeader profileImageSrc={profileImageSrc} />

      <main className="px-4 pb-24 pt-12 text-gray-900 sm:px-6 sm:pt-16 md:px-12 md:pt-20">
        <div className="mx-auto w-full max-w-3xl">
          <section className="mb-9 text-center sm:mb-12">
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-xl sm:h-36 sm:w-36">
              <Image
                src={profileImageSrc}
                alt="マチョ田のプロフィール写真"
                width={144}
                height={144}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-white">
              Machoda Question Box
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#7C2D12] sm:text-4xl">
              マチョ田の質問箱
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6B2A16] sm:text-base">
              筋トレ、食事、マチョ田について気になることを匿名で聞いてみよう。
              回答した質問は、質問と回答をセットでこのページに掲載します。
            </p>
          </section>

          <QuestionForm turnstileSiteKey={turnstileSiteKey} />
          <QuestionsFeed questions={questions} profileImageSrc={profileImageSrc} />
        </div>
      </main>
    </div>
  );
}
