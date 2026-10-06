import type { SiteTransaction } from "../../../../persistence/site-operation";
import type { Settings, RecordEntry } from "../../domain/workforce";

/** Published scoped directory for operational ownership; Workforce owns its storage. */
export async function workforceTeams(
  tx: SiteTransaction,
  scope: { organizationId: string; siteId: string },
  defaults: Settings,
): Promise<{ id: string; label: string }[]> {
  const result = await tx.query(
    "SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2 AND kind='settings' AND id='site'",
    [scope.organizationId, scope.siteId],
  );
  const snapshot = result.rows[0]?.snapshot as
    | RecordEntry<"settings">
    | undefined;
  const configured = snapshot?.data;
  return (configured ?? defaults).teams.map(({ id, label }) => ({ id, label }));
}
