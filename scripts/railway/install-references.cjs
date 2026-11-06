// Explicit one-time operator command, executed over SSH after the initial upload.
const fs = require("node:fs");
const { copyReferences } = require("../local/locator-private-copy.cjs");
try {
  if (process.env.IOP_EXECUTION_MODE !== "railway" || process.getuid() !== 0) throw new Error();
  const target = "/data/locator";
  if (process.argv[2] === "--check-empty") {
    if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error();
    console.log("Initial Locator destination is empty.");
  } else {
    if (process.argv.length !== 2) throw new Error();
    // Inspect first, then atomically replace each uploaded file with a private Node-owned copy.
    const result = copyReferences(target, target);
    console.log(`Installed ${result.files} initial Locator references with private Node-owned permissions.`);
  }
} catch {
  console.error("Initial references were not installed. Check the upload and an empty destination; existing references were preserved.");
  process.exitCode = 1;
}
