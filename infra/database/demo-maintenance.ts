import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { configuration, DatabaseError } from "./configuration";
import { verifyRole } from "./provision";
const revision = "20260927010000-demo-maintenance";
const names = [
  "20260923000000-privilege-baseline",
  "20260924000000-organizations",
  "20260925000000-sites",
  "20260926000000-users",
  "20260926010000-memberships",
  "20260926020000-authorization-lookup",
  "20260926030000-import-batches",
  "20260927000000-oip-aggregates",
  revision,
  "20260928000000-reporting-profiles",
  "20260929000000-hitliste-analytics",
  "20260930000000-transitional-access",
  "20261001000000-shift-handover",
];
function target(env: NodeJS.ProcessEnv) {
  if (env.IOP_EXECUTION_MODE !== "local-demo" || env.NODE_ENV === "production")
    throw new DatabaseError("Explicit local demo maintenance is required.");
  const values = [
    env.IOP_RESET_ORGANIZATION_ID,
    env.IOP_RESET_SITE_ID,
    env.IOP_RESET_SOURCE_ID,
  ];
  if (
    !values.every(
      (v) =>
        typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(v),
    )
  )
    throw new DatabaseError("An explicit complete reset target is required.");
  return values as string[];
}
/** Offline, trusted installation command. No runtime credentials or endpoint can invoke reset. */
export async function demoMaintenance(
  env: NodeJS.ProcessEnv,
  mode: "register" | "reset",
): Promise<{ datasetId: string; attempts: number; bytes: number }> {
  const scope = target(env);
  const client = new Client(configuration(env, "migrator"));
  try {
    await client.connect();
    if (
      !(await verifyRole(client, "migrator")) ||
      (await client.query("SELECT current_user AS name")).rows[0].name !==
        "iop_migrator"
    )
      throw new DatabaseError("Demo maintenance requires the migrator.");
    await client.query("BEGIN");
    const lease = await client.query(
      "SELECT pg_try_advisory_xact_lock(190147) AS locked",
    );
    if (!lease.rows[0].locked)
      throw new DatabaseError(
        "Stop the demo host and every runtime operation before maintenance.",
      );
    const connections = await client.query(
      "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename='iop_runtime'",
    );
    if (connections.rows[0].count !== 0)
      throw new DatabaseError(
        "Runtime connections remain; stop the host before maintenance.",
      );
    const migrations = await client.query(
      "SELECT name FROM iop_migrations.history ORDER BY name",
    );
    if (
      JSON.stringify(migrations.rows.map((r) => r.name)) !==
      JSON.stringify(names)
    )
      throw new DatabaseError(
        "Unsupported migration version for demo maintenance.",
      );
    await client.query(
      `SELECT set_config('iop.seed_organization_id',$1,true),set_config('iop.seed_site_id',$2,true),
      set_config('iop.reset_organization_id',$1,true),set_config('iop.reset_site_id',$2,true),
      set_config('iop.reset_source_id',$3,true),set_config('iop.reset_metadata','on',true)`,
      scope,
    );
    if (
      (
        await client.query(
          "SELECT 1 FROM platform_core.sites WHERE organization_id=$1 AND site_id=$2",
          scope.slice(0, 2),
        )
      ).rowCount !== 1
    )
      throw new DatabaseError("The configured demo site does not exist.");
    await client.query(
      "LOCK TABLE analytics.fact_hitliste,analytics.betriebsmittel,analytics.bereich,analytics.sektor,analytics.meldetext,analytics.meldung_typ,analytics.meldegruppe,iop_demo.installation,oip.facts,oip.publications,integrations.import_date_claims,integrations.import_batches,integrations.import_quota IN EXCLUSIVE MODE",
    );
    const marker = await client.query(
      "SELECT * FROM iop_demo.installation WHERE singleton FOR UPDATE",
    );
    const totals = await client.query(
      "SELECT count(*)::integer AS attempts,coalesce(sum(byte_length),0)::text AS bytes FROM integrations.import_batches",
    );
    const quota = await client.query(
      "SELECT retained_attempts,retained_bytes::text FROM integrations.import_quota WHERE singleton FOR UPDATE",
    );
    if (
      quota.rowCount !== 1 ||
      quota.rows[0].retained_attempts !== totals.rows[0].attempts ||
      quota.rows[0].retained_bytes !== totals.rows[0].bytes
    )
      throw new DatabaseError("Quota drift: no changes made.");
    if (marker.rowCount === 0) {
      if (mode !== "register" || totals.rows[0].attempts !== 0)
        throw new DatabaseError(
          "Register an empty dedicated installation before importing data.",
        );
      const datasetId = randomUUID();
      await client.query(
        `INSERT INTO iop_demo.installation(singleton,dataset_id,organization_id,site_id,source_id,schema_revision)
        VALUES(true,$1,$2,$3,$4,$5)`,
        [datasetId, ...scope, revision],
      );
      await client.query("COMMIT");
      return { datasetId, attempts: 0, bytes: 0 };
    }
    const m = marker.rows[0];
    if (
      m.organization_id !== scope[0] ||
      m.site_id !== scope[1] ||
      m.source_id !== scope[2] ||
      m.schema_revision !== revision
    )
      throw new DatabaseError(
        "Installation marker does not match the complete target.",
      );
    if (mode === "register") {
      await client.query("COMMIT");
      return { datasetId: m.dataset_id, attempts: 0, bytes: 0 };
    }
    if (env.IOP_DEMO_DATASET_ID !== m.dataset_id)
      throw new DatabaseError(
        "Explicit confirmation of the exact dataset identity is required.",
      );
    const selected = await client.query(
      `SELECT count(*)::integer AS attempts,coalesce(sum(byte_length),0)::text AS bytes
      FROM integrations.import_batches WHERE organization_id=$1 AND site_id=$2 AND source_id=$3`,
      scope,
    );
    for (const table of [
      "analytics.fact_hitliste",
      "analytics.betriebsmittel",
      "analytics.bereich",
      "analytics.sektor",
      "analytics.meldetext",
      "analytics.meldung_typ",
      "analytics.meldegruppe",
      "oip.facts",
      "oip.publications",
      "integrations.import_date_claims",
      "integrations.import_batches",
    ]) {
      await client.query(
        `DELETE FROM ${table} WHERE organization_id=$1 AND site_id=$2 AND source_id=$3`,
        scope,
      );
    }
    await client.query(
      "UPDATE integrations.import_quota SET retained_attempts=retained_attempts-$1,retained_bytes=retained_bytes-$2 WHERE singleton",
      [selected.rows[0].attempts, selected.rows[0].bytes],
    );
    await client.query("COMMIT");
    return {
      datasetId: m.dataset_id,
      attempts: selected.rows[0].attempts,
      bytes: Number(selected.rows[0].bytes),
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (e instanceof DatabaseError) throw e;
    // A connection failure after COMMIT may be ambiguous. Never auto-replay deletion.
    throw new DatabaseError(
      "Maintenance did not receive a confirmed result. Inspect the target before retrying; no reload was started.",
    );
  } finally {
    await client.end();
  }
}
