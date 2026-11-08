import { expect, test, type Locator } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

async function expectReadableOptions(scope: Locator) {
  const options = scope.locator("select option, select optgroup");
  expect(await options.count()).toBeGreaterThan(0);
  const failures = await options.evaluateAll(elements => elements.flatMap(element => {
    const style = getComputedStyle(element);
    const disabled = element.matches(":disabled");
    // Resolve semantic colors through a real painted element rather than assuming
    // a particular RGB palette or accepting the native transparent fallback.
    const reference = document.createElement("span");
    reference.style.backgroundColor = "var(--iop-surface)";
    reference.style.color = disabled ? "var(--iop-muted)" : "var(--iop-ink)";
    element.closest(".iop-ui")!.append(reference);
    const expected = getComputedStyle(reference);
    const readable = style.backgroundColor === expected.backgroundColor && style.color === expected.color;
    reference.remove();
    return readable ? [] : [{ label: element.textContent, background: style.backgroundColor, color: style.color }];
  }));
  expect(failures).toEqual([]);
}

for (const width of [1440, 1024, 390]) {
  test(`appearance remains consistent across workspace modules at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await installMaintenanceAssetsFixture(page, "administrator");
    await page.goto("/");
    const account = page.getByRole("button", { name: "User menu" });
    const appearance = page.getByRole("combobox", { name: "Appearance", exact: true });
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    const root = page.locator(".iop-ui").first();

    for (const mode of ["light", "dark"]) {
      await account.click();
      await expect(appearance).toHaveValue(mode === "light" ? "system" : "light");
      await appearance.selectOption(mode);
      await expect(root).toHaveAttribute("data-appearance", mode);
      await expectReadableOptions(page.locator(".iop-account-menu"));
      if (mode === "dark") {
        await page.screenshot({ path: `test-results/IOP-202-account-dark-${width}.png`, fullPage: true });
      }
      await appearance.press("Escape");
      await expect(account).toBeFocused();
      for (const section of ["Administration", "Data administration", "Data analysis", "Shift Handover", "Workforce & shifts", "Maintenance", "Assets", "Users & profiles"]) {
        await navigation.getByRole("button", { name: section, exact: true }).click();
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
        const main = page.getByRole("main");
        if (await main.locator("select option").count()) await expectReadableOptions(main);
        if (section === "Maintenance") {
          const location = main.getByRole("combobox", { name: "Selected location", exact: true });
          await location.selectOption("assembly");
          await expect(location).toHaveValue("assembly");
          await location.selectOption("");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `test-results/IOP-202-${section.replace(/\s/g, "-")}-${mode}-${width}.png`, fullPage: true });
      }
    }
    await page.reload();
    await expect(root).toHaveAttribute("data-appearance", "dark");
    await account.click();
    await expect(appearance).toHaveValue("dark");
    await appearance.selectOption("system");
    await appearance.press("Escape");
    await expect(root).toHaveAttribute("data-appearance", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(root).toHaveAttribute("data-appearance", "dark");
    await account.click();
    await expectReadableOptions(page.locator(".iop-account-menu"));
    await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("de");
    await expect(page.getByRole("combobox", { name: "Darstellung" })).toHaveValue("system");
    await expect(page.getByRole("option", { name: "Dunkel", exact: true })).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`dark appearance preserves public artwork and accessible dialogs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.route("**/api/v1/session/context", (route) => route.fulfill({ json: {
      enabled: true, authentication: "password", canImport: false,
      user: null, users: [], scope: null,
    } }));
    await page.goto("/");
    await expect(page.locator(".landing")).toHaveCSS("background-color", "rgb(23, 43, 67)");
    const navigation = page.getByRole("navigation", { name: "Platform navigation" });
    await navigation.getByRole("button", { name: "About IOP", exact: true }).click();
    const about = page.getByRole("dialog", { name: "About IOP", exact: true });
    await expect(about).toHaveCSS("background-color", "rgb(26, 41, 60)");
    const backdrop = await about.evaluate((element) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = getComputedStyle(element, "::backdrop").backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    });
    expect(backdrop.slice(0, 3).every((channel) => channel < 50)).toBe(true);
    expect(backdrop[3]).toBeGreaterThan(0);
    expect(backdrop[3]).toBeLessThan(255);
    await page.screenshot({ path: `test-results/IOP-202-about-dark-${width}.png`, fullPage: true });
    await about.press("Escape");
    await navigation.getByRole("button", { name: "Sign in", exact: true }).click();
    const access = page.getByRole("dialog", { name: "Workspace access", exact: true });
    await expect(access.getByLabel("Username", { exact: true })).toBeVisible();
    await expect(access).toHaveCSS("background-color", "rgb(26, 41, 60)");
    await page.screenshot({ path: `test-results/IOP-202-sign-in-dark-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
