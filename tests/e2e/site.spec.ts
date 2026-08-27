import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`${path} has clean semantics and no serious accessibility findings`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Export Proof/);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('download and pricing actions are concrete', async ({ page }) => {
  await page.goto('/');
  const download = page.getByRole('link', { name: 'Download for Chrome' });
  await expect(download).toHaveAttribute('href', '/downloads/export-proof-chrome.zip');
  await expect(page.getByRole('link', { name: 'Buy Team pack' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/canvas-export-proof/checkout');
  await page.getByRole('button', { name: /restore/i }).click();
  await expect(page.getByLabel('License token')).toBeVisible();
});
