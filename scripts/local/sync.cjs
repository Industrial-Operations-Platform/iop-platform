// Optional source update. Fast-forward only; never overwrite local work or resolve merges.
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const root = resolve(__dirname, "../..");
function run(command, args, capture = false) {
  const result = spawnSync(command, args, { cwd: root, stdio: capture ? "pipe" : "inherit", encoding: "utf8" });
  if (result.status !== 0) throw new Error("Source update failed. Existing containers and data were preserved.");
  return result.stdout;
}
try {
  if (process.argv.length !== 2) throw new Error("Use npm run local:sync without arguments.");
  if (run("git", ["status", "--porcelain"], true).trim()) throw new Error("Commit or stash your changes before local:sync; use local:update to rebuild current files.");
  run("git", ["pull", "--ff-only"]);
  run(process.execPath, ["scripts/local/platform.cjs", "update"]);
} catch (error) { console.error(error.message); process.exitCode = 1; }
