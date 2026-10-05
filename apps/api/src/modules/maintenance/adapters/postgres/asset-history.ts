import {
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import type { Scope } from "./store";
import type { Revision } from "../../domain/maintenance";
interface TimelineQuery {
  from: string;
  to: string;
  cursor: { date: string; recordedAt: string; kind: string; id: string } | null;
  limit: number;
  timeZone: string;
}
/** Owner-provided read projection; Maintenance retains and authorizes its own source. */
export async function maintenanceTimeline(
  tx: SiteTransaction,
  scope: Scope,
  assetId: string,
  query: TimelineQuery,
  aliases: {
    namespace: string;
    code: string;
    departmentId: string;
    areaId: string;
  }[] = [],
) {
  if (
    tx.context.organizationId !== scope.organizationId ||
    tx.context.siteId !== scope.siteId ||
    !(
      await evaluateSiteAccess(tx, {
        ...scope,
        userId: tx.context.userId,
        permissions: ["maintenance.read"],
      })
    ).allowed
  ) {
    throw new SiteAccessDeniedError();
  }
  const values: unknown[] = [
    scope.organizationId,
    scope.siteId,
    assetId,
    query.timeZone,
    query.from,
    query.to,
    JSON.stringify(
      aliases.filter((alias) => alias.namespace === "site-equipment"),
    ),
  ];
  const clauses = [
    "organization_id=$1",
    "site_id=$2",
    `(asset_id=$3 OR EXISTS (
      SELECT 1 FROM jsonb_array_elements($7::jsonb) alias
      JOIN jsonb_array_elements(coalesce(snapshot->'record'->'data'->'equipment','[]'::jsonb)) target
      ON target->>'namespace'=alias->>'namespace' AND target->>'code'=alias->>'code'
        AND target->>'departmentId'=alias->>'departmentId' AND target->>'areaId'=alias->>'areaId'
    ))`,
    "(at AT TIME ZONE $4)::date BETWEEN $5::date AND $6::date",
  ];
  let boundary = "true";
  if (query.cursor) {
    const c = query.cursor;
    values.push(c.date, c.recordedAt, c.kind, c.id);
    boundary =
      '(day COLLATE "C",snapshot->>\'at\' COLLATE "C",\'maintenance\'::text COLLATE "C",event_id COLLATE "C")<($8::text COLLATE "C",$9::text COLLATE "C",$10::text COLLATE "C",$11::text COLLATE "C")';
  }
  values.push(query.limit);
  const result = await tx.query(
    `WITH matching AS MATERIALIZED (
    SELECT snapshot,(at AT TIME ZONE $4)::date::text AS day,'maintenance_'||id||'_'||revision::text AS event_id
    FROM maintenance.revisions WHERE ${clauses.join(" AND ")}
    ), page AS (SELECT * FROM matching WHERE ${boundary} ORDER BY day COLLATE "C" DESC,snapshot->>'at' COLLATE "C" DESC,event_id COLLATE "C" DESC LIMIT $${values.length})
    SELECT (SELECT count(*)::integer FROM matching) AS total,coalesce((SELECT jsonb_agg(jsonb_build_object('snapshot',snapshot,'day',day) ORDER BY day COLLATE "C" DESC,snapshot->>'at' COLLATE "C" DESC,event_id COLLATE "C" DESC) FROM page),'[]'::jsonb) AS records`,
    values,
  );
  const rows = (result.rows[0]?.records ?? []) as {
    snapshot: Revision;
    day: string;
  }[];
  return {
    total: Number(result.rows[0]?.total ?? 0),
    records: rows.map((row) => {
      const revision = row.snapshot;
      const record = revision.record;
      return {
        id: `maintenance_${record.id}_${record.revision}`,
        kind: "maintenance" as const,
        date: row.day as string,
        recordedAt: revision.at as string,
        title: record.data.title as string,
        summary: [
          revision.action,
          record.data.status,
          record.data.outcome || record.data.blockedReason || revision.reason,
        ]
          .filter(Boolean)
          .join(" · "),
        sourceRecordId: record.id as string,
        periodKind: "calendar-date" as const,
      };
    }),
  };
}
