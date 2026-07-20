"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useDeferredValue, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

const ALL_CATEGORIES = "すべて";

const normalizeText = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const SEARCH_SYNONYM_GROUPS = [
  ["ダイエット", "減量", "痩せる", "痩せたい"],
  ["家トレ", "自宅トレ", "ホームジム"],
  ["お酒", "酒", "アルコール"],
  ["有酸素", "ランニング", "ジョギング"],
  ["腰痛", "腰が痛い", "腰の痛み"],
  ["膝痛", "膝が痛い", "膝の痛み"],
  ["頻度", "回数", "週何回"],
  ["大豆", "ソイ"],
].map((group) => group.map(normalizeText));

const isWithinOneEdit = (left: string, right: string) => {
  if (Math.abs(left.length - right.length) > 1) return false;

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (left.length > right.length) leftIndex += 1;
    else if (right.length > left.length) rightIndex += 1;
    else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }

  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1;
};

const fuzzyIncludes = (searchableText: string, term: string) => {
  if (term.length < 4) return false;
  const compactText = searchableText.replace(/\s+/g, "");
  const compactTerm = term.replace(/\s+/g, "");

  for (const windowLength of [compactTerm.length - 1, compactTerm.length, compactTerm.length + 1]) {
    if (windowLength < 1 || windowLength > compactText.length) continue;
    for (let index = 0; index <= compactText.length - windowLength; index += 1) {
      if (isWithinOneEdit(compactText.slice(index, index + windowLength), compactTerm)) return true;
    }
  }

  return false;
};

const matchesSearchTerm = (searchableText: string, term: string) => {
  const synonymGroup = SEARCH_SYNONYM_GROUPS.find((group) => group.includes(term));
  const alternatives = synonymGroup ?? [term];
  return alternatives.some((alternative) => searchableText.includes(alternative)) || fuzzyIncludes(searchableText, term);
};

const renderAnswer = (answer: string) => {
  const parts = answer.split(/(https:\/\/www\.machoda\.com\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (part === "https://www.machoda.com/intake-calculator") {
      return (
        <Link
          key={`${part}-${index}`}
          href="/intake-calculator"
          className="font-semibold text-[#C2410C] underline underline-offset-4"
        >
          {part}
        </Link>
      );
    }

    if (part === "https://www.machoda.com/training-wear") {
      return (
        <Link
          key={`${part}-${index}`}
          href="/training-wear"
          className="font-semibold text-[#C2410C] underline underline-offset-4"
        >
          {part}
        </Link>
      );
    }

    return part;
  });
};

export function TrainingFaqBrowser({ sections }: { sections: FaqSection[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const deferredQuery = useDeferredValue(query);
  const searchTerms = normalizeText(deferredQuery).trim().split(/\s+/).filter(Boolean);

  const filteredSections = sections
    .filter((section) => selectedCategory === ALL_CATEGORIES || section.title === selectedCategory)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (searchTerms.length === 0) return true;
        const searchableText = normalizeText(`${section.title} ${item.question} ${item.answer}`);
        return searchTerms.every((term) => matchesSearchTerm(searchableText, term));
      }),
    }))
    .filter((section) => section.items.length > 0);

  const totalCount = sections.reduce((count, section) => count + section.items.length, 0);
  const resultCount = filteredSections.reduce((count, section) => count + section.items.length, 0);
  const isFiltering = query.trim().length > 0 || selectedCategory !== ALL_CATEGORIES;

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory(ALL_CATEGORIES);
  };

  return (
    <>
      <section className="rounded-[28px] bg-white/95 p-5 shadow-xl sm:p-6" aria-label="FAQ検索">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#C2410C]"
            size={21}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="質問を検索（例：プロテイン、膝が痛い）"
            aria-label="筋トレFAQを検索"
            className="h-14 w-full rounded-2xl border-2 border-[#F6C982] bg-white py-3 pl-12 pr-12 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#FF8A23] focus:ring-4 focus:ring-[#FF8A23]/15"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="検索文字を消去"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-[#FFF1DF] hover:text-[#C2410C]"
            >
              <X aria-hidden="true" size={19} />
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="カテゴリで絞り込む">
          {[ALL_CATEGORIES, ...sections.map((section) => section.title)].map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={isSelected}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? "bg-[#FF8A23] text-white shadow-sm"
                    : "bg-[#FFF4E7] text-[#9A3412] hover:bg-[#FFE7C2]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600" aria-live="polite">
          <p>
            {isFiltering ? (
              <>
                <span className="font-bold text-[#C2410C]">{resultCount}件</span>見つかりました
              </>
            ) : (
              <>全{totalCount}件の質問</>
            )}
          </p>
          {isFiltering ? (
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-[#C2410C] underline decoration-[#F6C982] underline-offset-4 hover:text-[#9A3412]"
            >
              検索条件をリセット
            </button>
          ) : null}
        </div>
      </section>

      {filteredSections.length > 0 ? (
        filteredSections.map((section) => {
          const sectionIndex = sections.findIndex((candidate) => candidate.title === section.title);
          return (
            <section
              key={section.title}
              id={section.title}
              className="scroll-mt-24 rounded-[32px] bg-white/95 p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF8A23] text-sm font-bold text-white shadow-lg">
                  {sectionIndex + 1}
                </span>
                <h2 className="text-2xl font-bold text-[#7C2D12] sm:text-3xl">{section.title}</h2>
              </div>

              <div className="grid gap-4">
                {section.items.map((item) => (
                  <article
                    key={item.question}
                    className="rounded-3xl border border-[#FCD27B] bg-[#FFFDF8] p-5 shadow-sm"
                  >
                    <h3 className="flex gap-3 text-base font-bold leading-7 text-[#7C2D12] sm:text-lg">
                      <span className="text-[#FF8A23]">Q.</span>
                      <span>{item.question}</span>
                    </h3>
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 pl-0 text-sm leading-7 text-slate-700 sm:pl-8 sm:text-base">
                      <span className="font-bold text-[#C2410C]">A.</span>
                      <p className="whitespace-pre-line">{renderAnswer(item.answer)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <section className="rounded-[32px] bg-white/95 px-6 py-14 text-center shadow-2xl sm:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FFF1DF] text-[#C2410C]">
            <Search aria-hidden="true" size={27} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#7C2D12]">該当する質問が見つかりませんでした</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">言葉を短くするか、別のカテゴリで検索してみてください。</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-full bg-[#FF8A23] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E87512]"
          >
            すべての質問を表示
          </button>
        </section>
      )}
    </>
  );
}
