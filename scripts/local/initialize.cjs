const { readFileSync, existsSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { join } = require("node:path");
const {
  provisioningConfiguration,
} = require("../../infra/database/dist/configuration");
const { provision } = require("../../infra/database/dist/provision");
const { migrate } = require("../../infra/database/dist/migrate");
const { startPlatformRuntime } = require("../../apps/api/dist/host/runtime");
const {
  validateCsv,
} = require("../../apps/api/dist/modules/integrations/csv-adapter");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const next = (date) =>
  new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
function seedReportReader(runtime) {
  const {
    PgReportRepository,
  } = require("../../apps/api/dist/modules/oip/adapters/postgres/reports");
  const {
    PgReportingProfiles,
  } = require("../../apps/api/dist/modules/oip/adapters/postgres/reporting-profiles");
  const {
    hitlisteReportingProfile,
  } = require("../../apps/api/dist/host/adapters/hitliste-reporting-profile");
  // Offline verification reads every retained date; it is not an analytical view.
  return new PgReportRepository(
    new PgReportingProfiles(
      runtime.pool,
      runtime.source,
      hitlisteReportingProfile(runtime.config.mappings.configuration),
    ),
  );
}
async function seedHistory(
  runtime,
  actor,
  directory,
  verificationReports = seedReportReader(runtime),
) {
  const path = join(directory, "manifest.json");
  if (!existsSync(path)) {
    console.log("No historical seed configured; daily imports are available.");
    return;
  }
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  if (
    manifest.format !== 1 ||
    manifest.source !== "analytics.fact_hitliste" ||
    !/^[a-f0-9]{64}$/.test(manifest.archiveSha256) ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length ||
    manifest.files.length > 1000
  )
    throw new Error("Invalid backup seed manifest.");
  const history = await runtime.batches.history(actor),
    dates = new Set();
  // Preflight every file and existing date before publishing any new date.
  const files = [];
  for (const file of manifest.files) {
    if (!/^Hitliste-\d{8}\.csv$/.test(file.filename) || dates.has(file.date))
      throw new Error("Invalid seed date or filename.");
    dates.add(file.date);
    const bytes = readFileSync(join(directory, file.filename));
    if (hash(bytes) !== file.sha256)
      throw new Error("Seed bytes do not match the manifest.");
    const parsed = validateCsv(file.filename, bytes);
    if (
      parsed.status !== "valid" ||
      parsed.prepared.reportingDate !== file.date ||
      parsed.prepared.dataRecordCount !== file.records ||
      parsed.prepared.totalReportedFrequency !== file.frequency ||
      parsed.prepared.totalAccumulatedAlarmSeconds !== file.seconds ||
      file.lineage?.length !== file.records
    )
      throw new Error(
        `Seed reconciliation failed before import: ${file.filename}.`,
      );
    if (
      history.some(
        (x) =>
          x.reportingDate === file.date &&
          ["received", "processing", "unknown"].includes(x.outcome),
      )
    )
      throw new Error(
        "An unresolved existing import requires review before seeding.",
      );
    const existing = history.find(
      (x) => x.reportingDate === file.date && x.outcome === "succeeded",
    );
    if (
      existing &&
      hash(await runtime.batches.original(actor, existing.importId)) !==
        file.sha256
    )
      throw new Error(
        `Seed date conflicts with retained history: ${file.date}. No seed dates were imported.`,
      );
    files.push({ ...file, bytes, existing });
  }
  let imported = 0;
  for (const file of files) {
    if (!file.existing) {
      const outcome = await runtime.submit(actor, file.filename, file.bytes);
      if (outcome.outcome !== "succeeded")
        throw new Error(
          `Seed import stopped: ${file.date}, ${outcome.outcome}. Review before retrying.`,
        );
      imported++;
    }
  }
  // One report snapshot reconciles every seed date, including projection integrity.
  const sortedDates = [...dates].sort();
  const report = await verificationReports.query(actor, {
    from: sortedDates[0],
    toExclusive: next(sortedDates.at(-1)),
    dimension: "sector",
    period: "day",
    metric: "frequency",
    filters: {},
    search: "",
    page: 1,
  });
  const timeline = new Map(
    report.timeline.map((point) => [point.period, point]),
  );
  for (const file of files) {
    const actual = timeline.get(file.date);
    if (
      !actual ||
      actual.records !== file.records ||
      actual.frequency !== file.frequency ||
      actual.seconds !== file.seconds
    )
      throw new Error(`Stored seed reconciliation failed: ${file.date}.`);
  }
  console.log(
    `Analytics seed verified: ${files.length} dates, ${files.reduce((n, f) => n + f.records, 0)} rows, frequency ${files.reduce((n, f) => n + f.frequency, 0)}, ${files.reduce((n, f) => n + f.seconds, 0)} exact seconds; ${imported} dates imported, ${files.length - imported} unchanged.`,
  );
}
async function main() {
  const env = process.env,
    local = JSON.parse(readFileSync(env.IOP_CONFIG_FILE, "utf8"));
  const users = JSON.parse(
    readFileSync(env.IOP_LOCAL_IDENTITY_FILE, "utf8"),
  ).users;
  const configs = provisioningConfiguration(env);
  console.log("Provisioning local database roles and migrations…");
  await provision(configs);
  await migrate(configs.migrator);
  await provision(configs);
  console.log("Seeding local administrator and scope…");
  const seed = {
    ...env,
    IOP_SEED_ORGANIZATION_ID: local.organization.id,
    IOP_SEED_ORGANIZATION_NAME: "Local operations",
    IOP_SEED_SITE_ID: local.site.id,
    IOP_SEED_SITE_NAME: "Local site",
    IOP_SEED_SITE_TIME_ZONE: local.site.timeZone,
  };
  await require("../../infra/database/dist/seed-organization").seedOrganization(
    seed,
  );
  await require("../../infra/database/dist/seed-site").seedSite(seed);
  for (const user of users) {
    const userSeed = { ...seed, IOP_SEED_USER_ID: user.id };
    await require("../../infra/database/dist/seed-user").seedUser(userSeed);
    await require("../../infra/database/dist/seed-membership").seedMembership(
      userSeed,
    );
  }
  console.log("Preparing historical analytics…");
  const runtime = await startPlatformRuntime(env);
  try {
    await seedHistory(runtime, users[0].id, "/seed");
  } finally {
    await runtime.close();
  }
}
if (require.main === module)
  main().catch((error) => {
    // Avoid exposing connection details or source values from unexpected driver errors.
    console.error(
      ["Error", "DatabaseError", "ConfigurationError"].includes(
        error.constructor.name,
      )
        ? error.message
        : "Local initialization failed. Check configuration and retained import history.",
    );
    process.exitCode = 1;
  });
module.exports = { seedHistory };
