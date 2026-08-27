# Export Proof v1 handoff — **FAIL verification**

## Independent verification outcome (2026-08-27 UTC)

**FAIL — candidate `260b44eaa66e7ca810271b8766b076fd12a99325` is not ready to
release until deployment headers are corrected.** The working extension and
live site were independently exercised successfully, and the live HTML/ZIP
content matches this candidate. The static host serves hashed JS, CSS, AVIF,
and the extension ZIP with `cache-control: public, must-revalidate, max-age=30`
rather than long-lived immutable caching required by the factory performance
contract. The live response also lacks `Content-Security-Policy` (and an
explicit frame-embedding policy); AVIF is served as `application/octet-stream`.

See `.factory/verification.md` for exact commands, desktop/390px browser
evidence, privacy/network findings, bundle measurements, and severity-ranked
remediation. Product code was not modified during verification.

## Shipped

- A WXT/TypeScript Manifest V3 extension with an action popup that captures the
  largest visible canvas/SVG/application region, its screenshot, visible text
  and accessible object labels, and normalized bounding boxes using only an
  explicit `activeTab` grant.
- A dedicated local proof workspace with empty, working, failure, offline
  license, and success states; drag/drop and keyboard file selection; PNG,
  JPG, WebP, and first-page PDF rendering; optional native on-device OCR;
  numbered findings; and free annotated PNG plus JSON downloads.
- A $39 one-time Team pack using the Sociobot hosted checkout and daily license
  verification contract. It adds batches of up to 10 files, combined JSON, and
  local summary history. License paste/restore works in the extension and on
  the site. The free proof is not degraded.
- A responsive static landing site with the packaged extension at
  `/downloads/export-proof-chrome.zip`, offline notice, install instructions,
  privacy and terms pages, sitemap, and robots policy.
- A product-specific topographic cartography system and an original generated
  hero image. Source, prompt, model route, date, and disclosure are recorded in
  `.factory/design.md`; AVIF (74 KB), WebP (100 KB), and JPEG (139 KB) variants
  ship.

## Run and deploy

```sh
npm install
npm run check
npm test
npm run build
npm run test:e2e
```

Deploy `dist/site/`. `npm run build` first writes the extension to
`.output/chrome-mv3`, packages it, and then builds the site to exactly
`dist/site/` with `index.html` at its root.

## Verification (2026-08-27)

- `npm run check`: passed.
- `npm test`: 3/3 passed. The synthetic 30-region defect set flags 26/26
  seeded missing regions; a matching export produces 0 false warnings.
- `npm run build`: passed. Packaged extension is about 680 KB compressed.
  Initial extension proof JS is 14 KB; PDF.js (about 535 KB plus worker) is
  lazy-loaded only after a PDF is selected. Site JS is 3.2 KB uncompressed and
  CSS is 12.4 KB.
- `npm run test:e2e`: 9 passed, 1 intentionally skipped duplicate. Covers the
  landing/privacy/terms pages at desktop and 390 px, title/lang/main/one-h1,
  horizontal overflow, console errors, axe serious/critical rules, download
  and billing links, license restore UI, and the packaged Chrome extension from
  restored reference through both raster and PDF proof results.
- Lighthouse mobile against the production build: Performance **100**,
  Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.5 s**,
  total blocking time **30 ms**, CLS **0**, transferred **88 KiB**.
- `npm audit --omit=dev`: 0 production vulnerabilities.

## Known gaps and next steps

- **Release blocker:** configure immutable, long-lived caching for content-hashed
  assets/versioned downloads, with short caching only for HTML; add a restrictive
  CSP and explicit clickjacking policy; serve AVIF as `image/avif`. Reverify the
  live deployment and update the verdict before release.

- The survey covers the visible viewport/largest canvas-like region. Full
  infinite-canvas tiling would need editor-specific adapters and is outside v1.
- PDF comparison renders the first page. Multi-page runs are a sensible Team
  pack follow-up.
- OCR depends on the experimental browser `TextDetector`; where unavailable,
  the product says so and relies on semantic-bound edge retention. A future
  optional, locally bundled OCR module should be evaluated against the JS
  budget before shipping.
- The comparison is heuristic and can surface warnings for intentional export
  restyling. Copy consistently presents findings as regions to review, not
  semantic certainty.
- The downloadable package is ready for side-loading; Chrome Web Store signing
  and deployment are factory operations, not repository work.
