// Dedicated local demonstration launcher. Credentials stay in ignored mode-0600 files.
class DemoCommandError extends Error {}
const { spawn, spawnSync } = require("node:child_process");
const {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const { join, resolve } = require("node:path");
const { randomBytes } = require("node:crypto");
const root = resolve(__dirname, ".."),
  directory = join(root, ".local-demo");
const scope = require("../fixtures/analytical-poc/scope.json");
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.status !== 0) throw new DemoCommandError(`${command} failed.`);
};
const privateJson = (name, value) =>
  writeFileSync(join(directory, name), JSON.stringify(value, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
const configPath = join(directory, "environment.json");
async function main() {
  const [command, confirmation, ...extra] = process.argv.slice(2);
  if (
    extra.length ||
    (!["reset", "recreate"].includes(command) && confirmation)
  )
    throw new DemoCommandError("Unexpected arguments.");
  if (command === "setup") {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (!existsSync(configPath)) {
      // Refuse to attach an unknown existing container before creating new credentials.
      const probe = spawnSync(
        "docker",
        ["container", "inspect", "iop-poc-postgres"],
        { encoding: "utf8" },
      );
      if (probe.status === 0)
        throw new DemoCommandError(
          "An existing iop-poc-postgres container needs operator review; no credentials were overwritten.",
        );
      privateJson("environment.json", {
        IOP_DATABASE_MODE: "local",
        IOP_DATABASE_HOST: "127.0.0.1",
        IOP_DATABASE_PORT: "54329",
        IOP_DATABASE_NAME: "iop_local",
        IOP_POSTGRES_PASSWORD: randomBytes(24).toString("base64url"),
        IOP_MIGRATOR_PASSWORD: randomBytes(24).toString("base64url"),
        IOP_RUNTIME_PASSWORD: randomBytes(24).toString("base64url"),
      });
    }
    if (!existsSync(join(directory, "scope.json")))
      privateJson("scope.json", {
        organization: { id: scope.organizationId },
        site: {
          id: scope.siteId,
          organizationId: scope.organizationId,
          timeZone: scope.siteTimeZone,
        },
        source: {
          id: scope.sourceId,
          organizationId: scope.organizationId,
          siteId: scope.siteId,
        },
      });
    if (!existsSync(join(directory, "users.json")))
      privateJson("users.json", {
        users: [
          { id: "demo-operator", name: "Demo operator" },
          { id: "demo-colleague", name: "Demo colleague" },
        ],
        origins: ["http://127.0.0.1:5173", "http://127.0.0.1:4173"],
      });
    if (!existsSync(join(directory, "mappings.json")))
      privateJson("mappings.json", {
        organizationId: scope.organizationId,
        siteId: scope.siteId,
        sourceId: scope.sourceId,
        mappingRevision: scope.mappingRevision,
        sectors: Object.entries(scope.sectorLabels).map(
          ([sectorKey, label]) => ({ sectorKey, label }),
        ),
        areas: Object.entries(scope.sectorBySourceArea).map(
          ([sourceArea, sectorKey]) => ({ sourceArea, sectorKey }),
        ),
      });
  }
  if (!existsSync(configPath))
    throw new DemoCommandError("Run npm run demo:setup first.");
  const secret = JSON.parse(readFileSync(configPath, "utf8"));
  const local = JSON.parse(readFileSync(join(directory, "scope.json"), "utf8"));
  const users = JSON.parse(
    readFileSync(join(directory, "users.json"), "utf8"),
  ).users;
  const env = {
    ...process.env,
    ...secret,
    IOP_EXECUTION_MODE: "local-demo",
    IOP_TRANSPORT: "native",
    HOST: "127.0.0.1",
    PORT: "3000",
    NODE_ENV: "development",
    IOP_CONFIG_FILE: join(directory, "scope.json"),
    IOP_DEMO_CONFIG_FILE: join(directory, "users.json"),
    IOP_MAPPING_CONFIG_FILE: join(directory, "mappings.json"),
    IOP_RESET_ORGANIZATION_ID: local.organization.id,
    IOP_RESET_SITE_ID: local.site.id,
    IOP_RESET_SOURCE_ID: local.source.id,
  };
  if (command === "setup") {
    writeFileSync(
      join(directory, "postgres.env"),
      `POSTGRES_DB=iop_local\nPOSTGRES_USER=iop_bootstrap\nPOSTGRES_PASSWORD=${secret.IOP_POSTGRES_PASSWORD}\n`,
      { mode: 0o600 },
    );
    const probe = spawnSync(
      "docker",
      ["container", "inspect", "iop-poc-postgres"],
      { encoding: "utf8" },
    );
    if (probe.status === 0) {
      const existing = JSON.parse(probe.stdout)[0];
      if (existing.Config.Labels?.["iop.local-demo"] !== "dedicated")
        throw new DemoCommandError(
          "Existing container is not this dedicated demo.",
        );
      run("docker", ["start", "iop-poc-postgres"]);
    } else
      run("docker", [
        "run",
        "-d",
        "--name",
        "iop-poc-postgres",
        "--label",
        "iop.local-demo=dedicated",
        "--env-file",
        join(directory, "postgres.env"),
        "-p",
        "127.0.0.1:54329:5432",
        "-v",
        "iop-poc-data:/var/lib/postgresql/data",
        "--health-cmd",
        "pg_isready -U iop_bootstrap -d iop_local",
        "--health-interval",
        "2s",
        "--health-retries",
        "30",
        "postgres:17.6-bookworm",
      ]);
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const check = spawnSync(
        "docker",
        [
          "exec",
          "iop-poc-postgres",
          "pg_isready",
          "-U",
          "iop_bootstrap",
          "-d",
          "iop_local",
        ],
        { stdio: "ignore" },
      );
      if (check.status === 0) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready)
      throw new DemoCommandError("Local PostgreSQL did not become ready.");
    run("npm", ["run", "build"], env);
    const { provision } = require("../infra/database/dist/provision");
    const { migrate } = require("../infra/database/dist/migrate");
    const {
      provisioningConfiguration,
    } = require("../infra/database/dist/configuration");
    const configs = provisioningConfiguration(env);
    await provision(configs);
    await migrate(configs.migrator);
    await provision(configs);
    const seed = {
      ...env,
      IOP_SEED_ORGANIZATION_ID: local.organization.id,
      IOP_SEED_ORGANIZATION_NAME: scope.organizationName,
      IOP_SEED_SITE_ID: local.site.id,
      IOP_SEED_SITE_NAME: scope.siteName,
      IOP_SEED_SITE_TIME_ZONE: local.site.timeZone,
    };
    await require("../infra/database/dist/seed-organization").seedOrganization(
      seed,
    );
    await require("../infra/database/dist/seed-site").seedSite(seed);
    for (const user of users) {
      await require("../infra/database/dist/seed-user").seedUser({
        ...seed,
        IOP_SEED_USER_ID: user.id,
      });
      await require("../infra/database/dist/seed-membership").seedMembership({
        ...seed,
        IOP_SEED_USER_ID: user.id,
      });
    }
    const registered =
      await require("../infra/database/dist/demo-maintenance").demoMaintenance(
        env,
        "register",
      );
    writeFileSync(
      join(directory, "dataset.json"),
      JSON.stringify(registered, null, 2) + "\n",
      { mode: 0o600 },
    );
    console.log(
      `Demo ready. Dataset identity: ${registered.datasetId}\nRun npm run demo:start, then open http://127.0.0.1:5173`,
    );
    return;
  }
  if (command === "start") {
    run("npm", ["run", "build"], env);
    const api = spawn(process.execPath, ["apps/api/dist/main.js"], {
      cwd: root,
      env,
      stdio: "inherit",
    });
    const web = spawn(
      process.execPath,
      [
        join(root, "node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--strictPort",
      ],
      { cwd: join(root, "apps/web"), env, stdio: "inherit" },
    );
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      api.kill("SIGTERM");
      web.kill("SIGTERM");
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    api.on("exit", (code) => {
      if (!stopping && code) process.exitCode = code;
      stop();
    });
    web.on("exit", (code) => {
      if (!stopping && code) process.exitCode = code;
      stop();
    });
    return;
  }
  if (command === "reset" || command === "recreate") {
    if (!confirmation)
      throw new DemoCommandError(
        "Pass the dataset identity from .local-demo/dataset.json. Stop demo:start first.",
      );
    const result =
      await require("../infra/database/dist/demo-maintenance").demoMaintenance(
        { ...env, IOP_DEMO_DATASET_ID: confirmation },
        "reset",
      );
    console.log(
      `Confirmed reset: ${result.attempts} attempts, ${result.bytes} bytes removed from the exact demo target.`,
    );
    if (command === "reset") return;
  }
  if (command === "fixtures" || command === "recreate") {
    const { startDemoRuntime } = require("../apps/api/dist/demo/runtime");
    const runtime = await startDemoRuntime(env);
    try {
      for (const date of ["20260701", "20260703"]) {
        const name = `Hitliste-${date}.csv`;
        const result = await runtime.submit(
          users[0].id,
          name,
          readFileSync(join(root, "fixtures/analytical-poc/valid", name)),
        );
        if (result.outcome !== "succeeded")
          throw new DemoCommandError(
            `Fixture reload incomplete: ${result.outcome}. Inspect existing reporting dates before retrying.`,
          );
      }
      const a = await runtime.queries.availability(users[0].id);
      const result = await runtime.queries.query(users[0].id, {
        revision: a.revision,
        from: "2026-07-01",
        toExclusive: "2026-07-04",
      });
      if (
        result.recordCount !== 9 ||
        result.reportedFrequency !== 19 ||
        result.accumulatedAlarmSeconds !== 97775
      )
        throw new DemoCommandError("Fixture reconciliation failed.");
      console.log(
        "Fixture baseline verified: 9 records, frequency 19, 97,775 accumulated seconds.",
      );
    } finally {
      await runtime.close();
    }
    return;
  }
  throw new DemoCommandError(
    "Expected setup, start, fixtures, reset or recreate.",
  );
}
main().catch((error) => {
  console.error(
    error.name === "DatabaseError" || error instanceof DemoCommandError
      ? error.message
      : "Demo command failed. Check local configuration and the documented prerequisites; no automatic reset/retry was performed.",
  );
  process.exitCode = 1;
});
