import { expect, test } from '@playwright/test';

test('built UI reaches the real API through the same-origin proxy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Import CSV');
  await expect(page.getByRole('status')).toHaveText('API is reachable.');
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/health-mobile.png', fullPage: true });
});

test('safe error and keyboard retry recover to the real API', async ({ page }) => {
  await page.route('**/health', route => route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>private diagnostic</h1>' }));
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('API is unavailable');
  await expect(page.getByText('private diagnostic')).toHaveCount(0);
  await page.unroute('**/health');
  await page.getByRole('button', { name: 'Check again' }).focus();
  await expect(page.getByRole('button', { name: 'Check again' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('API is reachable.');
});
