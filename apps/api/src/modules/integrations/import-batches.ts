import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { runSiteOperation, SiteAccessDeniedError, AuthorizationUnavailableError,
  type SiteTransaction } from '../../persistence/site-operation';

import { reasons, ImportBatchError, ImportOutcomeUnknownError, type ImportSource, type Inspection, type Diagnostic, type BatchStatus } from './domain/imports';
export { ImportBatchError, ImportOutcomeUnknownError } from './domain/imports';
export type { ImportSource, Inspection, Diagnostic, BatchStatus } from './domain/imports';
/** OIP implements both methods; neither may open another connection or commit independently. */
export interface ImportPublication<T> {
  publish(transaction: SiteTransaction, batch: BatchStatus, input: T): Promise<number>;
  inspect(transaction: SiteTransaction, batch: BatchStatus): Promise<number | null>;
}
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const count = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 20000;
const emptyInspection: Inspection = Object.freeze({ dataRecordCount: null, inspectedValidCount: 0,
  inspectedInvalidCount: 0, inspectionComplete: false, unclassifiedCount: 0, repeatedCount: 0,
  diagnostics: [], diagnosticsTruncated: false });
// Local mode permits one host. This registry prevents recovery during any live phase,
// across service instances; it is not a distributed execution lease.
const active = new Set<string>();
const statusColumns = `import_id AS "importId", raw_id AS "rawId", source_id AS "sourceId",
  reporting_date::text AS "reportingDate", original_filename AS "originalFilename", sha256,
  byte_length AS "byteLength", outcome, admitted_record_count AS "admittedRecordCount",
  rejected_record_count AS "rejectedRecordCount", reason_code AS "reasonCode",
  data_record_count AS "dataRecordCount", inspected_valid_count AS "inspectedValidCount",
  inspected_invalid_count AS "inspectedInvalidCount", inspection_complete AS "inspectionComplete",
  unclassified_count AS "unclassifiedCount", repeated_count AS "repeatedCount", diagnostics,
  diagnostics_truncated AS "diagnosticsTruncated"`;

function inspect(input: Inspection, success: boolean): Inspection {
  if (!input || !(input.dataRecordCount === null || count(input.dataRecordCount)) ||
    ![input.inspectedValidCount, input.inspectedInvalidCount, input.unclassifiedCount, input.repeatedCount].every(count) ||
    typeof input.inspectionComplete !== 'boolean' || typeof input.diagnosticsTruncated !== 'boolean' ||
    input.inspectedValidCount + input.inspectedInvalidCount > 20000 ||
    (input.dataRecordCount !== null && input.inspectedValidCount + input.inspectedInvalidCount > input.dataRecordCount) ||
    (input.inspectionComplete && (input.dataRecordCount === null ||
      input.inspectedValidCount + input.inspectedInvalidCount !== input.dataRecordCount)) ||
    input.unclassifiedCount > input.inspectedValidCount || input.repeatedCount > input.inspectedValidCount ||
    !Array.isArray(input.diagnostics) || input.diagnostics.length > 100 ||
    (success && (!input.inspectionComplete || !input.dataRecordCount || input.inspectedInvalidCount !== 0 || input.diagnostics.length !== 0))) {
    throw new ImportBatchError('invalid-input');
  }
  const diagnostics = input.diagnostics.map((d: Diagnostic) => {
    if (!d || !Object.hasOwn(reasons, d.code) ||
      (d.line !== undefined && (!Number.isInteger(d.line) || d.line < 1 || d.line > 25000)) ||
      (d.field !== undefined && !['frequency','duration','area','equipment','message','type','group'].includes(d.field))) {
      throw new ImportBatchError('invalid-input');
    }
    return { code: d.code, reason: reasons[d.code], ...(d.line === undefined ? {} : { line: d.line }),
      ...(d.field === undefined ? {} : { field: d.field }) };
  });
  return Object.freeze({ ...input, diagnostics });
}

export class ImportBatches {
  private readonly source: ImportSource;
  constructor(private readonly pool: Pick<Pool, 'connect'>, source: ImportSource) {
    if (!source || ![source.organizationId, source.siteId, source.sourceId, source.adapterRevision,
      source.profileRevision, source.mappingRevision].every(id) ||
      typeof source.siteTimeZone !== 'string' || source.siteTimeZone.length > 100 ||
      !/^(UTC|[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+)$/.test(source.siteTimeZone)) throw new ImportBatchError('invalid-input');
    try { new Intl.DateTimeFormat('en', { timeZone: source.siteTimeZone }); }
    catch { throw new ImportBatchError('invalid-input'); }
    this.source = Object.freeze({ ...source });
  }
  private key(importId: string): string {
    return JSON.stringify([this.source.organizationId, this.source.siteId, this.source.sourceId, importId]);
  }
  private async run<T>(actor: string, importId: string, permission: 'imports.submit' | 'imports.review',
    write: boolean, action: (tx: SiteTransaction) => Promise<T>): Promise<T> {
    if (!uuid(importId)) throw new ImportBatchError('invalid-input');
    const key = this.key(importId);
    if (write && active.has(key)) throw new ImportBatchError('incomplete');
    if (write) active.add(key);
    try {
      return await runSiteOperation(this.pool, { userId: actor, organizationId: this.source.organizationId,
        siteId: this.source.siteId, permissions: [permission] }, async tx => {
        await tx.query("SET LOCAL lock_timeout = '5s'");
        await tx.query("SET LOCAL statement_timeout = '30s'");
        await tx.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
        if (write) {
          const digest = createHash('sha256').update('iop-import-attempt:' + key).digest();
          await tx.query('SELECT pg_advisory_xact_lock($1::bigint)', [digest.readBigInt64BE().toString()]);
        }
        return action(tx);
      });
    } catch (error) {
      if (error instanceof ImportBatchError || error instanceof SiteAccessDeniedError) throw error;
      if (write) throw new ImportOutcomeUnknownError(importId);
      throw new AuthorizationUnavailableError();
    } finally { if (write) active.delete(key); }
  }
  private values(importId: string): unknown[] {
    return [this.source.organizationId, this.source.siteId, this.source.sourceId, importId];
  }
  private async get(tx: SiteTransaction, importId: string, lock = false): Promise<BatchStatus | null> {
    const result = await tx.query(`SELECT ${statusColumns} FROM integrations.import_batches
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4 ${lock ? 'FOR UPDATE' : ''}`, this.values(importId));
    return result.rows[0] ? Object.freeze(result.rows[0] as unknown as BatchStatus) : null;
  }
  async receive(actor: string, filename: string, bytes: Buffer): Promise<string> {
    if (typeof filename !== 'string' || !/^Hitliste-[0-9]{8}\.csv$/.test(filename) ||
      !Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > 5242880) throw new ImportBatchError('invalid-input');
    const date = `${filename.slice(9,13)}-${filename.slice(13,15)}-${filename.slice(15,17)}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (date.startsWith('0000') || !Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0,10) !== date) throw new ImportBatchError('invalid-input');
    const original = Buffer.from(bytes);
    const importId = randomUUID();
    return this.run(actor, importId, 'imports.submit', true, async tx => {
      const quota = await tx.query(`UPDATE integrations.import_quota
        SET retained_attempts=retained_attempts+1, retained_bytes=retained_bytes+$1
        WHERE singleton AND retained_attempts<1000 AND retained_bytes+$1<=268435456
        RETURNING retained_attempts`, [original.length]);
      if (quota.rows.length !== 1) throw new ImportBatchError('capacity');
      await tx.query(`INSERT INTO integrations.import_batches
        (organization_id,site_id,source_id,import_id,raw_id,original_filename,reporting_date,
         original_bytes,byte_length,sha256,submitted_by,adapter_revision,profile_revision,mapping_revision,site_time_zone)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [...this.values(importId), randomUUID(), filename, date, original, original.length,
        createHash('sha256').update(original).digest('hex'), actor, this.source.adapterRevision,
        this.source.profileRevision, this.source.mappingRevision, this.source.siteTimeZone]);
      return importId;
    });
  }
  async history(actor: string): Promise<ImportSummary[]> {
    return runSiteOperation(this.pool, { userId: actor, organizationId: this.source.organizationId,
      siteId: this.source.siteId, permissions: ['imports.review'] }, async tx => {
      const result = await tx.query(`SELECT import_id AS "importId", original_filename AS "originalFilename",
        reporting_date::text AS "reportingDate", outcome, received_at AS "receivedAt", submitted_by AS "submittedBy",
        admitted_record_count AS "admittedRecordCount", reason_code AS "reasonCode", byte_length AS "byteLength"
        FROM integrations.import_batches WHERE organization_id=$1 AND site_id=$2 AND source_id=$3
        ORDER BY received_at DESC,import_id DESC LIMIT 1000`,
        [this.source.organizationId,this.source.siteId,this.source.sourceId]);
      return result.rows.map(row => ({...row, receivedAt: (row.receivedAt as Date).toISOString()} as unknown as ImportSummary));
    });
  }
  async review(actor: string, importId: string): Promise<BatchStatus> {
    return this.run(actor, importId, 'imports.review', false, async tx => {
      const batch = await this.get(tx, importId);
      if (!batch) throw new ImportBatchError('not-found');
      return batch;
    });
  }
  async original(actor: string, importId: string): Promise<Buffer> {
    return this.run(actor, importId, 'imports.review', false, async tx => {
      const result = await tx.query(`SELECT original_bytes, byte_length, sha256 FROM integrations.import_batches
        WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4`, this.values(importId));
      const row = result.rows[0];
      if (!row) throw new ImportBatchError('not-found');
      if (!Buffer.isBuffer(row.original_bytes) || row.original_bytes.length !== row.byte_length ||
        createHash('sha256').update(row.original_bytes).digest('hex') !== row.sha256) throw new ImportBatchError('integrity');
      return row.original_bytes;
    });
  }
  private async finish(tx: SiteTransaction, batch: BatchStatus, outcome: 'succeeded' | 'rejected' | 'failed',
    reason: string | null, counts: Inspection): Promise<void> {
    await tx.query(`UPDATE integrations.import_batches SET outcome=$5, completed_at=CURRENT_TIMESTAMP,
      reason_code=$6, data_record_count=$7, admitted_record_count=$8, rejected_record_count=$9,
      inspected_valid_count=$10, inspected_invalid_count=$11, inspection_complete=$12,
      unclassified_count=$13, repeated_count=$14, diagnostics=$15, diagnostics_truncated=$16
      WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND import_id=$4`,
    [...this.values(batch.importId), outcome, reason, counts.dataRecordCount,
      outcome === 'succeeded' ? counts.dataRecordCount : 0, outcome === 'succeeded' ? 0 : counts.dataRecordCount,
      counts.inspectedValidCount, counts.inspectedInvalidCount, counts.inspectionComplete,
      counts.unclassifiedCount, counts.repeatedCount, JSON.stringify(counts.diagnostics), counts.diagnosticsTruncated]);
  }
  async reject(actor: string, importId: string, inspection: Inspection): Promise<void> {
    return this.finalizeFailure(actor, importId, inspection, 'rejected', 'invalid-input');
  }
  /** A known pre-publication processing failure; uncertain publication uses reconcile. */
  async failProcessing(actor: string, importId: string, inspection: Inspection): Promise<void> {
    return this.finalizeFailure(actor, importId, inspection, 'failed', 'processing-failed');
  }
  private async finalizeFailure(actor: string, importId: string, inspection: Inspection,
    outcome: 'rejected' | 'failed', reason: string): Promise<void> {
    const counts = inspect(inspection, false);
    await this.run(actor, importId, 'imports.submit', true, async tx => {
      const batch = await this.get(tx, importId, true);
      if (!batch) throw new ImportBatchError('not-found');
      if (batch.outcome !== 'received') throw new ImportBatchError('terminal');
      await this.finish(tx, batch, outcome, reason, counts);
    });
  }
  async publish<T>(actor: string, importId: string, inspection: Inspection,
    receiver: ImportPublication<T>, input: T, deadline: number): Promise<'succeeded' | 'duplicate-date'> {
    const counts = inspect(inspection, true);
    const live = () => {
      if (!Number.isFinite(deadline) || Date.now() >= deadline || deadline > Date.now() + 30000) throw new ImportBatchError('incomplete');
    };
    live();
    return this.run(actor, importId, 'imports.submit', true, async tx => {
      live();
      await tx.query("SELECT set_config('statement_timeout',$1,true)", [String(Math.max(1, deadline - Date.now()))]);
      const batch = await this.get(tx, importId, true);
      if (!batch) throw new ImportBatchError('not-found');
      if (batch.outcome !== 'received') throw new ImportBatchError('terminal');
      const claim = await tx.query(`INSERT INTO integrations.import_date_claims
        (organization_id,site_id,source_id,import_id,reporting_date) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (organization_id,site_id,source_id,reporting_date) DO NOTHING RETURNING import_id`,
      [...this.values(importId), batch.reportingDate]);
      if (claim.rows.length === 0) {
        await this.finish(tx, batch, 'rejected', 'duplicate-date', counts);
        return 'duplicate-date';
      }
      const published = await receiver.publish(tx, batch, input);
      live();
      if (published !== counts.dataRecordCount) throw new ImportBatchError('inconsistent');
      await this.finish(tx, batch, 'succeeded', null, counts);
      return 'succeeded';
    });
  }
  /** Caller must stop parsing/scheduled phases first. No replay; one local host only. */
  async reconcile<T>(actor: string, importId: string, receiver: ImportPublication<T>): Promise<'absent' | BatchStatus['outcome']> {
    return this.run(actor, importId, 'imports.submit', true, async tx => {
      const batch = await this.get(tx, importId, true);
      if (!batch) return 'absent';
      const claims = await tx.query(`SELECT import_id FROM integrations.import_date_claims
        WHERE organization_id=$1 AND site_id=$2 AND source_id=$3 AND reporting_date=$4`,
      [this.source.organizationId, this.source.siteId, this.source.sourceId, batch.reportingDate]);
      const ownsClaim = claims.rows[0]?.import_id === importId;
      const published = await receiver.inspect(tx, batch);
      if (batch.outcome === 'succeeded') {
        if (!ownsClaim || published !== batch.admittedRecordCount) throw new ImportBatchError('inconsistent');
        return 'succeeded';
      }
      if (ownsClaim || published !== null) throw new ImportBatchError('inconsistent');
      if (batch.outcome !== 'received') return batch.outcome;
      await this.finish(tx, batch, 'failed', 'interrupted', emptyInspection);
      return 'failed';
    });
  }
}

export interface ImportSummary {
  importId: string; originalFilename: string; reportingDate: string;
  outcome: BatchStatus['outcome']; receivedAt: string; submittedBy: string;
  admittedRecordCount: number | null; reasonCode: string | null; byteLength: number;
}
