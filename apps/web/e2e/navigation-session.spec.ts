import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";

test("navigation slides open, respects reduced motion and starts open after login", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    localStorage.setItem("iop.language", "en");
    // A preference saved by an older version must not hide a new session's menu.
    localStorage.setItem("iop.navigationCollapsed", "true");
  });
  await installDesktopConsistencyFixture(page);
  let signedIn = true;
  await page.route("**/api/v1/session/context", route => route.fulfill({ json: {
    enabled: true, authentication: "password", canImport: true, canAdminister: true, canReadAnalytics: true,
    user: signedIn ? { id: "admin", name: "Morgan Administrator", profile: "administrator" } : null,
    users: [], scope: { organizationId: "org", siteId: "site", siteTimeZone: "UTC" },
  } }));
  await page.route("**/api/v1/auth/logout", route => {
    signedIn = false;
    return route.fulfill({ json: {} });
  });
  await page.route("**/api/v1/auth/login", route => {
    signedIn = true;
    return route.fulfill({ json: {} });
  });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(navigation).toBeVisible();
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect(navigation).toBeHidden();
  const sidebar = page.locator(".iop-sidebar");
  await sidebar.evaluate(element => {
    element.addEventListener("animationstart", () => {
      const animation = element.getAnimations()[0];
      animation.pause();
      animation.currentTime = 110;
    }, { once: true });
  });
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect.poll(() => sidebar.evaluate(element => element.getAnimations()[0]?.playState)).toBe("paused");
  const movingBox = (await sidebar.boundingBox())!;
  expect(movingBox.x).toBeLessThan(-1);
  expect(movingBox.x).toBeGreaterThan(-movingBox.width);
  await page.screenshot({ path: info.outputPath("navigation-opening-midway.png") });
  await sidebar.evaluate(element => element.getAnimations()[0].finish());
  await expect.poll(async () => (await sidebar.boundingBox())!.x).toBe(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect(navigation).toBeHidden();
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect(navigation).toBeVisible();
  expect(await sidebar.evaluate(element => element.getAnimations().length)).toBe(0);
  expect((await sidebar.boundingBox())!.x).toBe(0);
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect(navigation).toBeHidden();
  await page.getByRole("button", { name: "User menu", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("navigation", { name: "Platform navigation", exact: true })
    .getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Workspace access", exact: true });
  await dialog.getByLabel("Username", { exact: true }).fill("fixture-user");
  await dialog.getByLabel("Password", { exact: true }).fill("fixture-password");
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(navigation).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide navigation", exact: true })).toHaveAttribute("aria-expanded", "true");
});
