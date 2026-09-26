import { expect, test } from '@playwright/test';

function contrast(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const width of [768, 1366]) {
  test(`keyboard journey, labels, status and contrast at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('main')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Executive Overview' })).toBeFocused();
    await page.keyboard.press('Enter');

    for (const view of ['Executive Overview', 'Analytical detail']) {
      const heading = page.getByRole('heading', { level: 1, name: view });
      await expect(heading).toBeFocused();
      const outline = await heading.evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
      });
      expect(outline.style).toBe('solid');
      expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(3);
      expect(contrast(outline.color, 'rgb(242, 245, 247)')).toBeGreaterThanOrEqual(3);
      await page.keyboard.press('Tab');
      await expect(page.getByText('Preview UI states', { exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      const selector = page.getByRole('combobox', { name: 'Simulated analytical state' });
      await expect(selector).toBeFocused();
      await expect(selector).toHaveAccessibleDescription(/Simulation only/);
      await page.keyboard.type('Request');
      await expect(selector).toHaveValue('error');
      const status = page.getByRole('region', { name: 'Analytical state' }).getByRole('status');
      await expect(status).toContainText('Analytical data is unavailable');
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toHaveAttribute('aria-atomic', 'true');
      // Recovery must also work after the preview disclosure is collapsed.
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Simulate retry' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(selector).toBeFocused();
      await expect(status).toContainText('Loading analytical data');
      await page.keyboard.type('No matching');
      await expect(selector).toHaveValue('no-matches');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Reset state preview' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(selector).toBeFocused();
      await expect(selector).toHaveValue('disconnected');

      // Resolve inherited transparent backgrounds before measuring rendered text.
      const samples = await page.locator('h1, h2, p, a, label, summary, select, button, footer').evaluateAll(elements =>
        elements.filter(element => element.getClientRects().length && !element.classList.contains('skip-link')).map(element => {
          let surface: Element | null = element;
          let background = 'rgba(0, 0, 0, 0)';
          while (surface && background === 'rgba(0, 0, 0, 0)') {
            background = getComputedStyle(surface).backgroundColor;
            surface = surface.parentElement;
          }
          return { text: element.textContent, color: getComputedStyle(element).color, background };
        }));
      for (const sample of samples) {
        expect(contrast(sample.color, sample.background), sample.text ?? '').toBeGreaterThanOrEqual(4.5);
      }
      const border = await selector.evaluate(element => getComputedStyle(element).borderTopColor);
      expect(contrast(border, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3);
      expect(contrast(border, 'rgb(242, 245, 247)')).toBeGreaterThanOrEqual(3);
      await page.screenshot({ path: `test-results/accessibility-${view}-${width}.png`, fullPage: true });
      if (view === 'Executive Overview') {
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Explore analytical detail' })).toBeFocused();
        await page.keyboard.press('Enter');
      }
    }
  });
}
