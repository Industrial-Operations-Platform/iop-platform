// Initial snapshot only. Normal deployments never restore or overwrite a database.
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");
const { spawn, spawnSync } = require("node:child_process");
const { join, resolve } = require("node:path");
const { createHash } = require("node:crypto");
const { root, railway } = require("./cli.cjs");
const { readTarget, validateTarget } = require("./configure.cjs");
const folder = join(root, ".railway/initial-snapshot");
const literal = value => "'" + value.replace(/'/g, "''") + "'";
function restoreGuard(passwords) {
  if (![passwords.IOP_MIGRATOR_PASSWORD, passwords.IOP_RUNTIME_PASSWORD].every(x => typeof x === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(x))) throw new Error("Use generated independent Railway credentials.");
  return `\\set ON_ERROR_STOP on\nBEGIN;\nSET standard_conforming_strings=on;\nSELECT pg_advisory_xact_lock(190019);\nDO $$ BEGIN
IF current_database()<>'iop_local' OR current_user<>'iop_bootstrap' OR EXISTS (
SELECT 1 FROM pg_namespace WHERE nspname NOT IN ('public','information_schema') AND nspname NOT LIKE 'pg_%')
OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f'))
OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('iop_migrator','iop_runtime'))
THEN RAISE EXCEPTION 'Initial import requires a new empty dedicated database and new application roles'; END IF;
END $$;
CREATE ROLE iop_migrator LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(passwords.IOP_MIGRATOR_PASSWORD)};
CREATE ROLE iop_runtime LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(passwords.IOP_RUNTIME_PASSWORD)};
REVOKE ALL ON DATABASE iop_local FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT, CREATE ON DATABASE iop_local TO iop_migrator;
GRANT CONNECT ON DATABASE iop_local TO iop_runtime;\n`;
}
const checksum = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function referenceManifest(root) {
  const files = []; let bytes = 0;
  function visit(directory, prefix = "", depth = 0) {
    if (depth > 5) throw new Error("Locator reference directory is too deep.");
    for (const name of fs.readdirSync(directory).sort()) {
      const file = join(directory, name), relative = prefix + name, stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error("Locator references cannot contain symbolic links.");
      if (stat.isDirectory()) visit(file, relative + "/", depth + 1);
      else {
        bytes += stat.size;
        if (!stat.isFile() || !/\.(png|json)$/.test(name) || stat.size > 16 * 1024 * 1024 || files.length >= 1500 || bytes > 256 * 1024 * 1024) throw new Error("Unsupported or oversized Locator reference input.");
        files.push({ path: relative, sha256: checksum(file) });
      }
    }
  }
  visit(root); return files;
}
function done(child) {
  return new Promise((accept, reject) => {
    child.once("error", () => reject(new Error("Snapshot process could not start.")));
    child.once("exit", code => code === 0 ? accept() : reject(new Error("Snapshot operation failed. Review Docker or Railway privately; existing remote data was preserved.")));
  });
}
async function snapshot() {
  if (fs.existsSync(folder)) throw new Error("An initial snapshot already exists. Keep it for this installation or move it privately before creating another.");
  const target = readTarget(); validateTarget(target);
  const passwords = JSON.parse(fs.readFileSync(join(root, ".railway/app.variables.json"), "utf8"));
  const guard = restoreGuard(passwords);
  const referenceRoot = join(root, ".local-platform/locator");
  const references = referenceManifest(referenceRoot);
  const probe = spawnSync("docker", ["compose", "-f", "compose.platform.yaml", "ps", "-q", "database"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const container = probe.stdout?.trim();
  if (probe.status !== 0 || !/^[a-f0-9]{12,64}$/.test(container ?? "")) throw new Error("Start local Docker with local:up before taking the current database snapshot.");
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const dump = join(folder, "database.sql"), plain = join(folder, "source.sql");
  try {
    const process = spawn("docker", ["exec", container, "pg_dump", "--username", "iop_bootstrap", "--dbname", "iop_local", "--no-password"], { stdio: ["ignore", "pipe", "ignore"] });
    await Promise.all([pipeline(process.stdout, fs.createWriteStream(plain, { mode: 0o600, flags: "wx" })), done(process)]);
    fs.writeFileSync(dump, guard, { mode: 0o600, flag: "wx" });
    await pipeline(fs.createReadStream(plain), fs.createWriteStream(dump, { flags: "a" }));
    fs.appendFileSync(dump, "\nUPDATE authentication.sessions SET revoked=true;\nCOMMIT;\n");
    fs.rmSync(plain);
    fs.cpSync(referenceRoot, join(folder, "locator"), { recursive: true, dereference: false });
    if (JSON.stringify(referenceManifest(join(folder, "locator"))) !== JSON.stringify(references) || JSON.stringify(referenceManifest(referenceRoot)) !== JSON.stringify(references)) throw new Error("Locator references changed during export; retry the snapshot.");
    fs.cpSync(join(root, ".local-platform/config"), join(folder, "config"), { recursive: true });
    fs.writeFileSync(join(folder, "manifest.json"), JSON.stringify({ format: 1, createdAt: new Date().toISOString(), project: target.project, environment: target.environment, databaseService: target.databaseService, sha256: checksum(dump), variablesSha256: checksum(join(root, ".railway/app.variables.json")), references }, null, 2), { mode: 0o600 });
    console.log("Current local database and Locator references copied privately to .railway/initial-snapshot. The SQL contains sensitive data and must remain outside Git.");
  } catch (error) { fs.rmSync(folder, { recursive: true, force: true }); throw error; }
}
async function restore() {
  const target = readTarget(); validateTarget(target);
  const manifest = JSON.parse(fs.readFileSync(join(folder, "manifest.json"), "utf8"));
  const file = join(folder, "database.sql");
  if (manifest.format !== 1 || ["project", "environment", "databaseService"].some(k => target[k] !== manifest[k]) || checksum(file) !== manifest.sha256 || checksum(join(root, ".railway/app.variables.json")) !== manifest.variablesSha256) throw new Error("Snapshot target, credentials or checksum do not match; nothing was uploaded.");
  const cli = join(root, "node_modules/@railway/cli/bin/railway.js");
  const child = spawn(process.execPath, [cli, "ssh", "--project", target.project, "--environment", target.environment,
    "--service", target.databaseService, ...(target.sshIdentity ? ["--identity-file", target.sshIdentity] : []), "--", "psql", "-X", "--username", "iop_bootstrap", "--dbname", "iop_local", "--no-password", "--set", "ON_ERROR_STOP=1"], { cwd: root, stdio: ["pipe", "ignore", "ignore"] });
  await Promise.all([pipeline(fs.createReadStream(file), child.stdin), done(child)]);
  console.log("Initial database import committed. Existing account passwords were retained; previous sessions were revoked. Normal code deployments never repeat this operation.");
}
function references() {
  const target = readTarget(); validateTarget(target);
  const manifest = JSON.parse(fs.readFileSync(join(folder, "manifest.json"), "utf8"));
  const source = join(folder, "locator");
  if (target.project !== manifest.project || target.environment !== manifest.environment || JSON.stringify(referenceManifest(source)) !== JSON.stringify(manifest.references)) throw new Error("Reference snapshot or target does not match.");
  if (!target.sshIdentity || !fs.existsSync(target.sshIdentity)) throw new Error("Configure a dedicated SSH identity before transferring initial references.");
  const selection = ["--project", target.project, "--environment", target.environment, "--service", target.service, "--identity-file", target.sshIdentity];
  const config = railway(["ssh", "config", ...selection, "--dry-run"], { stdio: "pipe", encoding: "utf8" }).stdout;
  const host = config.match(/^\s+HostName\s+(\S+)/m)?.[1], user = config.match(/^\s+User\s+(\S+)/m)?.[1];
  if (host !== "ssh.railway.com" || !/^[a-f0-9-]{36}$/.test(user ?? "")) throw new Error("Unexpected Railway SSH target.");
  railway(["ssh", ...selection, "--", "node", "scripts/railway/install-references.cjs", "--check-empty"]);
  const upload = spawnSync("scp", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", target.sshIdentity, "-r", source, `${user}@${host}:/data/`], { cwd: root, stdio: "inherit" });
  if (upload.status !== 0) throw new Error("Reference upload failed; inspect the partial transfer before retrying.");
  railway(["ssh", ...selection, "--", "node", "scripts/railway/install-references.cjs"]);
  console.log("Initial Locator references uploaded with private ownership. Normal code updates preserve them.");
}
async function main() {
  if (process.argv.length !== 3) throw new Error("Use railway:snapshot or railway:import-initial without arguments.");
  if (process.argv[2] === "snapshot") await snapshot();
  else if (process.argv[2] === "restore") await restore();
  else if (process.argv[2] === "references") references();
  else throw new Error("Unsupported initial data operation.");
}
if (require.main === module) main().catch(() => { console.error("Initial transfer did not complete. Check the selected service, an empty target, the private snapshot and SSH access. No automatic retry or overwrite was attempted."); process.exitCode = 1; });
module.exports = { restoreGuard };
