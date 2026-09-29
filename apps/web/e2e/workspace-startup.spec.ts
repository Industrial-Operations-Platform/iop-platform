import { expect, test } from "@playwright/test";

test("the built workspace uses the real health/context proxy even with the retired preview flag", async ({
  page,
  request,
}) => {
  const health = await request.get("/health");
  expect(health.ok()).toBe(true);
  await page.goto("/?preview=1");
  await expect(
    page.getByRole("heading", { name: "Data analysis" }),
  ).toBeVisible();
  await expect(
    page.getByText("Connect the local API to open the analytical workspace."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry connection" }),
  ).toBeEnabled();
  await expect(
    page.getByText("Navigation preview", { exact: false }),
  ).toHaveCount(0);
});

for (const width of [1440, 375]) {
  test(`workspace connection recovery and keyboard navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let available = false;
    await page.route("**/api/v1/session/context", (route) =>
      available
        ? route.fulfill({
            json: {
              enabled: true,
              canImport: false,
              user: null,
              users: [{ id: "reader", name: "Reader" }],
              scope: null,
            },
          })
        : route.fulfill({
            status: 503,
            json: { type: "urn:iop:problem:service-unavailable", status: 503 },
          }),
    );
    await page.goto("/");
    await expect(page.getByRole("alert")).toBeVisible();
    available = true;
    await page.getByRole("button", { name: "Retry connection" }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Demo user" }),
    ).toContainText("Reader");
    await page
      .getByRole("button", { name: "Data analysis", exact: true })
      .click();
    await expect(
      page.getByText("Select a user in the header to open the workspace."),
    ).toBeVisible();
    await page.getByRole("link", { name: "Skip to workspace" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#analysis-main$/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
