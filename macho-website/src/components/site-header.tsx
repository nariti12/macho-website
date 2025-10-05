import Link from "next/link";

interface SiteHeaderProps {
  profileImageSrc: string;
}

export function SiteHeader({ profileImageSrc }: SiteHeaderProps) {
  return (
    <header className="sticky top-4 z-40 flex items-start justify-between px-12 pt-6 pb-4">
      <Link href="/" className="block text-left transition hover:text-[#FFE7C2]">
        <h1 className="text-6xl font-bold leading-none tracking-tight text-white">マチョ田の部屋</h1>
        <p className="text-xl font-medium text-white">〜筋トレについてもう悩まなくていい〜</p>
      </Link>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link
          href="/"
          className="text-base font-semibold uppercase tracking-wide text-white transition hover:text-[#FFE7C2]"
        >
          Home
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-2 text-white transition hover:text-[#FFE7C2]"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-lg transition-transform duration-300 hover:scale-110">
            <img
              src={profileImageSrc}
              alt="Profile"
              className="h-20 w-20 rounded-xl object-cover"
              loading="eager"
            />
          </div>
          <p className="text-base font-semibold">Profile</p>
        </Link>
        <Link
          href="/blog"
          className="text-base font-semibold uppercase tracking-wide text-white transition hover:text-[#FFE7C2]"
        >
          Blog
        </Link>
      </div>
    </header>
  );
}
