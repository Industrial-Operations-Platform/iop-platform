import {
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import { evaluateSiteAccess } from "../../../users-rbac";
import { sitePersonNames } from "../../../users-rbac/adapters/postgres/site-people";
import {
  MaintenanceIssuesError,
  resolveMaintenanceIssues,
  validateMaintenanceScope,
  type IssueResolution,
  type MaintenanceIssuePage,
  type MaintenanceIssueScope,
  type MaintenanceIssueSelection,
  type MaintenanceResolution,
} from "../../application/maintenance-issues";
import type { Entry } from "../../domain/handover";

interface Scope {
  organizationId: string;
  siteId: string;
}
async function authorize(
  tx: SiteTransaction,
  scope: Scope,
  write = false,
): Promise<void> {
  if (
    tx.context.organizationId !== scope.organizationId ||
    tx.context.siteId !== scope.siteId
  )
    throw new SiteAccessDeniedError();
  await tx.query(
    "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
    [scope.organizationId],
  );
  if (
    !(
      await evaluateSiteAccess(tx, {
        ...scope,
        userId: tx.context.userId,
        permissions: write
          ? ["handover.read", "handover.contribute", "maintenance.contribute"]
          : ["handover.read"],
      })
    ).allowed
  )
    throw new MaintenanceIssuesError("denied");
}
async function completionLease(tx: SiteTransaction, scope: Scope) {
  await tx.query(
    "SELECT pg_advisory_xact_lock(hashtext('iop-handover-maintenance'),hashtext($1))",
    [scope.organizationId + ":" + scope.siteId],
  );
}
function selection(input: MaintenanceIssueSelection) {
  if (
    !input ||
    Object.keys(input).some(
      (key) => !["scope", "search", "cursor", "limit", "ids"].includes(key),
    )
  )
    throw new MaintenanceIssuesError("invalid");
  validateMaintenanceScope(input.scope);
  const search = input.search ?? "";
  const cursor = input.cursor ?? "";
  const limit = input.limit ?? 20;
  if (
    typeof search !== "string" ||
    search.length > 240 ||
    /[\u0000-\u001f\u007f]/.test(search) ||
    typeof cursor !== "string" ||
    cursor.length > 100 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new MaintenanceIssuesError("invalid");
  if (
    input.ids !== undefined &&
    (!Array.isArray(input.ids) ||
      input.ids.length > 100 ||
      new Set(input.ids).size !== input.ids.length ||
      input.ids.some(
        (id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id),
      ))
  )
    throw new MaintenanceIssuesError("invalid");
  let instant = "",
    id = "";
  if (cursor) {
    const match =
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([0-9a-f-]{36})$/.exec(
        cursor,
      );
    if (
      !match ||
      !Number.isFinite(Date.parse(match[1])) ||
      new Date(match[1]).toISOString() !== match[1]
    )
      throw new MaintenanceIssuesError("invalid");
    [instant, id] = match.slice(1);
  }
  return { search: search.trim(), instant, id, limit };
}
const matching = `organization_id=$1 AND site_id=$2
  AND coalesce(snapshot->>'deleted','false')<>'true'
  AND coalesce(NULLIF(snapshot->'content'->>'areaId',''),snapshot->'content'->>'departmentId')=ANY($3::text[])
  AND (jsonb_array_length($4::jsonb)=0 OR coalesce(snapshot->'content'->>'equipmentCode','')=''
    OR EXISTS (SELECT 1 FROM jsonb_array_elements($4::jsonb) target
      WHERE snapshot->'content'->>'equipmentNamespace'=target->>'namespace'
      AND snapshot->'content'->>'equipmentCode'=target->>'code'
      AND snapshot->'content'->>'departmentId'=target->>'departmentId'
      AND snapshot->'content'->>'areaId'=target->>'areaId'))`;
function selectors(scope: Scope, issueScope: MaintenanceIssueScope) {
  return [
    scope.organizationId,
    scope.siteId,
    issueScope.locationIds,
    JSON.stringify(issueScope.equipment),
  ];
}
async function currentNames(
  tx: SiteTransaction,
  scope: Scope,
  entries: Entry[],
): Promise<Entry[]> {
  const actors = await tx.query(
    `SELECT DISTINCT ON (entry_id) entry_id,actor_id FROM shift_handover.revisions
    WHERE organization_id=$1 AND site_id=$2 AND entry_id=ANY($3::text[])
    AND snapshot->>'action' IN ('state','follow-up') ORDER BY entry_id,revision DESC`,
    [scope.organizationId, scope.siteId, entries.map((entry) => entry.id)],
  );
  const latestActors = new Map(
    (actors.rows as { entry_id: string; actor_id: string }[]).map((row) => [
      row.entry_id,
      row.actor_id,
    ]),
  );
  const names = await sitePersonNames(
    tx,
    scope.organizationId,
    scope.siteId,
    entries
      .flatMap((entry) => [
        entry.authorId,
        entry.responsibleId,
        latestActors.get(entry.id) ?? "",
      ])
      .filter(Boolean),
  );
  return entries.map((entry) => ({
    ...entry,
    authorName: names.get(entry.authorId) ?? entry.authorName,
    responsibleName: names.get(entry.responsibleId) ?? entry.responsibleName,
    ...(entry.latestUpdate
      ? {
          latestUpdate: {
            ...entry.latestUpdate,
            actorName:
              names.get(latestActors.get(entry.id) ?? "") ??
              entry.latestUpdate.actorName,
          },
        }
      : {}),
  }));
}

/** Owning-module projection; filters apply before counts and cursor pagination. */
export async function handoverMaintenanceIssues(
  tx: SiteTransaction,
  scope: Scope,
  input: MaintenanceIssueSelection,
): Promise<MaintenanceIssuePage> {
  const request = structuredClone(input);
  const query = selection(request);
  await authorize(tx, scope);
  const result = await tx.query(
    `WITH matching AS MATERIALIZED (
      SELECT id,snapshot,snapshot->>'createdAt' AS instant FROM shift_handover.entries WHERE ${matching}
      AND ($5='' OR strpos(lower(concat_ws(' ',snapshot->'content'->>'summary',snapshot->'content'->>'details',
        snapshot->'content'->>'equipmentCode',snapshot->'content'->>'externalReference',snapshot->'content'->>'challenge',
        snapshot->'content'->>'cause',snapshot->'content'->>'measure',snapshot->'latestUpdate'->>'note')),lower($5))>0)
      AND ($9::text[] IS NULL OR id=ANY($9::text[]))
    ), page AS (SELECT * FROM matching WHERE $6='' OR
      (instant COLLATE "C",id COLLATE "C")<($6 COLLATE "C",$7 COLLATE "C")
      ORDER BY instant COLLATE "C" DESC,id COLLATE "C" DESC LIMIT $8)
    SELECT (SELECT count(*)::integer FROM matching) AS total,
      coalesce((SELECT jsonb_agg(snapshot ORDER BY instant COLLATE "C" DESC,id COLLATE "C" DESC) FROM page),'[]'::jsonb) AS entries`,
    [
      ...selectors(scope, request.scope),
      query.search,
      query.instant,
      query.id,
      query.limit + 1,
      request.ids ?? null,
    ],
  );
  const entries = result.rows[0].entries as Entry[];
  const shown = entries.slice(0, query.limit);
  const last = shown.at(-1);
  return {
    entries: await currentNames(tx, scope, shown),
    total: result.rows[0].total as number,
    nextCursor:
      entries.length > query.limit && last
        ? last.createdAt + "|" + last.id
        : "",
  };
}

/** Exhaustive completion review; the exclusive lease prevents matching phantom writes. */
export async function pendingHandoverMaintenanceIssues(
  tx: SiteTransaction,
  scope: Scope,
  issueScope: MaintenanceIssueScope,
): Promise<Entry[]> {
  const request = structuredClone(issueScope);
  validateMaintenanceScope(request);
  await authorize(tx, scope, true);
  await completionLease(tx, scope);
  const result = await tx.query(
    `SELECT snapshot FROM shift_handover.entries WHERE ${matching}
    AND snapshot->>'issueState' IN ('open','in-progress') ORDER BY id COLLATE "C" LIMIT 201`,
    selectors(scope, request),
  );
  if (result.rows.length > 200) throw new MaintenanceIssuesError("capacity");
  return currentNames(
    tx,
    scope,
    result.rows.map((row) => row.snapshot as Entry),
  );
}

/** Caller supplies only explicitly reviewed IDs; all writes remain in its transaction. */
export async function resolveHandoverMaintenanceIssues(
  tx: SiteTransaction,
  scope: Scope,
  resolutions: IssueResolution[],
  context: MaintenanceResolution,
): Promise<Entry[]> {
  const request = structuredClone(resolutions);
  const resolution = structuredClone(context);
  await authorize(tx, scope, true);
  await completionLease(tx, scope);
  const actorId = tx.context.userId;
  const names = await sitePersonNames(tx, scope.organizationId, scope.siteId, [
    actorId,
  ]);
  const actorName = names.get(actorId);
  if (!actorName) throw new MaintenanceIssuesError("denied");
  const updated = await resolveMaintenanceIssues(
    {
      actorId,
      actorName,
      get: async (id) => {
        const result = await tx.query(
          "SELECT snapshot FROM shift_handover.entries WHERE organization_id=$1 AND site_id=$2 AND id=$3 FOR UPDATE",
          [scope.organizationId, scope.siteId, id],
        );
        return (result.rows[0]?.snapshot as Entry) ?? null;
      },
      save: async (entry, revision) => {
        await tx.query(
          "UPDATE shift_handover.entries SET revision=$4,snapshot=$5 WHERE organization_id=$1 AND site_id=$2 AND id=$3",
          [
            scope.organizationId,
            scope.siteId,
            entry.id,
            entry.revision,
            JSON.stringify(entry),
          ],
        );
        await tx.query(
          "INSERT INTO shift_handover.revisions(organization_id,site_id,entry_id,revision,actor_id,recorded_at,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            scope.organizationId,
            scope.siteId,
            entry.id,
            entry.revision,
            revision.actorId,
            revision.at,
            JSON.stringify(revision),
          ],
        );
      },
    },
    request,
    resolution,
  );
  return currentNames(tx, scope, updated);
}
