/** Exercise the explicit public-home access flow in real database/browser journeys. */
async function openWorkspaceAccess(page) {
  // The application's default follows the OS locale. Test labels are English on every runner.
  await page.evaluate(() => localStorage.setItem("iop.language", "en"));
  await page.reload();
  await page.getByRole("navigation", { name: "Platform navigation" })
    .getByRole("button", { name: "Sign in", exact: true }).click();
  return page.getByRole("dialog", { name: "Workspace access", exact: true });
}

function workspaceSignIn(page) {
  return page.getByRole("dialog", { name: "Workspace access", exact: true })
    .getByRole("button", { name: "Sign in", exact: true });
}

module.exports = { openWorkspaceAccess, workspaceSignIn };
