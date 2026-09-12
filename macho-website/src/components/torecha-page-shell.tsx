import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/apps/torecha", label: "アプリ" },
  { href: "/apps/torecha/support", label: "サポート" },
  { href: "/", label: "マチョ田の部屋" },
];

export function TorechaPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="torecha-app-shell min-h-screen bg-[#FCC081] text-[#171717]">
      <header className="sticky top-0 z-40 border-b-2 border-[#171717] bg-[#FCC081]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-3">
          <Link href="/apps/torecha" className="flex shrink-0 items-center gap-3" aria-label="トレチャのアプリ紹介へ">
            <Image src="/apps/torecha/icon.webp" alt="" width={44} height={44} className="h-11 w-11 rounded-[11px]" />
            <span className="text-xl font-black tracking-tight">トレチャ</span>
          </Link>
          <nav className="flex items-center gap-4 overflow-x-auto text-sm font-bold sm:gap-6" aria-label="トレチャページ">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="shrink-0 underline-offset-4 hover:underline">{item.label}</Link>)}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t-2 border-[#171717] bg-[#FCC081] px-5 py-8 text-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <span className="font-bold">© マチョ田の部屋</span>
          <div className="flex flex-wrap gap-5 font-bold">
            <Link href="/apps/torecha/privacy" className="hover:underline">プライバシーポリシー</Link>
            <Link href="/apps/torecha/terms" className="hover:underline">利用規約</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function TorechaDocument({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <TorechaPageShell>
      <main className="px-5 py-10 sm:py-14">
        <article className="mx-auto max-w-4xl border-2 border-[#171717] bg-white p-6 sm:p-10">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-gray-600">{lead}</p>
          <div className="mt-10 space-y-9 text-base leading-8 text-gray-700 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </main>
    </TorechaPageShell>
  );
}
