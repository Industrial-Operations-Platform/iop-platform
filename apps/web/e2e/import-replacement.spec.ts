import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import { german } from "../src/localization/de";

for (const [width, language] of [[1440, "en"], [375, "en"], [375, "de"]] as const) {
  test(`same-date confirmation and cancellation at ${width}px in ${language}`, async ({ page }) => {
    const label = (text: string) => language === "de" ? german[text] ?? text : text;
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(lang => {
      localStorage.setItem("iop.language", lang);
      localStorage.setItem("iop.appearance", lang === "de" ? "dark" : "light");
    }, language);
    await installDesktopConsistencyFixture(page);
    const original = {
      importId: "11111111-1111-4111-8111-111111111111", originalFilename: "Hitliste-20261123.csv",
      reportingDate: "2026-11-23", outcome: "succeeded", receivedAt: "2026-11-23T08:00:00Z",
      submittedBy: "admin", admittedRecordCount: 10, byteLength: 100, reasonCode: null,
    };
    let history = [original];
    const uploads: string[] = [];
    await page.route("**/api/v1/imports", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: history });
      uploads.push(route.request().headers()["x-csv-replaces-import-id"]);
      const next = { ...original, importId: "22222222-2222-4222-8222-222222222222", replacesImportId: original.importId };
      history = [next, { ...original, supersededByImportId: next.importId } as typeof original];
      return route.fulfill({ status: 201, json: {
        ...next, rawId: "raw", sourceId: "source", sha256: "0".repeat(64), dataRecordCount: 10,
        rejectedRecordCount: 0, inspectedValidCount: 10, inspectedInvalidCount: 0,
        inspectionComplete: true, unclassifiedCount: 0, repeatedCount: 0, diagnostics: [], diagnosticsTruncated: false,
      } });
    });
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: label("Main navigation"), exact: true });
    const administration = navigation.getByRole("button", { name: label("Data administration"), exact: true });
    await expect(administration).toBeVisible();
    await administration.click();
    await page.getByLabel(label("CSV file"), { exact: true }).setInputFiles({
      name: original.originalFilename, mimeType: "text/csv", buffer: Buffer.from("synthetic browser fixture"),
    });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: label("Import CSV"), exact: true }).click();
    const dialog = page.getByRole("dialog", { name: label("Replace this reporting date?"), exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("2026-11-23");
    expect(uploads).toEqual([]);
    expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await dialog.screenshot({ path: `test-results/IOP-243-confirmation-${width}-${language}.png` });
    await dialog.getByRole("button", { name: label("Cancel"), exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(uploads).toEqual([]);
    await page.getByRole("button", { name: label("Import CSV"), exact: true }).click();
    await dialog.getByRole("button", { name: label("Replace data"), exact: true }).click();
    await expect.poll(() => uploads).toEqual([original.importId]);
    await expect(page.getByRole("heading", { name: "Import complete", exact: true })).toBeVisible();
    await expect(page.getByText(label("Superseded import"), { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
