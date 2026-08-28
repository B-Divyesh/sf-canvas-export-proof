# Independent verification 3 — **PASS**

Date: 2026-08-28 UTC  
Candidate: `3fd051953e64e7b6405c43608aed466edfd0dded`  
Live target: <https://canvas-export-proof.sociobot.in>

## Verdict

**PASS.** This clean, independent verification found no release-blocking,
high, medium, or low severity product defects. The live static deployment and
the downloadable extension contents correspond to the candidate build.

The previous deployment-only concern was rechecked from fresh evidence. The
packaged proof workspace now makes the real, 48 px-or-taller `Choose export`
button the keyboard target; its computed visible focus is a 3 px cyan solid
outline, and the hidden native input has `tabindex=-1`.

## Reproducible local checks

The initially clean checkout was already at the candidate SHA. `npm ci`
installed 412 packages. It reported 11 development dependency advisories;
`npm audit --omit=dev --audit-level=high` reported **0 production
vulnerabilities**.

| Command | Result |
| --- | --- |
| `npm run check` | passed |
| `npm test` | passed, 7/7 |
| `npm run build` | passed; built MV3 output, packaged ZIP, and `dist/site/` |
| `npm run test:response-policy` | passed |
| `npm run test:e2e` | passed, 10/10 (desktop and 390 × 844) |

The first E2E invocation could not locate Playwright Chromium revision 1234
in this disposable environment. Per the work order, I ran `npx playwright
install chromium` and reran the unmodified suite; the second run passed
10/10. This was test-runner setup, not a product failure.

The production build reports a 14.25 KB proof entry chunk and 3.64 KB popup
entry chunk. PDF.js (534.55 KB) and its 2.38 MB worker are dynamically loaded
only after a user selects a PDF; the static site entry is 2.57 KB JS and 12.41
KB CSS. This meets the 200 KB initial-JS and 50 KB CSS budgets. The packaged
extension ZIP is 695,155 bytes.

The unit fixture passed the brief's matching-export and frame-drift cases. I
also independently executed the comparison against 30 missing mapped regions:
it emitted **30 missing-region findings** (score 0), exceeding the brief's
25/30 defect threshold. A matching raster emitted 0 notes.

## Product exercise

I loaded the built, packaged MV3 extension in Chromium, using both the
desktop and 390 px projects. The suite exercised a real raster upload and a
generated one-page PDF through the proof workspace, result rendering, OCR
availability messaging, keyboard upload activation, screenshots, and axe.
It recorded no console or page errors and no serious/critical axe findings.

Additional independent proof-workspace exercise covered:

- Empty state and capture-instructions dialog opened and closed with Enter.
- A byte-identical 500 × 340 PNG reference produced `Export reads clear` and
  `0 notes`; annotated PNG and JSON download actions completed, with JSON
  containing 0 findings.
- Invalid text input displayed `Choose a PNG, JPG, WebP, or PDF file.`
- A corrupt PNG displayed an actionable decode error.
- A 51 MiB PNG displayed the documented over-50-MB error.
- Selecting the valid PNG after every failure returned to the successful
  result, demonstrating recovery.

The extension's first proof-page load made no network request beyond its own
`chrome-extension:` assets and local blob downloads. Source review and the
manifest confirm `activeTab`, `scripting`, local storage, and user-requested
downloads only; the Sociobot verification request is reachable only after a
license token is stored. No analytics, remote fonts, OCR service, or image
upload endpoint exists. The browser toolbar's native popup surface is not
exposed to headless Playwright, so its literal toolbar click was not
automatable; the packaged popup/capture code, `activeTab` permission boundary,
and all downstream capture-to-proof behavior were inspected/tested.

## Live deployment and browser checks

Fresh live SHA-256 comparisons matched local `dist/site/` exactly for `/`,
`/privacy/`, `/terms/`, `assets/home-DhfI0ho6.js`, and the AVIF hero. The
downloaded ZIP's outer SHA-256 differs from a fresh local ZIP because its ZIP
timestamps are `01:31` versus `01:52`; all 17 entries, names, sizes, and
uncompressed SHA-256 values are identical. Thus the deployed extension is the
candidate artifact, despite non-reproducible ZIP metadata.

At 1440 × 900 and 390 × 844, live `/`, `/privacy/`, and `/terms/` each had
one h1, a main landmark, `lang=en`, no horizontal overflow, no console/page
errors, and 0 axe serious/critical findings. On the home page the first Tab
focused the visible skip link (top `12px`); reduced motion computed to
`scroll-behavior: auto`; and dispatching offline displayed the offline notice.
First-load requests were confined to `https://canvas-export-proof.sociobot.in`.

Live headers were HTTP 200 with HTML `public, max-age=300, must-revalidate`;
hashed JS, AVIF, and ZIP `public, max-age=31536000, immutable`; AVIF was
`image/avif`. Every checked response had the restrictive CSP (`self` plus the
explicit Sociobot license API in `connect-src`), `X-Frame-Options: DENY`,
`nosniff`, strict referrer policy, and restrictive Permissions-Policy.

Lighthouse 12.2.1 mobile against the live URL scored Performance **99**,
Accessibility **100**, Best Practices **100**, and SEO **100**. Measured LCP
was **1,357 ms**, TBT **105 ms**, CLS **0**, and total transfer **82,656 B**.

This extension-plus-static-site product has no service worker and does not
claim PWA offline reload; that is appropriate to this artifact class.

## Defects

None found.

## Verification limitations / follow-up

- ZIP byte-for-byte reproducibility is not currently available because the
  packaging step embeds file timestamps. Content-level identity was verified;
  deterministic ZIP timestamps would make future deployment identity checks
  simpler.
- A human Chrome toolbar-action smoke remains worthwhile before a Web Store
  release because Chromium does not expose the browser-action popup surface to
  headless Playwright. This is coverage follow-up, not a defect in the tested
  artifact.
