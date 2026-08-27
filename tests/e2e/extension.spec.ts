import { chromium, expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtemp } from 'node:fs/promises';

function onePagePdf(): Buffer {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length 47 >>\nstream\nBT /F1 24 Tf 40 100 Td (Export proof) Tj ET\nendstream'
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}

test('packaged extension runs the reference-to-proof flow', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Extension flow only needs one Chromium run.');
  const userDataDir = await mkdtemp('/tmp/export-proof-extension-');
  const extensionPath = '/work/repo/.output/chrome-mv3';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1234/chrome-linux64/chrome',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    const page = await context.newPage();
    await page.goto('chrome://extensions');
    const extensionId = await page.locator('extensions-manager').evaluate((manager) => {
      const list = manager.shadowRoot?.querySelector('extensions-item-list')?.shadowRoot;
      return [...(list?.querySelectorAll('extensions-item') || [])]
        .find((item) => item.shadowRoot?.querySelector('#name')?.textContent?.includes('Export Proof'))?.getAttribute('id');
    });
    expect(extensionId).toBeTruthy();
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`chrome-extension://${extensionId}/proof.html`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Start from the page you trust' })).toBeVisible();

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 340;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#f4f0e6'; context.fillRect(0, 0, 500, 340);
      context.strokeStyle = '#162622'; context.lineWidth = 5; context.strokeRect(70, 80, 280, 130);
      context.fillStyle = '#162622'; context.font = '32px sans-serif'; context.fillText('Approved label', 90, 150);
      await chrome.storage.local.set({ currentSnapshot: {
        version: 1, capturedAt: new Date().toISOString(), url: 'https://example.test/canvas', title: 'Approved lesson canvas', screenshot: canvas.toDataURL(),
        viewport: { width: 500, height: 340, dpr: 1 }, subject: { kind: 'viewport', label: 'Visible page', rect: { x: 0, y: 0, width: 500, height: 340 } },
        items: [{ id: 'label', kind: 'text', text: 'Approved label', rect: { x: .14, y: .24, width: .56, height: .38 } }]
      }});
    });
    await page.reload();
    await expect(page.getByText('Approved lesson canvas')).toBeVisible();
    await page.locator('#export-file').setInputFiles('/work/repo/public/assets/topographic-proof-hero.jpg');
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save annotated PNG' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save JSON report' })).toBeVisible();
    await page.locator('#export-file').setInputFiles({ name: 'proof.pdf', mimeType: 'application/pdf', buffer: onePagePdf() });
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#notice')).not.toContainText('could not');
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
