import { describe, expect, it } from 'vitest';
import { compareImages } from '../lib/compare';
import type { PixelImage, SemanticItem } from '../lib/types';

function blank(width = 600, height = 500): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) data.set([246, 242, 231, 255], index);
  return { width, height, data };
}

function paintPattern(image: PixelImage, item: SemanticItem, visible = true) {
  const x0 = Math.floor(item.rect.x * image.width);
  const y0 = Math.floor(item.rect.y * image.height);
  const x1 = Math.ceil((item.rect.x + item.rect.width) * image.width);
  const y1 = Math.ceil((item.rect.y + item.rect.height) * image.height);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * image.width + x) * 4;
      const ink = visible && ((x + y) % 5 < 2 || x === x0 || y === y0);
      const tone = ink ? 28 : 246;
      image.data.set([tone, tone, tone, 255], index);
    }
  }
}

function seededFixture(defects = 0) {
  const source = blank();
  const exported = blank();
  const items: SemanticItem[] = Array.from({ length: 30 }, (_, index) => ({
    id: String(index),
    kind: 'text',
    text: `Label ${index + 1}`,
    rect: { x: 0.04 + (index % 5) * 0.19, y: 0.04 + Math.floor(index / 5) * 0.15, width: 0.13, height: 0.07 }
  }));
  items.forEach((item, index) => {
    paintPattern(source, item);
    paintPattern(exported, item, index >= defects);
  });
  return { source, exported, items };
}

describe('export comparison', () => {
  it('flags at least 25 of 30 seeded missing-region defects', () => {
    const fixture = seededFixture(26);
    const report = compareImages({ ...fixture, sourceUrl: 'https://example.test/canvas', sourceTitle: 'Lesson map', exportName: 'lesson.png' });
    expect(report.findings.filter((item) => item.type === 'missing')).toHaveLength(26);
  });

  it('produces fewer than three false warnings on a matching export', () => {
    const fixture = seededFixture();
    const report = compareImages({ ...fixture, sourceUrl: 'https://example.test/canvas', sourceTitle: 'Lesson map', exportName: 'lesson.png' });
    expect(report.findings.length).toBeLessThan(3);
    expect(report.score).toBe(100);
  });

  it('reports a materially changed export frame', () => {
    const fixture = seededFixture();
    fixture.exported = blank(400, 500);
    const report = compareImages({ ...fixture, sourceUrl: 'https://example.test/canvas', sourceTitle: 'Lesson map', exportName: 'lesson.png' });
    expect(report.findings.some((item) => item.type === 'frame')).toBe(true);
  });
});
