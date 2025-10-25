# Home screen tweaks (Sept 2025)
- Hero layout uses `lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]` so CTA buttons sit centered while the muscle character (`/picture/man.png`) stands to the side on large screens.
- Buttons enlarged (`py-9 px-12`, `text-2xl`, `rounded-3xl`) with drop shadows for prominence; heading "自分に合った筋トレメニューを一発で" added above.
- Character stays hidden on small viewports (`hidden lg:flex`) but can be changed to `md:flex` if smaller devices should display it.
