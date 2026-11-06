const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const root = resolve(__dirname, "../..");
const cli = resolve(root, "node_modules/@railway/cli/bin/railway.js");
const binary = resolve(root, "node_modules/@railway/cli/bin", process.platform === "win32" ? "railway.exe" : "railway");
function railway(args, options = {}) {
  // The IaC SDK probes '_' for its CLI version. Pin it to the installed binary on Windows too.
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit", ...options, env: { ...process.env, _: binary, ...options.env } });
  if (result.status !== 0) throw new Error("Railway command failed. Check authentication, the selected environment and service.");
  return result;
}
if (require.main === module) {
  try { railway(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { railway, root };
