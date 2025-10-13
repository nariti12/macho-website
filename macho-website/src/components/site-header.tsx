import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  profileImageSrc: string;
}

export function SiteHeader({ profileImageSrc }: SiteHeaderProps) {
  return (
    <header className="z-40 flex flex-col items-center justify-center gap-3 bg-transparent px-4 pb-2 pt-3 text-center transition-all sm:px-6 md:sticky md:top-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-12 md:pb-4 md:text-left">
      <Link href="/" className="block transition hover:text-[#FFE7C2]">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-6xl">
          マチョ田の部屋
        </h1>
        <p className="mt-1 text-xs font-medium text-white sm:text-sm md:text-xl">
          〜筋トレについてもう悩まなくていい〜
        </p>
      </Link>
      <div className="flex w-full flex-wrap items-center justify-center gap-3 md:w-auto md:flex-col md:items-center md:gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-left text-[#7C2D12] shadow-lg transition hover:scale-[1.02] hover:bg-white md:flex-col md:bg-white md:px-5 md:py-4 md:text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white md:h-24 md:w-24 md:rounded-2xl">
            <Image
              src={profileImageSrc}
              alt="Profile"
              width={80}
              height={80}
              priority
              className="h-10 w-10 rounded-md object-cover md:h-20 md:w-20"
            />
          </div>
          <p className="text-xs font-semibold sm:text-sm md:mt-2 md:text-base md:text-[#7C2D12]">Profile</p>
        </Link>
        <nav className="flex w-full items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wide text-white sm:text-sm md:flex-col md:items-center md:gap-2 md:text-base">
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
