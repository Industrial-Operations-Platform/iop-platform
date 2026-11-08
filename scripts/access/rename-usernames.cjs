const { spawnSync } = require("node:child_process");
const { writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const { railway, root } = require("../railway/cli.cjs");

// Match the existing ASCII, case-insensitive authentication contract.
function personalUsername(name) {
  const parts = String(name ?? "").trim().split(/\s+/);
  if (parts.length < 2) return null;
  const ascii = parts.slice(0, 2).join("").toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .normalize("NFKD").replace(/\p{M}/gu, "").replace(/['’\-]/g, "");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(ascii))
    throw new Error("A personal name needs an explicit ASCII username; no changes were applied.");
  return ascii;
}
function prepare(rows) {
  const names = new Set();
  const changes = [], skipped = [];
  for (const row of rows) {
    const username = row.visible ? personalUsername(row.name) : null;
    const next = username ?? row.username;
    const key = JSON.stringify([row.organizationId, next]);
    if (names.has(key)) throw new Error("Personal usernames conflict; resolve the duplicate names before applying.");
    names.add(key);
    if (!username) skipped.push({ userId: row.userId, username: row.username });
    if (next !== row.username) changes.push({ ...row, next });
  }
  return { changes, skipped };
}
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
const inventorySql = `SELECT coalesce(json_agg(x ORDER BY x."userId"),'[]'::json) FROM (
  SELECT c.organization_id AS "organizationId",c.user_id AS "userId",c.username,
    p.display_name AS name,p.deleted_at IS NULL AND p.user_id IS NOT NULL AS visible,
    md5((to_jsonb(c)-'username')::text) AS fingerprint
  FROM authentication.credentials c LEFT JOIN users_rbac.profiles p USING(organization_id,user_id)
) x;`;
function applySql(changes, commit = true) {
  if (!changes.length) throw new Error("No username changes to apply.");
  const values = changes.map(row => `(${[row.organizationId, row.userId, row.username, row.next, row.name, row.fingerprint, randomUUID()].map(literal).join(",")})`).join(",\n");
  return `BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
LOCK TABLE authentication.credentials,users_rbac.profiles IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE username_plan(org text,id text,previous text,next text,name text,fingerprint text,audit_id text) ON COMMIT DROP;
INSERT INTO username_plan VALUES ${values};
DO $$ BEGIN
  IF (SELECT count(*) FROM username_plan p JOIN authentication.credentials c ON c.organization_id=p.org AND c.user_id=p.id
      JOIN users_rbac.profiles u ON u.organization_id=p.org AND u.user_id=p.id
      WHERE c.username=p.previous AND md5((to_jsonb(c)-'username')::text)=p.fingerprint AND u.display_name=p.name AND u.deleted_at IS NULL)
      <> (SELECT count(*) FROM username_plan) THEN RAISE EXCEPTION 'Account changed since preview'; END IF;
  IF EXISTS (SELECT 1 FROM username_plan p JOIN authentication.credentials c ON c.organization_id=p.org AND c.username=p.next AND c.user_id<>p.id)
    THEN RAISE EXCEPTION 'Username already in use'; END IF;
END $$;
UPDATE authentication.credentials c SET username=p.next FROM username_plan p WHERE c.organization_id=p.org AND c.user_id=p.id;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM username_plan p JOIN authentication.credentials c ON c.organization_id=p.org AND c.user_id=p.id
    WHERE c.username<>p.next OR md5((to_jsonb(c)-'username')::text)<>p.fingerprint)
    THEN RAISE EXCEPTION 'Credential preservation check failed'; END IF;
END $$;
INSERT INTO users_rbac.access_audit(id,organization_id,actor_id,subject_id,action,detail)
SELECT p.audit_id,p.org,'operator:personal-usernames',p.id,'user.username_changed',
jsonb_build_object('before',p.previous,'after',p.next,'source','operator') FROM username_plan p;
${commit ? "COMMIT" : "ROLLBACK"};`;
}
function transport(destination) {
  const psql = ["psql", "-X", "-q", "-t", "-A", "-U", "iop_bootstrap", "-d", "iop_local", "--set", "ON_ERROR_STOP=1"];
  if (destination === "local") return { directory: ".local-platform", target: { installation: "local" }, sql: input => {
    const result = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "exec", "-T", "database", ...psql], { cwd: root, input, encoding: "utf8", timeout: 60000 });
    if (result.status !== 0) throw new Error("Local username operation failed; inspect Docker/database diagnostics.");
    return result.stdout;
  } };
  if (destination !== "railway") throw new Error("Choose local or railway explicitly.");
  const target = require("../railway/configure.cjs").readTarget();
  require("../railway/configure.cjs").validateTarget(target);
  railway(["link", "--project", target.project, "--environment", target.environment, "--service", target.service], { stdio: "pipe" });
  const status = JSON.parse(railway(["status", "--json"], { stdio: "pipe", encoding: "utf8" }).stdout);
  if (status.id !== target.project || !status.environments.edges.some(({ node }) => node.id === target.environment && node.name === "development"))
    throw new Error("This operator command is restricted to Railway development.");
  return { directory: ".railway", target: { project: target.project, environment: target.environment, service: target.databaseService }, sql: input =>
    railway(["ssh", "--project", target.project, "--environment", target.environment, "--service", target.databaseService,
      "--identity-file", target.sshIdentity, "--", ...psql], { input, stdio: "pipe", encoding: "utf8", timeout: 60000 }).stdout };
}
function main(args = process.argv.slice(2)) {
  const [destination, action = "--preview"] = args;
  if (args.length > 2 || !["--preview", "--apply"].includes(action)) throw new Error("Use users:rename -- local|railway [--preview|--apply].");
  const remote = transport(destination);
  const rows = JSON.parse(remote.sql(inventorySql));
  const plan = prepare(rows);
  if (action === "--apply" && plan.changes.length) {
    const directory = join(root, remote.directory, "username-changes", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeFileSync(join(directory, "plan.json"), JSON.stringify({ target: remote.target, ...plan }, null, 2), { mode: 0o600, flag: "wx" });
    // Run the complete transaction once with rollback before committing it.
    remote.sql(applySql(plan.changes, false));
    remote.sql(applySql(plan.changes));
    const after = JSON.parse(remote.sql(inventorySql));
    const expected = rows.map(row => ({ ...row, username: plan.changes.find(change => change.userId === row.userId && change.organizationId === row.organizationId)?.next ?? row.username }));
    if (JSON.stringify(after) !== JSON.stringify(expected)) throw new Error("Post-change verification differs; inspect the private plan.");
    writeFileSync(join(directory, "verified.json"), JSON.stringify({ verifiedAt: new Date().toISOString(), changed: plan.changes.length }), { mode: 0o600 });
  }
  console.log(JSON.stringify({ destination, applied: action === "--apply", changed: plan.changes.length,
    changes: plan.changes.map(row => ({ from: row.username, to: row.next })), skipped: plan.skipped }, null, 2));
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { personalUsername, prepare, applySql };
