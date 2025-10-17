import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { buildUrl } from "@/lib/seo";

import { ContactForm } from "./contact-form";

const profileImageSrc = "/picture/ore.png";
const pageUrl = buildUrl("/contact");

export const metadata: Metadata = {
  title: "お問合せ｜マチョ田の部屋",
  description:
    "マチョ田へのご相談・ご依頼はお問い合わせフォームからお気軽にメッセージをお送りください。",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "お問合せ｜マチョ田の部屋",
    description:
      "マチョ田へのご相談・ご依頼はお問い合わせフォームからお気軽にメッセージをお送りください。",
    url: pageUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "お問合せ｜マチョ田の部屋",
    description:
      "マチョ田へのご相談・ご依頼はお問い合わせフォームからお気軽にメッセージをお送りください。",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-20 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded-[32px] bg-white/95 p-10 shadow-2xl">
          <section className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8A23]">Contact</p>
            <h1 className="mt-2 text-3xl font-bold text-[#7C2D12] md:text-4xl">お問合せ</h1>
            <p className="mt-4 text-sm leading-7 text-gray-700">
              こちらのフォームからお気軽にお問い合わせください。
            </p>
          </section>

          <ContactForm />
        </div>
      </main>
    </div>
  );
}
