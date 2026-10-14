export class JobError extends Error {
  constructor(readonly code: "invalid_job" | "job_denied" | "job_conflict" | "job_missing") { super(code); }
}
export class JobTransientError extends Error { constructor() { super("transient"); } }
export class JobConfigurationPending extends Error { constructor() { super("missing-configuration"); } }
export type JobState = "queued" | "running" | "retry" | "completed" | "failed" | "waiting-handler" | "waiting-configuration";
export interface Job {
  id: string; type: string; initiatorId: string; key: string; fingerprint: string; payload: Record<string, string | number | boolean>;
  revision: number; state: JobState; attempts: number; maxAttempts: number; availableAt: string; leaseToken: string; leaseUntil: string;
  createdAt: string; updatedAt: string; reason: "none" | "transient" | "missing-handler" | "missing-configuration" | "exhausted";
  result: Record<string,string | number | boolean>;
}
export interface JobInput { key: string; type: string; payload: Record<string,string | number | boolean> }
export function identifier(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value)) throw new JobError("invalid_job");
  return value;
}
export function payload(input: unknown): Record<string,string | number | boolean> {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 20) throw new JobError("invalid_job");
  const result: Record<string,string | number | boolean> = {};
  for (const [key,value] of Object.entries(input).sort(([left],[right]) => left.localeCompare(right))) {
    if (!/^[a-z][a-zA-Z0-9]{0,31}$/.test(key) || /password|token|secret|cookie|credential|email|name|url|path/i.test(key) ||
      !["string","number","boolean"].includes(typeof value) || (typeof value === "string" && (value.length > 160 || /[\x00-\x1f]/.test(value))) ||
      (typeof value === "number" && (!Number.isFinite(value) || Math.abs(value) > 1000000000))) throw new JobError("invalid_job");
    result[key] = value as string | number | boolean;
  }
  return result;
}
export function input(value: JobInput): JobInput {
  if (!value || Object.keys(value).sort().join() !== ["key","type","payload"].sort().join()) throw new JobError("invalid_job");
  return { key: identifier(value.key), type: identifier(value.type), payload: payload(value.payload) };
}
