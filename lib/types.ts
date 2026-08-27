export type NormalizedRect = { x: number; y: number; width: number; height: number };

export type SemanticItem = {
  id: string;
  kind: 'text' | 'object';
  text: string;
  rect: NormalizedRect;
};

export type CanvasSnapshot = {
  version: 1;
  capturedAt: string;
  url: string;
  title: string;
  screenshot: string;
  viewport: { width: number; height: number; dpr: number };
  subject: {
    kind: 'canvas' | 'svg' | 'application' | 'viewport';
    label: string;
    rect: { x: number; y: number; width: number; height: number };
  };
  items: SemanticItem[];
};

export type PixelImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type Finding = {
  id: string;
  severity: 'warning' | 'error';
  type: 'frame' | 'missing' | 'changed' | 'clipped' | 'ocr';
  title: string;
  detail: string;
  rect?: NormalizedRect;
  itemText?: string;
};

export type ProofReport = {
  createdAt: string;
  sourceUrl: string;
  sourceTitle: string;
  exportName: string;
  score: number;
  sourceSize: { width: number; height: number };
  exportSize: { width: number; height: number };
  comparedItems: number;
  findings: Finding[];
};
