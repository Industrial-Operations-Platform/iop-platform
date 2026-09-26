import { expect, test, type Page } from '@playwright/test';

async function expectUsableLayout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const controls = page.locator('nav a, button, .actions a, .action, summary, select');
  for (const control of await controls.all()) {
    if (!await control.isVisible()) continue;
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect(control).toBeInViewport();
  }
}

for (const size of [
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'zoom-reflow', width: 640, height: 480 },
]) {
  test(`${size.name}: destinations and analytical states remain usable`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: size, hasTouch: true });
    const page = await context.newPage();
    for (const view of ['import', 'overview', 'detail']) {
      await page.goto(`http://127.0.0.1:4173/#${view}`);
      await expectUsableLayout(page);
      if (view === 'import') continue;
      await page.getByText('Preview UI states', { exact: true }).tap();
      const selector = page.getByLabel('Simulated analytical state');
      for (const state of ['disconnected', 'loading', 'error', 'no-imports', 'no-matches']) {
        await selector.selectOption(state);
        await expectUsableLayout(page);
        await expect(page.getByText(/Accumulated alarm duration is not plant downtime/)).toBeVisible();
        if (state === 'error') {
          await page.getByRole('button', { name: 'Simulate retry' }).tap();
          await expect(selector).toHaveValue('loading');
        }
        if (state === 'no-matches') {
          await page.getByRole('button', { name: 'Reset state preview' }).tap();
          await expect(selector).toHaveValue('disconnected');
        }
      }
    }
    await page.getByLabel('Simulated analytical state').selectOption('error');
    await page.screenshot({ path: `test-results/responsive-${size.name}.png`, fullPage: true });
    // Stress wrapping without adding fictional data to the application itself.
    await page.locator('.context p').first().evaluate(element => {
      element.textContent = `Source: ${'LongSourceReference'.repeat(20)}`;
    });
    await expectUsableLayout(page);
    await context.close();
  });
}

test('tablet orientation preserves state and keyboard recovery remains reachable', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#overview');
  await page.getByText('Preview UI states', { exact: true }).click();
  const selector = page.getByLabel('Simulated analytical state');
  await selector.selectOption('error');
  await selector.focus();
  await page.keyboard.press('Tab');
  const retry = page.getByRole('button', { name: 'Simulate retry' });
  await expect(retry).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(selector).toHaveValue('error');
  await expect(retry).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(selector).toHaveValue('loading');
  await expectUsableLayout(page);
});
