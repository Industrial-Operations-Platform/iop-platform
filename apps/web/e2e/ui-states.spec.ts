import { expect, test } from '@playwright/test';

test('analytical state previews are explicit, keyboard operable and issue no business requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['overview', 'detail']) {
      await page.goto(`/#${view}`);
      await page.getByText('Preview UI states', { exact: true }).focus();
      await page.keyboard.press('Enter');
      const selector = page.getByLabel('Simulated analytical state');
      await selector.selectOption('error');
      const retry = page.getByRole('button', { name: 'Simulate retry' });
      await retry.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Loading analytical data…' })).toBeVisible();
      for (const state of ['no-imports', 'no-matches']) {
        await selector.selectOption(state);
        await expect(page.getByText('Simulated state · No business request was sent')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.getByRole('button', { name: 'Reset state preview' }).click();
      await expect(selector).toHaveValue('disconnected');
    }
  }
  expect(requests).toEqual([]);
});
