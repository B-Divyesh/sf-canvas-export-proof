import type { Finding, NormalizedRect, PixelImage, ProofReport, SemanticItem } from './types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function luminance(data: Uint8ClampedArray, index: number): number {
  return data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
}

export function edgeDensity(image: PixelImage, rect: NormalizedRect): number {
  const x0 = clamp(Math.floor(rect.x * image.width), 0, image.width - 1);
  const y0 = clamp(Math.floor(rect.y * image.height), 0, image.height - 1);
  const x1 = clamp(Math.ceil((rect.x + rect.width) * image.width), x0 + 1, image.width);
  const y1 = clamp(Math.ceil((rect.y + rect.height) * image.height), y0 + 1, image.height);
  let edges = 0;
  let samples = 0;

  for (let y = y0; y < y1 - 1; y += 2) {
    for (let x = x0; x < x1 - 1; x += 2) {
      const i = (y * image.width + x) * 4;
      const right = (y * image.width + x + 1) * 4;
      const down = ((y + 1) * image.width + x) * 4;
      const delta = Math.abs(luminance(image.data, i) - luminance(image.data, right))
        + Math.abs(luminance(image.data, i) - luminance(image.data, down));
      if (delta > 34) edges += 1;
      samples += 1;
    }
  }
  return samples ? edges / samples : 0;
}

function borderEdgeDensity(image: PixelImage): number {
  const band = 0.025;
  const strips: NormalizedRect[] = [
    { x: 0, y: 0, width: 1, height: band },
    { x: 0, y: 1 - band, width: 1, height: band },
    { x: 0, y: band, width: band, height: 1 - band * 2 },
    { x: 1 - band, y: band, width: band, height: 1 - band * 2 }
  ];
  return strips.reduce((sum, strip) => sum + edgeDensity(image, strip), 0) / strips.length;
}

export type CompareInput = {
  source: PixelImage;
  exported: PixelImage;
  items: SemanticItem[];
  sourceUrl: string;
  sourceTitle: string;
  exportName: string;
};

export function compareImages(input: CompareInput): ProofReport {
  const findings: Finding[] = [];
  const sourceRatio = input.source.width / input.source.height;
  const exportRatio = input.exported.width / input.exported.height;
  const ratioDrift = Math.abs(sourceRatio - exportRatio) / sourceRatio;

  if (ratioDrift > 0.035) {
    findings.push({
      id: 'frame-ratio',
      severity: ratioDrift > 0.1 ? 'error' : 'warning',
      type: 'frame',
      title: 'Export frame changed',
      detail: `The aspect ratio shifted by ${Math.round(ratioDrift * 100)}%. Check crop and page bounds.`
    });
  }

  const stableItems = input.items
    .filter((item) => item.rect.width > 0.006 && item.rect.height > 0.006)
    .slice(0, 160);

  for (const item of stableItems) {
    const sourceEdges = edgeDensity(input.source, item.rect);
    const exportEdges = edgeDensity(input.exported, item.rect);
    if (sourceEdges < 0.012) continue;
    const retention = exportEdges / sourceEdges;
    const label = item.text ? `“${item.text.slice(0, 56)}${item.text.length > 56 ? '…' : ''}”` : 'Visible object';

    if (retention < 0.34) {
      findings.push({
        id: `missing-${item.id}`,
        severity: 'error',
        type: 'missing',
        title: item.kind === 'text' ? 'Text may be missing' : 'Visible object may be missing',
        detail: `${label} retains only ${Math.round(retention * 100)}% of its live-canvas edge detail.`,
        rect: item.rect,
        itemText: item.text
      });
    } else if (retention < 0.56 || retention > 1.9) {
      findings.push({
        id: `changed-${item.id}`,
        severity: 'warning',
        type: 'changed',
        title: item.kind === 'text' ? 'Text shape changed' : 'Object shape changed',
        detail: `${label} has a large layout or ink-density shift (${Math.round(retention * 100)}% detail retained).`,
        rect: item.rect,
        itemText: item.text
      });
    }
  }

  const sourceBorder = borderEdgeDensity(input.source);
  const exportBorder = borderEdgeDensity(input.exported);
  if (exportBorder > 0.075 && exportBorder > sourceBorder * 1.8 + 0.02) {
    findings.push({
      id: 'border-ink',
      severity: 'warning',
      type: 'clipped',
      title: 'Ink reaches the export edge',
      detail: 'New detail touches the outer 2.5% of the export. Inspect the crop for clipped strokes or labels.'
    });
  }

  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.length - errors;
  return {
    createdAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    exportName: input.exportName,
    score: clamp(100 - errors * 24 - warnings * 9, 0, 100),
    sourceSize: { width: input.source.width, height: input.source.height },
    exportSize: { width: input.exported.width, height: input.exported.height },
    comparedItems: stableItems.length,
    findings
  };
}
