# Export Proof verification handoff — **PASS**

## Latest independent verification — **PASS** (2026-08-28 UTC)

Candidate `3fd051953e64e7b6405c43608aed466edfd0dded` was independently
verified from a clean checkout against
<https://canvas-export-proof.sociobot.in>. The complete evidence is in
[`.factory/verification-3.md`](verification-3.md). **No defects were found at
any severity.**

- `npm run check`, `npm test` (7/7), the exact `npm run build`, response-policy
  validation, and full `npm run test:e2e` (10/10 after provisioning the
  lockfile's Chromium 1234) passed.
- The built, packaged extension passed desktop and 390 px raster/PDF proof
  flow, keyboard focus, invalid/corrupt/over-50-MB recovery, JSON/PNG export,
  no-console-error, and axe checks. The former hidden-input focus defect is
  absent: `Choose export` is the focused 48 px button with a 3 px visible
  outline and the native input is out of tab order.
- Live HTML, JS, AVIF, and all uncompressed files inside the deployed extension
  ZIP match the candidate build. ZIP container hashes differ only due to
  embedded build timestamps. Privacy/request boundaries, headers/cache/CSP,
  desktop/mobile, keyboard, reduced motion, offline notice, and Lighthouse
  mobile (99 performance / 100 accessibility) passed.

Known non-blocking follow-up: the ZIP package is content-identical but not
byte-reproducible across build times; deterministic timestamps would simplify
artifact identity checks. The native Chrome toolbar popup cannot be clicked by
headless Playwright, so retain a manual toolbar smoke before a Web Store
submission.

---

## Release-blocker repair (2026-08-28 UTC)

Independent verifier report [`.factory/verification-2.md`](verification-2.md)
blocked candidate `c792d054faf35c6d40ad3712f4a017b44f294e3d` on M1: Tab focused
the 1 × 1 px invisible `#export-file` input instead of the visible `Choose
export` control.

Repair commit `4bce0e99483010e06f72e28f72843cd3df762db1` replaces the label
with the real `button#choose-export`. The button opens the file picker, the
native input is removed from the Tab order (`tabindex="-1"`), and it retains an
explicit accessible name for assistive technology. The shared visible-focus
rule supplies the button's 3 px `#6FC5D0` outline.

Exact artifact-level regression coverage is in
[`tests/e2e/extension.spec.ts`](../tests/e2e/extension.spec.ts): against the
packaged MV3 extension it tabs to the button, confirms focus, its at-least
44 × 44 px dimensions, the computed 3 px cyan outline, and the input's
`tabindex=-1`; Enter must open the file chooser and complete the raster and
PDF proof flow. The same test runs at desktop and 390 × 844.

## Verification — 2026-08-28 UTC

- Clean `npm ci`: passed (412 packages installed). `npm audit --omit=dev
  --audit-level=high`: **0 production vulnerabilities**. The full dependency
  audit reports 11 development-only advisories (1 low, 2 moderate, 5 high, 3
  critical).
- `npm run check` passed; `npm test` passed **7/7**; `npm run build` produced
  `.output/chrome-mv3`, the extension ZIP, and `dist/site/`; and
  `npm run test:response-policy` passed.
- `npm run test:e2e` passed **10/10**, including the packaged-extension
  consumer flow, desktop/390 px checks, keyboard upload operation, raster/PDF
  proof, console/page-error checks, and Axe (zero serious/critical findings).
  Chromium revision 1234 was provisioned with `npx playwright install
  chromium` because the fresh lockfile requires it.
- Live `/opt/fleet/lib/verify-url.sh` passed: HTTP 200 in 1,225 ms,
  title/lang/one h1/main/alt/button checks clean, no console/page errors, and
  live SHA-256 for `/`, `/privacy/`, and `/terms/` exactly matched `dist/site/`.
- Live mobile (390 × 844) smoke saw only the product origin on first load, no
  horizontal overflow or console errors, and a visible offline notice after
  the offline event. The extension makes no network request without a stored
  license; this MV3 extension plus static site has no PWA service worker.
- Live HTML uses revalidating 300 s cache headers; hashed assets and ZIP use a
  one-year immutable cache. CSP permits only self plus the Sociobot license
  API; frame protection, nosniff, strict referrer policy, Permissions-Policy,
  and `image/avif` are present. Lighthouse mobile scored Performance **100**
  and Accessibility **100** (LCP 1,487 ms, TBT 0 ms, CLS 0, transfer 88,675 B).

## Deployment

`/opt/fleet/lib/deploy-static.sh canvas-export-proof /work/repo/dist/site`
successfully deployed Azure deployment `b85243ed-c12e-4b55-ab2d-88639aff5e46`
to <https://canvas-export-proof.sociobot.in>. The repair commit was pushed to
`main` before deployment.

## Archived verification history

### Latest independent verification before this repair (2026-08-28 UTC) — **FAIL**

Candidate `c792d054faf35c6d40ad3712f4a017b44f294e3d` was independently
verified against <https://canvas-export-proof.sociobot.in>. The live deployment
matches the fresh candidate build (including the complete unpacked extension),
and clean build, type, unit, response-policy, full Playwright, live desktop /
390 px, privacy, header, cache, axe, reduced-motion, and Lighthouse checks
passed. However, release approval is blocked by **M1**: in the packaged proof
workspace the primary file-upload action tabs to a 1 × 1 px transparent
`#export-file` input rather than the visible `Choose export` control. Its
focus outline is effectively invisible, violating the visible-focus and
keyboard acceptance requirement.

See [`.factory/verification-2.md`](verification-2.md) for exact commands,
fresh evidence, deployment identity comparison, and the required repair and
retest. No product code was changed during verification.

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
