# Verification 1 — FAIL

**Candidate:** `260b44eaa66e7ca810271b8766b076fd12a99325` on `main`  
**Live URL:** <https://canvas-export-proof.sociobot.in/>  
**Verified:** 2026-08-27 (UTC)  
**Scope:** independent release QA; product code was not modified.

## Verdict

**FAIL — do not release as-is.** The extension and landing site work in the
tested user journeys, and the deployed content matches the candidate. The
deployment nonetheless fails the supplied performance/response-policy contract:
fingerprinted static assets are returned with only `max-age=30, must-revalidate`,
not long-lived immutable caching. The deployment also supplies no
`Content-Security-Policy` response header. These are deployment fixes; they do
not require a product-code change.

## Release-blocking defects

| Severity | Evidence | Required resolution |
| --- | --- | --- |
| High | `curl -I` on `/assets/home-DhfI0ho6.js`, `/assets/home-O5YYN4Cn.css`, `/assets/topographic-proof-hero.avif`, and `/downloads/export-proof-chrome.zip` all returned `cache-control: public, must-revalidate, max-age=30`. The JS/CSS names are content-hashed. This contradicts the factory requirement for long-lived immutable caching of hashed static assets. | Configure the static host/CDN to return a long immutable TTL (for example, `public, max-age=31536000, immutable`) for hashed assets and versioned downloads; retain a short TTL only for HTML. Re-verify the live headers. |
| Medium | The live HTML response contains HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but no `Content-Security-Policy`, `Permissions-Policy`, or frame-embedding policy. | Add a restrictive CSP suitable for this static site (and an explicit clickjacking policy), then verify that the site and download still work. |
| Low | The AVIF hero is served as `application/octet-stream` while `X-Content-Type-Options: nosniff` is set. Chromium currently displayed it, but this is not the correct media type. | Serve `.avif` as `image/avif`. |

## Evidence collected

### Clean install and local gates

The checkout began clean and at the candidate SHA. `npm ci` completed. Its
full development dependency audit reported 11 advisories; `npm audit --omit=dev`
reported **0 production vulnerabilities**.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 3/3 Vitest tests. Includes a 30-region fixture: 26 seeded missing regions flagged; matching export has 0 warnings. |
| `npm run check` | PASS — `tsc --noEmit`. No lint script exists in `package.json`. |
| `npm run build` | PASS — WXT extension, ZIP package, and `dist/site/` site build all produced. |
| `npm run test:e2e` | PASS after installing the browser revision required by locked Playwright 1.62 — 9 passed, 1 intentionally skipped duplicate extension project. The first run could not start because the container only preinstalled a different Playwright browser revision; this was resolved without changing the repository. |

The build warns that the lazy PDF.js chunk is 534.55 KB, with a 2.38 MB worker.
The initial extension proof chunk is 14.19 KB. The static site's initial JS is
2.57 KB (1.17 KB gzip) and CSS is 12.41 KB (3.46 KB gzip), within the 200 KB
initial-JS and 50 KB CSS budgets. The packaged extension ZIP is 695,119 bytes.

### Independent packaged-extension journey

I extracted the built ZIP into a new temporary Chrome profile and loaded that
extracted package, rather than testing source files. Results:

- Empty state appeared; keyboard Tab reached the skip link first and had a
  visible solid outline.
- A matching 500×340 PNG reference/export scored **100** with no material-loss
  finding.
- A text/plain upload was rejected with supported-file guidance.
- A 51 MB PNG was rejected at the documented 50 MB limit.
- After both failures, a valid blank export recovered correctly and flagged
  **“Text may be missing.”**
- Both annotated PNG and JSON report downloads completed through
  `chrome.downloads`.
- `prefers-reduced-motion: reduce` reduced the spinner animation to `.01ms`
  (computed as `1e-05s`).
- Axe found **0 serious/critical** violations and there were **0 console/page
  errors**.

The repository's Playwright coverage independently exercised restored reference
through raster and first-page PDF comparison, plus all landing/legal pages at
desktop and 390 px.

### Live deployment and browser checks

- The live `index.html` exactly equals `dist/site/index.html`.
- Every file inside the live download ZIP has the same SHA-256 content hash as
  the candidate-built ZIP. The outer ZIP hashes differ only because ZIP entry
  timestamps differ (live 19:36 UTC vs. local rebuild 23:50 UTC).
- Live `/`, `/privacy/`, and `/terms/` each passed desktop and 390×844 mobile
  checks: one `h1`, one `main`, `lang=en`, no horizontal overflow, skip-link
  first keyboard target with visible focus, no console/page errors, and 0 Axe
  serious/critical findings. Mobile license-restore disclosure opened and its
  token input was usable.
- Initial live-page requests were only to `canvas-export-proof.sociobot.in`; no
  analytics, remote font, or third-party script request was observed. Static
  inspection found the only extension network call is the explicit Team-license
  verification request to `https://api.sociobot.in/api/v1/...`; reference
  pixels, export pixels, and free reports remain local.
- Live headers include HTTPS/HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Content-Type-Options: nosniff`. See the blocking header defects above.
- Lighthouse mobile report written from the live site reported Performance **100**
  and Accessibility **100**, LCP **1.2 s**, TBT **0 ms**, CLS **0**, and total
  transfer **86 KiB**. Chrome crashed while Lighthouse attempted its final
  screenshot after the audit artifacts had been generated; the independent
  Playwright page checks above completed normally.

## Notes and next steps

1. Correct the hosting cache and security headers, then re-run the live-header
   and smoke checks before changing this verdict to PASS.
2. Keep the PDF payload lazy-loaded; it is correctly out of the first proof
   screen but remains substantial once a PDF is selected.
3. No service-worker/offline check applies: this is a browser extension plus a
   static companion site, not a PWA.
