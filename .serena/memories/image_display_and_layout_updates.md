# Homepage imagery & layout
- Static PNGs under `/public/picture` are now served with plain `<img>` tags; `next/image` is reserved only for blog cards to avoid runtime constructor errors.
- Dev server port warning was due to stray Next instances on :3000; kill them before running `npm run dev` to keep port stable.
- Home hero section centered with flex/grid layout; buttons use `text-2xl`, `py-9`, `rounded-3xl`, `max-w-3xl`, `justify-items-center` for 1-page focus before readers scroll to blog.
