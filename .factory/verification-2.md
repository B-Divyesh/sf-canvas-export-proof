# Independent verification 2 — **FAIL**

Date: 2026-08-28 UTC  
Candidate: `c792d054faf35c6d40ad3712f4a017b44f294e3d`  
Live URL: <https://canvas-export-proof.sociobot.in>

## Verdict

**FAIL.** The product and deployment otherwise operate correctly, but the
primary keyboard path for adding an export has no usable visible focus
indicator. This violates the factory accessibility acceptance contract and
prevents release approval until fixed.

## Release-blocking defect

### M1 — hidden file input receives keyboard focus, not its visible control

**Severity: medium / release-blocking accessibility defect**

In the extension proof workspace, Tab reaches `#export-file` after the
top-bar controls. It is styled as `position:absolute; width:1px; height:1px;
opacity:0`, while the visible `Choose export` element is a non-focusable
`label`. The focused input's computed outline is 3 px, but its measured box is
only **1 × 1 px** at `(46.6, 634.5)`, so the person using a keyboard cannot see
which control is focused. The visible 48 px upload control never receives
focus. This is reproducible in the packaged MV3 extension built from the
candidate, not merely source inspection.

Evidence: keyboard sequence was Skip link → home link → Capture another page
→ Team pack → `INPUT#export-file` (1 × 1 px) → document body. Other focused
controls had the intended visible 3 px cyan outline.

Suggested repair (not made by this verifier): make the visible upload button
a real, focusable button that activates the input, or style the `label` using
`:focus-within` so the full visible control receives the same high-contrast
focus indication. Re-run keyboard and axe checks at 390 px after the repair.

## Fresh verification evidence

### Clean build and automated checks

- Clean checkout was at the exact candidate SHA; `npm ci` installed 412
  packages successfully.
- `npm run check`: passed.
- `npm test`: passed, **7/7** tests.
- `npm run build`: passed. It generated `.output/chrome-mv3`, the packaged
  extension, and `dist/site/`.
- `npm run test:response-policy`: passed.
- `npm run test:e2e`: passed, **9 passed / 1 intentional desktop-only duplicate
  skip**. The initial fresh invocation could not locate Chromium because the
  lockfile resolves Playwright 1.62.1 while the worker preinstalls 1.58.2
  browsers. Per the work order, `npx playwright install chromium` provisioned
  the matching Chromium v1234; the exact same test command then passed.
- `npm audit --omit=dev --audit-level=high`: **0 production
  vulnerabilities**. The clean full dependency audit reported 11 development
  advisories (1 low, 2 moderate, 5 high, 3 critical).

### End-to-end product checks

- Packaged extension test exercised restored local reference → raster export →
  first-page PDF render → result screen → annotated PNG and JSON controls,
  with no console/page errors and no Axe serious/critical findings.
- Independent boundary/recovery checks in the packaged extension:
  - GIF input reports `Choose a PNG, JPG, WebP, or PDF file.`
  - a 50 MiB + 1 byte file reports `<name> is larger than 50 MB.`
  - immediately selecting a valid JPG recovers to a visible result (`91/100`)
    with both save controls available.
  - entering an invalid Team license triggers only the expected Sociobot
    verification URL and reports that the license is no longer active.
- Empty proof workspace correctly offers capture instructions. In this browser
  the optional native `TextDetector` is unavailable; the OCR toggle is disabled
  and explains that visual checks continue, as required for optional OCR.
- Desktop and 390 × 844 live-site checks: one `h1`, one `main`, `lang=en`, no
  horizontal overflow, no console/page errors, skip link is first Tab target
  with a visible focus outline, and Axe found **0 serious/critical** issues.
  `prefers-reduced-motion: reduce` yields `0.00001s` transition/animation
  durations.

### Privacy, policies, performance, and deployment identity

- Live landing page made no initial third-party requests. Fresh extension
  proof-workspace load made only `chrome-extension://` requests; it made no
  network request without a stored license. OCR is disabled by default and no
  remote OCR dependency is present.
- Live responses for `/`, `/privacy/`, `/terms/`, the AVIF asset, and extension
  ZIP include HSTS, CSP (self plus only the Sociobot billing API in
  `connect-src`), `X-Frame-Options: DENY`, `nosniff`, referrer policy, and the
  restrictive Permissions-Policy. HTML caches for 300 s with revalidation;
  assets and ZIP cache for one year immutable; AVIF has `image/avif`.
- Lighthouse mobile on the live URL: Performance **95**, Accessibility **100**,
  LCP **2,397.65 ms**, TBT **0 ms**, CLS **0**, total transfer **88,678 B**.
  Built landing JS is 2.57 KB, CSS is 12.4 KB; the 74 KB AVIF LCP image is
  within the stated budgets. The 534.6 KB PDF.js chunk and worker are
  dynamically loaded only when a PDF is selected, not on initial proof load.
- Candidate-to-live comparison passed: SHA-256 matched for root, privacy,
  terms, home and legal CSS, and hero AVIF. The live extension ZIP archive
  byte hash differs because ZIP metadata is non-deterministic, but its complete
  unzipped file tree and every file SHA-256 exactly match the fresh candidate
  build.

## Scope notes

This is a browser extension plus static landing page, not a PWA or backend;
there is no service worker/offline shell, server persistence, or health API to
verify. The extension's local storage and optional daily billing verification
were checked in scope. No product code was modified.

## Required next step

Fix M1, then rerun `npm run check`, `npm test`, `npm run build`,
`npm run test:response-policy`, `npm run test:e2e`, and a manual keyboard
focus check on the packaged extension at desktop and 390 px. Until then the
release verdict remains **FAIL**.
