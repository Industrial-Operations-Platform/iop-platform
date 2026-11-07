import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";
import type { Entry } from "../src/features/shift-handover/domain/models";

for (const { profile, width, appearance } of [
  { profile: 'team-leader', width: 1440, appearance: 'light' },
  { profile: 'team-leader', width: 1440, appearance: 'dark' },
  { profile: 'team-leader', width: 390, appearance: 'light' },
  { profile: 'team-leader', width: 390, appearance: 'dark' },
  { profile: 'administrator', width: 1440, appearance: 'light' },
  { profile: 'technician', width: 390, appearance: 'light' },
]) {
  test(`Profile precedes five German notices for ${profile} at ${width}px in ${appearance}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-11-07T10:00:00Z'));
    await page.addInitScript(value => { localStorage.setItem('iop.language', 'de'); localStorage.setItem('iop.appearance', value); }, appearance);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const fixture = await installMaintenanceAssetsFixture(page, profile);
    const notices = ['Halle A T3','Halle A T2','Halle A T1','Halle B Sh','Halle B Sky'].map((department, index): Entry => ({
      ...fixture.sourceReport, id: `information-${index}`, authorId: 'admin', authorName: 'Mike Gautschi', categoryLabel: 'Information', issueState: 'none', departmentLabel: department,
      content: { ...fixture.sourceReport.content, categoryId: 'information', date: '2026-11-07', displayUntil: '2026-11-15',
        summary: `[DEMO KW46] Frühschicht und Wartungsfenster - ${department}`, details: 'Mike koordiniert die Frühschicht von Montag bis Freitag, jeweils von 05:00 bis 14:15 Uhr. Geplante Inspektionen beginnen um 09:00 Uhr; Ergebnisse werden in der Übergabe dokumentiert.',
        condition: '', dueDate: '', feedbackDueDate: '', equipmentCode: '' } }));
    await page.route('**/api/v1/session/context', route => route.fulfill({ json: { enabled: true, authentication: 'password', canImport: profile === 'administrator', canAdminister: profile === 'administrator', canReadAnalytics: false,
      user: { id: 'admin', name: 'Mike Gautschi', profile }, users: [], scope: { organizationId: 'org', siteId: 'site', siteTimeZone: 'Europe/Zurich' } } }));
    await page.route('**/api/v1/handover/context', route => route.fulfill({ json: { actorId: 'admin', canCoordinate: profile !== 'technician', timeZone: 'Europe/Zurich', people: [{ id: 'admin', name: 'Mike Gautschi' }], locations: [], categories: [{ id: 'information', label: 'Information', workflow: 'information', coordinatorOnly: true, publisherProfiles: ['team-leader'] }] } }));
    await page.route('**/api/v1/handover/query', route => {
      const input = route.request().postDataJSON();
      return route.fulfill({ json: input.categoryId === 'information' ? { entries: notices, total: 5, nextCursor: '' } : { entries: [], total: 0, nextCursor: '' } });
    });
    await page.route('**/api/v1/handover/history', route => route.fulfill({ json: { entry: notices.find(entry => entry.id === route.request().postDataJSON().id), revisions: [], nextBefore: 0 } }));
    await page.goto('/');
    const main = page.getByRole('main');
    const profileCard = main.getByRole('region', { name: 'Profil', exact: true });
    const information = main.getByRole('region', { name: 'Aktuelle Informationen', exact: true });
    await expect(profileCard).toBeVisible();
    await expect(information.getByText('Anzeige 3 von 5 Mitteilungen.')).toBeVisible();
    await expect(information.locator('.handover-summary-card')).toHaveCount(3);
    const firstCard = main.locator('.iop-panel').first();
    await expect(firstCard).toHaveAttribute('aria-label', 'Profil');
    expect((await profileCard.boundingBox())!.y + (await profileCard.boundingBox())!.height).toBeLessThan((await information.boundingBox())!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('start-information.png'), fullPage: true });
    await information.getByRole('button', { name: /Alle Informationen/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Alle Informationen', exact: true });
    await expect(dialog.locator('.handover-summary-card')).toHaveCount(5);
    await expect(dialog).toContainText('Halle B Sky');
    await page.screenshot({ path: info.outputPath('all-information.png') });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(information.getByRole('button', { name: /Alle Informationen/ })).toBeFocused();
    await information.getByRole('button', { name: /Alle Informationen/ }).click();
    await dialog.getByRole('button', { name: /Frühschicht und Wartungsfenster - Halle B Sky/ }).click();
    await expect(page.getByRole('heading', { name: notices[4].content.summary, exact: true })).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
