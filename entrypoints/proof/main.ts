import './style.css';
import { compareImages } from '../../lib/compare';
import { captureReturnedLicense, getCachedLicenseState, saveLicense, verifyLicense } from '../../lib/license';
import type { CanvasSnapshot, Finding, PixelImage, ProofReport } from '../../lib/types';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const emptyState = $('#empty-state');
const proofFlow = $('#proof-flow');
const notice = $('#notice');
const input = $('#export-file') as HTMLInputElement;
const uploadZone = $('#upload-zone');
const working = $('#working');
const workingDetail = $('#working-detail');
const resultSection = $('#result');
const sourceCanvas = $('#source-canvas') as HTMLCanvasElement;
const exportCanvas = $('#export-canvas') as HTMLCanvasElement;
const findingsList = $('#findings-list');
const teamDialog = $('#team-dialog') as HTMLDialogElement;
const captureDialog = $('#capture-dialog') as HTMLDialogElement;
const ocrToggle = $('#ocr-toggle') as HTMLInputElement;
const ocrStatus = $('#ocr-status');

let snapshot: CanvasSnapshot | null = null;
let sourcePixels: PixelImage | null = null;
let cleanExportCanvas: HTMLCanvasElement | null = null;
let currentReport: ProofReport | null = null;
let visualScore = 100;
let teamUnlocked = false;
let batchReports: ProofReport[] = [];

function canvasPixels(canvas: HTMLCanvasElement): PixelImage {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Your browser could not read the comparison canvas.');
  return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded. Try exporting it again as PNG.'));
    image.src = source;
  });
}

async function drawSource(captured: CanvasSnapshot): Promise<PixelImage> {
  const image = await loadImage(captured.screenshot);
  const scaleX = image.naturalWidth / captured.viewport.width;
  const scaleY = image.naturalHeight / captured.viewport.height;
  const rect = captured.subject.rect;
  const sourceWidth = Math.max(1, Math.round(rect.width * scaleX));
  const sourceHeight = Math.max(1, Math.round(rect.height * scaleY));
  const maxEdge = 1400;
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  sourceCanvas.width = Math.round(sourceWidth * scale);
  sourceCanvas.height = Math.round(sourceHeight * scale);
  const context = sourceCanvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas rendering is unavailable.');
  context.drawImage(image, rect.x * scaleX, rect.y * scaleY, sourceWidth, sourceHeight, 0, 0, sourceCanvas.width, sourceCanvas.height);
  return canvasPixels(sourceCanvas);
}

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  if (file.size > 50 * 1024 * 1024) throw new Error(`${file.name} is larger than 50 MB.`);
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    workingDetail.textContent = 'Rendering the first PDF page';
    const { renderPdfFirstPage } = await import('../../lib/pdf');
    return renderPdfFirstPage(file);
  }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Choose a PNG, JPG, WebP, or PDF file.');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const maxEdge = 1800;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d', { alpha: false })?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}

function renderAnnotated(report: ProofReport, clean: HTMLCanvasElement): void {
  exportCanvas.width = clean.width;
  exportCanvas.height = clean.height;
  const context = exportCanvas.getContext('2d');
  if (!context) return;
  context.drawImage(clean, 0, 0);
  const lineWidth = Math.max(3, Math.round(clean.width / 360));
  context.lineWidth = lineWidth;
  context.font = `700 ${Math.max(14, Math.round(clean.width / 45))}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  report.findings.forEach((finding, index) => {
    if (!finding.rect) return;
    const rect = finding.rect;
    const x = rect.x * clean.width;
    const y = rect.y * clean.height;
    const width = rect.width * clean.width;
    const height = rect.height * clean.height;
    const color = finding.severity === 'error' ? '#d7492f' : '#b36b00';
    context.strokeStyle = color;
    context.fillStyle = color;
    context.strokeRect(x, y, width, height);
    const radius = Math.max(12, clean.width / 70);
    const pinX = Math.max(radius, Math.min(clean.width - radius, x));
    const pinY = Math.max(radius, Math.min(clean.height - radius, y));
    context.beginPath(); context.arc(pinX, pinY, radius, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#fff'; context.fillText(String(index + 1), pinX, pinY + 1);
  });
}

function renderFindings(report: ProofReport): void {
  findingsList.replaceChildren();
  $('#finding-count').textContent = `${report.findings.length} ${report.findings.length === 1 ? 'note' : 'notes'}`;
  if (!report.findings.length) {
    const item = document.createElement('li');
    item.className = 'all-clear';
    item.textContent = '✓ No material layout or ink loss found in mapped regions.';
    findingsList.append(item);
    return;
  }
  report.findings.forEach((finding, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="finding-number">${index + 1}</span><div><strong></strong><small></small></div><span class="severity ${finding.severity}"></span>`;
    item.querySelector('strong')!.textContent = finding.title;
    item.querySelector('small')!.textContent = finding.detail;
    item.querySelector('.severity')!.textContent = finding.severity;
    findingsList.append(item);
  });
}

function showReport(report: ProofReport, clean: HTMLCanvasElement): void {
  currentReport = report;
  cleanExportCanvas = clean;
  $('#score span').textContent = String(report.score);
  $('#result-title').textContent = report.findings.length ? 'Review the marked regions' : 'Export reads clear';
  const errors = report.findings.filter((item) => item.severity === 'error').length;
  $('#result-summary').textContent = report.findings.length
    ? `${errors} likely ${errors === 1 ? 'failure' : 'failures'} and ${report.findings.length - errors} review ${report.findings.length - errors === 1 ? 'note' : 'notes'} across ${report.comparedItems} mapped regions.`
    : `${report.comparedItems} mapped regions retained their visible structure.`;
  renderAnnotated(report, clean);
  renderFindings(report);
  $('#step-export').classList.add('done');
  $('#step-proof').classList.add('active');
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

async function compareFile(file: File): Promise<{ report: ProofReport; canvas: HTMLCanvasElement }> {
  if (!snapshot || !sourcePixels) throw new Error('Capture a live canvas before adding an export.');
  const canvas = await fileToCanvas(file);
  workingDetail.textContent = `Checking ${snapshot.items.length} mapped regions in ${file.name}`;
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  const report = compareImages({
    source: sourcePixels,
    exported: canvasPixels(canvas),
    items: snapshot.items,
    sourceUrl: snapshot.url,
    sourceTitle: snapshot.title,
    exportName: file.name
  });
  return { report, canvas };
}

async function handleFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  if (!files.length) return;
  if (!teamUnlocked && files.length > 1) {
    notice.textContent = 'The free proof checks one file at a time. Team pack compares up to 10 in one pass.';
    teamDialog.showModal();
  }
  const selected = files.slice(0, teamUnlocked ? 10 : 1);
  working.hidden = false;
  resultSection.hidden = true;
  notice.textContent = '';
  batchReports = [];
  try {
    let last: { report: ProofReport; canvas: HTMLCanvasElement } | null = null;
    for (const [index, file] of selected.entries()) {
      workingDetail.textContent = `File ${index + 1} of ${selected.length}: ${file.name}`;
      last = await compareFile(file);
      batchReports.push(last.report);
    }
    if (last) {
      visualScore = last.report.score;
      showReport(last.report, last.canvas);
    }
    const batch = $('#batch-results');
    if (batchReports.length > 1) {
      batch.hidden = false;
      batch.innerHTML = '<h2>Batch survey</h2><p>The final file is shown above.</p><ul></ul>';
      const list = batch.querySelector('ul')!;
      batchReports.forEach((report) => {
        const row = document.createElement('li');
        row.textContent = `${report.exportName} — ${report.score}/100 · ${report.findings.length} notes`;
        list.append(row);
      });
    } else batch.hidden = true;
    if (teamUnlocked) await chrome.storage.local.set({ proofHistory: batchReports.map(({ sourceUrl, ...report }) => ({ ...report, sourceHost: new URL(sourceUrl).host })).slice(-30) });
  } catch (error) {
    notice.textContent = error instanceof Error ? error.message : 'The export could not be compared.';
    resultSection.hidden = true;
  } finally { working.hidden = true; input.value = ''; }
}

async function addOcrFindings(): Promise<void> {
  if (!currentReport || !cleanExportCanvas || !snapshot) return;
  const Detector = (window as unknown as { TextDetector?: new () => { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> } }).TextDetector;
  if (!Detector) return;
  notice.textContent = 'Running optional OCR locally in your browser…';
  try {
    const detected = await new Detector().detect(cleanExportCanvas);
    const exportedText = detected.map((item) => item.rawValue || '').join(' ').toLocaleLowerCase();
    const ocrFindings: Finding[] = snapshot.items.filter((item) => item.kind === 'text' && item.text.length >= 3)
      .filter((item) => !exportedText.includes(item.text.toLocaleLowerCase()))
      .slice(0, 20)
      .map((item) => ({ id: `ocr-${item.id}`, severity: 'warning', type: 'ocr', title: 'Text not found by local OCR', detail: `“${item.text.slice(0, 80)}” was visible live but was not read in the export.`, rect: item.rect, itemText: item.text }));
    currentReport.findings = [...currentReport.findings.filter((item) => item.type !== 'ocr'), ...ocrFindings];
    currentReport.score = Math.max(0, visualScore - ocrFindings.length * 6);
    showReport(currentReport, cleanExportCanvas);
    notice.textContent = ocrFindings.length ? `Local OCR added ${ocrFindings.length} review notes.` : 'Local OCR found all mapped text.';
  } catch { notice.textContent = 'Local OCR could not read this file. The visual proof is unchanged.'; }
}

function downloadData(filename: string, url: string) {
  chrome.downloads.download({ url, filename, saveAs: true }).catch(() => { window.open(url, '_blank'); });
}

$('#download-proof').addEventListener('click', () => {
  if (!currentReport) return;
  downloadData(`export-proof/${currentReport.exportName.replace(/\.[^.]+$/, '')}-proof.png`, exportCanvas.toDataURL('image/png'));
});
$('#download-json').addEventListener('click', () => {
  if (!currentReport) return;
  const payload = batchReports.length > 1 ? batchReports : currentReport;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadData(`export-proof/${currentReport.exportName.replace(/\.[^.]+$/, '')}-report.json`, url);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
});

input.addEventListener('change', () => { if (input.files) void handleFiles(input.files); });
$('#choose-export').addEventListener('click', () => input.click());
for (const eventName of ['dragenter', 'dragover']) uploadZone.addEventListener(eventName, (event) => { event.preventDefault(); uploadZone.classList.add('drag'); });
for (const eventName of ['dragleave', 'drop']) uploadZone.addEventListener(eventName, (event) => { event.preventDefault(); uploadZone.classList.remove('drag'); });
uploadZone.addEventListener('drop', (event) => { if (event instanceof DragEvent && event.dataTransfer?.files) void handleFiles(event.dataTransfer.files); });
ocrToggle.addEventListener('change', () => { if (ocrToggle.checked) void addOcrFindings(); else if (currentReport) { currentReport.findings = currentReport.findings.filter((item) => item.type !== 'ocr'); currentReport.score = visualScore; showReport(currentReport, cleanExportCanvas!); } });

function showCaptureHelp() { captureDialog.showModal(); }
$('#new-capture').addEventListener('click', showCaptureHelp);
$('#empty-capture').addEventListener('click', showCaptureHelp);
$('#team-button').addEventListener('click', () => teamDialog.showModal());

$('#license-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = ($('#license-token') as HTMLInputElement).value.trim();
  if (!token) return;
  saveLicense(token);
  $('#license-state').textContent = 'Verifying license…';
  const verdict = await verifyLicense(true);
  applyLicense(verdict.valid, verdict.reason);
});

function applyLicense(valid: boolean, reason?: string) {
  teamUnlocked = valid;
  input.multiple = valid;
  $('#batch-hint').textContent = valid ? 'Team pack: select up to 10 files' : 'Free proof: one file at a time';
  $('#license-state').textContent = valid ? '✓ Team pack active on this browser.' : reason === 'offline' ? 'Offline — using the last saved license status.' : reason && reason !== 'missing' ? 'License no longer active. You can buy or restore another license.' : 'Team pack is not active.';
  $('#team-button').textContent = valid ? 'Team pack ✓' : 'Team pack';
}

async function initialize() {
  captureReturnedLicense();
  const stored = await chrome.storage.local.get('currentSnapshot');
  snapshot = (stored.currentSnapshot as CanvasSnapshot | undefined) || null;
  if (!snapshot?.screenshot) {
    emptyState.hidden = false;
    proofFlow.hidden = true;
  } else {
    emptyState.hidden = true;
    proofFlow.hidden = false;
    $('#source-title').textContent = snapshot.title || new URL(snapshot.url).hostname;
    $('#source-title').setAttribute('title', snapshot.url);
    $('#source-frame').textContent = `${Math.round(snapshot.subject.rect.width)} × ${Math.round(snapshot.subject.rect.height)} px`;
    $('#source-items').textContent = `${snapshot.items.length} regions`;
    $('#capture-time').textContent = new Date(snapshot.capturedAt).toLocaleString();
    try { sourcePixels = await drawSource(snapshot); } catch (error) { notice.textContent = error instanceof Error ? error.message : 'The reference could not be restored.'; }
  }
  const Detector = (window as unknown as { TextDetector?: unknown }).TextDetector;
  ocrToggle.disabled = !Detector;
  ocrStatus.textContent = Detector ? 'Runs on-device; no image leaves this browser.' : 'Native OCR is not available in this browser. Visual checks still run.';
  const cached = getCachedLicenseState();
  applyLicense(cached.valid, cached.token ? 'cached' : 'missing');
  if (cached.token) {
    const verdict = await verifyLicense();
    applyLicense(verdict.valid, verdict.reason);
  }
}

void initialize();
