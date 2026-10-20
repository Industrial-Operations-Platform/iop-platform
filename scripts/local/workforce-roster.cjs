const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareRoster, run } = require("./workforce-roster-runner.cjs");
const file = process.argv[2], action = process.argv[3] ?? "--preview";
if (!file || process.argv.length > 4 || !["--preview", "--apply"].includes(action))
  throw new Error("Use node scripts/local/workforce-roster.cjs /private/roster.json [--preview|--apply].");
const content = readFileSync(file, "utf8");
if (Buffer.byteLength(content) > 65536) throw new Error("Roster file exceeds 64 KiB.");
const input = JSON.parse(content);
const source = `(${run.toString()})(${JSON.stringify(input)},${action === "--apply"},${prepareRoster.toString()}).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });`;
const result = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "exec", "-T", "api", "node", "-"], {
  cwd: resolve(__dirname, "../.."), input: source, encoding: "utf8", maxBuffer: 2 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
