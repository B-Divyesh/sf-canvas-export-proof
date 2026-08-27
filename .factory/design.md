# Export Proof visual thesis

## Direction: topographic cartography

Export Proof is a survey instrument for the last mile between a live canvas and
the file that leaves it. The interface borrows the confidence and restraint of
a field map: contour lines reveal drift, coordinate ticks make comparisons
measurable, and vermilion survey marks identify faults. Decoration always
explains the product's function—nothing is a generic gradient flourish.

## Palette

The primary treatment is a light paper map, with a deliberately dark extension
workspace so exported artwork remains visually dominant.

| Token | Light | Dark workspace | Purpose |
| --- | --- | --- | --- |
| paper / background | `#F4F0E6` | `#17211F` | warm survey paper / night field desk |
| surface | `#FFFCF4` | `#202D2A` | raised sheets and controls |
| ink / text | `#162622` | `#F5F0E4` | deep pine, 12+:1 contrast |
| muted | `#52635E` | `#B8C5BF` | supporting copy, 5+:1 contrast |
| contour | `#C8D1BF` | `#40524D` | boundaries and quiet structure |
| signal | `#C63F29` | `#FF8065` | survey flags, primary action |
| signal contrast | `#FFFFFF` | `#17211F` | action labels |
| success | `#1F715A` | `#72D3AF` | verified regions |
| warning | `#9B5E00` | `#F2BC66` | review required |
| danger | `#A82D29` | `#FF9189` | failed comparison |
| coordinate | `#116B79` | `#6FC5D0` | dimensions and measurements |

Color never carries status alone: marks always include an icon, label, or
pattern. The landing page paints its background explicitly in light mode; the
proof workspace uses the dark treatment regardless of OS theme to keep visual
comparison stable.

## Type and spacing

- Display: **Georgia**, a self-host-free system serif with map-title authority.
- Utility/body: **Arial / system sans**, optimized for measurements and dense
  controls. No runtime font request is made.
- Scale: 12, 14, 16, 20, 28, 44–68 px; body copy is never below 16 px.
- Tabular numerals label dimensions and scores.
- A 4 px base grid with primary gaps of 8, 16, 24, 32, 48, and 72 px.
- Reading measure is capped at 68 characters. Control targets are at least
  44×44 px; the phone layout drops ornamental map coordinates and stacks the
  proof panels.

## Interaction grammar and depth

Controls resemble durable field labels rather than floating glass: flat paper
surfaces, one-pixel map rules, and a short offset shadow. Dashed survey frames
mark drop zones. Selecting a file “pins” it to the workspace; findings are
drawn as numbered vermilion rectangles tied to a coordinate list. The primary
journey is always Capture → Compare → Save proof.

Motion is limited to 180–240 ms opacity and transform transitions: a sheet
settles by 6 px when loaded, and findings fade in at their mapped coordinates.
There are no loops. With `prefers-reduced-motion: reduce`, all transforms and
smooth scrolling are removed and state changes are instant.

## Original asset plan

- `assets/src/topographic-proof-source.png`: AI-generated editorial hero
  source showing two map sheets, one accurately traced and one with clipped
  contour labels, connected by a surveyor's comparison frame.
- `public/assets/topographic-proof-hero.webp`: optimized landing-page asset,
  with explicit dimensions and responsive containment. It clarifies the
  compare-and-flag workflow; no UI capability is implied beyond the product.
- Product marks, icons, contour textures, and proof overlays are hand-authored
  in SVG/CSS in the repository.

### Prompt sheet

Use case: `stylized-concept`. Asset: wide landing hero illustration. Subject:
an abstract cartographer's proof table with two overlapping topographic map
sheets of the same imaginary island; the left sheet is clean and complete, the
right contains one visibly clipped contour segment highlighted by a precise
vermilion survey rectangle. World/materials: warm fibrous paper, graphite
contours, brass registration pins, cyan measurement ticks. Light/lens: soft
overhead studio light, crisp orthographic three-quarter view, ample negative
space, no dramatic perspective. Palette words: parchment, deep pine,
vermilion, muted teal, graphite. Style: refined editorial cut-paper and ink,
subtle tactile grain, precise, calm, professional. Avoid: text, letters,
numbers, logos, watermarks, people, hands, devices, UI screenshots, generic
gradients, glossy 3D, illegible symbols.

### Provenance

Generated on 2026-08-27 with the Param Factory Azure image deployment via
`/opt/fleet/lib/gen-image.sh`. Original prompt is stored beside the source in
`assets/src/topographic-proof-source.json`. Generated imagery is original to
this product. The shipped page discloses AI-assisted artwork in its footer.
