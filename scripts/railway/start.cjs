const { spawn } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const { materialize, runtimeEnvironment } = require("./configuration.cjs");
function main() {
  const env = materialize();
  // A volume also serializes replacements, respecting the application's singleton lease.
  if (env.RAILWAY_VOLUME_MOUNT_PATH !== "/data") throw new Error("Attach the application volume at /data before starting.");
  mkdirSync("/data/locator", { recursive: true, mode: 0o700 });
  env.IOP_LOCATOR_REFERENCE_ROOT = "/data/locator";
  env.IOP_WEB_ROOT = "/app/apps/web/dist";
  const child = spawn(process.execPath, ["apps/api/dist/main.js"], {
    cwd: "/app", stdio: "inherit", env: runtimeEnvironment(env),
  });
  for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => child.kill(signal));
  child.once("error", () => { console.error("Railway application could not start."); process.exitCode = 1; });
  child.once("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGTERM" ? 0 : 1); });
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
