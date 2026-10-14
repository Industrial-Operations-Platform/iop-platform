async function run(options) {
  const {
      resolve
    } = require("node:path"),
    {
      Pool
    } = require("pg");
  const compiled = path => require(resolve("dist", path));
  const env = process.env;
  if (env.IOP_EXECUTION_MODE !== "local-container" || env.IOP_DATABASE_HOST !== "database" || env.IOP_DATABASE_NAME !== "iop_local" || env.IOP_AUTHENTICATION !== "password") throw new Error("Synthetic model tooling requires the local password-authenticated Docker installation.");
  const {
      PlatformRuntime,
      readLocalIdentityConfiguration
    } = compiled("host/runtime"),
    {
      composeAssetDomain
    } = compiled("host/asset-domain-composition"),
    {
      accessTransaction
    } = compiled("persistence/access-transaction"),
    {
      startupAdministrator
    } = compiled("modules/users-rbac/adapters/postgres/administration"),
    {
      seedSyntheticAssetDomain
    } = compiled("host/adapters/synthetic-asset-domain");
  const config = readLocalIdentityConfiguration(env);
  if (!config) throw new Error("Local runtime configuration is unavailable.");
  const pool = new Pool({
    host: "database",
    port: Number(env.IOP_DATABASE_PORT),
    database: "iop_local",
    user: "iop_runtime",
    password: env.IOP_RUNTIME_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    application_name: "iop-synthetic-asset-domain",
    options: "-c search_path=pg_catalog -c lock_timeout=5000"
  });
  try {
    const runtime = new PlatformRuntime(pool, config),
      scope = runtime.source,
      domain = composeAssetDomain(pool, scope).domain;
    const actor = await accessTransaction(pool, scope, tx => startupAdministrator(tx, scope));
    if (!actor) throw new Error("A current scoped administrator is required.");
    const catalog = await runtime.assets.context(actor),
      location = catalog.locations.find(l => l.role === "area") ?? catalog.locations[0];
    if (!location) throw new Error("A configured scoped location is required.");
    await domain.catalog(actor);
    if (options.action === "prepare") return {
      format: 1,
      label: "Synthetic model demonstration",
      token: require("node:crypto").randomUUID(),
      organizationId: scope.organizationId,
      siteId: scope.siteId,
      sourceId: scope.sourceId,
      locationId: location.id
    };
    const manifest = options.manifest;
    if (!manifest || manifest.format !== 1 || manifest.organizationId !== scope.organizationId || manifest.siteId !== scope.siteId || manifest.sourceId !== scope.sourceId) throw new Error("Synthetic manifest does not match the current installation scope.");
    if (options.action === "preview") return {
      label: manifest.label,
      assets: 4,
      typedMetadata: true,
      surveyDecisions: ["pending", "validated", "rejected"],
      canonicalMapping: "Synthetic pending ambiguity only",
      writes: false
    };
    if (options.action !== "apply") throw new Error("Unsupported synthetic model operation.");
    return await seedSyntheticAssetDomain(runtime.assets, domain, actor, manifest);
  } finally {
    await pool.end();
  }
}
module.exports = {
  run
};
