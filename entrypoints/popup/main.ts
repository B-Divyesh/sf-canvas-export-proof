import './style.css';
import type { CanvasSnapshot } from '../../lib/types';

const captureButton = document.querySelector<HTMLButtonElement>('#capture')!;
const pageState = document.querySelector<HTMLDivElement>('#page-state')!;
const openProof = document.querySelector<HTMLAnchorElement>('#open-proof')!;
openProof.href = chrome.runtime.getURL('proof.html');

let activeTab: chrome.tabs.Tab | undefined;

function collectCanvasMap() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewportArea = vw * vh;
  const visibleRect = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0
      && rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
  };
  const candidates = Array.from(document.querySelectorAll('canvas, svg, [role="img"], [role="application"], [data-canvas]'))
    .filter(visibleRect)
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width * rect.height > viewportArea * 0.08)
    .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height);
  const candidate = candidates[0];
  const raw = candidate?.rect ?? { left: 0, top: 0, right: vw, bottom: vh, width: vw, height: vh };
  const rootRect = {
    x: Math.max(0, raw.left), y: Math.max(0, raw.top),
    width: Math.min(vw, raw.right) - Math.max(0, raw.left),
    height: Math.min(vh, raw.bottom) - Math.max(0, raw.top)
  };
  if (rootRect.width < 40 || rootRect.height < 40) Object.assign(rootRect, { x: 0, y: 0, width: vw, height: vh });

  const semanticSelector = 'h1,h2,h3,h4,h5,h6,p,label,button,a,[aria-label],[role="img"],img,canvas,svg';
  const seen = new Set<string>();
  const items = Array.from(document.querySelectorAll(semanticSelector)).flatMap((element, index) => {
    if (!visibleRect(element)) return [];
    const rect = element.getBoundingClientRect();
    const left = Math.max(rect.left, rootRect.x);
    const top = Math.max(rect.top, rootRect.y);
    const right = Math.min(rect.right, rootRect.x + rootRect.width);
    const bottom = Math.min(rect.bottom, rootRect.y + rootRect.height);
    if (right <= left || bottom <= top) return [];
    const aria = element.getAttribute('aria-label')?.trim() || '';
    const tag = element.tagName.toLowerCase();
    const isObject = ['img', 'canvas', 'svg'].includes(tag) || element.getAttribute('role') === 'img';
    const rawText = aria || (!isObject ? (element.textContent || '').replace(/\s+/g, ' ').trim() : '');
    const text = rawText.slice(0, 220);
    if (!text && !isObject) return [];
    if (!aria && !isObject && element.children.length && !/^h[1-6]$/.test(tag) && tag !== 'button' && tag !== 'a') return [];
    const normalized = {
      x: (left - rootRect.x) / rootRect.width,
      y: (top - rootRect.y) / rootRect.height,
      width: (right - left) / rootRect.width,
      height: (bottom - top) / rootRect.height
    };
    const key = `${text}|${Math.round(normalized.x * 100)}|${Math.round(normalized.y * 100)}|${Math.round(normalized.width * 100)}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: `s${index}`, kind: isObject ? 'object' as const : 'text' as const, text, rect: normalized }];
  }).slice(0, 160);

  const element = candidate?.element;
  const tag = element?.tagName.toLowerCase();
  const role = element?.getAttribute('role');
  const kind: CanvasSnapshot['subject']['kind'] = tag === 'canvas' ? 'canvas' : tag === 'svg' ? 'svg' : role === 'application' ? 'application' : 'viewport';
  return {
    version: 1 as const,
    capturedAt: new Date().toISOString(),
    url: location.href,
    title: document.title,
    viewport: { width: vw, height: vh, dpr: window.devicePixelRatio || 1 },
    subject: { kind, label: element?.getAttribute('aria-label') || (kind === 'viewport' ? 'Visible page' : `Largest ${kind}`), rect: rootRect },
    items
  };
}

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  const blocked = !tab?.id || !tab.url || /^(chrome|edge|about|view-source):/.test(tab.url);
  if (blocked) {
    pageState.textContent = 'This browser page cannot be captured. Open the canvas tab, then try again.';
    pageState.classList.add('error');
    return;
  }
  pageState.textContent = `Ready: ${tab.title || 'current tab'}`;
  captureButton.disabled = false;
}

captureButton.addEventListener('click', async () => {
  if (!activeTab?.id) return;
  captureButton.disabled = true;
  captureButton.querySelector('span')!.textContent = 'Surveying visible canvas…';
  pageState.textContent = 'Reading visible labels and bounds. This stays in your browser.';
  try {
    const [result] = await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, func: collectCanvasMap });
    if (!result?.result) throw new Error('The page returned no visible frame.');
    const screenshot = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'png' });
    const snapshot: CanvasSnapshot = { ...result.result, screenshot };
    await chrome.storage.local.set({ currentSnapshot: snapshot });
    await chrome.tabs.create({ url: chrome.runtime.getURL('proof.html') });
    window.close();
  } catch (error) {
    pageState.textContent = `Capture failed: ${error instanceof Error ? error.message : 'Reload the page and try again.'}`;
    pageState.classList.add('error');
    captureButton.disabled = false;
    captureButton.querySelector('span')!.textContent = 'Capture current canvas';
  }
});

void initialize();
