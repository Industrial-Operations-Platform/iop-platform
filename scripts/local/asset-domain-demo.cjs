const {
    readFileSync,
    writeFileSync,
    existsSync
  } = require("node:fs"),
  {
    resolve
  } = require("node:path"),
  {
    spawnSync
  } = require("node:child_process"),
  {
    run
  } = require("./asset-domain-demo-runner.cjs");
const root = resolve(__dirname, "../.."),
  file = resolve(root, ".local-platform/asset-domain-demo.json"),
  argument = process.argv[2] ?? "--preview";
if (process.argv.length > 3 || !["--preview", "--apply"].includes(argument)) throw new Error("Use node scripts/local/asset-domain-demo.cjs [--preview|--apply].");
function execute(options) {
  const source = `(${run.toString()})(${JSON.stringify(options)}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const result = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "exec", "-T", "api", "node", "-"], {
    cwd: root,
    input: source,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "Synthetic model operation failed.");
  return JSON.parse(result.stdout);
}
try {
  let manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (!manifest) {
    manifest = execute({
      action: "prepare"
    });
    if (argument === "--apply") writeFileSync(file, JSON.stringify(manifest, null, 2), {
      mode: 0o600,
      flag: "wx"
    });
  }
  console.log(JSON.stringify(execute({
    action: argument.slice(2),
    manifest
  }), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
