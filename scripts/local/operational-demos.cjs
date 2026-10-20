const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const root = resolve(__dirname, "../..");
const file = resolve(root, ".local-platform/operational-demos-2026-10-19.json");
const action = process.argv[2] ?? "--preview";
if (process.argv.length > 3 || !["--preview", "--apply", "--inspect"].includes(action))
  throw new Error("Use local:operational-demos [--preview|--apply|--inspect].");
function execute(options) {
  const runner = readFileSync(resolve(__dirname, "operational-demos-runner.cjs"), "utf8");
  const input = `const runner=(()=>{const module={exports:{}};\n${runner}\nreturn module.exports;})();\nrunner.run(${JSON.stringify(options)}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const result = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "exec", "-T", "api", "node", "-"],
    { cwd: root, input, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "Local operational demo operation failed.");
  return JSON.parse(result.stdout);
}
try {
  let manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (!manifest && action === "--inspect") throw new Error("No retained operational demo manifest exists.");
  if (!manifest) {
    manifest = execute({ action: "prepare" });
    // Preview freezes the reviewed plan privately; it never writes application records.
    writeFileSync(file, JSON.stringify(manifest, null, 2), { mode: 0o600, flag: "wx" });
  }
  console.log(JSON.stringify(execute({ action: action.slice(2), manifest }), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
