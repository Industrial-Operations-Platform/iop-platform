const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { run } = require("./handover-demo-runner.cjs");

const root = resolve(__dirname, "../..");
const manifestFile = resolve(root, ".local-platform/handover-demo.json");
const argument = process.argv[2] ?? "--preview";
if (
  process.argv.length > 3 ||
  !["--preview", "--apply", "--inspect"].includes(argument)
)
  throw new Error("Use local:handover-demo [--preview|--apply|--inspect].");
function execute(options) {
  const fixture = readFileSync(
    resolve(__dirname, "handover-demo-scenarios.cjs"),
    "utf8",
  );
  const source = `const fixture = (() => { const module = { exports: {} };\n${fixture}\nreturn module.exports; })();\n(${run.toString()})(${JSON.stringify(options)}, fixture).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });`;
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
    throw new Error(result.stderr?.trim() || "Local demo operation failed.");
  return JSON.parse(result.stdout);
}
try {
  let manifest = existsSync(manifestFile)
    ? JSON.parse(readFileSync(manifestFile, "utf8"))
    : null;
  if (argument === "--inspect") {
    if (!manifest) throw new Error("No local demo manifest exists.");
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
            entries: manifest.scenarios.length,
            anchorDate: manifest.today,
            departments: [
              ...new Set(
                manifest.scenarios.map((entry) => entry.content.departmentId),
              ),
            ],
            authors: new Set(manifest.scenarios.map((entry) => entry.actor))
              .size,
            baseline: manifest.baseline,
            writes: false,
          },
          null,
          2,
        ),
      );
    else {
      const { results, ...summary } = execute({ action: "apply", manifest });
      console.log(
        JSON.stringify({ ...summary, processed: results.length }, null, 2),
      );
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
