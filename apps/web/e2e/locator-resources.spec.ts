import { expect, test, type Page } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Scene } from "../src/features/asset-locator/domain/models";

async function installLocatorFixture(page: Page, canManage: boolean) {
  const base = await installDesktopConsistencyFixture(page);
  const referenceRequests: string[] = [], searches: unknown[] = [];
  const scenes: Scene[] = Array.from({ length: 71 }, (_, index) => ({
    id: `area-${index}`, revision: 1, authorId: "admin", createdAt: "2026-10-20T12:00:00Z", updatedAt: "2026-10-20T12:00:00Z",
    content: { name: `Assembly area ${String(index).padStart(2, "0")}`, group: "Assembly", locationId: "assembly", referenceId: `reference-${index}`, description: "Synthetic schematic", calibration: "pending", surveyNote: "", components: index ? [] : [
      { id: "sensor-a", kind: "sensor", label: "Guard sensor", x: .4, y: .4, elevation: null, rotation: 0, width: .02, depth: .02, height: .04, assetId: "", verification: "provisional", note: "" },
      { id: "conveyor-a", kind: "conveyor", label: "Assembly conveyor", x: .6, y: .6, elevation: null, rotation: 0, width: .2, depth: .04, height: .02, assetId: "", verification: "provisional", note: "" },
      { id: "curve-a", kind: "curve", label: "Quarter-turn conveyor", x: .25, y: .45, elevation: null, rotation: 0, width: .2, depth: .4, height: .02, assetId: "", verification: "provisional", note: "" },
      { id: "s-curve-a", kind: "s-curve", label: "S conveyor", x: .7, y: .3, elevation: null, rotation: 0, width: .3, depth: .25, height: .02, assetId: "", verification: "provisional", note: "" },
    ] },
  }));
  await page.route(/\/api\/v1\/locator\//, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/references/")) {
      referenceRequests.push(path);
      return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64") });
    }
    const input = route.request().postDataJSON();
    if (path.endsWith("/context")) return route.fulfill({ json: { canManage, referenceDimensions: scenes.map(scene => ({ id: scene.content.referenceId, width: 4096, height: 2048 })), references: canManage ? scenes.map(scene => ({ id: scene.content.referenceId, name: scene.content.name, group: "Assembly", width: 4096, height: 2048, kind: "schematic" })) : [], locations: [{ id: "assembly", label: "Assembly", parentId: "" }], componentCatalog: [{ kind: "sensor", width: .02, depth: .02, height: .04 }], coordinateSystem: "image-local normalized", globalCalibration: "pending" } });
    if (path.endsWith("/query")) return route.fulfill({ json: { scenes, total: scenes.length } });
    if (path.endsWith("/detail")) return route.fulfill({ json: { scene: scenes.find(scene => scene.id === input.id), assets: [], problems: { items: [], coverage: [] } } });
    if (path.endsWith("/search")) { searches.push(input); return route.fulfill({ json: { results: [], problems: { items: [], coverage: [] }, total: 0, limit: 200 } }); }
    throw new Error(`Unexpected Locator fixture request ${path}`);
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => { localStorage.setItem("iop.language", "en"); localStorage.setItem("iop.appearance", "light"); });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Asset Locator", exact: true }).click();
  return { ...base, referenceRequests, searches };
}

test("Locator overview keeps 71 private area references unloaded", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixture = await installLocatorFixture(page, true);
  const main = page.getByRole("main");
  await expect(main.locator(".locator-scene-card")).toHaveCount(71);
  await expect(main.locator("canvas, img")).toHaveCount(0);
  expect(fixture.referenceRequests).toEqual([]);
  expect(fixture.searches).toEqual([]);
  await expect(main.getByRole("button", { name: "Create scene", exact: true })).toHaveCount(0);
  await main.getByRole("button", { name: "Configure scenes", exact: true }).click();
  await expect(main.getByRole("button", { name: "Create scene", exact: true })).toBeVisible();
  await expect(main.getByRole("button", { name: "Synchronize imported reference scenes", exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Exit configuration", exact: true }).click();
  await expect(main.getByRole("button", { name: "Create scene", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("locator-lightweight-overview.png"), fullPage: true });
  expect(fixture.unexpectedRequests).toEqual([]);
});

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  for (const canManage of [false, true]) {
    test(`Locator ${canManage ? "Administrator" : "read-only"} viewer keeps references private on ${viewport.name}`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        Object.defineProperty(window, "locatorWebglContexts", { value: 0, writable: true });
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
          if (String(args[0]).startsWith("webgl")) Reflect.set(window, "locatorWebglContexts", Number(Reflect.get(window, "locatorWebglContexts")) + 1);
          return Reflect.apply(original, this, args);
        } as typeof original;
      });
      const fixture = await installLocatorFixture(page, canManage);
      const main = page.getByRole("main");
      await main.locator(".locator-scene-card").first().click();
      const canvas = main.locator(".locator-canvas canvas");
      await expect(canvas).toBeVisible();
      await expect(main.locator("img")).toHaveCount(0);
      expect(fixture.referenceRequests).toEqual([]);
      const contexts = await page.evaluate(() => Number(Reflect.get(window, "locatorWebglContexts")));
      expect(contexts).toBeGreaterThan(0);
      await main.getByRole("button", { name: "Guard sensor — sensor", exact: true }).click();
      await expect(main.getByRole("button", { name: "Guard sensor — sensor", exact: true })).toHaveAttribute("aria-pressed", "true");
      await main.getByRole("button", { name: "Assembly conveyor — conveyor", exact: true }).click();
      expect(await page.evaluate(() => Number(Reflect.get(window, "locatorWebglContexts")))).toBe(contexts);
      expect(fixture.referenceRequests).toEqual([]);
      expect(fixture.searches).toEqual([]);
      await expect(main.getByRole("button", { name: "Configure scenes", exact: true })).toHaveCount(canManage ? 1 : 0);
      await expect(main.getByLabel("Revision note", { exact: true })).toHaveCount(0);
      await page.evaluate(() => new Promise<void>(resolve => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => resolve());
      }));
      await page.screenshot({ path: info.outputPath("locator-model-viewer.png"), fullPage: true });
      await canvas.evaluate(element => element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
      await expect(main.getByRole("alert")).toContainText("3D rendering is unavailable");
      await expect(main.locator(".locator-canvas canvas")).toHaveCount(0);
      await expect(main.locator("img")).toHaveCount(0);
      expect(fixture.referenceRequests).toEqual([]);
      await expect(main.getByRole("button", { name: "Assembly conveyor — conveyor", exact: true })).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath("locator-context-fallback.png"), fullPage: true });
      expect(fixture.unexpectedRequests).toEqual([]);
    });
  }

  test(`Locator Administrator loads references only while configuring on ${viewport.name}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    const fixture = await installLocatorFixture(page, true);
    const main = page.getByRole("main");
    await main.locator(".locator-scene-card").first().click();
    await expect(main.locator(".locator-canvas canvas")).toBeVisible();
    await expect(main.locator("img")).toHaveCount(0);
    expect(fixture.referenceRequests).toEqual([]);
    await main.getByRole("button", { name: "Configure scenes", exact: true }).click();
    await expect(main.getByLabel("Revision note", { exact: true })).toBeVisible();
    await expect.poll(() => fixture.referenceRequests.length).toBeGreaterThan(0);
    const canvas = main.locator(".locator-canvas canvas");
    await expect(canvas).toBeVisible();
    await page.screenshot({ path: info.outputPath("locator-administrator-editor.png"), fullPage: true });
    await canvas.evaluate(element => element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
    await expect(main.getByRole("alert")).toContainText("3D rendering is unavailable");
    await expect(main.getByAltText("Private source schematic — historical reference only", { exact: true })).toBeVisible();
    await main.getByRole("button", { name: "Exit configuration", exact: true }).click();
    await expect(main.getByRole("button", { name: "Configure scenes", exact: true })).toBeVisible();
    await expect(main.getByLabel("Revision note", { exact: true })).toHaveCount(0);
    await expect(main.locator("img")).toHaveCount(0);
    await expect(main.locator(".locator-canvas canvas")).toBeVisible();
    const editingRequests = fixture.referenceRequests.length;
    await main.getByRole("button", { name: "Guard sensor — sensor", exact: true }).click();
    await expect(main.getByRole("button", { name: "Guard sensor — sensor", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(fixture.referenceRequests).toHaveLength(editingRequests);
    expect(fixture.unexpectedRequests).toEqual([]);
  });
}
