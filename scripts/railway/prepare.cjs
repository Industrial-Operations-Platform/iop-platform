// Runs in Railway's pre-deploy container, before the replacement is activated.
const { materialize } = require("./configuration.cjs");
async function main() {
  const env = materialize();
  await require("../local/initialize.cjs").initializeDatabase(env);
  console.log("Railway database provisioning and forward migrations completed.");
}
if (require.main === module) main().catch(() => {
  console.error("Railway preparation failed. Check private configuration and database health; deployment was stopped.");
  process.exitCode = 1;
});
module.exports = { main };
