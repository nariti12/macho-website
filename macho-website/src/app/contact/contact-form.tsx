"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

const initialFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status !== "idle") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(data.error ?? "送信に失敗しました。時間をおいて再度お試しください。");
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm(initialFormState);
    } catch (error) {
      console.error("Failed to submit inquiry", error);
      setErrorMessage("予期せぬエラーが発生しました。時間をおいて再度お試しください。");
      setStatus("error");
    }
  };

  return (
    <section className="rounded-3xl border border-[#FFE7C2] bg-[#FFF6EB] p-8 shadow-inner">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-left text-sm text-[#7C2D12]">
            お名前
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="マチョ田 太郎"
              className="rounded-2xl border border-[#FFE7C2] bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#FF8A23] focus:ring-2 focus:ring-[#FF8A23]/50"
            />
          </label>
          <label className="flex flex-col gap-2 text-left text-sm text-[#7C2D12]">
            メールアドレス
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@example.com"
              required
              className="rounded-2xl border border-[#FFE7C2] bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#FF8A23] focus:ring-2 focus:ring-[#FF8A23]/50"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-left text-sm text-[#7C2D12]">
            件名
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="お問い合わせの内容"
              className="rounded-2xl border border-[#FFE7C2] bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#FF8A23] focus:ring-2 focus:ring-[#FF8A23]/50"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-left text-sm text-[#7C2D12]">
            メッセージ
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="お問い合わせ内容をご記入ください"
              required
              rows={6}
              className="rounded-2xl border border-[#FFE7C2] bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#FF8A23] focus:ring-2 focus:ring-[#FF8A23]/50"
            />
          </label>
        </div>

        {status === "error" && (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {status === "success" && (
          <p className="rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            送信が完了しました。確認後、追ってご連絡いたします。
          </p>
        )}

        <button
          type="submit"
          className="mx-auto mt-4 inline-flex items-center justify-center rounded-full bg-[#FF8A23] px-10 py-3 text-base font-semibold text-white transition hover:bg-[#f57200] disabled:cursor-not-allowed disabled:bg-[#FF8A23]/60"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "送信中..." : "送信する"}
        </button>
      </form>
    </section>
  );
}
