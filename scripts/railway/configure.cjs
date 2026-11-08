const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { randomBytes } = require("node:crypto");
const { railway, root } = require("./cli.cjs");
const directory = join(root, ".railway");
const targetFile = join(directory, "target.json");
function readTarget(env = process.env) {
  const target = existsSync(targetFile) ? JSON.parse(readFileSync(targetFile, "utf8")) : {};
  return {
    project: env.RAILWAY_PROJECT_ID || target.project,
    environment: env.RAILWAY_ENVIRONMENT_ID || target.environment,
    service: env.RAILWAY_SERVICE_ID || target.service,
    databaseService: env.RAILWAY_DATABASE_SERVICE_ID || target.databaseService,
    origin: env.IOP_PUBLIC_ORIGIN || target.origin,
    sshIdentity: env.IOP_RAILWAY_SSH_IDENTITY || target.sshIdentity,
  };
}
function validateTarget(target) {
  if (![target.project, target.environment, target.service, target.databaseService].every(x => typeof x === "string" && /^[a-zA-Z0-9_-]+$/.test(x))) throw new Error("Supply explicit Railway project, environment, application and database service IDs.");
  require("../../apps/api/dist/host/remote-transport").remoteOrigin(target.origin);
  if (target.service === target.databaseService) throw new Error("Application and database must be separate services.");
}
function configure(args) {
  const names = { "--project": "project", "--environment": "environment", "--service": "service", "--database-service": "databaseService", "--origin": "origin" };
  const target = readTarget();
  for (let i = 0; i < args.length; i += 2) {
    if (!names[args[i]] || !args[i + 1]) throw new Error("Use paired --project, --environment, --service, --database-service and --origin options.");
    target[names[args[i]]] = args[i + 1];
  }
  validateTarget(target);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const appFile = join(directory, "app.variables.json");
  const prior = existsSync(appFile) ? JSON.parse(readFileSync(appFile, "utf8")) : null;
  const databaseFile = join(directory, "database.variables.json");
  if (!prior && existsSync(databaseFile)) throw new Error("Restore app.variables.json before reconfiguring an existing Railway installation; credentials were not regenerated.");
  if (prior && existsSync(targetFile)) {
    const old = JSON.parse(readFileSync(targetFile, "utf8"));
    if (["project", "environment", "service", "databaseService"].some(k => target[k] !== old[k])) throw new Error("Use a separate checkout for another Railway installation; existing credentials were preserved.");
  }
  const source = join(root, ".local-platform/config");
  const read = name => JSON.parse(readFileSync(join(source, name + ".json"), "utf8"));
  const users = read("users");
  users.origins = [target.origin];
  const secret = () => randomBytes(32).toString("base64url");
  const app = {
    // NODE_ENV selects the optimized Node runtime, independently of the Railway environment name.
    NODE_ENV: "production", HOST: "0.0.0.0", IOP_TRANSPORT: "container",
    IOP_EXECUTION_MODE: "railway", IOP_DATABASE_MODE: "railway", IOP_AUTHENTICATION: "password",
    IOP_DATABASE_HOST: "${{database.RAILWAY_PRIVATE_DOMAIN}}", IOP_DATABASE_PORT: "5432", IOP_DATABASE_NAME: "iop_local",
    IOP_POSTGRES_PASSWORD: prior?.IOP_POSTGRES_PASSWORD || secret(),
    IOP_MIGRATOR_PASSWORD: prior?.IOP_MIGRATOR_PASSWORD || secret(),
    IOP_RUNTIME_PASSWORD: prior?.IOP_RUNTIME_PASSWORD || secret(),
    IOP_SCOPE_JSON: JSON.stringify(read("scope")), IOP_USERS_JSON: JSON.stringify(users),
    IOP_MAPPINGS_JSON: JSON.stringify(read("mappings")), IOP_HANDOVER_JSON: JSON.stringify(read("handover")),
    NODE_OPTIONS: "--max-old-space-size=384",
  };
  const database = { POSTGRES_DB: "iop_local", POSTGRES_USER: "iop_bootstrap", POSTGRES_PASSWORD: app.IOP_POSTGRES_PASSWORD, PGDATA: "/var/lib/postgresql/data/pgdata" };
  writeFileSync(appFile, JSON.stringify(app, null, 2), { mode: 0o600 });
  writeFileSync(databaseFile, JSON.stringify(database, null, 2), { mode: 0o600 });
  writeFileSync(targetFile, JSON.stringify(target, null, 2), { mode: 0o600 });
  console.log("Prepared private Railway configuration in .railway/. Remote credentials are independent of local Docker; existing remote secrets were preserved.");
}
function pushVariables() {
  const target = readTarget(); validateTarget(target);
  for (const [file, service] of [["database.variables.json", target.databaseService], ["app.variables.json", target.service]]) {
    const variables = JSON.parse(readFileSync(join(directory, file), "utf8"));
    for (const [key, value] of Object.entries(variables)) railway(["variable", "set", key, "--stdin", "--skip-deploys", "--project", target.project, "--service", service, "--environment", target.environment], { input: value, stdio: ["pipe", "inherit", "inherit"] });
  }
  console.log("Railway variables configured without printing their values. Deploy the database, then the application.");
}
if (require.main === module) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === "prepare") configure(args);
    else if (command === "push" && !args.length) pushVariables();
    else throw new Error("Use railway:configure or railway:variables.");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { readTarget, validateTarget, configure };
