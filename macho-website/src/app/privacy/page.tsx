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
          <p className="text-sm leading-6 text-gray-600">
            本プライバシーポリシーは、当サイト「マチョ田の部屋」（以下、「当サイト」といいます。）における、
            個人情報の取り扱い方針を定めるものです。
          </p>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">1. 個人情報の利用目的</h2>
            <p>
              当サイトでは、お問い合わせやコメント投稿の際に、名前（ハンドルネーム）やメールアドレスなどの個人情報をご入力いただく場合があります。
              これらの個人情報は、質問への回答や必要な情報を電子メールなどでご連絡する場合にのみ利用いたします。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">2. 個人情報の第三者提供について</h2>
            <p>当サイトでは、取得した個人情報を適切に管理し、以下の場合を除き第三者に開示することはありません。</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>本人の同意がある場合</li>
              <li>法令に基づき開示が必要な場合</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">3. アクセス解析ツールについて</h2>
            <p>
              当サイトでは、アクセス解析ツール「Googleアナリティクス」を利用しています。Googleアナリティクスは、トラフィックデータの収集のためにCookieを使用しています。
              このデータは匿名で収集されており、個人を特定するものではありません。Cookieを無効にすることで収集を拒否することが可能です。詳しくはお使いのブラウザ設定をご確認ください。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">4. 広告の配信について</h2>
            <p>
              当サイトでは、第三者配信の広告サービス（例：Googleアドセンス、A8.net、Amazonアソシエイトなど）を利用しています。これらの広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するためにCookieを使用することがあります。
              広告配信の詳細やCookieの無効化設定については、各広告配信事業者のプライバシーポリシーをご確認ください。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">5. Amazonアソシエイトについて</h2>
            <p>
              当サイトは、Amazon.co.jpを宣伝・リンクすることによって紹介料を獲得できるアフィリエイトプログラム「Amazonアソシエイト・プログラム」の参加者です。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">6. 免責事項</h2>
            <p>
              当サイトに掲載する情報は、正確な内容を提供するよう努めていますが、誤情報が含まれる場合や情報が古くなる場合があります。当サイトに掲載された内容によって生じた損害等について、一切の責任を負いかねますのでご了承ください。
            </p>
            <p>
              また、当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報・サービス等についても一切の責任を負いません。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">7. 著作権について</h2>
            <p>
              当サイトに掲載されている文章・画像・動画などの著作物の著作権は、運営者または正当な権利者に帰属します。無断転載や無断使用を禁止します。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">8. プライバシーポリシーの変更</h2>
            <p>
              本プライバシーポリシーの内容は、法令の改正や運営方針の変更により、事前の予告なく変更されることがあります。最新のプライバシーポリシーは当ページにて常に開示いたします。
            </p>
          </section>

          <section className="space-y-3 text-sm leading-6 text-gray-700">
            <h2 className="text-xl font-semibold text-[#7C2D12]">9. お問い合わせ</h2>
            <p>
              本プライバシーポリシーに関するご質問や、個人情報の取り扱いに関するお問い合わせは、当サイト内の
              {" "}
              <Link href="/contact" className="text-[#FF8A23] underline">
                「お問い合わせフォーム」
              </Link>
              よりご連絡をお願いいたします。
            </p>
          </section>

          <div className="mt-6 flex justify-start">
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
