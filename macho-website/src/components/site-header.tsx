import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  profileImageSrc: string;
}

export function SiteHeader({ profileImageSrc }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex flex-col items-center justify-between gap-4 bg-transparent px-4 pt-4 pb-3 text-center transition-all md:top-4 md:flex-row md:items-start md:gap-6 md:px-12 md:pb-4 md:text-left">
      <Link
        href="/"
        className="block transition hover:text-[#FFE7C2]"
      >
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
          マチョ田の部屋
        </h1>
        <p className="mt-1 text-sm font-medium text-white sm:text-base md:text-xl">
          〜筋トレについてもう悩まなくていい〜
        </p>
      </Link>
      <div className="flex w-full flex-wrap items-center justify-center gap-4 md:w-auto md:flex-col md:items-center md:gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2 text-left text-[#7C2D12] shadow-lg transition hover:scale-[1.02] hover:bg-white md:flex-col md:bg-white md:px-5 md:py-4 md:text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white md:h-24 md:w-24 md:rounded-2xl">
            <Image
              src={profileImageSrc}
              alt="Profile"
              width={80}
              height={80}
              priority
              className="h-12 w-12 rounded-lg object-cover md:h-20 md:w-20"
            />
          </div>
          <p className="text-sm font-semibold md:mt-2 md:text-base md:text-[#7C2D12]">Profile</p>
        </Link>
        <nav className="flex w-full items-center justify-center gap-3 text-sm font-semibold uppercase tracking-wide text-white md:flex-col md:gap-2 md:text-base">
          <Link href="/" className="transition hover:text-[#FFE7C2]">
            Home
          </Link>
          <Link href="/blog" className="transition hover:text-[#FFE7C2]">
            Blog
          </Link>
          <Link href="/contact" className="transition hover:text-[#FFE7C2]">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
