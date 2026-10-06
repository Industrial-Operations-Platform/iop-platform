const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const root = resolve(__dirname, "../..");
const manifestFile = resolve(
  root,
  ".local-platform/linked-maintenance-demo.json",
);
const argument = process.argv[2] ?? "--preview";
if (
  process.argv.length > 3 ||
  !["--preview", "--apply", "--inspect"].includes(argument)
)
  throw new Error(
    "Use local:linked-maintenance-demo [--preview|--apply|--inspect].",
  );
function execute(options) {
  const runner = readFileSync(
    resolve(__dirname, "linked-maintenance-demo-runner.cjs"),
    "utf8",
  );
  const source = `const runner=(()=>{const module={exports:{}};\n${runner}\nreturn module.exports;})();\nrunner.run(${JSON.stringify(options)}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const result = spawnSync(
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
    { cwd: root, input: source, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (result.status !== 0)
    throw new Error(
      result.stderr?.trim() || "Local linked demo operation failed.",
    );
  return JSON.parse(result.stdout);
}
try {
  let manifest = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : null;
  if (argument === "--inspect") {
    if (!manifest) throw new Error("No local linked demo manifest exists.");
    console.log(
      JSON.stringify(execute({ action: "inspect", manifest }), null, 2),
    );
  } else {
    if (!manifest) {
      manifest = execute({ action: "prepare" });
      if (argument === "--apply")
        writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), {
          mode: 0o600,
          flag: "wx",
        });
    }
    if (argument === "--preview")
      console.log(
        JSON.stringify(
          {
            assets: manifest.assets.length,
            problems: manifest.issues.length,
            maintenance: manifest.records.length,
            date: manifest.today,
            existingReportsExcluded: manifest.exclusions.length,
            writes: false,
          },
          null,
          2,
        ),
      );
    else
      console.log(
        JSON.stringify(execute({ action: "apply", manifest }), null, 2),
      );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
