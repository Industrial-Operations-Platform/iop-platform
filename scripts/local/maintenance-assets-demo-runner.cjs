// Serialized by the explicit local launcher and executed inside the API container.
async function run(options, fixture) {
  const { readFileSync } = require("node:fs");
  const { resolve } = require("node:path");
  const { randomUUID, createHash } = require("node:crypto");
  const { Pool } = require("pg");
  const compiled = (path) => require(resolve("dist", path));
  const env = process.env;
  if (
    env.IOP_EXECUTION_MODE !== "local-container" ||
    env.IOP_DATABASE_HOST !== "database" ||
    env.IOP_DATABASE_NAME !== "iop_local" ||
    env.IOP_AUTHENTICATION !== "password"
  )
    throw new Error(
      "Demo data is restricted to the local password-authenticated Docker installation.",
    );
  const { loadConfiguration } = compiled("host/configuration");
  const local = loadConfiguration(env.IOP_CONFIG_FILE);
  const scope = {
    organizationId: local.organization.id,
    siteId: local.site.id,
  };
  const json = (file) => JSON.parse(readFileSync(file, "utf8"));
  const { handoverCatalog } = compiled("host/adapters/handover-catalog");
  const catalog = handoverCatalog(
    json(env.IOP_HANDOVER_CONFIG_FILE),
    { ...scope, sourceId: local.source.id },
    local.site.timeZone,
  );
  const configuredOperator = json(env.IOP_LOCAL_IDENTITY_FILE).users[0].id;
  let actor = configuredOperator;
  const pool = new Pool({
    host: env.IOP_DATABASE_HOST,
    port: Number(env.IOP_DATABASE_PORT),
    database: "iop_local",
    user: "iop_runtime",
    password: env.IOP_RUNTIME_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    application_name: "iop-maintenance-assets-demo",
    options: "-c search_path=pg_catalog -c lock_timeout=5000",
  });
  const { runSiteOperation } = compiled("persistence/site-operation");
  const { evaluateSiteAccess } = compiled("modules/users-rbac");
  const { sitePeople, sitePersonNames } = compiled(
    "modules/users-rbac/adapters/postgres/site-people",
  );
  const { workforceTeams } = compiled(
    "modules/workforce/adapters/postgres/teams",
  );
  const { workforceDefaults } = compiled("host/adapters/workforce-defaults");
  const { maintenanceDefaults } = compiled(
    "host/adapters/maintenance-defaults",
  );
  const { Assets } = compiled("modules/assets/application/assets");
  const { Maintenance } = compiled(
    "modules/maintenance/application/maintenance",
  );
  const { PgAssets, assetReferences, assetReference } = compiled(
    "modules/assets/adapters/postgres/store",
  );
  const { PgMaintenance } = compiled(
    "modules/maintenance/adapters/postgres/store",
  );
  const { siteDate } = compiled("modules/shift-handover/domain/handover");
  const allowed = async (tx, userId, permission) =>
    (
      await evaluateSiteAccess(tx, {
        ...scope,
        userId,
        permissions: [permission],
      })
    ).allowed;
  const names = (tx, ids) =>
    sitePersonNames(tx, scope.organizationId, scope.siteId, ids);
  const { maintenanceTimeline } = compiled(
    "modules/maintenance/adapters/postgres/asset-history",
  );
  const assets = new Assets(
    new PgAssets(pool, scope, {
      allowed,
      names,
      sources: [
        {
          kind: "maintenance",
          permission: "maintenance.read",
          read: (tx, asset, query) =>
            maintenanceTimeline(tx, scope, asset.id, query),
        },
      ],
    }),
    catalog.locations,
    catalog.timeZone,
    randomUUID,
    () => new Date().toISOString(),
  );
  const {
    handoverMaintenanceIssues,
    pendingHandoverMaintenanceIssues,
    resolveHandoverMaintenanceIssues,
  } = compiled("modules/shift-handover/adapters/postgres/maintenance-issues");
  const maintenance = new Maintenance(
    new PgMaintenance(pool, scope, {
      allowed,
      names,
      people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
      teams: (tx) =>
        workforceTeams(tx, scope, workforceDefaults(catalog.locations)),
      assets: (tx) => assetReferences(tx, scope),
      asset: (tx, id) => assetReference(tx, scope, id),
      related: (tx, issueScope, selection) =>
        handoverMaintenanceIssues(tx, scope, {
          scope: issueScope,
          ...selection,
        }),
      pending: (tx, issueScope) =>
        pendingHandoverMaintenanceIssues(tx, scope, issueScope),
      resolve: (tx, resolutions, evidence) =>
        resolveHandoverMaintenanceIssues(tx, scope, resolutions, evidence),
    }),
    catalog.locations,
    maintenanceDefaults,
    () => new Date().toISOString(),
    catalog.timeZone,
  );
  const digest = (value) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const inspect = () =>
    runSiteOperation(
      pool,
      {
        ...scope,
        userId: actor,
        permissions: ["assets.read", "maintenance.read"],
      },
      async (tx) => {
        // Read-only evidence stays in tooling; all writes go through module applications.
        const rows = async (table, order) =>
          (
            await tx.query(
              `SELECT row_to_json(t) AS value FROM ${table} t WHERE organization_id=$1 AND site_id=$2 ORDER BY ${order}`,
              [scope.organizationId, scope.siteId],
            )
          ).rows.map((row) => row.value);
        const assetRows = await rows("assets.records", "id");
        const assetIds = new Set(
          assetRows
            .filter((row) => row.request_key.startsWith(fixture.prefix))
            .map((row) => row.id),
        );
        const workRows = await rows("maintenance.records", "id");
        const mine = (row) => row.id.startsWith(fixture.prefix);
        const originals = [
          assetRows.filter((row) => !assetIds.has(row.id)),
          (await rows("assets.revisions", "asset_id,revision")).filter(
            (row) => !assetIds.has(row.asset_id),
          ),
          (await rows("assets.aliases", "asset_id,alias_key")).filter(
            (row) => !assetIds.has(row.asset_id),
          ),
          workRows.filter((row) => !mine(row)),
          (await rows("maintenance.revisions", "id,revision")).filter(
            (row) => !mine(row),
          ),
          await rows("maintenance.settings", "revision"),
          await rows("maintenance.settings_revisions", "revision"),
          await rows("shift_handover.entries", "id"),
          await rows("shift_handover.revisions", "entry_id,revision"),
        ];
        const analytics = (
          await tx.query(
            "SELECT count(*)::integer AS facts,coalesce(sum(haufigkeit),0)::text AS frequency,coalesce(sum(dauer_sekunden),0)::text AS seconds FROM analytics.fact_hitliste WHERE organization_id=$1 AND site_id=$2 AND source_id=$3",
            [scope.organizationId, scope.siteId, local.source.id],
          )
        ).rows[0];
        const group = (items, property) =>
          items.reduce((result, row) => {
            result[row[property]] = (result[row[property]] ?? 0) + 1;
            return result;
          }, {});
        const demoAssets = assetRows.filter((row) => assetIds.has(row.id));
        const demoWork = workRows.filter(mine);
        const assetHistory = (
          await rows("assets.revisions", "asset_id,revision")
        ).filter((row) => assetIds.has(row.asset_id));
        const workHistory = (
          await rows("maintenance.revisions", "id,revision")
        ).filter(mine);
        return {
          originalDigest: digest(originals),
          originalCounts: originals.map((items) => items.length),
          analytics,
          assets: demoAssets.length,
          assetStates: group(demoAssets, "status"),
          assetRevisions: assetHistory.length,
          maintenance: demoWork.length,
          maintenanceStates: group(demoWork, "status"),
          maintenanceRevisions: workHistory.length,
          assigned: demoWork.filter((row) => row.assignee_id).length,
          teamAssigned: demoWork.filter((row) => row.team_id).length,
          assetLinked: demoWork.filter((row) => row.asset_id).length,
          demoDigest: digest([demoAssets, demoWork, assetHistory, workHistory]),
        };
      },
    );
  try {
    // Use an existing eligible leader, without creating accounts or changing grants.
    const directory = await maintenance.catalog(configuredOperator);
    const candidates = [...directory.people].sort(
      (first, second) =>
        Number(second.id === options.manifest?.actor) -
        Number(first.id === options.manifest?.actor),
    );
    let context;
    for (const person of candidates) {
      try {
        const [assetContext, workContext] = await Promise.all([
          assets.context(person.id),
          maintenance.catalog(person.id),
        ]);
        if (
          assetContext.canManage &&
          workContext.canCoordinate &&
          workContext.canContribute
        ) {
          actor = person.id;
          context = workContext;
          break;
        }
      } catch (error) {
        const { SiteAccessDeniedError } = compiled(
          "persistence/site-operation",
        );
        if (!(error instanceof SiteAccessDeniedError)) throw error;
      }
    }
    if (!context)
      throw new Error(
        "Demo data requires an existing active Team Leader with current Asset and Maintenance grants.",
      );
    if (options.action === "prepare") {
      const baseline = await inspect();
      if (baseline.assets || baseline.maintenance)
        throw new Error(
          "Demo records already exist. Restore the private manifest before rerunning.",
        );
      const today = siteDate(new Date().toISOString(), catalog.timeZone);
      const sample = fixture.build({
        today,
        actor,
        people: context.people,
        teams: context.teams,
        priorities: context.settings.priorities,
        departments: catalog.locations.filter(
          (location) => location.role === "department",
        ),
      });
      const byLocation = new Map();
      for (const record of sample.records) {
        const entries = byLocation.get(record.data.locationId) ?? [];
        let cursor = "";
        if (!byLocation.has(record.data.locationId))
          do {
            const page = await maintenance.related(actor, {
              locationId: record.data.locationId,
              equipment: [],
              cursor,
            });
            entries.push(...page.entries);
            cursor = page.nextCursor;
          } while (cursor && entries.length <= 100);
        byLocation.set(record.data.locationId, entries);
        if (entries.length > 100 || cursor)
          throw new Error(
            "The configured demo zone has too many reports; narrow its scope before preparing fixtures.",
          );
        record.data = {
          ...record.data,
          category: record.id.endsWith("-5")
            ? "preventive"
            : record.id.endsWith("-0")
              ? "inspection"
              : "corrective",
          repairTarget:
            "[DEMO] Simulated component inspection or repair; no physical work.",
          equipment: [],
          linkedEntries: entries
            .filter((entry) =>
              ["open", "in-progress"].includes(entry.issueState),
            )
            .map((entry) => ({
              id: entry.id,
              expectedRevision: entry.revision,
              disposition: "exclude",
              reason:
                "[DEMO] Existing operational report is outside this fictional exercise; leave it unchanged.",
            })),
        };
      }
      return { version: 1, scope, actor, today, baseline, ...sample };
    }
    const manifest = options.manifest;
    if (
      manifest?.version !== 1 ||
      JSON.stringify(manifest.scope) !== JSON.stringify(scope) ||
      !Array.isArray(manifest.assets) ||
      !Array.isArray(manifest.records) ||
      manifest.assets.length > 100 ||
      manifest.records.length > 300
    )
      throw new Error("Demo manifest does not match this installation.");
    for (const asset of manifest.assets)
      if (
        !asset.key.startsWith(fixture.prefix) ||
        !asset.content.code.startsWith("DEMO-194-") ||
        asset.content.aliases.length ||
        asset.changes.length > 5
      )
        throw new Error("Demo asset marker or bounds invalid.");
    for (const record of manifest.records)
      if (
        !record.id.startsWith(fixture.prefix) ||
        !record.data.title.startsWith("[DEMO] ") ||
        record.actor !== manifest.actor ||
        record.changes.length > 5
      )
        throw new Error("Demo maintenance marker or bounds invalid.");
    const { validContent } = compiled("modules/assets/domain/assets");
    const { data: validateData } = compiled(
      "modules/maintenance/domain/maintenance",
    );
    // Validate every planned snapshot before the first write.
    for (const scenario of manifest.assets) {
      let content = validContent(scenario.content, catalog.locations);
      for (const { note, ...change } of scenario.changes)
        content = validContent({ ...content, ...change }, catalog.locations);
    }
    for (const scenario of manifest.records) {
      let data = scenario.data;
      validateData(data);
      for (const { reason, ...change } of scenario.changes) {
        data = { ...data, ...change };
        validateData(data);
      }
    }
    const before = await inspect();
    if (options.action === "apply") {
      if (manifest.actor !== actor)
        throw new Error(
          "The original demo author no longer has creation permissions. Use --inspect to explore the retained dataset; do not recreate or overwrite it.",
        );
      await fixture.apply({ assets, maintenance }, manifest);
    } else if (options.action !== "inspect")
      throw new Error("Unknown demo operation.");
    const after = await inspect();
    if (
      after.originalDigest !== before.originalDigest ||
      JSON.stringify(after.analytics) !== JSON.stringify(before.analytics)
    )
      throw new Error(
        "Non-demo data changed during the run; inspect concurrent activity.",
      );
    const page = await maintenance.query(actor, {
      search: "[DEMO]",
      limit: 20,
    });
    const registry = await assets.query(actor, {
      search: "DEMO-194-",
      status: "",
      locationId: "",
      cursor: "",
    });
    let timelineEvents = 0;
    const to = siteDate(new Date().toISOString(), catalog.timeZone);
    for (const asset of registry.assets) {
      const timeline = await assets.timeline(actor, {
        id: asset.id,
        from: manifest.today,
        to,
        kind: "maintenance",
        cursor: "",
      });
      timelineEvents += timeline.total;
    }
    return {
      ...after,
      originalUnchanged:
        after.originalDigest === manifest.baseline.originalDigest &&
        JSON.stringify(after.analytics) ===
          JSON.stringify(manifest.baseline.analytics),
      queries: {
        firstPage: page.records.length,
        total: page.total,
        hasNextPage: !!page.nextCursor,
        maintenanceTimelineEvents: timelineEvents,
      },
    };
  } finally {
    await pool.end();
  }
}
module.exports = { run };
