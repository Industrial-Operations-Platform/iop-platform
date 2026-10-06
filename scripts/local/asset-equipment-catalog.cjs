const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawn } = require("node:child_process");
const root = resolve(__dirname, "../..");
const manifestFile = resolve(
  root,
  ".local-platform/asset-equipment-catalog.json",
);
const argument = process.argv[2] ?? "--preview";
if (
  process.argv.length > 3 ||
  !["--preview", "--apply", "--inspect"].includes(argument)
)
  throw new Error("Use local:asset-catalog [--preview|--apply|--inspect].");
function execute(options) {
  const runner = readFileSync(
    resolve(__dirname, "asset-equipment-catalog-runner.cjs"),
    "utf8",
  );
  const source = `const runner = (() => { const module = { exports: {} };\n${runner}\nreturn module.exports; })();\nrunner.run(${JSON.stringify(options)}).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });`;
  return new Promise((resolveResult, reject) => {
    const child = spawn(
      "docker",
      [
        "compose",
        "-f",
        "compose.platform.yaml",
        "exec",
        "-T",
        "api",
        "node",
        "-",
      ],
      { cwd: root, stdio: ["pipe", "pipe", "pipe"] },
    );
    let output = "";
    let errors = "";
    child.stdout.on("data", (value) => {
      output += value;
    });
    child.stderr.on("data", (value) => {
      errors += value;
      process.stderr.write(value);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0)
        return reject(new Error(errors.trim() || "Catalog operation failed."));
      try {
        resolveResult(JSON.parse(output));
      } catch {
        reject(new Error("Invalid catalog operation response."));
      }
    });
    child.stdin.on("error", reject);
    child.stdin.end(source);
  });
}
async function main() {
  let manifest = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : null;
  if (!manifest && argument === "--inspect")
    throw new Error("No frozen equipment catalog manifest exists.");
  if (!manifest) {
    manifest = await execute({ action: "prepare" });
    // Preview freezes metadata only; database writes require the explicit apply mode.
    writeFileSync(manifestFile, JSON.stringify(manifest), {
      mode: 0o600,
      flag: "wx",
    });
  }
  const summary = await execute({ action: argument.slice(2), manifest });
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
