"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";

const MAX_QUESTION_LENGTH = 1_000;

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "light";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function QuestionForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [question, setQuestion] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  const questionLength = Array.from(question).length;
  const captchaRequired = Boolean(turnstileSiteKey);
  const canSubmit =
    question.trim().length > 0 &&
    status !== "submitting" &&
    (!captchaRequired || Boolean(turnstileToken));

  useEffect(() => {
    if (
      !captchaRequired ||
      !turnstileReady ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      turnstileWidgetIdRef.current
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        action: "submit_question",
        theme: "light",
        callback: (token) => {
          setTurnstileToken(token);
          setErrorMessage("");
          setStatus((current) => (current === "error" ? "idle" : current));
        },
        "expired-callback": () => {
          setTurnstileToken("");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setStatus("error");
          setErrorMessage("セキュリティ確認を読み込めませんでした。ページを再読み込みしてください。");
        },
      },
    );

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [captchaRequired, turnstileReady, turnstileSiteKey]);

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  const handleQuestionChange = (value: string) => {
    const normalized = Array.from(value).slice(0, MAX_QUESTION_LENGTH).join("");
    setQuestion(normalized);

    if (status !== "idle") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          website,
          turnstileToken,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          data.error ?? "質問を送信できませんでした。時間をおいてからもう一度お試しください。",
        );
        resetTurnstile();
        return;
      }

      setQuestion("");
      setWebsite("");
      setStatus("success");
      resetTurnstile();
    } catch (error) {
      console.error("Failed to submit anonymous question", error);
      setStatus("error");
      setErrorMessage("通信に失敗しました。接続を確認してもう一度お試しください。");
      resetTurnstile();
    }
  };

  return (
    <section
      id="question-form"
      className="scroll-mt-8 rounded-[28px] border border-[#FFE0BF] bg-white p-5 shadow-[0_24px_70px_-32px_rgba(124,45,18,0.45)] sm:p-8"
      aria-labelledby="question-form-heading"
    >
      {captchaRequired ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setTurnstileReady(true)}
        />
      ) : null}

      <div className="mb-6 text-center">
        <h2
          id="question-form-heading"
          className="text-2xl font-bold text-[#7C2D12] sm:text-3xl"
        >
          マチョ田に匿名で質問してみよう
        </h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <label className="block">
          <span className="sr-only">質問内容</span>
          <textarea
            value={question}
            onChange={(event) => handleQuestionChange(event.target.value)}
            rows={8}
            placeholder="筋トレ、食事、マチョ田について気になることを匿名で質問してください"
            className="w-full resize-y rounded-2xl border border-[#FFD5AB] bg-[#FFF9F2] px-4 py-4 text-base leading-7 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#FF8A23] focus:bg-white focus:ring-4 focus:ring-[#FF8A23]/15"
            aria-describedby="question-character-count"
            required
          />
        </label>

        <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
          <span>回答した質問だけが公開されます</span>
          <span
            id="question-character-count"
            className={questionLength >= MAX_QUESTION_LENGTH ? "font-bold text-[#C2410C]" : ""}
          >
            {questionLength.toLocaleString("ja-JP")} / {MAX_QUESTION_LENGTH.toLocaleString("ja-JP")}
          </span>
        </div>

        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            ウェブサイト
            <input
              type="text"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        {captchaRequired ? (
          <div className="flex min-h-[66px] justify-center">
            <div ref={turnstileContainerRef} />
          </div>
        ) : null}

        <p className="rounded-2xl bg-[#FFF6EB] px-4 py-3 text-xs leading-6 text-gray-600">
          個人情報、誹謗中傷、宣伝・スパムは送信しないでください。送信をもって
          <Link href="/privacy" className="mx-1 font-semibold text-[#C2410C] underline underline-offset-2">
            プライバシーポリシー
          </Link>
          に同意したものとします。
        </p>

        <div aria-live="polite">
          {status === "error" ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {status === "success" ? (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm leading-6 text-green-800">
              質問を受け付けました！マチョ田が回答すると、このページに掲載されます。
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-full bg-[#FF8A23] px-8 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F57200] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {status === "submitting" ? "送信しています..." : "匿名で質問を送る"}
        </button>
      </form>
    </section>
  );
}
