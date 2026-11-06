// Verify row counts against the exact initial pg_dump without printing business records.
const fs = require("node:fs");
const readline = require("node:readline");
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const { root } = require("./cli.cjs");
const { readTarget, validateTarget } = require("./configure.cjs");
async function main() {
  const target = readTarget(); validateTarget(target);
  if (!target.sshIdentity) throw new Error("Configure the dedicated SSH identity.");
  const expected = {}; let table;
  for await (const line of readline.createInterface({ input: fs.createReadStream(join(root, ".railway/initial-snapshot/database.sql")), crlfDelay: Infinity })) {
    const match = line.match(/^COPY ([a-z_]+\.[a-z_]+) \(/);
    if (match) { table = match[1]; expected[table] = 0; }
    else if (line === "\\.") table = undefined;
    else if (table) expected[table]++;
  }
  if (!Object.keys(expected).length) throw new Error("No data tables found in the initial snapshot.");
  const sql = `BEGIN; CREATE TEMP TABLE initial_counts(name text,rows bigint);
DO $$ DECLARE r record; n bigint; BEGIN FOR r IN SELECT schemaname,tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') AND schemaname NOT LIKE 'pg_%' LOOP
EXECUTE format('SELECT count(*) FROM %I.%I',r.schemaname,r.tablename) INTO n;
INSERT INTO initial_counts VALUES(r.schemaname||'.'||r.tablename,n); END LOOP; END $$;
SELECT json_object_agg(name,rows) FROM initial_counts; ROLLBACK;`;
  const config = spawnSync(process.execPath, [join(root, "scripts/railway/cli.cjs"), "ssh", "config", "--project", target.project, "--environment", target.environment, "--service", target.databaseService, "--identity-file", target.sshIdentity, "--dry-run"], { encoding: "utf8" });
  const host = config.stdout?.match(/^\s+HostName\s+(\S+)/m)?.[1], user = config.stdout?.match(/^\s+User\s+(\S+)/m)?.[1];
  if (config.status !== 0 || host !== "ssh.railway.com" || !/^[a-f0-9-]{36}$/.test(user ?? "")) throw new Error("Unable to resolve the selected Railway database.");
  const result = spawnSync("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", target.sshIdentity, `${user}@${host}`, "psql", "-X", "-U", "iop_bootstrap", "-d", "iop_local", "-qAt", "--set", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8", timeout: 60000 });
  if (result.status !== 0) throw new Error("Initial data verification failed; inspect private database diagnostics.");
  const actual = JSON.parse(result.stdout);
  const mismatch = Object.keys(expected).filter(name => Number(actual[name]) !== expected[name]);
  if (mismatch.length) throw new Error("Initial data row counts differ from the snapshot; do not share the deployment yet.");
  console.log(`Verified ${Object.keys(expected).length} copied tables against the initial snapshot; business data was not printed.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
