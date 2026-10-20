const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const root = resolve(__dirname, "../.."), file = resolve(root, ".local-platform/team-availability-demo-2026-10-19.json");
const action = process.argv[2] ?? "--preview";
if (process.argv.length > 3 || !["--preview", "--apply", "--inspect"].includes(action))
  throw new Error("Use local:team-availability-demo [--preview|--apply|--inspect].");
function execute(options) {
  const runner = readFileSync(resolve(__dirname, "team-availability-demo-runner.cjs"), "utf8");
  const input = `const runner=(()=>{const module={exports:{}};\n${runner}\nreturn module.exports;})();\nrunner.run(${JSON.stringify(options)}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const result = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "exec", "-T", "api", "node", "-"], { cwd: root, input, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "Local team availability demo operation failed.");
  return JSON.parse(result.stdout);
}
try {
  const original = JSON.parse(readFileSync(resolve(root, ".local-platform/operational-demos-2026-10-19.json"), "utf8"));
  let manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (!manifest && action === "--inspect") throw new Error("No retained team availability demo manifest exists.");
  if (!manifest) {
    const groups = JSON.parse(readFileSync(resolve(root, ".local-platform/config/workforce-groups.json"), "utf8"));
    manifest = execute({ action: "prepare", original, groups });
    writeFileSync(file, JSON.stringify(manifest, null, 2), { mode: 0o600, flag: "wx" });
  }
  console.log(JSON.stringify(execute({ action: action.slice(2), original, manifest }), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
