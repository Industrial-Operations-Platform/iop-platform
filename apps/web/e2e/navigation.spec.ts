import { expect, test } from '@playwright/test';

test('navigation supports keyboard, history, direct links and reload without business requests', async ({ page }) => {
  const businessRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) businessRequests.push(request.url());
  });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const overview = page.getByRole('navigation').getByRole('link', { name: 'Executive Overview' });
  await overview.focus();
  await page.keyboard.press('Enter');
  await expect(overview).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Executive Overview');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Explore analytical detail' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Analytical detail');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Executive Overview');
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Analytical detail');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Analytical detail');
  await page.goto('/#overview');
  await expect(page).toHaveTitle('Executive Overview | IOP');
  await expect(page.getByText(/No organization, site or source connected/)).toBeVisible();
  await expect(page.getByText(/Accumulated alarm duration is not plant downtime/)).toBeVisible();
  await page.screenshot({ path: 'test-results/navigation-desktop.png', fullPage: true });
  expect(businessRequests).toEqual([]);
});

test('invalid destination recovers and all pages fit narrow and tablet layouts', async ({ page }) => {
  await page.goto('/#unknown');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await page.getByRole('link', { name: 'Go to Import CSV' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Import CSV');
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const title of ['Import CSV', 'Executive Overview', 'Analytical detail']) {
      await page.getByRole('navigation').getByRole('link', { name: title, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: `test-results/navigation-${width}.png`, fullPage: true });
  }
});
