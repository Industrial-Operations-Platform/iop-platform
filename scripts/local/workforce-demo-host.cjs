const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
if (process.argv.length !== 3)
  throw new Error(
    "Usage: npm run local:workforce-demo -- /private/path/to/password.txt",
  );
const password = readFileSync(process.argv[2], "utf8").trim();
if (password.length < 15 || password.length > 128)
  throw new Error("Test password must contain 15–128 characters.");
const result = spawnSync(
  "docker",
  [
    "compose",
    "-f",
    "compose.platform.yaml",
    "run",
    "--rm",
    "-T",
    "--no-deps",
    "setup",
    "node",
    "scripts/local/workforce-demo.cjs",
  ],
  {
    cwd: resolve(__dirname, "../.."),
    input: JSON.stringify({ password }),
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
