/** Exercise the explicit public-home access flow in real database/browser journeys. */
async function openWorkspaceAccess(page) {
  await page.getByRole("navigation", { name: "Platform navigation" })
    .getByRole("button", { name: "Sign in", exact: true }).click();
  return page.getByRole("dialog", { name: "Workspace access", exact: true });
}

function workspaceSignIn(page) {
  return page.getByRole("dialog", { name: "Workspace access", exact: true })
    .getByRole("button", { name: "Sign in", exact: true });
}

module.exports = { openWorkspaceAccess, workspaceSignIn };
