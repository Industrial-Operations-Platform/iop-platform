import { expect, test, type Locator } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";

async function pauseNextNavigationAnimation(sidebar: Locator, animationName: string) {
  await sidebar.evaluate((element, expectedName) => {
    const pause = (event: Event) => {
      if (!(event instanceof AnimationEvent) || event.target !== element || event.animationName !== expectedName) return;
      element.removeEventListener("animationstart", pause);
      const animation = element.getAnimations().find(animation =>
        animation instanceof CSSAnimation && animation.animationName === expectedName)!;
      animation.pause();
      animation.currentTime = 110;
    };
    element.addEventListener("animationstart", pause);
  }, animationName);
}

test("navigation slides both ways, handles interruptions and resets after login", async ({ page }, info) => {
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
  const sidebar = page.locator(".iop-sidebar");
  // Expose the final CSS frame while React's completion handler is still pending.
  await sidebar.evaluate(element => {
    const holdCompletion = (event: Event) => {
      if (!(event instanceof AnimationEvent) || event.target !== element || event.animationName !== "iop-navigation-hide") return;
      element.removeEventListener("animationend", holdCompletion, true);
      event.stopPropagation();
      element.setAttribute("data-completion-held", "true");
    };
    element.addEventListener("animationend", holdCompletion, true);
  });
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect(sidebar).toHaveAttribute("data-completion-held", "true");
  const completionFrames = await sidebar.evaluate(async element => {
    const frames: number[] = [];
    for (let frame = 0; frame < 2; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      frames.push(element.getBoundingClientRect().right);
    }
    return frames;
  });
  await page.screenshot({ path: info.outputPath("navigation-closing-completion.png") });
  for (const rightEdge of completionFrames) expect(rightEdge).toBeLessThanOrEqual(0);
  await sidebar.evaluate(element => {
    element.removeAttribute("data-completion-held");
    element.dispatchEvent(new AnimationEvent("animationend", {
      animationName: "iop-navigation-hide", bubbles: true,
    }));
  });
  await expect(navigation).toBeHidden();
  await expect(sidebar).toBeHidden();
  await pauseNextNavigationAnimation(sidebar, "iop-navigation-reveal");
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect.poll(() => sidebar.evaluate(element => element.getAnimations()[0]?.playState)).toBe("paused");
  const movingBox = (await sidebar.boundingBox())!;
  expect(movingBox.x).toBeLessThan(-1);
  expect(movingBox.x).toBeGreaterThan(-movingBox.width);
  await page.screenshot({ path: info.outputPath("navigation-opening-midway.png") });
  await sidebar.evaluate(element => element.getAnimations()[0].finish());
  await expect.poll(async () => (await sidebar.boundingBox())!.x).toBe(0);
  const fullWidth = (await sidebar.boundingBox())!.width;

  await pauseNextNavigationAnimation(sidebar, "iop-navigation-hide");
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect.poll(() => sidebar.evaluate(element => element.getAnimations()[0]?.playState)).toBe("paused");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(navigation).toBeHidden();
  const closingBox = (await sidebar.boundingBox())!;
  expect(closingBox.width).toBe(fullWidth);
  expect(closingBox.x).toBeLessThan(-1);
  expect(closingBox.x).toBeGreaterThan(-closingBox.width);
  expect(await sidebar.evaluate(element => {
    const destination = element.querySelector("button")!;
    destination.focus();
    return document.activeElement !== destination;
  })).toBe(true);
  await page.screenshot({ path: info.outputPath("navigation-closing-midway.png") });
  // Reopening before the closing animation ends must not hide the reopened panel.
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect(sidebar).toHaveAttribute("aria-hidden", "false");
  await expect(sidebar).not.toHaveAttribute("inert");
  await sidebar.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await expect(sidebar).toBeVisible();
  expect((await sidebar.boundingBox())!.x).toBe(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect(sidebar).toBeHidden();
  await expect(navigation).toBeHidden();
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect(navigation).toBeVisible();
  expect(await sidebar.evaluate(element => element.getAnimations().length)).toBe(0);
  expect((await sidebar.boundingBox())!.x).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await pauseNextNavigationAnimation(sidebar, "iop-navigation-hide");
  await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
  await expect.poll(() => sidebar.evaluate(element => element.getAnimations()[0]?.playState)).toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sidebar).toBeHidden();
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
