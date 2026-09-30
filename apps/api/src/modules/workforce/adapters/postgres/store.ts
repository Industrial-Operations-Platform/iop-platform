import type { Pool } from "pg";
import {
  runSiteOperation,
  SiteAccessDeniedError,
  type SiteTransaction,
} from "../../../../persistence/site-operation";
import type { Store, Transaction } from "../../application/workforce";
import type {
  Kind,
  Person,
  RecordEntry,
  Revision,
} from "../../domain/workforce";
interface Scope {
  organizationId: string;
  siteId: string;
}
export interface Directory {
  allowed(
    tx: SiteTransaction,
    actor: string,
    permission: string,
  ): Promise<boolean>;
  people(tx: SiteTransaction): Promise<Person[]>;
}
export class PgWorkforce implements Store {
  constructor(
    private readonly pool: Pool,
    private readonly scope: Scope,
    private readonly directory: Directory,
  ) {}
  run<T>(
    actor: string,
    permission: Parameters<Store["run"]>[1],
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    return runSiteOperation(
      this.pool,
      { ...this.scope, userId: actor, permissions: [permission] },
      async (tx) => {
        await tx.query(
          "SELECT pg_advisory_xact_lock_shared(hashtext('iop-access'),hashtext($1))",
          [this.scope.organizationId],
        );
        if (!(await this.directory.allowed(tx, actor, permission)))
          throw new SiteAccessDeniedError();
        // One site write lease makes overlap, phone exclusivity and optimistic revisions atomic.
        await tx.query(
          "SELECT pg_advisory_xact_lock(hashtext('iop-workforce'),hashtext($1))",
          [this.scope.organizationId + ":" + this.scope.siteId],
        );
        return work(
          new PgWorkforceTransaction(
            tx,
            this.scope,
            await this.directory.allowed(tx, actor, "workforce.plan"),
            await this.directory.allowed(tx, actor, "workforce.administer"),
            () => this.directory.people(tx),
          ),
        );
      },
    );
  }
}
class PgWorkforceTransaction implements Transaction {
  constructor(
    private readonly tx: SiteTransaction,
    private readonly scope: Scope,
    readonly canPlan: boolean,
    readonly canAdminister: boolean,
    readonly people: () => Promise<Person[]>,
  ) {}
  private get selectors() {
    return [this.scope.organizationId, this.scope.siteId];
  }
  async records(from: string, to: string): Promise<RecordEntry[]> {
    const r = await this.tx.query(
      "SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2 AND (business_date IS NULL OR business_date BETWEEN $3::date AND $4::date) ORDER BY kind,id LIMIT 20001",
      [...this.selectors, from, to],
    );
    if (r.rows.length > 20000)
      throw new Error("Workforce query exceeds the supported site capacity.");
    return r.rows.map((r) => r.snapshot as RecordEntry);
  }
  async get(kind: Kind, id: string): Promise<RecordEntry | null> {
    const r = await this.tx.query(
      "SELECT snapshot FROM workforce.records WHERE organization_id=$1 AND site_id=$2 AND kind=$3 AND id=$4",
      [...this.selectors, kind, id],
    );
    return (r.rows[0]?.snapshot as RecordEntry) ?? null;
  }
  async save(entry: RecordEntry, revision: Revision) {
    await this.tx.query(
      `INSERT INTO workforce.records(organization_id,site_id,kind,id,business_date,revision,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(organization_id,site_id,kind,id) DO UPDATE SET business_date=EXCLUDED.business_date,revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot`,
      [
        ...this.selectors,
        entry.kind,
        entry.id,
        "date" in entry.data ? entry.data.date : null,
        entry.revision,
        JSON.stringify(entry),
      ],
    );
    await this.tx.query(
      "INSERT INTO workforce.revisions(organization_id,site_id,kind,id,revision,snapshot) VALUES($1,$2,$3,$4,$5,$6)",
      [
        ...this.selectors,
        entry.kind,
        entry.id,
        entry.revision,
        JSON.stringify(revision),
      ],
    );
  }
  async history(kind: Kind, id: string): Promise<Revision[]> {
    const r = await this.tx.query(
      "SELECT snapshot FROM workforce.revisions WHERE organization_id=$1 AND site_id=$2 AND kind=$3 AND id=$4 ORDER BY revision DESC LIMIT 100",
      [...this.selectors, kind, id],
    );
    return r.rows.map((r) => r.snapshot as Revision);
  }
}
