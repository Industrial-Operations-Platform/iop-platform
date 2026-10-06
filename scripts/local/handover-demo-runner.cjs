// Executed only by the explicit local launcher inside the running API container.
async function run(options, fixture) {
  const { readFileSync } = require("node:fs");
  const { resolve } = require("node:path");
  const { randomUUID, createHash } = require("node:crypto");
  const { Pool } = require("pg");
  const compiled = (path) => require(resolve("dist", path));
  const { loadConfiguration } = compiled("host/configuration");
  const { handoverCatalog } = compiled("host/adapters/handover-catalog");
  const { Handover } = compiled("modules/shift-handover/application/handover");
  const { siteDate, withinLocation, validContent, emptySelection } = compiled(
    "modules/shift-handover/domain/handover",
  );
  const { PgHandover } = compiled(
    "modules/shift-handover/adapters/postgres/store",
  );
  const { sitePeople } = compiled(
    "modules/users-rbac/adapters/postgres/site-people",
  );
  const { evaluateSiteAccess } = compiled("modules/users-rbac");
  const { importedEquipmentCodes } = compiled(
    "modules/oip/adapters/postgres/equipment-codes",
  );
  const { runSiteOperation } = compiled("persistence/site-operation");
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
  const local = loadConfiguration(env.IOP_CONFIG_FILE);
  const scope = {
    organizationId: local.organization.id,
    siteId: local.site.id,
    sourceId: local.source.id,
  };
  const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
  const catalog = handoverCatalog(
    readJson(env.IOP_HANDOVER_CONFIG_FILE),
    scope,
    local.site.timeZone,
  );
  const operator = readJson(env.IOP_LOCAL_IDENTITY_FILE).users[0].id;
  const pool = new Pool({
    host: env.IOP_DATABASE_HOST,
    port: Number(env.IOP_DATABASE_PORT),
    database: "iop_local",
    user: "iop_runtime",
    password: env.IOP_RUNTIME_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    application_name: "iop-handover-demo",
    options: "-c search_path=pg_catalog -c lock_timeout=5000",
  });
  const allowed = async (tx, actor, permission) =>
    (
      await evaluateSiteAccess(tx, {
        ...scope,
        userId: actor,
        permissions: [permission],
      })
    ).allowed;
  const store = new PgHandover(pool, scope, {
    allowed,
    people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
    equipment: async (
      tx,
      actor,
      departmentId,
      areaId,
      search,
      after,
      exact = false,
    ) => {
      if (!(await allowed(tx, actor, "handover.read")))
        throw new Error("Equipment lookup denied.");
      const department = catalog.locations.find(
        (location) => location.id === departmentId,
      );
      const area = catalog.locations.find((location) => location.id === areaId);
      if (!department?.sectorKey || !area) return { codes: [], nextCursor: "" };
      return importedEquipmentCodes(tx, scope, {
        sector: department.sectorKey,
        area: area.label,
        search,
        after,
        exact,
      });
    },
  });
  let clock = new Date().toISOString();
  const app = new Handover(store, catalog, randomUUID, () => clock);
  const digest = (value) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const inspect = () =>
    runSiteOperation(
      pool,
      { ...scope, userId: operator, permissions: ["handover.read"] },
      async (tx) => {
        const entries = (
          await tx.query(
            "SELECT request_key,snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 ORDER BY id",
            [scope.organizationId, scope.siteId],
          )
        ).rows;
        const revisions = (
          await tx.query(
            "SELECT entry_id,revision,snapshot FROM shift_handover.revisions WHERE organization_id=$1 AND site_id=$2 ORDER BY entry_id,revision",
            [scope.organizationId, scope.siteId],
          )
        ).rows;
        const demo = entries.filter((row) =>
          row.request_key.startsWith("iop173-"),
        );
        const originals = entries.filter(
          (row) => !row.request_key.startsWith("iop173-"),
        );
        const originalIds = new Set(originals.map((row) => row.snapshot.id));
        const originalHistory = revisions.filter((row) =>
          originalIds.has(row.entry_id),
        );
        const analytics = (
          await tx.query(
            "SELECT count(*)::integer AS facts,coalesce(sum(haufigkeit),0)::text AS frequency,coalesce(sum(dauer_sekunden),0)::text AS seconds FROM analytics.fact_hitliste WHERE organization_id=$1 AND site_id=$2 AND source_id=$3",
            [scope.organizationId, scope.siteId, scope.sourceId],
          )
        ).rows[0];
        const group = (read) =>
          demo.reduce((counts, row) => {
            const key = read(row.snapshot);
            counts[key] = (counts[key] ?? 0) + 1;
            return counts;
          }, {});
        return {
          originalCount: originals.length,
          originalRevisionCount: originalHistory.length,
          originalDigest: digest([originals, originalHistory]),
          analytics,
          demoCount: demo.length,
          demoRevisionCount: revisions.length - originalHistory.length,
          demoDigest: digest([
            demo,
            revisions.filter((row) => !originalIds.has(row.entry_id)),
          ]),
          byUser: group((entry) => entry.authorName),
          byDepartment: group((entry) => entry.departmentLabel),
          byState: group((entry) => entry.issueState),
          byDate: group((entry) => entry.content.date),
          byCategory: group((entry) => entry.categoryLabel),
          highlighted: demo.filter((row) => row.snapshot.highlighted).length,
          withEquipment: demo.filter(
            (row) => row.snapshot.content.equipmentCode,
          ).length,
        };
      },
    );
  try {
    const context = await app.context(operator);
    if (!context.canCoordinate)
      throw new Error(
        "The configured local operator must coordinate handover.",
      );
    if (options.action === "prepare") {
      const baseline = await inspect();
      if (baseline.demoCount)
        throw new Error(
          "Demo records already exist. Restore the private manifest before rerunning.",
        );
      const people = [];
      for (const person of context.people) {
        await store.run(
          person.id,
          "handover.contribute",
          async () => undefined,
        );
        people.push(person);
      }
      const departments = [];
      for (const department of catalog.locations.filter(
        (location) => location.role === "department",
      )) {
        const areas = catalog.locations.filter(
          (location) =>
            location.role === "area" &&
            withinLocation(location.id, department.id, catalog.locations),
        );
        const equipment = [];
        for (const area of areas) {
          const result = await app.equipmentChoices(operator, {
            departmentId: department.id,
            areaId: area.id,
            search: "",
            after: "",
          });
          equipment.push(
            ...result.codes
              .slice(0, 2)
              .map((code) => ({ areaId: area.id, code })),
          );
          if (equipment.length >= 4) break;
        }
        departments.push({
          id: department.id,
          label: department.label,
          areaId: areas[0]?.id ?? "",
          equipment,
        });
      }
      const createdAt = new Date().toISOString();
      const today = siteDate(createdAt, catalog.timeZone);
      const scenarios = fixture.buildScenarios({
        today,
        people,
        coordinator: operator,
        restrictedCategoryIds: catalog.categories.filter((category) => category.coordinatorOnly).map((category) => category.id),
        departments,
      });
      scenarios.forEach((scenario) => validContent(scenario.content, catalog));
      return { version: 1, scope, createdAt, today, baseline, scenarios };
    }
    const manifest = options.manifest;
    if (
      manifest?.version !== 1 ||
      JSON.stringify(manifest.scope) !== JSON.stringify(scope) ||
      !Array.isArray(manifest.scenarios) ||
      manifest.scenarios.length > 240
    )
      throw new Error("Demo manifest does not match this installation.");
    const before = await inspect();
    const originalUnchanged = (state) =>
      state.originalDigest === manifest.baseline.originalDigest &&
      JSON.stringify(state.analytics) ===
        JSON.stringify(manifest.baseline.analytics);
    if (options.action === "inspect") {
      const mine = {},
        dailyDepartments = {};
      for (const actor of new Set(
        manifest.scenarios.map((scenario) => scenario.actor),
      )) {
        mine[actor] = (
          await app.list(actor, {
            ...emptySelection,
            search: "[DEMO]",
            mine: true,
          })
        ).total;
      }
      for (const departmentId of new Set(
        manifest.scenarios.map((scenario) => scenario.content.departmentId),
      )) {
        dailyDepartments[departmentId] = (
          await app.list(operator, {
            ...emptySelection,
            search: "[DEMO]",
            departmentId,
            from: manifest.today,
            to: manifest.today,
          })
        ).total;
      }
      const reopened = await app.list(operator, {
        ...emptySelection,
        search: "[DEMO] Repeated stop",
      });
      const reopenedHistories = [];
      for (const entry of reopened.entries) {
        const history = await app.history(operator, entry.id);
        reopenedHistories.push(
          history.revisions
            .slice()
            .reverse()
            .map((revision) => revision.entry.issueState),
        );
      }
      return {
        ...before,
        originalUnchanged: originalUnchanged(before),
        queries: { mine, dailyDepartments, reopenedHistories },
      };
    }
    if (options.action !== "apply") throw new Error("Unknown demo operation.");
    // Validate the entire frozen dataset before the first write.
    for (const scenario of manifest.scenarios) {
      if (
        !scenario.key.startsWith("iop173-") ||
        !scenario.content.summary.startsWith("[DEMO] ")
      )
        throw new Error("Demo marker missing.");
      validContent(scenario.content, catalog);
      await store.run(
        scenario.actor,
        "handover.contribute",
        async () => undefined,
      );
      for (const change of scenario.changes)
        await store.run(
          change.actor,
          "handover.contribute",
          async () => undefined,
        );
      if (scenario.content.equipmentCode) {
        const content = scenario.content;
        const result = await app.equipmentChoices(scenario.actor, {
          departmentId: content.departmentId,
          areaId: content.areaId,
          search: content.equipmentCode,
          after: "",
        });
        if (!result.codes.includes(content.equipmentCode))
          throw new Error("Demo equipment is no longer available.");
      }
    }
    const setDate = (date, step) => {
      let at = Date.parse(date + "T12:00:00Z");
      if (date === manifest.today) at = Date.parse(manifest.createdAt) - 60000;
      if (siteDate(new Date(at).toISOString(), catalog.timeZone) !== date) {
        at = Date.parse(date + "T00:00:00Z");
        while (siteDate(new Date(at).toISOString(), catalog.timeZone) < date)
          at += 3600000;
        while (siteDate(new Date(at).toISOString(), catalog.timeZone) > date)
          at -= 3600000;
      }
      clock = new Date(at + step * 1000).toISOString();
    };
    const results = [];
    for (const scenario of manifest.scenarios)
      results.push(await fixture.applyScenario(app, scenario, setDate));
    const after = await inspect();
    if (
      after.originalDigest !== before.originalDigest ||
      JSON.stringify(after.analytics) !== JSON.stringify(before.analytics)
    )
      throw new Error(
        "Non-demo data changed during the run; inspect concurrent activity.",
      );
    return { ...after, originalUnchanged: originalUnchanged(after), results };
  } finally {
    await pool.end();
  }
}

module.exports = { run };
