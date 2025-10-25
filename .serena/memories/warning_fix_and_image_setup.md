## Dev server warning & image imports
- Added `outputFileTracingRoot` = path.join(__dirname, "../") to next.config.ts so `npm run dev` no longer warns about multiple lockfiles.
- profile and character images now imported statically from `public/picture/*.png`; the PNG files were rewritten from base64 strings back into real binaries.
- Image components specify widths via Tailwind (`w-16`, `w-56`) to ensure visibility; buttons centered with `mx-auto` grid.