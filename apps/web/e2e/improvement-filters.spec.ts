import { expect, test } from "@playwright/test";
import type { components } from "../src/contracts/schema";
import { emptyAction, statuses, type Selection } from "../src/features/improvement-tracking/domain/models";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

type Schema = components["schemas"];
const catalog: Schema["ImprovementCatalogDto"] = {
  actorId: "admin", canContribute: true, canCoordinate: true,
  people: [{ id: "admin", name: "Morgan Administrator" }],
  locations: [{ id: "assembly", label: "Assembly", parentId: "" }],
  assets: [],
};
const action: Schema["ImprovementViewDto"] = {
  id: "77777777-7777-4777-8777-777777777771", revision: 1,
  data: { ...emptyAction("assembly"), title: "Inspect drive guides", ownerId: "admin" },
  authorId: "admin", authorName: "Morgan Administrator", ownerName: "Morgan Administrator",
  assetName: "", issueTitle: "", locationLabel: "Assembly",
  createdAt: "2026-10-06T08:00:00.000Z", updatedAt: "2026-10-06T08:00:00.000Z",
  evidenceCount: 0, comparisonCount: 0, canEdit: true, canCoordinate: true,
};

for (const width of [1440, 390]) for (const appearance of ["light", "dark"]) {
  test(`Actions compact native filters preserve search and cursor semantics at ${width}px ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.addInitScript(mode => {
      localStorage.setItem("iop.appearance", mode);
      localStorage.setItem("iop.language", "en");
    }, appearance);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await installMaintenanceAssetsFixture(page, "team-leader");
    const queries: Selection[] = [];
    await page.route("**/api/v1/improvements/*", async route => {
      const path = new URL(route.request().url()).pathname;
      expect(route.request().method()).toBe("POST");
      const data = route.request().postDataJSON();
      if (path === "/api/v1/improvements/catalog") {
        expect(data).toEqual({});
        return route.fulfill({ json: catalog });
      }
      if (path !== "/api/v1/improvements/query") throw new Error(`Unexpected Improvement request: ${path}`);
      expect(Object.keys(data).every(key => ["locationId", "status", "ownerId", "search", "cursor"].includes(key))).toBe(true);
      queries.push(data);
      const response: Schema["ImprovementPageDto"] = {
        actions: [data.cursor ? { ...action, id: "77777777-7777-4777-8777-777777777772", data: { ...action.data, title: "Inspect drive rollers" } } : action],
        total: 2,
        nextCursor: data.cursor ? "" : "opaque-improvement-cursor",
        statusCounts: Object.fromEntries(statuses.map(status => [status, status === "planned" ? 2 : 0])) as Record<typeof statuses[number], number>,
      };
      if (data.cursor) expect(data.cursor).toBe("opaque-improvement-cursor");
      return route.fulfill({ json: response });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Improvements", exact: true }).click();
    await expect(page.getByRole("button", { name: "Inspect drive guides", exact: true })).toBeVisible();
    const apply = page.getByRole("button", { name: "Apply filters", exact: true });
    const department = page.getByRole("combobox", { name: "Selected department", exact: true });
    const status = page.getByRole("combobox", { name: "Status", exact: true });
    const owner = page.getByRole("combobox", { name: "Owner", exact: true });
    await expect(status.getByRole("option", { name: "Planned (2)", exact: true })).toHaveAttribute("value", "planned");
    await department.selectOption("assembly");
    await expect(apply).toBeEnabled();
    await status.selectOption("planned");
    await expect(apply).toBeEnabled();
    await owner.selectOption("admin");
    await expect(apply).toBeEnabled();
    expect(queries).toEqual([
      {},
      { locationId: "assembly", cursor: "" },
      { locationId: "assembly", status: "planned", cursor: "" },
      { locationId: "assembly", status: "planned", ownerId: "admin", cursor: "" },
    ]);
    await page.getByRole("button", { name: "Search improvements", exact: true }).click();
    const search = page.getByRole("searchbox", { name: "Search improvements", exact: true });
    await expect(search).toBeFocused();
    await search.fill("drive");
    expect(queries).toHaveLength(4);
    for (const control of [department, status, owner, search]) {
      const compact = await control.evaluate(element => {
        const field = element.closest("label")!;
        const caption = field.querySelector("span")!;
        const box = field.getBoundingClientRect();
        return {
          inline: getComputedStyle(field).flexDirection === "row",
          bounded: box.left >= 0 && box.right <= innerWidth,
          minimumTarget: box.height >= 44,
          captionBeforeValue: caption.getBoundingClientRect().right < element.getBoundingClientRect().left,
          divider: getComputedStyle(element).borderLeftWidth,
        };
      });
      expect(compact).toEqual({ inline: true, bounded: true, minimumTarget: true, captionBeforeValue: true, divider: "1px" });
    }
    const enclosingCard = await apply.evaluate(element => {
      const style = getComputedStyle(element.closest("form")!);
      return { border: style.borderTopWidth, padding: style.paddingTop };
    });
    expect(enclosingCard).toEqual({ border: "0px", padding: "0px" });
    await page.screenshot({ path: `test-results/IOP-211-actions-filters-${width}-${appearance}.png`, fullPage: true });
    await search.press("Enter");
    await expect(apply).toBeEnabled();
    const selected = { locationId: "assembly", status: "planned", ownerId: "admin", search: "drive", cursor: "" };
    expect(queries).toHaveLength(5);
    expect(queries[4]).toEqual(selected);
    await page.getByRole("button", { name: "Load more actions", exact: true }).click();
    await expect(page.getByRole("button", { name: "Inspect drive rollers", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inspect drive guides", exact: true })).toBeVisible();
    expect(queries).toHaveLength(6);
    expect(queries[5]).toEqual({ ...selected, cursor: "opaque-improvement-cursor" });
    await search.press("Escape");
    await expect(page.getByRole("button", { name: "Search improvements", exact: true })).toBeFocused();
    await expect(search).toBeHidden();
    expect(queries).toHaveLength(6);
    await apply.click();
    await expect(apply).toBeEnabled();
    expect(queries).toHaveLength(7);
    expect(queries[6]).toEqual({ ...selected, search: "" });
    await expect(page.getByRole("button", { name: "Inspect drive rollers", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
