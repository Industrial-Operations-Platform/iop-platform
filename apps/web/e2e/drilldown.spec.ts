import { expect, test } from '@playwright/test';

for (const width of [375, 1366]) {
  test(`complete fictional drill-down and return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const businessRequests: string[] = [];
    page.on('request', request => { if (request.url().includes('/api/')) businessRequests.push(request.url()); });
    await page.goto('/?preview=1#overview');
    await page.getByText('Try shared filters with fictional data', { exact: true }).click();
    await page.getByLabel('From', { exact: true }).fill('2026-06-26');
    await page.getByRole('group', { name: 'Excluded messages' }).getByLabel('Check · Warning · Inspection').check();
    await page.getByRole('button', { name: 'Apply filters' }).click();
    for (const label of ['North', 'Area A', 'Pump · Area A', 'Stopped · Alarm · Operations']) {
      await page.getByRole('button', { name: `Inspect ${label}`, exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByText(/Fixture totals: 6 reported occurrences · 200/)).toBeVisible();
      await expect(page.getByText('Excluded messages: Check · Warning · Inspection', { exact: true })).toBeVisible();
    }
    const records = page.getByRole('list', { name: 'Fixture contributing records' });
    await expect(records.getByRole('listitem')).toHaveCount(3);
    await expect(records.getByText(/Demo-20260628.csv · physical line 5/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/drilldown-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Back to previous selection' }).click();
    await expect(page.getByRole('heading', { name: 'Applied fixture selection' })).toBeFocused();
    await expect(page.getByText('Included messages: All', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Return before Sectors: North', exact: true }).click();
    await expect(page.getByText('Areas: All', { exact: true })).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Executive Overview' }).click();
    await expect(page.getByText(/Fixture totals: 6 reported occurrences · 200/)).toBeVisible();
    expect(businessRequests).toEqual([]);
  });
}
