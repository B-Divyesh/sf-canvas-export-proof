# Export Proof

Export Proof is a local-first Chrome/Edge extension for people who publish
diagrams, collaborative canvases, pixel art, and teaching visuals. It captures
the visible semantic map of an approved canvas, compares that reference with a
PNG/JPG/WebP or the first page of a PDF, and produces an annotated proof image
plus a machine-readable report.

Live site: <https://canvas-export-proof.sociobot.in>

## What it checks

- Changed canvas/page aspect ratio
- Lost edge detail inside visible text and object bounds
- Large local shape or ink-density changes
- New ink reaching the export boundary
- Missing source text through optional on-device browser OCR, where supported

Warnings are review evidence, not a guarantee of semantic correctness. Export
Proof deliberately does not host or edit canvases, bypass authentication, or
send captured images to a server.

## Install the packaged extension

1. Download `dist/site/downloads/export-proof-chrome.zip` after building.
2. Unzip it.
3. Open `chrome://extensions`, enable Developer mode, and choose **Load
   unpacked**.
4. Select the unzipped directory.

Open the canvas view you trust, select the Export Proof toolbar action, and
choose **Capture current canvas**. In the proof workspace, drop the exported
file and save the annotated PNG or JSON report.

## Develop

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing site
npm run check        # TypeScript
npm test             # deterministic comparison tests
npm run build        # extension + zip + site -> dist/site
npm run test:e2e     # desktop, 390 px, axe, and packaged-extension flow
```

The exact static deployment command is `npm run build`; deploy `dist/site/`.
Its root contains `index.html`, `/privacy/`, `/terms/`, and the extension zip at
`/downloads/export-proof-chrome.zip`.

## Architecture

- **WXT + TypeScript / MV3**: action popup uses `activeTab` to capture only the
  page the user explicitly approves.
- **Local proof workspace**: Canvas APIs compare normalized semantic regions;
  PDF.js is lazy-loaded only for PDF input.
- **Vite static site**: no framework runtime, third-party scripts, analytics,
  or remote fonts.
- **Sociobot billing**: the optional $39 Team pack uses the hosted checkout and
  daily license verification contract. It adds local batch/history workflow;
  the complete single-file proof and both report formats remain free.

## Privacy and limitations

The last reference is stored in extension-local storage. Export pixels remain
in memory; free reports are not retained. License verification is the only
extension network request, and only after a token exists. See
[`site/privacy/index.html`](site/privacy/index.html).

The v1 survey is intentionally conservative: it checks the largest visible
canvas-like region, not content outside the viewport; PDF comparison uses the
first page; and OCR is available only in browsers exposing an on-device
`TextDetector`. Visual region checks continue without OCR.

Visual rationale and generated-asset provenance are in
[`.factory/design.md`](.factory/design.md). Verification and known gaps are in
[`.factory/handoff.md`](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
