const { isDeepStrictEqual } = require("node:util");
const prefix = "iop194-linked-demo-";
const codes = ["DEMO-LINKED-194-A", "DEMO-LINKED-194-B", "DEMO-LINKED-194-C"];
const marker = "[DEMO LINKED] ";
const createReason = marker + "Create fictional linked maintenance exercise.";
function build({
  scope,
  actor,
  worker,
  today,
  departmentId,
  areaId,
  priorityId,
  categoryId,
  exclusions,
  ids,
}) {
  if (
    !actor ||
    !worker ||
    !departmentId ||
    !areaId ||
    !priorityId ||
    !categoryId ||
    exclusions.length > 95
  )
    throw new Error(
      "Linked demo needs an active Team Leader, Technician and configured repair area.",
    );
  const target = (code) => ({
    namespace: "site-equipment",
    code,
    departmentId,
    areaId,
  });
  const assets = codes
    .slice(0, 2)
    .map((code, index) => ({
      id: ids(),
      key: `${prefix}asset-${index}`,
      content: {
        code,
        name:
          marker +
          (index ? "Motor roller reference" : "Cassette sensor reference"),
        type: "Equipment identifier",
        locationId: areaId,
        status: "unverified",
        validationNote: "",
        description:
          "Fictional equipment reference for interface exploration. No physical inspection or analytical source identity is asserted.",
        aliases: [{ ...target(code), sourceId: "", sector: "", area: "" }],
      },
    }));
  const descriptions = [
    "Cassette direction mechanism stopped",
    "Cassette guard requires a separate inspection",
    "Motor roller remains blocked",
    "Unrelated neighbouring conveyor fault",
  ];
  const issues = descriptions.map((summary, index) => ({
    id: ids(),
    key: `${prefix}entry-${index}`,
    content: {
      date: today,
      categoryId,
      summary: marker + summary,
      details:
        "Fictional report. Sensor evidence identifies a repair zone; the cassette or motor roller itself may not have a sensor identifier.",
      departmentId,
      areaId,
      equipmentCode: codes[index < 2 ? 0 : index === 2 ? 1 : 2],
      equipmentNamespace: "site-equipment",
      condition: "blocked",
      externalReference: `${prefix}reference-${index}`,
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: true,
    },
  }));
  const included = (index) => ({
    id: issues[index].id,
    expectedRevision: 1,
    disposition: "include",
    reason: "",
  });
  const excluded = (index) => ({
    id: issues[index].id,
    expectedRevision: 1,
    disposition: "exclude",
    reason: marker + "Separate repair scope; leave this report open.",
  });
  const examples = [
    {
      title: "Investigate motor roller",
      category: "corrective",
      status: "open",
      selected: [codes[1]],
      links: [included(2)],
    },
    {
      title: "Inspect cassette and roller zone",
      category: "preventive",
      status: "in-progress",
      selected: codes.slice(0, 2),
      links: [included(0), included(1), included(2)],
    },
    {
      title: "Inspect cassette guard",
      category: "inspection",
      status: "blocked",
      selected: [codes[0]],
      links: [included(0), included(1)],
    },
    {
      title: "Replace cassette direction mechanism",
      category: "corrective",
      status: "done",
      selected: codes.slice(0, 2),
      links: [included(0), excluded(1), excluded(2)],
    },
  ];
  const records = examples.map((example, index) => ({
    id: `${prefix}work-${index}`,
    finalStatus: example.status,
    data: {
      title: marker + example.title,
      details:
        "Fictional maintenance exercise. No repair was performed on physical equipment.",
      category: example.category,
      repairTarget:
        index === 3
          ? "Cassette direction mechanism; selected identifiers describe nearby sensor evidence"
          : "Cassette or motor roller in the manually selected repair zone",
      locationId: areaId,
      assetId: "",
      priorityId,
      assigneeId: worker,
      teamId: "",
      status: "open",
      dueDate: today,
      outcome: "",
      blockedReason: "",
      externalReference: `${prefix}order-${index}`,
      equipment: example.selected.map(target),
      linkedEntries: [...example.links, ...exclusions],
    },
  }));
  return {
    version: 1,
    scope,
    actor,
    worker,
    today,
    departmentId,
    areaId,
    exclusions,
    assets,
    issues,
    records,
  };
}
function validate(manifest, scope) {
  if (
    manifest?.version !== 1 ||
    !isDeepStrictEqual(manifest.scope, scope) ||
    manifest.assets?.length !== 2 ||
    manifest.issues?.length !== 4 ||
    manifest.records?.length !== 4
  )
    throw new Error("Linked demo manifest does not match this installation.");
  const own = new Set(manifest.issues.map((issue) => issue.id));
  const identifiers = [...manifest.assets, ...manifest.issues].map(
    (entry) => entry.id,
  );
  if (
    new Set(identifiers).size !== identifiers.length ||
    identifiers.some((id) => !/^[0-9a-f-]{36}$/.test(id))
  )
    throw new Error("Linked demo identities are invalid.");
  for (const asset of manifest.assets)
    if (
      !asset.key.startsWith(prefix) ||
      !codes.slice(0, 2).includes(asset.content.code) ||
      asset.content.status !== "unverified" ||
      asset.content.aliases.length !== 1 ||
      asset.content.aliases[0].code !== asset.content.code ||
      asset.content.aliases[0].departmentId !== manifest.departmentId ||
      asset.content.aliases[0].areaId !== manifest.areaId
    )
      throw new Error(
        "Linked demo asset identity is not fictional scoped evidence.",
      );
  for (const issue of manifest.issues)
    if (
      !issue.key.startsWith(prefix) ||
      !issue.content.summary.startsWith(marker) ||
      !codes.includes(issue.content.equipmentCode) ||
      issue.content.departmentId !== manifest.departmentId ||
      issue.content.areaId !== manifest.areaId
    )
      throw new Error("Linked demo report is outside the fictional scope.");
  for (const record of manifest.records) {
    if (
      !record.id.startsWith(prefix) ||
      !record.data.title.startsWith(marker) ||
      record.data.assigneeId !== manifest.worker ||
      record.data.locationId !== manifest.areaId ||
      record.data.equipment.some(
        (target) =>
          !codes.slice(0, 2).includes(target.code) ||
          target.namespace !== "site-equipment" ||
          target.departmentId !== manifest.departmentId ||
          target.areaId !== manifest.areaId,
      )
    )
      throw new Error("Linked demo work scope is invalid.");
    for (const link of record.data.linkedEntries)
      if (link.disposition === "include" && !own.has(link.id))
        throw new Error("Linked demo cannot resolve a pre-existing report.");
  }
}
function finalData(record) {
  return {
    ...record.data,
    status: record.finalStatus,
    outcome:
      record.finalStatus === "done"
        ? marker +
          "Simulated cassette replacement and direction test; no physical work performed."
        : "",
    blockedReason:
      record.finalStatus === "blocked"
        ? marker + "Awaiting a fictional spare guard."
        : "",
  };
}
async function resume(maintenance, manifest, scenario, current) {
  const expected = [{ data: scenario.data, reason: createReason }];
  if (scenario.finalStatus !== "open")
    expected.push({
      data: finalData(scenario),
      reason: marker + "Record the simulated repair progress.",
    });
  const history = (await maintenance.history(manifest.actor, current.id))
    .revisions;
  for (
    let index = 0;
    index < Math.min(current.revision, expected.length);
    index++
  ) {
    const revision = history.find(
      (revision) => revision.record.revision === index + 1,
    );
    if (
      !revision ||
      !isDeepStrictEqual(revision.record.data, expected[index].data) ||
      revision.reason !== expected[index].reason
    )
      throw new Error(
        "Linked demo history diverged; preserve owner changes before resuming.",
      );
  }
  while (current.revision < expected.length) {
    const next = expected[current.revision];
    current = await maintenance.save(manifest.worker, {
      id: current.id,
      expectedRevision: current.revision,
      data: next.data,
      reason: next.reason,
    });
  }
  return current;
}
async function run(options) {
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
      "Linked demo is restricted to the local password-authenticated Docker installation.",
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
  const operator = json(env.IOP_LOCAL_IDENTITY_FILE).users[0].id;
  const pool = new Pool({
    host: env.IOP_DATABASE_HOST,
    port: Number(env.IOP_DATABASE_PORT),
    database: "iop_local",
    user: "iop_runtime",
    password: env.IOP_RUNTIME_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    application_name: "iop-linked-maintenance-demo",
    options: "-c search_path=pg_catalog -c lock_timeout=5000",
  });
  const { runSiteOperation, SiteAccessDeniedError } = compiled(
    "persistence/site-operation",
  );
  const { evaluateSiteAccess } = compiled("modules/users-rbac");
  const { sitePeople, sitePersonNames, workforcePeople } = compiled(
    "modules/users-rbac/adapters/postgres/site-people",
  );
  const { Maintenance } = compiled(
    "modules/maintenance/application/maintenance",
  );
  const { PgMaintenance } = compiled(
    "modules/maintenance/adapters/postgres/store",
  );
  const { Assets } = compiled("modules/assets/application/assets");
  const { PgAssets, assetReferences, assetReference } = compiled(
    "modules/assets/adapters/postgres/store",
  );
  const { Handover } = compiled("modules/shift-handover/application/handover");
  const { PgHandover } = compiled(
    "modules/shift-handover/adapters/postgres/store",
  );
  const {
    handoverMaintenanceIssues,
    pendingHandoverMaintenanceIssues,
    resolveHandoverMaintenanceIssues,
  } = compiled("modules/shift-handover/adapters/postgres/maintenance-issues");
  const { maintenanceDefaults } = compiled(
    "host/adapters/maintenance-defaults",
  );
  const { workforceDefaults } = compiled("host/adapters/workforce-defaults");
  const { workforceTeams } = compiled(
    "modules/workforce/adapters/postgres/teams",
  );
  const { siteDate, withinLocation } = compiled(
    "modules/shift-handover/domain/handover",
  );
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
  const now = () => new Date().toISOString();
  let nextIdentity;
  const assets = new Assets(
    new PgAssets(pool, scope, { allowed, names, sources: [] }),
    catalog.locations,
    catalog.timeZone,
    () => nextIdentity,
    now,
  );
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
    now,
    catalog.timeZone,
  );
  let actor = operator;
  const inspect = () =>
    runSiteOperation(
      pool,
      {
        ...scope,
        userId: actor,
        permissions: ["maintenance.read", "handover.read", "assets.read"],
      },
      async (tx) => {
        const rows = async (table, order) =>
          (
            await tx.query(
              `SELECT row_to_json(t) AS value FROM ${table} t WHERE organization_id=$1 AND site_id=$2 ORDER BY ${order}`,
              [scope.organizationId, scope.siteId],
            )
          ).rows.map((row) => row.value);
        const assetRows = await rows("assets.records", "id"),
          workRows = await rows("maintenance.records", "id"),
          entryRows = await rows("shift_handover.entries", "id");
        const assetIds = new Set(
          assetRows
            .filter((row) => row.request_key.startsWith(prefix))
            .map((row) => row.id),
        );
        const issueIds = new Set(
          entryRows
            .filter((row) => row.request_key.startsWith(prefix))
            .map((row) => row.id),
        );
        const ownWork = (row) => row.id.startsWith(prefix);
        const originals = [
          assetRows.filter((row) => !assetIds.has(row.id)),
          (await rows("assets.revisions", "asset_id,revision")).filter(
            (row) => !assetIds.has(row.asset_id),
          ),
          (await rows("assets.aliases", "asset_id,alias_key")).filter(
            (row) => !assetIds.has(row.asset_id),
          ),
          workRows.filter((row) => !ownWork(row)),
          (await rows("maintenance.revisions", "id,revision")).filter(
            (row) => !ownWork(row),
          ),
          entryRows.filter((row) => !issueIds.has(row.id)),
          (await rows("shift_handover.revisions", "entry_id,revision")).filter(
            (row) => !issueIds.has(row.entry_id),
          ),
          (await rows("shift_handover.equipment_references", "id")).filter(
            (row) => !codes.includes(row.code),
          ),
          await rows("maintenance.settings", "revision"),
          await rows("maintenance.settings_revisions", "revision"),
        ];
        const analytics = (
          await tx.query(
            "SELECT count(*)::integer AS facts,coalesce(sum(haufigkeit),0)::text AS frequency,coalesce(sum(dauer_sekunden),0)::text AS seconds FROM analytics.fact_hitliste WHERE organization_id=$1 AND site_id=$2 AND source_id=$3",
            [scope.organizationId, scope.siteId, local.source.id],
          )
        ).rows[0];
        const ownAssets = assetRows.filter((row) => assetIds.has(row.id)),
          ownEntries = entryRows.filter((row) => issueIds.has(row.id)),
          ownRecords = workRows.filter(ownWork);
        const group = (rows, read) =>
          rows.reduce((result, row) => {
            const key = read(row);
            result[key] = (result[key] ?? 0) + 1;
            return result;
          }, {});
        const digest = (value) =>
          createHash("sha256").update(JSON.stringify(value)).digest("hex");
        return {
          originalDigest: digest(originals),
          originalCounts: originals.map((rows) => rows.length),
          analytics,
          assets: ownAssets.length,
          problems: ownEntries.length,
          problemStates: group(ownEntries, (row) => row.snapshot.issueState),
          maintenance: ownRecords.length,
          maintenanceStates: group(ownRecords, (row) => row.status),
          categories: group(ownRecords, (row) => row.snapshot.data.category),
          demoDigest: digest([ownAssets, ownEntries, ownRecords]),
        };
      },
    );
  try {
    const people = await runSiteOperation(
      pool,
      { ...scope, userId: operator, permissions: ["maintenance.read"] },
      (tx) => workforcePeople(tx, scope.organizationId, scope.siteId),
    );
    const leaders = people
      .filter((person) => person.profile === "team-leader")
      .sort(
        (a, b) =>
          Number(b.id === options.manifest?.actor) -
          Number(a.id === options.manifest?.actor),
      );
    let context;
    for (const person of leaders)
      try {
        const [work, asset] = await Promise.all([
          maintenance.catalog(person.id),
          assets.context(person.id),
        ]);
        if (work.canCoordinate && asset.canManage) {
          actor = person.id;
          context = work;
          break;
        }
      } catch (error) {
        if (!(error instanceof SiteAccessDeniedError)) throw error;
      }
    if (!context)
      throw new Error(
        "Linked demo requires an existing active Team Leader with current operational grants.",
      );
    let manifest = options.manifest;
    if (options.action === "prepare") {
      const baseline = await inspect();
      if (baseline.assets || baseline.problems || baseline.maintenance)
        throw new Error(
          "Linked demo already exists; restore its private manifest before rerunning.",
        );
      const worker = people.find(
        (person) =>
          person.profile === "technician" &&
          context.people.some((candidate) => candidate.id === person.id),
      );
      if (!worker || !(await maintenance.catalog(worker.id)).canContribute)
        throw new Error("Linked demo requires an existing active Technician.");
      const area = catalog.locations.find(
        (location) =>
          location.role === "area" &&
          catalog.locations.some(
            (department) =>
              department.role === "department" &&
              withinLocation(location.id, department.id, catalog.locations),
          ),
      );
      if (!area)
        throw new Error(
          "Linked demo requires a configured department and area.",
        );
      const department = catalog.locations.find(
        (location) =>
          location.role === "department" &&
          withinLocation(area.id, location.id, catalog.locations),
      );
      const category =
        catalog.categories.find((category) => category.carryForward) ??
        catalog.categories[0];
      const equipment = codes
        .slice(0, 2)
        .map((code) => ({
          namespace: "site-equipment",
          code,
          departmentId: department.id,
          areaId: area.id,
        }));
      const exclusions = [];
      let cursor = "";
      do {
        const page = await maintenance.related(actor, {
          locationId: area.id,
          equipment,
          cursor,
        });
        exclusions.push(
          ...page.entries
            .filter((entry) =>
              ["open", "in-progress"].includes(entry.issueState),
            )
            .map((entry) => ({
              id: entry.id,
              expectedRevision: entry.revision,
              disposition: "exclude",
              reason:
                marker +
                "Existing operational report is outside this fictional exercise; leave it unchanged.",
            })),
        );
        cursor = page.nextCursor;
        if (exclusions.length > 95)
          throw new Error(
            "Too many pending reports in the repair area; narrow the fixture scope.",
          );
      } while (cursor);
      manifest = build({
        scope,
        actor,
        worker: worker.id,
        today: siteDate(now(), catalog.timeZone),
        departmentId: department.id,
        areaId: area.id,
        priorityId:
          context.settings.priorities.find(
            (priority) => priority.id === "normal",
          )?.id ?? context.settings.priorities[0].id,
        categoryId: category.id,
        exclusions,
        ids: randomUUID,
      });
      validate(manifest, scope);
      return { ...manifest, baseline };
    }
    validate(manifest, scope);
    if (options.action !== "apply" && options.action !== "inspect")
      throw new Error("Unknown linked demo operation.");
    if (options.action === "apply" && manifest.actor !== actor)
      throw new Error(
        "Original linked demo author no longer has permissions; inspect retained data without recreating it.",
      );
    const before = await inspect();
    if (options.action === "apply") {
      if (!(await maintenance.catalog(manifest.worker)).canContribute)
        throw new Error("Original demo Technician no longer has permissions.");
      const { validContent } = compiled("modules/assets/domain/assets");
      const { data } = compiled("modules/maintenance/domain/maintenance");
      const { validContent: handoverContent } = compiled(
        "modules/shift-handover/domain/handover",
      );
      for (const asset of manifest.assets)
        validContent(asset.content, catalog.locations);
      for (const issue of manifest.issues)
        handoverContent(issue.content, catalog);
      for (const record of manifest.records) {
        data(record.data);
        data(finalData(record));
      }
      const handover = new Handover(
        new PgHandover(pool, scope, {
          allowed,
          names,
          people: (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
          // Only this local fixture's fictional exact identifiers are supplied; analytical data is never changed.
          equipment: async (
            tx,
            userId,
            departmentId,
            areaId,
            search,
            after,
            exact,
          ) => {
            if (
              !(await allowed(tx, userId, "handover.read")) ||
              departmentId !== manifest.departmentId ||
              areaId !== manifest.areaId
            )
              return { codes: [], nextCursor: "" };
            return {
              codes: codes.filter(
                (code) =>
                  (exact ? code === search : code.includes(search)) &&
                  code > after,
              ),
              nextCursor: "",
            };
          },
        }),
        catalog,
        () => nextIdentity,
        now,
      );
      for (const asset of manifest.assets) {
        nextIdentity = asset.id;
        const created = await assets.save(actor, {
          key: asset.key,
          id: "",
          expectedRevision: 0,
          note: marker + "Register fictional equipment reference.",
          content: asset.content,
        });
        if (created.id !== asset.id)
          throw new Error(
            "Linked asset identity differs from the retained manifest.",
          );
      }
      for (const issue of manifest.issues) {
        nextIdentity = issue.id;
        const created = await handover.create(actor, {
          key: issue.key,
          issue: true,
          responsibleId: actor,
          content: issue.content,
        });
        if (created.id !== issue.id)
          throw new Error(
            "Linked report identity differs from the retained manifest.",
          );
      }
      for (const scenario of manifest.records) {
        const current = await maintenance.save(actor, {
          id: scenario.id,
          expectedRevision: 0,
          data: scenario.data,
          reason: createReason,
        });
        await resume(maintenance, manifest, scenario, current);
      }
    }
    const after = await inspect();
    if (
      before.originalDigest !== after.originalDigest ||
      !isDeepStrictEqual(before.analytics, after.analytics)
    )
      throw new Error(
        "Existing data changed during the linked demo run; inspect concurrent activity.",
      );
    const assigned = await maintenance.assignments(manifest.worker, {});
    return {
      ...after,
      existingUnchanged:
        after.originalDigest === manifest.baseline.originalDigest &&
        isDeepStrictEqual(after.analytics, manifest.baseline.analytics),
      assignedUnfinished: assigned.records.filter((record) =>
        record.id.startsWith(prefix),
      ).length,
      assignmentNotices: assigned.events.filter((event) =>
        event.recordId.startsWith(prefix),
      ).length,
    };
  } finally {
    await pool.end();
  }
}
module.exports = {
  run,
  build,
  validate,
  resume,
  finalData,
  prefix,
  createReason,
};
