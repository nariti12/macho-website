# macho-face2 v1 integration

## Source and delivery

- Canonical local source: `assets/character-ip/macho-face2/v1` at the repository root.
- Read `README.md`, `IP_USAGE_RULES.md`, and `manifest.json` before changing usage.
- The 12 delivery WebPs and their original manifest/rules are copied unchanged to `public/images/characters/macho-face2/v1/`. Master PNGs and contact sheets are not shipped.
- The copied README describes the canonical package; its `master/`, `delivery/`, and `previews/` paths refer to that source package, not this flattened delivery directory.
- All images are 768 × 1230 with transparency. The verification script checks original SHA-256 hashes, size, and alpha. Do not edit, crop, recompose, stretch, mirror, or split the character.
- Visual revisions must use a new versioned directory and manifest, never overwrite v1 images.

## Homepage

Lv050 replaces the old `/picture/man.png` hero. Next Image declares the source dimensions, responsive `sizes`, `priority`, a fixed aspect ratio, and `object-fit: contain`. The entire image floats by 3px and breathes at scale 1.006 on a four-second loop. `prefers-reduced-motion: reduce` disables it.

The hero sits in its own responsive layout cell; navigation copy and existing colors are unchanged. Only Lv050 is requested on the homepage.

## Clicker evolution

`src/lib/characters/macho-face2.ts` reads the approved stage catalogue from the copied manifest. `getMachoCharacterAsset(level)` selects the nearest approved level at or below a numeric level (37 → 30, 99 → 90).

| Character level | Required lifetime muscle points |
| --- | ---: |
| 1 | 0 |
| 5 | 500 |
| 10 | 5,000 |
| 20 | 25,000 |
| 30 | 100,000 |
| 40 | 1,000,000 |
| 50 | 7,000,000 |
| 60 | 20,000,000 |
| 70 | 70,000,000 |
| 80 | 250,000,000 |
| 90 | 1,000,000,000 |
| 100 | 2,500,000,000 |

Manual evolution is retained. The current and next assets are loaded only after the local save is restored, preventing an unnecessary Lv001 download for returning players. The delivery WebPs are used directly, sharing URLs between the main character, preview, and preload. The old image stays visible until the new image loads; opacity crossfades for 400ms in an identical rectangle without changing scale or position. Reduced-motion and reduced-effects modes disable the fade.

Save envelope v3 migrates v1/v2's old 20-stage indices using each old stage's earned threshold. The storage key is unchanged. Currency, buildings, achievements, and other save data are retained; migration is idempotent. Old stages 18 and 19 become Lv90 and Lv100. Missing stage indices still use lifetime points as before.

## Verification

```sh
npm run check:macho-character-assets
npm run test:macho-clicker-unit
npm run build
npm run start -- --hostname 127.0.0.1 --port 3107
# In another terminal, after the server is ready:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 npx playwright test e2e/macho-character.spec.ts e2e/macho-clicker.spec.ts
```

Browser tests exercise homepage layouts at 320, 390, 768, and 1440px; game layouts including short phones and landscape; all 12 evolution transitions; asset request limits; and reduced motion. Screenshots are written to `test-results/character/` and `test-results/visual/` (not committed).

### Verification record — 2026-08-26

- All 12 original WebP hashes, dimensions, and alpha channels verified.
- ESLint and production `npm run build` succeeded.
- All 48 tests passed against the local production server (character, economy/save, and existing gameplay suites).
- Desktop/mobile homepage and game Lv1/Lv50/Lv100 screenshots were visually inspected; whole bodies and Lv100 wings/feet fit without overlapping copy.
- The localhost server is for QA only; this record does not certify deployment status.
