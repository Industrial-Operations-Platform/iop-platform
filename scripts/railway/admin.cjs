// Run interactively through Railway SSH. Never use deployment logs for one-time passwords.
const { materialize } = require("./configuration.cjs");
async function main() {
  Object.assign(process.env, materialize());
  await require("../local/bootstrap-access.cjs").main();
}
main().catch(() => { console.error("Railway administrator command failed; existing accounts were preserved."); process.exitCode = 1; });
