import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function PrivacyPolicyPage() {
  const profileImageSrc = "/picture/ore.png";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FCC081" }}>
      <SiteHeader profileImageSrc={profileImageSrc} />
      <main className="px-6 pb-20 pt-24 text-gray-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-[32px] bg-white/95 p-10 shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
          <p className="text-sm text-gray-600">
            本ページは現在準備中です。正式なプライバシーポリシーは整い次第公開いたします。
          </p>
          <div className="mt-4 flex justify-start">
            <Link
              href="/"
              className="rounded-full bg-[#FF8A23] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#f57200]"
            >
              トップページへ戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
