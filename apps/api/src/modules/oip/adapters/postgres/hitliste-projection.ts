import type { SiteTransaction } from "../../../../persistence/site-operation";
import type { ImportSource } from "../../../integrations";
import { scopeTuple } from "./analytics";
import {
  labelWhitespace,
  textFields,
  type CompiledProfile,
} from "../../domain/reporting-profile";

/** PostgreSQL/source adapter: source labels never become platform-core entities. */
export async function lockHitliste(
  tx: SiteTransaction,
  source: ImportSource,
): Promise<void> {
  await tx.query("SELECT pg_advisory_xact_lock(190149,hashtext($1))", [
    JSON.stringify(scopeTuple(source)),
  ]);
}
const payloadFields = {
  area: "sourceArea",
  equipment: "sourceEquipmentReference",
  message: "sourceMessageText",
  type: "sourceMessageType",
  messageGroup: "sourceMessageGroup",
};
const normalize = (field: string) => {
  const unicode = `CASE WHEN (p.config->'normalization'->>'unicodeNfc')::boolean THEN normalize(f.payload->>'${field}',NFC) ELSE f.payload->>'${field}' END`;
  const trim = `CASE WHEN (p.config->'normalization'->>'trim')::boolean THEN btrim(${unicode},p.spaces) ELSE ${unicode} END`;
  return `CASE WHEN (p.config->'normalization'->>'collapseWhitespace')::boolean THEN regexp_replace(${trim},'[' || p.spaces || ']+',' ','g') ELSE ${trim} END`;
};
const id = (...expressions: string[]) =>
  `encode(sha256(convert_to(jsonb_build_array(${expressions.join(",")})::text,'UTF8')),'hex')`;
const scope = "organization_id,site_id,source_id";

/** Caller holds the source lock. Inserts and profile refresh share the publication transaction. */
export async function projectHitliste(
  tx: SiteTransaction,
  source: ImportSource,
  config: CompiledProfile,
  version: string,
  importId?: string,
): Promise<void> {
  const params = [
    ...scopeTuple(source),
    JSON.stringify(config),
    version,
    labelWhitespace,
    importId ?? null,
  ];
  const cte = `WITH p AS (SELECT $4::jsonb AS config,$5::text AS version,$6::text AS spaces,$7::uuid AS import_id),
    norm AS (SELECT f.*,${textFields.map((k) => normalize(payloadFields[k]) + " AS " + k.toLowerCase()).join(",")}
      FROM oip.facts f CROSS JOIN p WHERE f.organization_id=$1 AND f.site_id=$2 AND f.source_id=$3 AND (p.import_id IS NULL OR f.import_id=p.import_id)),
    aliased AS (SELECT n.*,${textFields.map((k) => `coalesce(p.config->'compiled'->'aliases'->'${k}'->>(n.${k.toLowerCase()}),n.${k.toLowerCase()}) AS v_${k.toLowerCase()}`).join(",")}
      FROM norm n CROSS JOIN p),
    labels AS (SELECT a.*,coalesce(p.config->'compiled'->'areas'->>v_area,p.config->>'unclassifiedLabel') AS v_sector,
      p.config->'compiled'->'areas'->>v_area IS NULL AS unmapped FROM aliased a CROSS JOIN p),
    ready AS (SELECT l.*,${id("v_sector", "unmapped")} AS sektor_id,${id("v_area")} AS bereich_id,
      ${id("v_area", "v_equipment")} AS betriebsmittel_id,${id("v_message")} AS meldetext_id,
      ${id("v_type")} AS typ_id,${id("v_messagegroup")} AS meldegruppe_id FROM labels l)`;
  // Seed all configured sectors, including those with no observations yet.
  await tx.query(
    `${cte}, sectors AS (
    SELECT value AS name,false AS is_unclassified FROM p,jsonb_each_text(p.config->'compiled'->'areas')
    UNION SELECT p.config->>'unclassifiedLabel',true FROM p)
    INSERT INTO analytics.sektor(${scope},id,name,is_unclassified)
    SELECT $1,$2,$3,${id("name", "is_unclassified")},name,is_unclassified FROM sectors
    ON CONFLICT DO NOTHING`,
    params,
  );
  for (const [table, key, label] of [
    ["bereich", "bereich_id", "v_area"],
    ["meldetext", "meldetext_id", "v_message"],
    ["meldung_typ", "typ_id", "v_type"],
    ["meldegruppe", "meldegruppe_id", "v_messagegroup"],
  ]) {
    await tx.query(
      `${cte} INSERT INTO analytics.${table}(${scope},id,name)
      SELECT DISTINCT $1,$2,$3,${key},${label} FROM ready ON CONFLICT DO NOTHING`,
      params,
    );
  }
  await tx.query(
    `${cte} INSERT INTO analytics.betriebsmittel(${scope},id,kennzeichen,bereich_id)
    SELECT DISTINCT $1,$2,$3,betriebsmittel_id,v_equipment,bereich_id FROM ready ON CONFLICT DO NOTHING`,
    params,
  );
  await tx.query(
    `${cte} INSERT INTO analytics.fact_hitliste(${scope},import_id,source_record_number,datum,haufigkeit,dauer_sekunden,dauer_original,
    sektor_id,bereich_id,betriebsmittel_id,meldetext_id,typ_id,meldegruppe_id,profile_version)
    SELECT $1,$2,$3,import_id,source_record_number,reporting_date,reported_frequency,accumulated_alarm_seconds,payload->>'originalDuration',
      sektor_id,bereich_id,betriebsmittel_id,meldetext_id,typ_id,meldegruppe_id,$5 FROM ready
    ON CONFLICT (${scope},import_id,source_record_number) DO UPDATE SET
      sektor_id=excluded.sektor_id,bereich_id=excluded.bereich_id,betriebsmittel_id=excluded.betriebsmittel_id,
      meldetext_id=excluded.meldetext_id,typ_id=excluded.typ_id,meldegruppe_id=excluded.meldegruppe_id,profile_version=excluded.profile_version`,
    params,
  );
}
