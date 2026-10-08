import { expect, test } from "@playwright/test";
import { emptyWorkforce } from "./workforce-fixture";
import type { Entry, Content } from "../src/features/shift-handover/domain/models";

for (const width of [1440, 375]) {
  test(`category workflows, personal Journal and exact notices at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-07T10:00:00.000Z"));
    await page.addInitScript(() => {
      localStorage.setItem("iop.language", "en");
      localStorage.setItem('iop.handover.read:["org","site","leader"]', "1970-01-01T00:00:00.000Z");
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const workflows = { safety: "safety", information: "information", successes: "success", people: "people", performance: "technical-blocked", problems: "technical-problem" };
    const categories = ["Safety", "Information", "Successes", "People", "Performance", "Problems"].map((label) => ({
      id: label.toLowerCase(), label, workflow: workflows[label.toLowerCase() as keyof typeof workflows],
      carryForward: ["Performance", "Problems"].includes(label), coordinatorOnly: label === "Information",
    }));
    const locations = [{ id: "hall-a", label: "Halle A", role: "department", parentId: "", sectorKey: "" },
      { id: "hall-b", label: "Halle B", role: "department", parentId: "", sectorKey: "" },
      { id: "area-a", label: "Area A", role: "area", parentId: "hall-a", sectorKey: "" }];
    const makeEntry = (id: string, authorId = "leader", categoryId = "problems"): Entry => ({
      id, authorId, authorName: authorId === "leader" ? "Lee Leader" : "Taylor Technician", createdAt: "2026-10-07T08:00:00.000Z", updatedAt: "2026-10-07T08:00:00.000Z",
      revision: 1, departmentLabel: "Halle A", areaLabel: "", categoryLabel: categories.find((category) => category.id === categoryId)!.label,
      equipmentReferenceId: "", responsibleId: "leader", responsibleName: "Lee Leader", issueState: categoryId === "information" ? "none" : "open", highlighted: false, highlightedAt: "",
      content: { date: "2026-10-07", categoryId, summary: id, details: "Full instructions for the next shift.", departmentId: "hall-a", areaId: "", equipmentCode: "", equipmentNamespace: "site-equipment",
        condition: "", externalReference: "", challenge: "", cause: "", measure: "", dueDate: "", feedbackDueDate: "", discuss: false },
    });
    const briefingImage = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 320;
      const context = canvas.getContext("2d")!; context.fillStyle = "#e8f3fc"; context.fillRect(0, 0, 640, 320);
      context.fillStyle = "#172b43"; context.font = "bold 32px sans-serif"; context.fillText("Shift briefing", 40, 80);
      context.font = "22px sans-serif"; context.fillText("Keep the marked access route clear.", 40, 135);
      context.strokeStyle = "#087bd5"; context.lineWidth = 6; context.strokeRect(40, 180, 550, 90);
      return canvas.toDataURL("image/png");
    });
    const information = makeEntry("Shared safety briefing", "other-leader", "information");
    information.departmentLabel = "";
    information.content = { ...information.content, departmentId: "", date: "2026-10-06", displayUntil: "2026-10-09", images: [{ name: "Briefing diagram", dataUrl: briefingImage }] };
    const secondInformation = { ...structuredClone(information), id: "Second announcement", content: { ...information.content, summary: "Second announcement" } };
    let entries = [makeEntry("Own technical report"), makeEntry("Other technician report", "tech"), information, secondInformation];
    const publications: { content: Content; issue: boolean }[] = [];
    const queries: Record<string, unknown>[] = [];
    const workforceQueries: { from: string; to: string }[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/session/context")) return route.fulfill({ json: { enabled: true, authentication: "password", canImport: false, canAdminister: false, canReadAnalytics: false,
        user: { id: "leader", name: "Lee Leader", profile: "team-leader" }, users: [], scope: { organizationId: "org", siteId: "site", siteTimeZone: "UTC" } } });
      if (path.endsWith("/maintenance/assignments")) return route.fulfill({ json: { records: [], events: [] } });
      if (path.endsWith("/workforce/summary")) return route.fulfill({ json: { actorId: "leader", today: "2026-10-07", currentFrom: "2026-10-01", previousFrom: "2026-09-01", previousTo: "2026-09-30",
        homeTargetId: "hall-a", homeTargetLabel: "Halle A", teamLabel: "", scheduledDays: 0, shifts: [], saturdays: 0, sundays: 0 } });
      if (path.endsWith("/workforce/board")) {
        workforceQueries.push(route.request().postDataJSON());
        return route.fulfill({ json: { ...emptyWorkforce, actorId: "leader", settings: {
          shifts: [{ id: "early", label: "Early", start: "05:00", end: "14:15", days: [0,1,2,3,4,5,6] }],
          targets: [{ id: "hall-a", label: "Halle A", phone: "" }], teams: [],
        }, records: [{ id: "assignment", kind: "assignment", revision: 1, deleted: false, personName: "Lee Leader",
          data: { userId: "leader", date: "2026-10-07", shiftId: "early", targetId: "hall-a", duty: "zone", phone: "", start: "05:00", end: "14:15",
            startsAt: "2026-10-07T05:00:00.000Z", endsAt: "2026-10-07T14:15:00.000Z" } }] } });
      }
      if (path.endsWith("/handover/context")) return route.fulfill({ json: { actorId: "leader", canCoordinate: true, timeZone: "UTC", externalSystemLabel: "Reference", people: [{ id: "leader", name: "Lee Leader" }], categories, locations } });
      if (path.endsWith("/handover/default-location")) return route.fulfill({ json: { departmentId: route.request().postDataJSON().date === "2026-10-07" ? "hall-a" : "" } });
      if (path.endsWith("/handover/equipment")) return route.fulfill({ json: { codes: [], nextCursor: "" } });
      if (path.endsWith("/handover/query")) {
        const selection = route.request().postDataJSON(); queries.push(selection);
        const matching = entries.filter((entry) => (!selection.from || entry.content.date >= selection.from) && (!selection.to || entry.content.date <= selection.to)
          && (!selection.categoryId || entry.content.categoryId === selection.categoryId) && (!selection.departmentId || entry.content.departmentId === selection.departmentId)
          && (!selection.mine || entry.authorId === "leader") && (!selection.state || (selection.state === "pending" ? ["open", "in-progress"].includes(entry.issueState) : entry.issueState === selection.state))
          && (!selection.displayOn || (entry.content.date <= selection.displayOn && (entry.content.displayUntil || entry.content.date) >= selection.displayOn))
          && (!selection.notificationsAfter || (entry.authorId !== "leader" && entry.updatedAt > selection.notificationsAfter && !(selection.notificationReads ?? []).some((read: { id: string; at: string }) => read.id === entry.id && read.at >= entry.updatedAt))));
        return route.fulfill({ json: { entries: matching.map((entry) => selection.notificationsAfter ? { ...entry, notificationAt: entry.updatedAt } : entry), total: matching.length, nextCursor: "" } });
      }
      if (path.endsWith("/handover/history")) {
        const entry = entries.find((entry) => entry.id === route.request().postDataJSON().id)!;
        return route.fulfill({ json: { entry, revisions: [], nextBefore: 0 } });
      }
      if (path.endsWith("/handover/completion-targets")) return route.fulfill({ json: { targets: entries.filter((entry) => ["problems", "performance"].includes(entry.content.categoryId) && entry.issueState === "open").map((entry) => ({
        source: "handover", id: entry.id, expectedRevision: entry.revision, title: entry.content.summary, location: entry.departmentLabel, canComplete: entry.authorId === "leader" })), total: 2, nextCursor: "" } });
      if (path.endsWith("/handover/entries")) {
        const input = route.request().postDataJSON(); publications.push(input);
        const entry = makeEntry(`publication-${publications.length}`, "leader", input.content.categoryId);
        entry.content = input.content; entry.issueState = input.issue ? "open" : "none";
        entry.completedReferences = (input.content.resolutions ?? []).map((reference: { source: "handover"; id: string }) => {
          const selected = entries.find((record) => record.id === reference.id)!; selected.issueState = "resolved"; selected.revision++;
          return { source: reference.source, id: selected.id, title: selected.content.summary, location: selected.departmentLabel };
        });
        entries = [...entries, entry]; return route.fulfill({ json: entry });
      }
      throw new Error(`Unexpected fixture request ${path}`);
    });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Active information" })).toContainText("Shared safety briefing");
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    const notices = page.getByRole("dialog", { name: "Notifications" });
    await notices.getByRole("button", { name: /Other technician report/ }).click();
    await expect(page.getByRole("heading", { name: "Other technician report", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    await expect(notices.getByRole("button", { name: /Other technician report/ })).toHaveCount(0);
    await expect(notices.getByRole("button", { name: /Shared safety briefing/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Shift Handover", exact: true }).click();
    const canvas = page.getByLabel("Daily category canvas");
    await canvas.getByRole("region", { name: "Information section", exact: true }).getByRole("button", { name: "Information", exact: true }).click();
    const expanded = page.getByRole("dialog", { name: "Information", exact: true });
    await expect(expanded.getByAltText("Briefing diagram").first()).toBeVisible();
    await expect(expanded.getByText("Full instructions for the next shift.").first()).toBeVisible();
    await page.screenshot({ path: `/private/tmp/iop-199-information-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await canvas.getByRole("region", { name: "People section", exact: true }).getByRole("button", { name: "People", exact: true }).click();
    const people = page.getByRole("dialog", { name: "People", exact: true });
    await expect(people.getByText("Lee Leader", { exact: true }).first()).toBeVisible();
    expect(workforceQueries.some((query) => query.from === "2026-10-07" && query.to === query.from)).toBe(true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "New entry", exact: true }).click();
    const form = page.getByRole("dialog", { name: "New handover entry" });
    await expect(form.getByLabel("Department / Halle", { exact: true })).toHaveValue("hall-a");
    await expect(form.getByLabel("Betriebsmittelkennzeichen", { exact: true })).toHaveCount(0);
    await form.getByLabel("Department / Halle", { exact: true }).selectOption("hall-b");
    await expect(form.getByLabel("Department / Halle", { exact: true })).toHaveValue("hall-b");
    await form.getByLabel("Date", { exact: true }).fill("2026-10-08");
    await expect(form.getByLabel("Department / Halle", { exact: true })).toHaveValue("");
    await form.getByLabel("Date", { exact: true }).fill("2026-10-07");
    await expect(form.getByLabel("Department / Halle", { exact: true })).toHaveValue("hall-a");
    await page.screenshot({ path: `/private/tmp/iop-199-safety-${width}.png`, fullPage: true });
    await form.getByLabel("Category", { exact: true }).selectOption("problems");
    await expect(form.getByLabel("Category", { exact: true }).locator("option")).not.toContainText(["Performance", "Problems"]);
    await form.getByLabel("Summary", { exact: true }).fill("Blocked sorting plant");
    await form.getByLabel("Reported condition", { exact: true }).selectOption("blocked");
    await form.getByRole("button", { name: "Publish update", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Blocked sorting plant", exact: true })).toBeVisible();
    expect(publications[0].content.categoryId).toBe("performance");
    expect(publications[0].issue).toBe(true);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Shift Handover", exact: true }).click();
    await expect(canvas).toContainText("3 current open issues");
    await page.getByRole("button", { name: "New entry", exact: true }).click();
    await form.getByLabel("Category", { exact: true }).selectOption("successes");
    await form.getByLabel("Summary", { exact: true }).fill("Drive checked and restored");
    await form.getByLabel(/Own technical report/).check();
    await form.getByLabel(/I confirm the selected work/).check();
    await page.screenshot({ path: `/private/tmp/iop-199-success-${width}.png`, fullPage: true });
    await form.getByRole("button", { name: "Publish update", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Completed records", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Track as issue", exact: true })).toHaveCount(0);
    expect(entries.find((entry) => entry.id === "Own technical report")?.issueState).toBe("resolved");
    expect(entries.find((entry) => entry.id === "Other technician report")?.issueState).toBe("open");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Shift Handover", exact: true }).click();
    await page.getByRole("navigation", { name: "Handover views" }).getByRole("button", { name: "Journal", exact: true }).click();
    await expect(page.getByRole("button", { name: /Other technician report/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Own technical report/ })).toBeVisible();
    expect(queries.some((selection) => selection.mine === true)).toBe(true);
    await page.screenshot({ path: `/private/tmp/iop-199-journal-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
