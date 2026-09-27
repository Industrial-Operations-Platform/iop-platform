import { hitlisteReportingProfile } from "./adapters/hitliste-reporting-profile";
import { createImportWorkflow } from "./adapters/import-gateway";
import { evaluateSiteAccess } from "../modules/users-rbac";
import {
  ReportingProfiles,
  OipReports,
} from "../modules/oip/application/reporting";
import { PgReportingProfiles } from "../modules/oip/adapters/postgres/reporting-profiles";
import { PgReportRepository } from "../modules/oip/adapters/postgres/reports";
import { randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { Pool, type PoolClient } from "pg";
import {
  ForbiddenException,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ConfigurationError,
  loadConfiguration,
  type LocalConfiguration,
} from "../configuration";
import { runSiteOperation } from "../persistence/site-operation";
import {
  ImportBatches,
  SourceMappings,
  CSV_ADAPTER_REVISION,
  type BatchStatus,
  type ImportSource,
} from "../modules/integrations";
import { OipReceiver } from "../modules/oip/receiver";
import { OipQueries } from "../modules/oip/queries";

export const DEMO_RUNTIME = "IOP_DEMO_RUNTIME";
export const MAINTENANCE_LOCK = 190147;
export interface DemoUser {
  id: string;
  name: string;
}
export interface DemoConfiguration {
  users: DemoUser[];
  origins: string[];
  local: LocalConfiguration;
  mappings: SourceMappings;
}
export interface PrincipalResolver {
  resolve(request: IncomingMessage): string;
}
const jsonFile = (file: string | undefined, max: number): unknown => {
  if (!file || !statSync(file).isFile() || statSync(file).size > max)
    throw new ConfigurationError("demo file");
  return JSON.parse(readFileSync(file, "utf8"));
};
export function readDemoConfiguration(
  env: NodeJS.ProcessEnv,
): DemoConfiguration | null {
  if (env.IOP_EXECUTION_MODE === undefined) return null;
  if (
    env.IOP_EXECUTION_MODE !== "local-demo" ||
    env.NODE_ENV === "production" ||
    (env.IOP_TRANSPORT ?? "native") !== "native" ||
    (env.HOST ?? "127.0.0.1") !== "127.0.0.1" ||
    env.IOP_DATABASE_MODE !== "local" ||
    !["127.0.0.1", "localhost", "::1"].includes(env.IOP_DATABASE_HOST ?? "") ||
    env.IOP_DATABASE_NAME !== "iop_local"
  )
    throw new ConfigurationError("local-demo mode");
  try {
    const value = jsonFile(env.IOP_DEMO_CONFIG_FILE, 16384) as Record<
      string,
      unknown
    >;
    if (
      !value ||
      Object.keys(value).sort().join(",") !== "origins,users" ||
      !Array.isArray(value.users) ||
      value.users.length < 1 ||
      value.users.length > 20 ||
      !Array.isArray(value.origins) ||
      value.origins.length < 1 ||
      value.origins.length > 4
    )
      throw new Error();
    const users = value.users.map((u: unknown) => {
      const user = u as DemoUser;
      if (
        !user ||
        Object.keys(user).sort().join(",") !== "id,name" ||
        typeof user.id !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(user.id) ||
        typeof user.name !== "string" ||
        !user.name.trim() ||
        user.name.length > 100 ||
        /[\x00-\x1f]/.test(user.name)
      )
        throw new Error();
      return Object.freeze({ ...user });
    });
    if (new Set(users.map((u) => u.id)).size !== users.length)
      throw new Error();
    const origins = value.origins.map((o: unknown) => {
      if (typeof o !== "string") throw new Error();
      const url = new URL(o);
      if (
        url.origin !== o ||
        url.protocol !== "http:" ||
        url.hostname !== "127.0.0.1" ||
        !url.port
      )
        throw new Error();
      return o;
    });
    const local = loadConfiguration(env.IOP_CONFIG_FILE);
    const mappings = new SourceMappings(
      jsonFile(env.IOP_MAPPING_CONFIG_FILE, 4 * 1024 * 1024),
    );
    if (
      mappings.configuration.organizationId !== local.organization.id ||
      mappings.configuration.siteId !== local.site.id ||
      mappings.configuration.sourceId !== local.source.id
    )
      throw new Error();
    return { users, origins, local, mappings };
  } catch {
    throw new ConfigurationError("demo users, origins or source mappings");
  }
}
/** Local demonstration adapter. A future authenticated provider implements PrincipalResolver. */
export class LocalDemoPrincipals implements PrincipalResolver {
  private sessions = new Map<string, { actor: string; expires: number }>();
  constructor(private readonly users: readonly DemoUser[]) {}
  token(request: IncomingMessage): string | undefined {
    const entries = (request.headers.cookie ?? "")
      .split(";")
      .map((x) => x.trim())
      .filter((x) => x.startsWith("iop_demo="));
    return entries.length === 1 ? entries[0].slice(9) : undefined;
  }
  resolve(request: IncomingMessage): string {
    const token = this.token(request),
      session = token ? this.sessions.get(token) : undefined;
    if (!session || session.expires <= Date.now()) {
      if (token) this.sessions.delete(token);
      throw new UnauthorizedException();
    }
    return session.actor;
  }
  switch(request: IncomingMessage, actor: string): string {
    if (!this.users.some((u) => u.id === actor)) throw new ForbiddenException();
    const previous = this.token(request);
    if (previous) this.sessions.delete(previous);
    for (const [key, value] of this.sessions)
      if (value.expires <= Date.now()) this.sessions.delete(key);
    if (this.sessions.size >= 32)
      this.sessions.delete(this.sessions.keys().next().value!);
    const token = randomBytes(32).toString("base64url");
    this.sessions.set(token, { actor, expires: Date.now() + 8 * 3600000 });
    return token;
  }
}
export class DemoRuntime {
  readonly source: ImportSource;
  readonly batches: ImportBatches;
  readonly receiver: OipReceiver;
  readonly queries: OipQueries;
  readonly profiles: ReportingProfiles;
  readonly reports: OipReports;
  readonly principals: LocalDemoPrincipals;
  readonly imports: ReturnType<typeof createImportWorkflow>;
  private receiving = false;
  private lease: PoolClient | undefined;
  constructor(
    readonly pool: Pool,
    readonly config: DemoConfiguration,
  ) {
    const { local, mappings } = config;
    this.source = Object.freeze({
      organizationId: local.organization.id,
      siteId: local.site.id,
      sourceId: local.source.id,
      siteTimeZone: local.site.timeZone,
      adapterRevision: CSV_ADAPTER_REVISION,
      profileRevision: "aggregate-poc-v1",
      mappingRevision: mappings.configuration.mappingRevision,
    });
    this.batches = new ImportBatches(pool, this.source);
    this.receiver = new OipReceiver(this.source);
    this.imports = createImportWorkflow(
      this.batches,
      this.receiver,
      mappings,
      this.source,
    );
    this.queries = new OipQueries(pool, this.source);
    this.principals = new LocalDemoPrincipals(config.users);
    const profileRepository = new PgReportingProfiles(
      pool,
      this.source,
      hitlisteReportingProfile(mappings.configuration),
    );
    this.profiles = new ReportingProfiles(profileRepository);
    this.reports = new OipReports(new PgReportRepository(profileRepository));
  }
  async start(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const single = await client.query(
        "SELECT pg_try_advisory_lock(190148) AS locked",
      );
      if (!single.rows[0].locked)
        throw new ConfigurationError("another demo host is active");
      const r = await client.query(
        "SELECT pg_try_advisory_lock_shared($1) AS locked",
        [MAINTENANCE_LOCK],
      );
      if (!r.rows[0].locked)
        throw new ConfigurationError("demo maintenance active");
      // A lost lease stops new requests; the single host must be restarted explicitly.
      client.on("error", () => {
        if (this.lease === client) {
          this.lease = undefined;
          client.release(true);
        }
      });
      this.lease = client;
      await this.checkUser(this.config.users[0].id);
    } catch (e) {
      this.lease = undefined;
      client.release(true);
      throw e;
    }
  }
  async close(): Promise<void> {
    if (this.lease) {
      this.lease.release(true);
      this.lease = undefined;
    }
    await this.pool.end();
  }
  async checkUser(actor: string): Promise<void> {
    if (!this.config.users.some((u) => u.id === actor))
      throw new ForbiddenException();
    await runSiteOperation(
      this.pool,
      {
        userId: actor,
        organizationId: this.source.organizationId,
        siteId: this.source.siteId,
        permissions: ["analytics.read"],
      },
      async (tx) => {
        const r = await tx.query(
          "SELECT time_zone FROM platform_core.sites WHERE organization_id=$1 AND site_id=$2",
          [this.source.organizationId, this.source.siteId],
        );
        if (r.rows[0]?.time_zone !== this.source.siteTimeZone)
          throw new ConfigurationError("seeded site zone");
      },
    );
  }
  async canImport(actor: string): Promise<boolean> {
    const context = {
      userId: actor,
      organizationId: this.source.organizationId,
      siteId: this.source.siteId,
    };
    return runSiteOperation(
      this.pool,
      { ...context, permissions: ["analytics.read"] },
      async (tx) =>
        (
          await evaluateSiteAccess(tx, {
            ...context,
            permissions: ["imports.submit", "imports.review"],
          })
        ).allowed,
    );
  }
  protect(request: IncomingMessage, apiPort: number): void {
    if (!this.lease) throw new ServiceUnavailableException();
    const hosts = new Set([
      `127.0.0.1:${apiPort}`,
      ...this.config.origins.map((o) => new URL(o).host),
    ]);
    if (
      !hosts.has(request.headers.host ?? "") ||
      request.headers["sec-fetch-site"] === "cross-site" ||
      (request.headers.origin !== undefined &&
        !this.config.origins.includes(request.headers.origin))
    )
      throw new ForbiddenException();
    if (
      !["GET", "HEAD"].includes(request.method ?? "") &&
      (!request.headers.origin ||
        !this.config.origins.includes(request.headers.origin) ||
        request.headers["x-iop-demo"] !== "1")
    )
      throw new ForbiddenException();
  }
  reserveUpload(): () => void {
    if (this.receiving || this.imports.isBusy)
      throw new ServiceUnavailableException();
    this.receiving = true;
    return () => {
      this.receiving = false;
    };
  }
  submit(actor: string, filename: string, bytes: Buffer): Promise<BatchStatus> {
    return this.imports.submit(actor, filename, bytes);
  }
  recover(actor: string, id: string): Promise<BatchStatus> {
    return this.imports.recover(actor, id);
  }
}
export async function startDemoRuntime(
  env: NodeJS.ProcessEnv,
): Promise<DemoRuntime | null> {
  const config = readDemoConfiguration(env);
  if (!config) return null;
  const password = env.IOP_RUNTIME_PASSWORD,
    port = env.IOP_DATABASE_PORT;
  if (
    !password ||
    Buffer.byteLength(password) < 16 ||
    Buffer.byteLength(password) > 256 ||
    password.includes("\0") ||
    !port ||
    !/^\d{1,5}$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535
  )
    throw new ConfigurationError("runtime database credentials");
  const runtime = new DemoRuntime(
    new Pool({
      host: env.IOP_DATABASE_HOST,
      port: Number(port),
      database: "iop_local",
      user: "iop_runtime",
      password,
      max: 5,
      ssl: false,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
      application_name: "iop-local-demo",
      options: "-c search_path=pg_catalog -c lock_timeout=5000",
    }),
    config,
  );
  try {
    await runtime.start();
    return runtime;
  } catch (e) {
    await runtime.close();
    throw e;
  }
}
