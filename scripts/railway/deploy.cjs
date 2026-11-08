const { spawnSync } = require("node:child_process");
const { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync, existsSync, lstatSync, readdirSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { tmpdir } = require("node:os");
const { railway, root } = require("./cli.cjs");
const { inspect } = require("../check-secrets.cjs");
const { readTarget, validateTarget } = require("./configure.cjs");

// An allowlist is intentional: Railway must never upload the working directory wholesale.
const inputs = ["package.json", "package-lock.json", ".dockerignore",
  "apps/api/package.json", "apps/api/tsconfig.json", "apps/api/tsconfig.build.json", "apps/api/src",
  "apps/web/package.json", "apps/web/tsconfig.json", "apps/web/vite.config.ts", "apps/web/index.html",
  "apps/web/jest.config.cjs", "apps/web/test/design-boundaries.spec.ts", "apps/web/src", "apps/web/public",
  "infra/database", "infra/railway", "scripts/railway", "scripts/check-secrets.cjs",
  "scripts/local/initialize.cjs", "scripts/local/bootstrap-access.cjs", "scripts/local/locator-private-copy.cjs"];
function run(file, args, capture = false) {
  const result = spawnSync(file, args, { cwd: root, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.status !== 0) throw new Error("Deployment validation failed; no code was uploaded.");
  return result.stdout;
}
function cleanTree() {
  if (run("git", ["status", "--porcelain"], true).trim()) throw new Error("Commit all intended changes before deploying so the published version is reproducible.");
  return run("git", ["rev-parse", "HEAD"], true).trim();
}
function validateDevelopmentDeployment(branch, status, target) {
  if (branch !== "develop") throw new Error("Railway development deployments must use the develop branch.");
  const environment = status.environments?.edges?.find(({ node }) => node.id === target.environment)?.node;
  if (status.id !== target.project || environment?.name !== "development") {
    throw new Error("The selected Railway target must be the development environment. Production is not configured.");
  }
}
function inspectDeploymentTarget(target, env = process.env, execute = railway) {
  const { project, environment, service } = target;
  // Linking enumerates user workspaces, which project-scoped CI tokens cannot read.
  if (!env.RAILWAY_TOKEN) {
    execute(["link", "--project", project, "--environment", environment, "--service", service]);
  }
  return JSON.parse(execute(["status", "--project", project, "--environment", environment, "--json"],
    { stdio: "pipe", encoding: "utf8" }).stdout);
}
function copyInput(relative, target, base = root) {
  const source = resolve(base, relative), info = lstatSync(source);
  if (info.isSymbolicLink()) throw new Error("Deployment inputs must not contain symbolic links.");
  if (info.isDirectory()) {
    for (const name of readdirSync(source)) {
      if (["node_modules", "dist", "test", "tests"].includes(name) && relative === "infra/database") continue;
      copyInput(relative + "/" + name, target, base);
    }
  } else {
    if (inspect(relative, readFileSync(source, "utf8")).length) throw new Error("A deployment input failed secret hygiene; inspect the source privately.");
    cpSync(source, join(target, relative), { recursive: true });
  }
}
function main(env = process.env) {
  if (process.argv.length !== 2) throw new Error("Use npm run railway:deploy without arguments; select the target through environment variables.");
  const target = readTarget(env); validateTarget(target);
  const { project, environment, service, origin } = target;
  const sha = cleanTree();
  const branch = run("git", ["branch", "--show-current"], true).trim();
  // Pin and inspect the target before any infrastructure change or code upload.
  const status = inspectDeploymentTarget(target, env);
  validateDevelopmentDeployment(branch, status, target);
  if (!env.npm_execpath || !existsSync(env.npm_execpath)) throw new Error("Run deployment through npm run railway:deploy.");
  run(process.execPath, [env.npm_execpath, "audit", "--omit=dev", "--audit-level=high"]);
  if (!(env.GITHUB_ACTIONS === "true" && env.IOP_VALIDATED_SHA === sha)) {
    run("docker", ["info", "--format", "{{.ServerVersion}}"], true);
    run(process.execPath, [env.npm_execpath, "run", "test:poc"]);
  }
  if (cleanTree() !== sha) throw new Error("Source changed during validation; retry the deployment.");
  railway(["config", "apply", "--environment", environment, "--yes"]);
  const directory = mkdtempSync(join(tmpdir(), "iop-deploy-"));
  try {
    for (const relative of inputs) copyInput(relative, directory);
    writeFileSync(join(directory, "infra/railway/revision.json"), JSON.stringify({ revision: sha }));
    console.log(`Publishing IOP revision ${sha.slice(0, 12)} to the explicitly selected Railway service.`);
    railway(["up", directory, "--path-as-root", "--project", project, "--environment", environment,
      "--service", service, "--ci", "--message", `IOP ${sha}`]);
    console.log("Build submitted successfully. Checking the live application...");
    const result = spawnSync(process.execPath, ["scripts/railway/smoke.cjs"], { cwd: root, stdio: "inherit", env: { ...env, IOP_PUBLIC_ORIGIN: origin, IOP_EXPECTED_REVISION: sha } });
    if (result.status !== 0) throw new Error("Live verification failed after the build; inspect Railway before sharing the URL.");
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { inputs, copyInput, cleanTree, validateDevelopmentDeployment, inspectDeploymentTarget };
