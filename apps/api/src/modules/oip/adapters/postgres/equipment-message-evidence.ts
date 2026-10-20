import { SiteAccessDeniedError, type SiteTransaction } from '../../../../persistence/site-operation';
import type { ImportSource } from '../../../integrations';
import { evaluateSiteAccess } from '../../../users-rbac';
import { sitePersonProfile } from '../../../users-rbac/adapters/postgres/site-people';
import { AnalyticsError } from '../../domain/analytics';
import { exactTotal } from '../../domain/values';

/** Original source messages for an exact source tuple; this read never infers equipment kinds. */
export async function equipmentMessageEvidence(
  tx: SiteTransaction,
  source: Pick<ImportSource, 'organizationId' | 'siteId' | 'sourceId'>,
  selection: { area: string; code: string },
): Promise<{ total: number; evidence: { importId: string; sourceRecordNumber: number; reportingDate: string; message: string }[] }> {
  if (tx.context.organizationId !== source.organizationId || tx.context.siteId !== source.siteId ||
    await sitePersonProfile(tx, source.organizationId, source.siteId, tx.context.userId) !== 'administrator' ||
    !(await evaluateSiteAccess(tx, { ...source, userId: tx.context.userId, permissions: ['assets.read', 'analytics.read'] })).allowed)
    throw new SiteAccessDeniedError();
  if (!selection || Object.keys(selection).sort().join() !== 'area,code' ||
    [selection.area, selection.code].some(value => typeof value !== 'string' || !value || value.length > 4096 || /[\u0000-\u001f\u007f]/.test(value)))
    throw new AnalyticsError('invalid_selection');
  const result = await tx.query(`WITH matching AS MATERIALIZED (
      SELECT import_id,source_record_number,reporting_date,payload->>'sourceMessageText' AS message FROM oip.facts
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3
      AND payload->>'sourceArea'=$4 AND payload->>'sourceEquipmentReference'=$5
    ), page AS (SELECT * FROM matching ORDER BY reporting_date DESC,import_id,source_record_number LIMIT 30)
    SELECT (SELECT count(*)::text FROM matching) AS total,
      coalesce((SELECT jsonb_agg(jsonb_build_object('importId',import_id,'sourceRecordNumber',source_record_number,
        'reportingDate',reporting_date::text,'message',message) ORDER BY reporting_date DESC,import_id,source_record_number) FROM page),'[]'::jsonb) AS evidence`,
    [source.organizationId, source.siteId, source.sourceId, selection.area, selection.code]);
  return { total: exactTotal(String(result.rows[0].total)), evidence: result.rows[0].evidence as {
    importId: string; sourceRecordNumber: number; reportingDate: string; message: string;
  }[] };
}
