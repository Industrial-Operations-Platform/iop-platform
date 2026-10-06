const catalogVersion = 1;
const catalogPrefix = "iop194-catalog-";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
function digest(value) {
  return require("node:crypto")
    .createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
function contentOf(content) {
  return {
    ...structuredClone(content),
    locationDetails: content.locationDetails ?? "",
  };
}
function isTraining(code) {
  return /^DEMO-(?:194-|LINKED-194-)/.test(code);
}
function aliasKey(alias) {
  return JSON.stringify([
    alias.namespace,
    alias.sourceId,
    alias.code,
    alias.departmentId,
    alias.areaId,
    alias.sector,
    alias.area,
  ]);
}
function exactAliases(aliases) {
  return [
    ...new Map(aliases.map((alias) => [aliasKey(alias), alias])).values(),
  ].sort((first, second) => (aliasKey(first) < aliasKey(second) ? -1 : 1));
}
function underLocation(locations, id, parentId) {
  const seen = new Set();
  while (id && !seen.has(id)) {
    if (id === parentId) return true;
    seen.add(id);
    id = locations.find((location) => location.id === id)?.parentId ?? "";
  }
  return false;
}
function mapContext(candidate, locations) {
  const departments = locations.filter(
    (location) =>
      location.role === "department" && location.sectorKey === candidate.sector,
  );
  if (departments.length !== 1) return null;
  const areas = locations.filter(
    (location) =>
      location.role === "area" &&
      location.label === candidate.area &&
      underLocation(locations, location.id, departments[0].id),
  );
  return areas.length === 1
    ? { departmentId: departments[0].id, areaId: areas[0].id }
    : null;
}

/** Deterministic reconciliation decisions; no database, account or Docker mutation. */
function prepareCatalog({
  scope,
  actor,
  contexts,
  reported = [],
  assets,
  locations,
  baseline,
}) {
  if (
    !Array.isArray(contexts) ||
    contexts.length > 10000 ||
    !Array.isArray(assets) ||
    assets.length > 10000
  )
    throw new Error("Equipment catalog exceeds the supported limit.");
  const imported = new Map();
  for (const candidate of contexts) {
    if (
      candidate.namespace !== "analytics" ||
      !candidate.code ||
      !candidate.sourceId ||
      !candidate.sector ||
      !candidate.area ||
      candidate.code.length > 160
    )
      throw new Error("An imported equipment identity is incomplete.");
    const values = imported.get(candidate.code) ?? [];
    values.push(candidate);
    imported.set(candidate.code, values);
  }
  const existing = new Map(assets.map((asset) => [asset.content.code, asset]));
  if (existing.size !== assets.length)
    throw new Error("The registry contains duplicate exact codes.");
  if (
    assets.some(
      (asset) =>
        isTraining(asset.content.code) && imported.has(asset.content.code),
    )
  )
    throw new Error(
      "A training marker overlaps a retained source code; inspect it before reconciliation.",
    );
  const codes = [
    ...new Set([
      ...imported.keys(),
      ...assets
        .filter((asset) => !isTraining(asset.content.code))
        .map((asset) => asset.content.code),
    ]),
  ].sort();
  if (
    codes.length +
      assets.filter((asset) => isTraining(asset.content.code)).length >
    10000
  )
    throw new Error("The reconciled registry exceeds the supported limit.");
  const manifestId = digest({
    scope,
    contexts,
    assets,
    locations,
    baseline,
  }).slice(0, 16);
  const actions = [];
  for (const code of codes) {
    const before = existing.get(code);
    const evidence = imported.get(code) ?? [];
    const mapped = evidence.map((candidate) =>
      mapContext(candidate, locations),
    );
    const aliases = [
      ...(before?.content.aliases ?? []).filter((alias) => alias.code === code),
    ];
    for (const candidate of evidence) {
      aliases.push({
        namespace: "analytics",
        sourceId: candidate.sourceId,
        code,
        sector: candidate.sector,
        area: candidate.area,
        departmentId: "",
        areaId: "",
      });
      const mapping = mapContext(candidate, locations);
      if (mapping)
        aliases.push({
          namespace: "site-equipment",
          sourceId: "",
          code,
          sector: "",
          area: "",
          ...mapping,
        });
    }
    for (const candidate of reported.filter(
      (candidate) => candidate.code === code,
    ))
      aliases.push({
        namespace: "site-equipment",
        sourceId: "",
        code,
        sector: "",
        area: "",
        departmentId: candidate.departmentId,
        areaId: candidate.areaId,
      });
    const preparedAliases = exactAliases(aliases);
    if (preparedAliases.length > 30)
      throw new Error("An equipment code exceeds the supported alias limit.");
    const mappedAreas = new Set(
      mapped.filter(Boolean).map((mapping) => mapping.areaId),
    );
    const locationId =
      before?.content.locationId ||
      (mapped.length && mapped.every(Boolean) && mappedAreas.size === 1
        ? [...mappedAreas][0]
        : "");
    const content = before
      ? { ...contentOf(before.content), name: code, aliases: preparedAliases }
      : {
          code,
          name: code,
          type: "",
          locationId,
          status: "unverified",
          validationNote: "",
          description:
            "Provisional equipment identifier from retained source evidence. Physical identity and current condition remain unverified.",
          aliases: preparedAliases,
          locationDetails: "",
        };
    if (before) content.locationId = before.content.locationId || locationId;
    if (before && digest(contentOf(before.content)) === digest(content))
      continue;
    actions.push({
      kind: before ? "update" : "create",
      code,
      id: before?.id ?? "",
      expectedRevision: before?.revision ?? 0,
      key: before ? "" : catalogPrefix + digest([scope, code]).slice(0, 44),
      beforeContent: before ? contentOf(before.content) : null,
      content,
      note: `IOP-194 catalog ${manifestId}: ${before ? "retain identity and reconcile exact code evidence" : "register provisional equipment identifier"}.`,
    });
  }
  for (const asset of assets.filter(
    (asset) =>
      isTraining(asset.content.code) && asset.content.status !== "retired",
  )) {
    const content = {
      ...contentOf(asset.content),
      name: asset.content.code,
      status: "retired",
      aliases: asset.content.aliases.filter(
        (alias) => alias.code === asset.content.code,
      ),
    };
    actions.push({
      kind: "archive",
      code: asset.content.code,
      id: asset.id,
      expectedRevision: asset.revision,
      key: "",
      beforeContent: contentOf(asset.content),
      content,
      note: `IOP-194 catalog ${manifestId}: archive superseded training identity; preserve work references and immutable history.`,
    });
  }
  // Release cross-code aliases on retained identities before new identities claim them.
  actions.sort(
    (first, second) =>
      Number(first.kind === "create") - Number(second.kind === "create") ||
      (first.code < second.code ? -1 : first.code > second.code ? 1 : 0),
  );
  const claims = new Map();
  const desired = new Map(
    assets.map((asset) => [asset.content.code, asset.content]),
  );
  for (const action of actions) desired.set(action.code, action.content);
  for (const [code, content] of desired)
    for (const alias of content.aliases) {
      const key = aliasKey(alias);
      if (claims.has(key) && claims.get(key) !== code)
        throw new Error(
          "The proposed registry contains an ambiguous alias claim.",
        );
      claims.set(key, code);
    }
  const summary = {
    importedCodes: imported.size,
    manualOnlyCodes: codes.filter((code) => !imported.has(code)).length,
    contextualIdentities: contexts.length,
    sourceIds: [
      ...new Set(contexts.map((candidate) => candidate.sourceId)),
    ].sort(),
    create: actions.filter((action) => action.kind === "create").length,
    update: actions.filter((action) => action.kind === "update").length,
    archive: actions.filter((action) => action.kind === "archive").length,
    retainedTrainingIdentities: assets.filter((asset) =>
      isTraining(asset.content.code),
    ).length,
    expectedRegistryRecords:
      assets.length +
      actions.filter((action) => action.kind === "create").length,
    expectedCurrentCodes: [...desired.values()].filter(
      (content) => content.status !== "retired",
    ).length,
  };
  return {
    version: catalogVersion,
    manifestId,
    scope,
    actor,
    sourceDigest: digest(contexts),
    locationDigest: digest(locations),
    baseline,
    originalHeads: assets.map((asset) => ({
      id: asset.id,
      revision: asset.revision,
    })),
    actions,
    summary,
  };
}

/** A retained request/revision proves our prefix; later owner edits are never overwritten. */
function actionState(action, manifest, rows, revisions) {
  if (action.kind === "create") {
    const prior = rows.find(
      (row) =>
        row.author_id === manifest.actor && row.request_key === action.key,
    );
    if (prior) {
      if (
        digest(JSON.parse(prior.fingerprint)) !==
        digest({ content: action.content, note: action.note })
      )
        throw new Error(
          "A catalog request key has conflicting original content.",
        );
      return {
        complete: true,
        preserved:
          digest(contentOf(prior.snapshot.content)) !== digest(action.content),
      };
    }
    if (rows.some((row) => row.snapshot.content.code === action.code))
      throw new Error(
        "An equipment identity was registered after preview; review the catalog before retrying.",
      );
    return { complete: false, preserved: false };
  }
  const current = rows.find((row) => row.snapshot.id === action.id)?.snapshot;
  if (!current) throw new Error("A retained catalog identity is unavailable.");
  if (
    current.revision === action.expectedRevision &&
    digest(contentOf(current.content)) === digest(action.beforeContent)
  )
    return { complete: false, preserved: false };
  const retained = revisions.find(
    (revision) =>
      revision.asset.id === action.id &&
      revision.asset.revision === action.expectedRevision + 1 &&
      revision.actorId === manifest.actor &&
      revision.note === action.note &&
      digest(contentOf(revision.asset.content)) === digest(action.content),
  );
  if (retained)
    return {
      complete: true,
      preserved:
        current.revision > retained.asset.revision ||
        digest(contentOf(current.content)) !== digest(action.content),
    };
  throw new Error(
    "An asset changed after preview; catalog reconciliation will not overwrite it.",
  );
}
async function applyCatalog(manifest, snapshot, save, progress = () => {}) {
  const states = manifest.actions.map((action) =>
    actionState(action, manifest, snapshot.rows, snapshot.revisions),
  );
  let completed = states.filter((state) => state.complete).length;
  const preserved = states.filter((state) => state.preserved).length;
  let written = 0;
  for (let index = 0; index < manifest.actions.length; index++) {
    if (states[index].complete) continue;
    const action = manifest.actions[index];
    await save({
      key: action.key,
      id: action.id,
      expectedRevision: action.expectedRevision,
      content: action.content,
      note: action.note,
    });
    written++;
    completed++;
    if (written % 250 === 0)
      progress({ completed, total: manifest.actions.length, written });
  }
  return { completed, written, preservedOwnerEdits: preserved };
}

async function run(options) {
  const { readFileSync } = require("node:fs"),
    { resolve } = require("node:path"),
    { randomUUID } = require("node:crypto");
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
      "Equipment reconciliation requires the local password-authenticated Docker installation.",
    );
  const local = compiled("host/configuration").loadConfiguration(
    env.IOP_CONFIG_FILE,
  );
  const scope = {
    organizationId: local.organization.id,
    siteId: local.site.id,
  };
  const source = { ...scope, sourceId: local.source.id };
  const catalog = compiled("host/adapters/handover-catalog").handoverCatalog(
    JSON.parse(readFileSync(env.IOP_HANDOVER_CONFIG_FILE, "utf8")),
    source,
    local.site.timeZone,
  );
  const configuredOperator = JSON.parse(
    readFileSync(env.IOP_LOCAL_IDENTITY_FILE, "utf8"),
  ).users[0].id;
  const { runSiteOperation } = compiled("persistence/site-operation");
  const { evaluateSiteAccess } = compiled("modules/users-rbac");
  const { sitePeople, sitePersonNames } = compiled(
    "modules/users-rbac/adapters/postgres/site-people",
  );
  const { Assets } = compiled("modules/assets/application/assets");
  const { validContent } = compiled("modules/assets/domain/assets");
  const { PgAssets } = compiled("modules/assets/adapters/postgres/store");
  const { importedEquipmentCatalog } = compiled(
    "modules/oip/adapters/postgres/equipment-catalog",
  );
  const { handoverEquipmentCatalog } = compiled(
    "modules/shift-handover/adapters/postgres/equipment-catalog",
  );
  const { assetEquipmentCatalog } = compiled(
    "host/adapters/asset-equipment-catalog",
  );
  const pool = new Pool({
    host: env.IOP_DATABASE_HOST,
    port: Number(env.IOP_DATABASE_PORT),
    database: "iop_local",
    user: "iop_runtime",
    password: env.IOP_RUNTIME_PASSWORD,
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    application_name: "iop-asset-equipment-catalog",
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
  const app = new Assets(
    new PgAssets(pool, scope, {
      allowed,
      sources: [],
      equipment: (tx, selection) =>
        assetEquipmentCatalog(tx, source, catalog.locations, selection),
      names: (tx, ids) =>
        sitePersonNames(tx, scope.organizationId, scope.siteId, ids),
    }),
    catalog.locations,
    local.site.timeZone,
    randomUUID,
    () => new Date().toISOString(),
  );
  let actor;
  const read = (work) =>
    runSiteOperation(
      pool,
      {
        ...scope,
        userId: actor,
        permissions: [
          "assets.read",
          "analytics.read",
          "handover.read",
          "maintenance.read",
        ],
      },
      work,
    );
  const snapshot = (originalHeads) =>
    read(async (tx) => {
      const selectors = [scope.organizationId, scope.siteId];
      const rows = (
        await tx.query(
          "SELECT author_id,request_key,fingerprint,snapshot FROM assets.records WHERE organization_id=$1 AND site_id=$2 ORDER BY id",
          selectors,
        )
      ).rows;
      const revisions = (
        await tx.query(
          "SELECT snapshot FROM assets.revisions WHERE organization_id=$1 AND site_id=$2 ORDER BY asset_id,revision",
          selectors,
        )
      ).rows.map((row) => row.snapshot);
      const contexts = await importedEquipmentCatalog(tx, source);
      const reported = await handoverEquipmentCatalog(tx, scope, {
        locationIds: [],
        search: "",
        code: "",
      });
      const tables = [
        ["maintenance.records", "id"],
        ["maintenance.revisions", "id,revision"],
        ["maintenance.settings", "revision"],
        ["maintenance.settings_revisions", "revision"],
        ["shift_handover.entries", "id"],
        ["shift_handover.revisions", "entry_id,revision"],
        ["shift_handover.equipment_references", "id"],
        ["oip.facts", "source_id,import_id,source_record_number"],
        ["oip.publications", "source_id,import_id"],
        ["analytics.fact_hitliste", "source_id,import_id,source_record_number"],
      ];
      const baseline = {};
      for (const [table, order] of tables) {
        const result = await tx.query(
          `SELECT count(*)::integer AS count,
        md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY ${order}),'')) AS digest
        FROM ${table} t WHERE organization_id=$1 AND site_id=$2`,
          selectors,
        );
        baseline[table] = result.rows[0];
      }
      const heads =
        originalHeads ??
        rows.map((row) => ({
          id: row.snapshot.id,
          revision: row.snapshot.revision,
        }));
      const originalHistory = revisions.filter((revision) =>
        heads.some(
          (head) =>
            head.id === revision.asset.id &&
            revision.asset.revision <= head.revision,
        ),
      );
      baseline.originalAssetRevisions = {
        count: originalHistory.length,
        digest: digest(originalHistory),
      };
      return { rows, revisions, contexts, reported, baseline };
    });
  try {
    const people = await runSiteOperation(
      pool,
      {
        ...scope,
        userId: configuredOperator,
        permissions: ["maintenance.read"],
      },
      (tx) => sitePeople(tx, scope.organizationId, scope.siteId),
    );
    const candidates = options.manifest
      ? people.filter((person) => person.id === options.manifest.actor)
      : people;
    for (const person of candidates) {
      try {
        await runSiteOperation(
          pool,
          {
            ...scope,
            userId: person.id,
            permissions: [
              "assets.manage",
              "analytics.read",
              "handover.read",
              "maintenance.read",
              "maintenance.coordinate",
            ],
          },
          async () => true,
        );
        actor = person.id;
        break;
      } catch (error) {
        if (
          !(
            error instanceof
            compiled("persistence/site-operation").SiteAccessDeniedError
          )
        )
          throw error;
      }
    }
    if (!actor)
      throw new Error(
        "The retained catalog author must be an eligible Administrator or Team Leader with current source access.",
      );
    const current = await snapshot(options.manifest?.originalHeads);
    if (options.action === "prepare") {
      const manifest = prepareCatalog({
        scope,
        actor,
        contexts: current.contexts,
        reported: current.reported,
        assets: current.rows.map((row) => row.snapshot),
        locations: catalog.locations,
        baseline: current.baseline,
      });
      for (const action of manifest.actions)
        validContent(action.content, catalog.locations);
      return manifest;
    }
    const manifest = options.manifest;
    if (
      !manifest ||
      manifest.version !== catalogVersion ||
      digest(manifest.scope) !== digest(scope) ||
      manifest.actor !== actor ||
      digest(catalog.locations) !== manifest.locationDigest ||
      digest(current.contexts) !== manifest.sourceDigest ||
      manifest.actions.length > 10000
    )
      throw new Error(
        "The frozen catalog manifest no longer matches the scoped source/configuration.",
      );
    const states = manifest.actions.map((action) =>
      actionState(action, manifest, current.rows, current.revisions),
    );
    const protectedDataUnchanged =
      digest(manifest.baseline) === digest(current.baseline);
    const summary = {
      ...manifest.summary,
      registryRecords: current.rows.length,
      currentAssets: current.rows.filter(
        (row) => row.snapshot.content.status !== "retired",
      ).length,
      retiredAssets: current.rows.filter(
        (row) => row.snapshot.content.status === "retired",
      ).length,
      completed: states.filter((state) => state.complete).length,
      pending: states.filter((state) => !state.complete).length,
      preservedOwnerEdits: states.filter((state) => state.preserved).length,
      protectedDataUnchanged,
      protectedCounts: Object.fromEntries(
        Object.entries(current.baseline).map(([table, evidence]) => [
          table,
          evidence.count,
        ]),
      ),
    };
    if (options.action === "inspect") return summary;
    if (!protectedDataUnchanged)
      throw new Error(
        "Protected source/work/history changed after preview; no further catalog writes will run.",
      );
    for (const action of manifest.actions)
      validContent(action.content, catalog.locations);
    if (options.action === "preview")
      return { ...summary, databaseWrites: false };
    if (options.action !== "apply")
      throw new Error("Unsupported catalog action.");
    const result = await applyCatalog(
      manifest,
      current,
      (request) => app.save(actor, request),
      (progress) =>
        console.error(
          `Catalog progress: ${progress.completed}/${progress.total}; ${progress.written} writes.`,
        ),
    );
    const after = await snapshot(manifest.originalHeads);
    if (digest(manifest.baseline) !== digest(after.baseline))
      throw new Error(
        "Catalog writes finished, but protected data changed during the run; inspect the retained manifest.",
      );
    return {
      ...manifest.summary,
      ...result,
      registryRecords: after.rows.length,
      currentAssets: after.rows.filter(
        (row) => row.snapshot.content.status !== "retired",
      ).length,
      retiredAssets: after.rows.filter(
        (row) => row.snapshot.content.status === "retired",
      ).length,
      protectedDataUnchanged: true,
      protectedCounts: Object.fromEntries(
        Object.entries(after.baseline).map(([table, evidence]) => [
          table,
          evidence.count,
        ]),
      ),
    };
  } finally {
    await pool.end();
  }
}
module.exports = { prepareCatalog, actionState, applyCatalog, digest, run };
