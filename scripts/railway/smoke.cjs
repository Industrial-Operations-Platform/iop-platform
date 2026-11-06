const { setTimeout: delay } = require("node:timers/promises");
async function smoke(origin, attempts = 60, pause = 5000, expectedRevision) {
  const url = new URL(origin);
  if (url.origin !== origin || url.protocol !== "https:") throw new Error("Set IOP_PUBLIC_ORIGIN to the exact HTTPS application origin.");
  for (let i = 0; i < attempts; i++) {
    try {
      const health = await fetch(origin + "/health", { signal: AbortSignal.timeout(10000), redirect: "error" });
      const web = await fetch(origin + "/", { signal: AbortSignal.timeout(10000), redirect: "error" });
      const context = await fetch(origin + "/api/v1/demo/context", { signal: AbortSignal.timeout(10000), redirect: "error" });
      const users = await fetch(origin + "/api/v1/users", { signal: AbortSignal.timeout(10000), redirect: "error" });
      const revision = expectedRevision ? await fetch(origin + "/build-revision.json", { signal: AbortSignal.timeout(10000), redirect: "error", cache: "no-store" }) : null;
      const identity = context.ok ? await context.json() : null;
      if (health.ok && (await health.json()).status === "ok" && web.ok &&
          web.headers.get("content-type")?.includes("text/html") && users.status === 401 &&
          identity?.enabled === true && identity.authentication === "password" && identity.user === null && identity.scope === null &&
          (!expectedRevision || (revision?.ok && (await revision.json()).revision === expectedRevision))) {
        console.log("HTTPS web and API respond; anonymous business access is denied.");
        return;
      }
    } catch { /* A replacement may still be starting; retry within the deployment window. */ }
    if (i + 1 < attempts) await delay(pause);
  }
  throw new Error("Live verification did not pass. Inspect Railway deployment health and logs before sharing the URL.");
}
if (require.main === module) smoke(require("./configure.cjs").readTarget().origin, 60, 5000, process.env.IOP_EXPECTED_REVISION).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { smoke };
