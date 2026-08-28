# Export Proof repair handoff — **PASS**

## Release-blocker repair (2026-08-28 UTC)

This repair addresses every release-blocking finding in independent verifier
report `.factory/verification.md` for candidate
`260b44eaa66e7ca810271b8766b076fd12a99325`, while preserving the extension
and landing-site behaviour that already passed.

- Added the Azure Static Web Apps configuration at
  `public/staticwebapp.config.json`; Vite copies it to the deployment root.
  HTML uses `Cache-Control: public, max-age=300, must-revalidate`; `/assets/*`
  and `/downloads/*` use `public, max-age=31536000, immutable`.
- Added a restrictive static-site CSP, `X-Frame-Options: DENY`, a restrictive
  `Permissions-Policy`, existing `nosniff` and referrer policy, and only the
  explicit Sociobot license API in `connect-src`.
- Declared `.avif` as `image/avif` through the Static Web Apps MIME mapping.
- Added exact regression coverage in `tests/deployment-config.test.ts` and an
  artifact-level `npm run test:response-policy` check. They protect the cache,
  CSP/frame, permissions, `nosniff`, and AVIF requirements in both source and
  built output.

Commit `1347e12` was pushed to `main`, built, and deployed to
<https://canvas-export-proof.sociobot.in> using
`/opt/fleet/lib/deploy-static.sh canvas-export-proof /work/repo/dist/site`
(Azure deployment `7866ecd5-bd0a-4f51-aad6-00756c5ab39f`).

Live `curl -I` verification after deployment confirmed:

- `/`: `text/html` with `public, max-age=300, must-revalidate`.
- hashed JS/CSS, the AVIF hero, and `/downloads/export-proof-chrome.zip`:
  `public, max-age=31536000, immutable`.
- hero AVIF: `content-type: image/avif`.
- all checked routes: the CSP, `Permissions-Policy`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, and `Referrer-Policy` are present.
- the deployed extension ZIP exactly matched the local build SHA-256:
  `4ec2557ebf66e64825db18c6b2c96bf4c7871240c244a3dc830932dcaa64ee15`.

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
npm run test:response-policy
npm run test:e2e
```

Deploy `dist/site/`. `npm run build` first writes the extension to
`.output/chrome-mv3`, packages it, and then builds the site to exactly
`dist/site/` with `index.html` at its root.

## Verification (2026-08-28)

- Clean `npm ci`: passed. `npm audit --omit=dev`: 0 production
  vulnerabilities (the full development dependency audit reports 11 advisories).
- `npm run check`: passed.
- `npm test`: 7/7 passed. The synthetic 30-region defect set flags 26/26
  seeded missing regions; a matching export produces 0 false warnings.
- `npm run build`: passed, producing the extension ZIP and `dist/site/`.
  `npm run test:response-policy`: passed against the built Static Web Apps
  configuration.
- Packaged extension is about 680 KB compressed.
  Initial extension proof JS is 14 KB; PDF.js (about 535 KB plus worker) is
  lazy-loaded only after a PDF is selected. Site JS is 3.2 KB uncompressed and
  CSS is 12.4 KB.
- `npm run test:e2e`: 9 passed, 1 intentionally skipped duplicate. Covers the
  landing/privacy/terms pages at desktop and 390 px, title/lang/main/one-h1,
  horizontal overflow, console errors, axe serious/critical rules, download
  and billing links, license restore UI, and the packaged Chrome extension from
  restored reference through both raster and PDF proof results.
- Live browser smoke at desktop and 390×844: both had one `h1`, `main`,
  `lang=en`, no horizontal overflow, the skip link as the first Tab target,
  no console/page errors, no third-party initial requests, and 0 Axe
  serious/critical violations. Toggling offline showed the local offline
  notice; no service worker is required for this extension-plus-static-site
  product.
- `/opt/fleet/lib/verify-url.sh` against the live identity passed: 740 ms
  load, title/lang/main/alt/button checks clean, and no load errors.
- Lighthouse mobile against the live site: Performance **100**, Accessibility
  **100**, Best Practices **100**, SEO **92**; LCP **1.2 s**, total blocking
  time **0 ms**, CLS **0**, transferred **87 KiB**. Chromium crashed only
  during Lighthouse's final full-page screenshot after the audit artifacts had
  been generated; the complete Playwright browser checks above passed.

## Known gaps and next steps

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
