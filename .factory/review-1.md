# Review 1 — Compare a canvas with its export — **FAIL**

Date: 2026-09-05 UTC  
Live URL: <https://canvas-export-proof.sociobot.in>  
Implementation candidate: `4bce0e99483010e06f72e28f72843cd3df762db1`  
Documentation candidate: `caddb6ce19a02888b8098fa94acbf0c433324d9c`  
Role: independent reviewer; product code was not changed.

## Verdict

**FAIL — 10 findings, including 4 high-severity findings, and 23 public
claims without the required declared claim tests.** The live extension can
complete a local proof, but it can also report that a changed label is clear.
There is no one-click sample, and the paid checkout returns 404.

## Cold first-screen read

- **Job:** compare an approved live canvas with its exported file and save
  marked evidence of differences.
- **Audience:** people publishing diagrams, pixel canvases, and teaching
  visuals.
- **First action shown:** download the Chrome extension and side-load it.
  There is no sample action.

The audience and possible problems appear in the supporting sentence, but the
headline is the question “Your canvas looked right. Did the export?” It does
not name the job. On the 390 px phone view, the question, supporting sentence,
download link, secondary link, and one combined facts line appear before the
fold. The required one-click sample does not.

## Findings

### R1-H1 — A changed label receives a false all-clear

**Severity: high — core job failure and false public claim**

In a clean profile using the installed live ZIP, I captured a 500 × 340
reference containing `Approved label` and supplied an otherwise identical PNG
containing `Rejected label`. The result was:

```text
Export reads clear
100 / 100
0 notes
1 mapped regions retained their visible structure.
```

A one-page PDF containing `Export proof` against the same reference also
reported `100` and `0 notes`. The live first screen promises to “Catch changed
labels,” and the workspace asks whether the export says the same thing. Native
`TextDetector` was unavailable in current Chromium, so the visual edge-density
heuristic treated different words with similar structure as equivalent. This
is not the real job-to-be-done.

Require an available text comparison path, such as optional bundled local OCR
or an explicit opt-in OCR action with a clear privacy preview and local
fallback. Until then, remove the changed-label and semantic-sameness claims and
never show an unqualified clear result when text was not checked.

### R1-H2 — No one-click sample or isolated demo exists

**Severity: high — required first-use path missing**

There is no “Try it with sample data” action on the landing page. Both `/demo`
and `/?demo=1` return the ordinary landing page with no populated proof, no
`Demo — sample data, nothing is saved` label, no reset, and no “Start for real”
action. `.factory/demo.md` is absent. Therefore realistic sample output,
repeatable reset, separate `demo:` storage, and protection of real data cannot
be tested. Fresh contexts had empty local storage, but that is not a demo
sandbox.

### R1-H3 — The advertised Team pack cannot be bought

**Severity: high — paid user path broken**

The live `Buy Team pack` link points to
`https://api.sociobot.in/api/v1/products/canvas-export-proof/checkout`. A clean
GET returned HTTP 404 with the product-specific response
`{"error":"enabled factory product","status":404}`. This is not the expected
designed 404 for an unknown site route; it breaks the purchase action for the
advertised $39 product. The verify endpoint did respond normally for an
invalid token, and the extension showed “License no longer active.”

### R1-H4 — The required claims manifest is absent

**Severity: high — 23 public claims have no declared test command**

`.factory/claims.json` does not exist, and no test contains an
`@claim:<id>` tag. There were consequently no declared claim commands to run.
The following 23 distinct public claims are contract-untested, even where this
review gathered partial manual evidence:

| # | Public claim |
| ---: | --- |
| 1 | Detects changed labels |
| 2 | Detects clipped ink or crop-boundary ink |
| 3 | Detects missing visible objects |
| 4 | Detects aspect-ratio or frame drift |
| 5 | Captures the largest visible canvas plus semantic labels and bounds |
| 6 | Compares PNG, JPG, and WebP exports |
| 7 | Renders and compares the first page of a PDF |
| 8 | Saves an annotated PNG |
| 9 | Saves a JSON report |
| 10 | Free images and reports never leave the extension |
| 11 | No analytics, remote fonts, or image-processing services run |
| 12 | OCR is off by default and on-device where available |
| 13 | Exactly one reference persists until replacement or removal |
| 14 | Capture uses active-tab access only after the toolbar action and does not bypass authentication |
| 15 | Works as a Chrome/Edge MV3 extension without an account |
| 16 | The free tier provides a complete single-page proof |
| 17 | Team compares up to 10 files in one pass |
| 18 | Team keeps local proof history |
| 19 | Team downloads a combined JSON summary |
| 20 | Team costs $39 once and can be bought and restored |
| 21 | License verification is cached for at most one day |
| 22 | The check takes three minutes |
| 23 | Installation takes two minutes |

Claim 1 and the checkout portion of claim 20 were independently disproved.
The repository's seven unit tests cover only parts of claims 2–4, and its E2E
tests cover parts of claims 6–9. Those tests are not mapped to the public copy,
do not use the required sample entry point, and do not replace the missing
claim contract.

### R1-M1 — The first screen and section copy break the plain-words contract

**Severity: medium**

The question headline does not state the job. The primary action is a download,
not the required sample. The privacy, offline, and price facts are not three
short adjacent lines; instead one line combines free scope, browser packaging,
and account status. The page also uses metaphor or mood labels such as “local
export survey,” “short field procedure,” “Fix the reference,” “Pin the export,”
“Read the field notes,” “Private by construction,” and “Team field pack.” The
extension repeats the survey/field language and uses the banned marketing word
“Unlock.” `.factory/copy-audit.md` is absent.

### R1-M2 — Unknown routes silently render the home page

**Severity: medium**

`/this-route-does-not-exist` returned HTTP 200 and the ordinary home page.
There is no `404.html` or styled not-found route with a way back. This is an
unexpected route result, not a deliberate HTTP 404, and it fails the required
site structure.

### R1-M3 — Required discovery metadata and footer identity are incomplete

**Severity: medium**

The live home page has no canonical link, Open Graph image, Twitter card, or
apple-touch icon. The legal pages also lack canonical and social metadata. The
repository has no required 1200 × 630 social image or SVG favicon. The footer
does not include “Built by Param Factory” or a version/build id. Titles,
descriptions, `lang`, one `h1`, and the `main` landmark do pass on the existing
home, privacy, and terms routes.

### R1-M4 — The documented E2E command is not clean-checkout portable

**Severity: medium**

From a fresh clone at `/tmp/canvas-export-proof-review-z9ZM9Q`, after `npm ci`,
`npm run build`, and installing the lockfile's Chromium revision, the documented
`npm run test:e2e` command finished with **2 failed / 8 passed**. Both packaged
extension projects failed to find the extension because
`tests/e2e/extension.spec.ts` hard-codes
`/work/repo/.output/chrome-mv3` instead of resolving the current checkout.
The same command therefore depends on a particular worker directory and can
test a different tree or no tree at all.

### R1-M5 — Several interactive targets are shorter than 44 CSS pixels

**Severity: medium — accessibility**

At 390 px, the landing-page footer Privacy, Terms, and Source links measured
18 px high, the inline “Terms apply” link measured 15 px high, and the skip
link measured 42 px high. In the extension, the skip link measured 38 px high.
These fail the attached 44 × 44 px target baseline. Focus order and the 3 px
visible focus treatment otherwise passed, including the repaired 48 px
`Choose export` button.

### R1-L1 — A successful one-region result has incorrect grammar

**Severity: low**

The installed extension reports “1 mapped regions retained their visible
structure.” Use the singular form for one region. This appears in the main
success output, not only in test data.

## Verification evidence

### Clean checkout and declared commands

The clean clone resolved to documentation SHA `caddb6c`. The last commit that
changed implementation or tests is `4bce0e9`; later commits only document
verification. `npm ci` installed 412 packages and reported 11 development
dependency advisories. `npm audit --omit=dev --audit-level=high` reported zero
production vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 7/7 Vitest tests |
| `npm run check` | PASS |
| `npm run build` | PASS — extension, ZIP, and `dist/site/` produced |
| `npm run test:response-policy` | PASS |
| `npm run test:e2e` | **FAIL — 2 failed, 8 passed**; see R1-M4 |
| `/opt/fleet/lib/verify-url.sh <live> <evidence>` | PASS — HTTP 200, title/lang/h1/main/alt checks and console clean |
| Declared `.factory/claims.json` commands | **None — manifest missing** |

The packaged proof entry is 14.25 KB. The static site's initial JavaScript is
2,571 bytes (1,189 gzip), CSS is 12,413 bytes (3,467 gzip), and the AVIF hero is
73,963 bytes, all within the relevant transfer budgets. A Lighthouse 12.2.1
mobile run produced Performance 100, Accessibility 100, Best Practices 100,
SEO 100, LCP 1,208 ms, TBT 0 ms, CLS 0, and 88,591 transferred bytes. Chrome
crashed during Lighthouse's final screenshot, after the JSON audit artifact
was written; this runtime error is not concealed.

### Live desktop, phone, accessibility, privacy, and recovery

- Fresh 1440 × 900 desktop and 390 × 844 phone contexts loaded the live site
  with no console/page errors, horizontal overflow, or serious/critical Axe
  findings. First-load requests stayed on the product origin.
- Home, Privacy, and Terms returned 200 with distinct correct titles. Privacy
  and Terms rendered their legal content. Unknown routes failed as described
  in R1-M2.
- The skip link was first in keyboard order and had a visible 3 px focus ring.
  Reduced motion changed smooth scrolling to `auto` and transitions to
  `0.00001s`.
- Setting the browser context offline displayed the stated offline notice;
  returning online recovered to the Privacy route. No offline-reload/PWA claim
  is made, and there is no service worker.
- The live installed extension showed its empty state, managed dialog focus
  and Escape return correctly, and recovered from a text file, corrupt PNG,
  and 50 MB + 1 byte input. A matching raster produced a populated 100/100
  result; a different raster produced a marked warning; PDF rendering ran;
  annotated PNG and JSON downloads completed.
- The extension workspace had no Axe violations or console/page errors at
  desktop or phone widths. Its explicit invalid-license action made only the
  documented Sociobot verification request and handled the invalid verdict.
  With no stored license, no HTTP request was made.

Screenshots and machine output are under `/work/.evidence/`, including
`live-home-desktop.png`, `live-home-phone.png`,
`live-extension-desktop.png`, `live-extension-phone.png`, `verify-url/`, and
`lighthouse.json`.

### Candidate and live identity

Freshly built home, privacy, terms, hashed JavaScript, and CSS content matched
the live deployment byte-for-byte. All 14 files in the unzipped live extension
matched the candidate build byte-for-byte. The ZIP container hashes differ
because the packaging process embeds timestamps; this earlier non-user-facing
verification limitation remains, but content identity is proven.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Verification 1: short asset caching | Fixed — hashed JS, AVIF, and ZIP return one-year immutable caching |
| Verification 1: missing CSP/frame/permissions headers | Fixed — live responses contain the restrictive policies |
| Verification 1: AVIF served as octet-stream | Fixed — live response is `image/avif` |
| Verification 2 M1: invisible upload focus | Fixed — installed button is 136 × 48 px with a 3 px cyan outline; native input has `tabindex=-1` |
| Verification 3: non-deterministic outer ZIP | Still present; all uncompressed files match, so recorded as a verification limitation rather than a user defect |
| Verification 3: literal toolbar popup not automatable | Still a coverage limitation; installed popup/capture code was inspected, while the installed proof workspace and downstream artifact flow were exercised |

## Required next steps

1. Prevent clear results when label content was not actually checked, and add
   realistic text-change, clip, crop, raster, PDF, and recovery fixtures.
2. Add the required isolated sample route, persistent demo label, reset, real
   start action, and `.factory/demo.md`.
3. Register or enable the paid product so the live checkout succeeds.
4. Add `.factory/claims.json` and one tagged sample-based test per public
   claim; remove claims that cannot be proved.
5. Repair the plain-word first screen, 404, metadata/footer, touch targets,
   portable E2E path, copy audit, and singular result copy.

Do not declare PASS until every finding and every untested claim is cleared.
