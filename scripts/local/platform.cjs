// Host orchestration only. Application, provisioning and seed imports execute in containers.
const { spawnSync } = require("node:child_process");
const {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
} = require("node:fs");
const { resolve, join } = require("node:path");
const { randomBytes } = require("node:crypto");
const { makeSeed, sha256 } = require("./backup-seed.cjs");
const root = resolve(__dirname, "../.."),
  directory = join(root, ".local-platform");
const compose = ["compose", "-f", "compose.platform.yaml"];
function docker(args, options = {}) {
  const result = spawnSync("docker", [...compose, ...args], {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
  if (result.status !== 0)
    throw new Error("Docker operation failed; existing data was preserved.");
  return result;
}
function privateFile(name, contents) {
  const file = join(directory, name);
  if (!existsSync(file))
    writeFileSync(file, contents, { mode: 0o600, flag: "wx" });
}
function configuration() {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  mkdirSync(join(directory, "config"), { recursive: true, mode: 0o700 });
  mkdirSync(join(directory, "seed"), { recursive: true, mode: 0o700 });
  if (!existsSync(join(directory, "setup.env"))) {
    // An old volume with missing credentials must not be silently adopted.
    const probe = spawnSync(
      "docker",
      ["volume", "inspect", "iop-platform-local_platform-data"],
      { stdio: "ignore" },
    );
    if (probe.status === 0)
      throw new Error(
        "Local volume exists without its configuration. Restore .local-platform before starting.",
      );
    const bootstrap = randomBytes(24).toString("base64url"),
      migrator = randomBytes(24).toString("base64url"),
      runtime = randomBytes(24).toString("base64url");
    privateFile(
      "setup.env",
      `IOP_POSTGRES_PASSWORD=${bootstrap}\nIOP_MIGRATOR_PASSWORD=${migrator}\nIOP_RUNTIME_PASSWORD=${runtime}\n`,
    );
    privateFile("runtime.env", `IOP_RUNTIME_PASSWORD=${runtime}\n`);
    privateFile(
      "postgres.env",
      `POSTGRES_DB=iop_local\nPOSTGRES_USER=iop_bootstrap\nPOSTGRES_PASSWORD=${bootstrap}\n`,
    );
  }
  const preset = require("../../config/reporting/hitliste-halls.json");
  const sectors = [...new Set(preset.areaSectors.map((x) => x.sector))];
  const scope = {
    organization: { id: "local-org" },
    site: {
      id: "local-site",
      organizationId: "local-org",
      timeZone: "Europe/Zurich",
    },
    source: {
      id: "hitliste",
      organizationId: "local-org",
      siteId: "local-site",
    },
  };
  privateFile("config/scope.json", JSON.stringify(scope, null, 2));
  privateFile(
    "config/handover.json",
    JSON.stringify(
      {
        organizationId: scope.organization.id,
        siteId: scope.site.id,
        locations: [],
        externalSystemLabel: "Ultimo",
        categories: [
          "Safety",
          "Information",
          "Successes",
          "People",
          "Performance",
          "Problems",
        ].map((label) => ({ id: label.toLowerCase(), label })),
      },
      null,
      2,
    ),
  );
  privateFile(
    "config/users.json",
    JSON.stringify(
      {
        users: [{ id: "local-administrator", name: "Administrator" }],
        origins: ["http://127.0.0.1:8080"],
      },
      null,
      2,
    ),
  );
  privateFile(
    "config/mappings.json",
    JSON.stringify(
      {
        organizationId: scope.organization.id,
        siteId: scope.site.id,
        sourceId: scope.source.id,
        mappingRevision: "owner-halls-v1",
        sectors: sectors.map((label, i) => ({ sectorKey: `hall-${i}`, label })),
        areas: preset.areaSectors.map((x) => ({
          sourceArea: x.area,
          sectorKey: `hall-${sectors.indexOf(x.sector)}`,
        })),
      },
      null,
      2,
    ),
  );
}
function extract(backup) {
  const bytes = readFileSync(resolve(backup));
  const archiveHash = sha256(bytes),
    manifestPath = join(directory, "seed/manifest.json");
  if (existsSync(manifestPath)) {
    const prior = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (prior.archiveSha256 !== archiveHash)
      throw new Error(
        "A different seed is configured. Existing history was preserved; use a separate installation to compare backups.",
      );
  }
  const result = docker(
    [
      "exec",
      "-T",
      "database",
      "pg_restore",
      "--data-only",
      "--no-owner",
      "--no-privileges",
      "-f",
      "-",
    ],
    {
      input: bytes,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024,
    },
  );
  const seed = makeSeed(result.stdout, archiveHash);
  for (const file of seed.files)
    writeFileSync(join(directory, "seed", file.filename), file.bytes, {
      mode: 0o600,
    });
  const manifest = {
    ...seed,
    files: seed.files.map(({ bytes, ...file }) => file),
  };
  writeFileSync(manifestPath + ".tmp", JSON.stringify(manifest), {
    mode: 0o600,
  });
  renameSync(manifestPath + ".tmp", manifestPath);
  console.log(
    `Prepared ${seed.files.length} daily seed files from analytics; private provenance retained locally.`,
  );
}
function main() {
  const [command, backup, ...extra] = process.argv.slice(2);
  if (
    !["up", "stop", "status", "admin"].includes(command) ||
    extra.length ||
    (command !== "up" &&
      !(command === "admin" && backup === "--reset") &&
      backup)
  )
    throw new Error(
      "Use local:up [backup path], local:stop, local:status or local:admin [--reset].",
    );
  if (command === "up") {
    configuration();
    docker(["stop", "web", "api"]);
    docker(["up", "-d", "--wait", "database"]);
    if (backup) extract(backup);
    docker(["build", "setup", "api", "web"]);
    docker(["run", "--rm", "setup"]);
    docker(["up", "-d", "--wait", "api", "web"]);
    console.log(
      "Platform ready at http://127.0.0.1:8080. Sign in to use the platform. For first access, run npm run local:admin.",
    );
  } else if (command === "admin") {
    docker([
      "run",
      "--rm",
      "-T",
      "setup",
      "node",
      "scripts/local/bootstrap-access.cjs",
      ...(backup ? [backup] : []),
    ]);
  } else docker(command === "stop" ? ["stop"] : ["ps"]);
}
try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
