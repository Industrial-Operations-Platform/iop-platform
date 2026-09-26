import { createHash, randomBytes } from "node:crypto";
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
  ImportOutcomeUnknownError,
  SourceMappings,
  validateCsv,
  CSV_ADAPTER_REVISION,
  parseCsvReportingDate,
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
  readonly principals: LocalDemoPrincipals;
  private busy = false;
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
    this.queries = new OipQueries(pool, this.source);
    this.principals = new LocalDemoPrincipals(config.users);
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
    if (this.receiving || this.busy) throw new ServiceUnavailableException();
    this.receiving = true;
    return () => {
      this.receiving = false;
    };
  }
  async submit(
    actor: string,
    filename: string,
    bytes: Buffer,
  ): Promise<BatchStatus> {
    if (this.busy) throw new ServiceUnavailableException();
    this.busy = true;
    const deadline = Date.now() + 30000;
    let importId: string | undefined;
    try {
      parseCsvReportingDate(filename);
      importId = await this.batches.receive(actor, filename, bytes);
      const inspected = validateCsv(filename, bytes);
      if (inspected.status === "invalid")
        await this.batches.reject(actor, importId, {
          ...inspected.inspection,
          unclassifiedCount: 0,
        });
      else {
        const classified = this.config.mappings.classify(
          this.source,
          inspected.prepared,
        );
        await this.batches.publish(
          actor,
          importId,
          {
            ...inspected.inspection,
            unclassifiedCount: classified.unclassifiedCount,
          },
          this.receiver,
          {
            classified,
            prepared: inspected.prepared,
            inputSha256: createHash("sha256").update(bytes).digest("hex"),
          },
          deadline,
        );
      }
      return await this.batches.review(actor, importId);
    } catch (error) {
      if (error instanceof ImportOutcomeUnknownError) {
        // All awaited phases have stopped; reconciliation never replays input.
        try {
          await this.batches.reconcile(actor, error.importId, this.receiver);
          return await this.batches.review(actor, error.importId);
        } catch {
          throw new ImportOutcomeUnknownError(error.importId);
        }
      }
      if (importId)
        await this.batches
          .reconcile(actor, importId, this.receiver)
          .catch(() => undefined);
      throw error;
    } finally {
      this.busy = false;
    }
  }
  async recover(actor: string, id: string): Promise<BatchStatus> {
    if (this.busy) throw new ServiceUnavailableException();
    await this.batches.reconcile(actor, id, this.receiver);
    return this.batches.review(actor, id);
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
