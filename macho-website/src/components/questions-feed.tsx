"use client";

import Image from "next/image";
import { useState } from "react";

import type { PublishedQuestion } from "@/lib/questions";

const INITIAL_VISIBLE_COUNT = 10;

const formatPublishedDate = (value: string) =>
  new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export function QuestionsFeed({
  questions,
  profileImageSrc,
}: {
  questions: PublishedQuestion[];
  profileImageSrc: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const visibleQuestions = questions.slice(0, visibleCount);
  const hasMore = visibleCount < questions.length;

  return (
    <section className="mt-14 sm:mt-20" aria-labelledby="answered-questions-heading">
      <div className="mb-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#FF8A23]">
          Questions &amp; Answers
        </p>
        <h2
          id="answered-questions-heading"
          className="mt-2 text-2xl font-bold text-[#7C2D12] sm:text-3xl"
        >
          マチョ田の回答
        </h2>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-[28px] border border-white/70 bg-white/80 px-6 py-12 text-center shadow-lg">
          <p className="text-lg font-bold text-[#7C2D12]">まだ公開された回答はありません</p>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            最初の質問を送って、マチョ田の回答を待ってみよう！
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {visibleQuestions.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[28px] border border-[#FFE0BF] bg-white shadow-[0_22px_65px_-34px_rgba(124,45,18,0.5)]"
            >
              <div className="relative bg-[#FFF2E4] px-5 py-6 sm:px-8">
                <span className="mb-3 inline-flex rounded-full bg-[#FF8A23] px-3 py-1 text-xs font-bold text-white">
                  匿名の質問
                </span>
                <p className="whitespace-pre-wrap break-words text-base font-semibold leading-8 text-[#6B2A16] sm:text-lg">
                  {item.question}
                </p>
                <span
                  className="absolute -bottom-3 left-10 h-6 w-6 rotate-45 bg-[#FFF2E4]"
                  aria-hidden="true"
                />
              </div>

              <div className="px-5 pb-6 pt-8 sm:px-8 sm:pb-8">
                <div className="flex items-start gap-4">
                  <Image
                    src={profileImageSrc}
                    alt="マチョ田のプロフィール写真"
                    width={56}
                    height={56}
                    className="h-12 w-12 shrink-0 rounded-2xl border-2 border-[#FFE0BF] bg-white object-cover sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#7C2D12]">マチョ田の回答</p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 sm:text-base sm:leading-8">
                      {item.answer}
                    </p>
                    <time
                      dateTime={item.publishedAt}
                      className="mt-4 block text-right text-xs text-gray-400"
                    >
                      {formatPublishedDate(item.publishedAt)}
                    </time>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-9 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}
            className="rounded-full border-2 border-[#FF8A23] bg-white px-8 py-3 text-sm font-bold text-[#C2410C] transition hover:bg-[#FFF2E4]"
          >
            もっと見る
          </button>
        </div>
      ) : null}

      <div className="mt-12 text-center">
        <a
          href="#question-form"
          className="inline-flex rounded-full bg-[#7C2D12] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#5F210E]"
        >
          マチョ田に匿名で質問する
        </a>
      </div>
    </section>
  );
}
