"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { TorechaPageShell } from "@/components/torecha-page-shell";
import documents from "@/lib/torecha-legal-translations.json";

function language() {
  const value = new URLSearchParams(window.location.search).get("lang");
  return value === "en" || value === "ko" ? value : "ja";
}
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}
export function LegalLanguageLinks() {
  return <nav aria-label="Language / 言語 / 언어" className="mb-6 flex gap-5 text-sm font-bold underline">
    <a href="?lang=ja" lang="ja" hrefLang="ja">日本語</a>
    <a href="?lang=en" lang="en" hrefLang="en">English</a>
    <a href="?lang=ko" lang="ko" hrefLang="ko">한국어</a>
  </nav>;
}
export function TorechaLocalizedLegal({ page, children }: { page: "privacy" | "terms" | "delete-account"; children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, language, () => "ja" as const);
  if (locale === "ja") return children;
  // Trusted, versioned legal copy; no user or remote HTML is accepted.
  return <TorechaPageShell><main lang={locale} className="px-5 py-10 sm:py-14">
    <article className="mx-auto max-w-4xl border-2 border-[#171717] bg-white p-6 sm:p-10">
      <LegalLanguageLinks />
      <div className="space-y-5 text-base leading-8 text-gray-700 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:pt-5 [&_h2]:text-xl [&_h2]:font-black [&_li]:ml-5 [&_li]:list-disc [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: documents[page][locale] }} />
    </article>
  </main></TorechaPageShell>;
}
