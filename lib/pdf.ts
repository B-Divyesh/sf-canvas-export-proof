import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function renderPdfFirstPage(file: File): Promise<HTMLCanvasElement> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data }).promise;
  const page = await pdfDocument.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(2, 1800 / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas rendering is unavailable.');
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas;
}
