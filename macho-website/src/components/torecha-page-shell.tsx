import Link from "next/link";
import { Dumbbell } from "lucide-react";

const navigation = [
  { href: "/apps/torecha", label: "アプリ紹介" },
  { href: "/apps/torecha/support", label: "サポート" },
  { href: "/apps/torecha/privacy", label: "プライバシー" },
  { href: "/apps/torecha/terms", label: "利用規約" },
];

export function TorechaPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="torecha-app-shell min-h-screen bg-[#F6F6F8] text-[#171717]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/apps/torecha" className="flex items-center gap-3" aria-label="トレチャ アプリ紹介へ">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#ED1C24] text-white shadow-sm">
              <Dumbbell className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">トレチャ</span>
              <span className="block text-[10px] font-bold tracking-[0.16em] text-gray-500">TRAINING CHAT</span>
            </span>
          </Link>
          <nav className="flex gap-x-4 gap-y-2 overflow-x-auto text-xs font-bold text-gray-600 sm:text-sm" aria-label="トレチャページ">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="shrink-0 transition hover:text-[#ED1C24]">{item.label}</Link>)}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-black/5 bg-white px-5 py-10 text-center text-xs text-gray-500">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <span>© マチョ田の部屋</span>
          <Link href="/apps/torecha/privacy" className="hover:text-[#ED1C24]">プライバシーポリシー</Link>
          <Link href="/apps/torecha/terms" className="hover:text-[#ED1C24]">利用規約</Link>
          <Link href="/apps/torecha/support" className="hover:text-[#ED1C24]">サポート</Link>
          <Link href="/" className="hover:text-[#ED1C24]">マチョ田の部屋</Link>
        </div>
      </footer>
    </div>
  );
}

export function TorechaDocument({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <TorechaPageShell>
      <main className="px-5 py-12 sm:py-16">
        <article className="mx-auto max-w-4xl rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.35)] sm:p-10">
          <p className="text-xs font-black tracking-[0.18em] text-[#ED1C24]">TORECHA</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">{lead}</p>
          <div className="mt-10 space-y-9 text-sm leading-7 text-gray-700 sm:text-base [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </main>
    </TorechaPageShell>
  );
}
