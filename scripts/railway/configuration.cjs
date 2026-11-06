const { writeFileSync, mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

function materialize(env = process.env) {
  if (env.IOP_EXECUTION_MODE !== "railway" || env.IOP_DATABASE_MODE !== "railway" ||
      env.IOP_AUTHENTICATION !== "password" || env.IOP_TRANSPORT !== "container" ||
      env.HOST !== "0.0.0.0" || env.NODE_ENV !== "production") {
    throw new Error("Explicit Railway password-authenticated production mode is required.");
  }
  const directory = mkdtempSync(join(tmpdir(), "iop-railway-"));
  const files = {
    IOP_SCOPE_JSON: ["scope.json", "IOP_CONFIG_FILE", 16384],
    IOP_USERS_JSON: ["users.json", "IOP_LOCAL_IDENTITY_FILE", 16384],
    IOP_MAPPINGS_JSON: ["mappings.json", "IOP_MAPPING_CONFIG_FILE", 4 * 1024 * 1024],
    IOP_HANDOVER_JSON: ["handover.json", "IOP_HANDOVER_CONFIG_FILE", 262144],
  };
  const result = { ...env };
  for (const [key, [name, target, limit]] of Object.entries(files)) {
    const value = env[key];
    if (!value || Buffer.byteLength(value) > limit) throw new Error(`Missing or oversized ${key}.`);
    try { JSON.parse(value); } catch { throw new Error(`Invalid ${key}.`); }
    const file = join(directory, name);
    writeFileSync(file, value, { mode: 0o600, flag: "wx" });
    result[target] = file;
    delete result[key];
  }
  // Validate all origin, identity and mapping boundaries before touching the database.
  require("../../apps/api/dist/host/runtime").readLocalIdentityConfiguration(result);
  return result;
}

function runtimeEnvironment(env) {
  const result = { ...env };
  for (const key of Object.keys(result)) {
    if (/^(?:IOP_POSTGRES_PASSWORD|IOP_MIGRATOR_PASSWORD|IOP_INITIAL_ADMIN_PASSWORD|DATABASE_URL|PG[A-Z_]*|RAILWAY_TOKEN|RAILWAY_API_TOKEN)$/.test(key)) delete result[key];
  }
  return result;
}

module.exports = { materialize, runtimeEnvironment };
