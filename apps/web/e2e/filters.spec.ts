import { expect, test } from '@playwright/test';

for (const width of [640, 768, 1366]) {
  test(`shared fixture filters, keyboard and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    const businessRequests: string[] = [];
    page.on('request', request => { if (request.url().includes('/api/')) businessRequests.push(request.url()); });
    await page.goto('/#overview');
    const disclosure = page.getByText('Try shared filters with fictional data', { exact: true });
    await disclosure.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('From', { exact: true })).toBeFocused();
    await page.getByLabel('From', { exact: true }).fill('2026-06-26');
    const excluded = page.getByRole('group', { name: 'Excluded messages' }).getByLabel('Check · Warning · Inspection');
    await excluded.focus();
    await page.keyboard.press('Space');
    await expect(page.getByText(/Fixture totals: 8 reported occurrences/)).toBeVisible();
    await page.getByRole('button', { name: 'Apply filters' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Fixture totals: 6 reported occurrences · 200/)).toBeVisible();
    await expect(page.getByText(/Missing imports: 2026-06-27/)).toBeVisible();
    await page.getByRole('button', { name: 'Inspect Area A' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Analytical detail' })).toBeFocused();
    await expect(page.getByRole('list', { name: 'Fixture contributing records' }).getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: 'Back to previous selection' }).click();
    await expect(page.getByRole('heading', { name: 'Applied fixture selection' })).toBeFocused();
    await expect(page.getByText('Areas: All', { exact: true })).toBeVisible();
    await page.getByRole('navigation').getByRole('link', { name: 'Import CSV' }).click();
    await page.getByRole('navigation').getByRole('link', { name: 'Executive Overview' }).click();
    await expect(excluded).toBeChecked();
    await expect(page.getByLabel('From', { exact: true })).toHaveValue('2026-06-26');
    await expect(page.getByText(/Fixture totals: 6 reported occurrences · 200/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/filters-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await expect(page.getByLabel('From', { exact: true })).toHaveValue('2026-06-28');
    await expect(excluded).not.toBeChecked();
    expect(businessRequests).toEqual([]);
  });
}

test('invalid and empty selections preserve applied meaning', async ({ page }) => {
  await page.goto('/#overview');
  await page.getByText('Try shared filters with fictional data', { exact: true }).click();
  await page.getByLabel('From', { exact: true }).fill('2026-06-29');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('alert')).toContainText('Choose 1–366');
  await expect(page.getByText(/Fixture totals: 8 reported occurrences/)).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('group', { name: 'Sectors', exact: true }).getByLabel('North', { exact: true }).check();
  await page.getByRole('group', { name: 'Areas', exact: true }).getByLabel('Area B', { exact: true }).check();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByText('No matching records. Imported coverage is unchanged by filters.')).toBeVisible();
  await expect(page.getByText(/Admitted fixture dates: 2026-06-28/)).toBeVisible();
  await page.getByLabel('From', { exact: true }).fill('2026-06-27');
  await page.getByLabel('Through', { exact: true }).fill('2026-06-27');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByText(/No imports in this fixture range/)).toBeVisible();
  await expect(page.getByText(/Fixture totals:/)).toHaveCount(0);
});
