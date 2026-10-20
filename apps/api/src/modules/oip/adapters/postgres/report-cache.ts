import type { ReportResult } from "../../domain/report";

/** Disposable report values only; authorization and current revisions stay in PostgreSQL. */
export class ReportCache {
  private readonly entries = new Map<string, { json: string; bytes: number; expires: number; profileFingerprint: string }>();
  private bytes = 0;

  constructor(
    private readonly maxEntries = 64,
    private readonly maxBytes = 16 * 1024 * 1024,
    private readonly ttlMs = 5 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): ReportResult | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.remove(key);
    if (entry.expires <= this.now()) return undefined;
    this.entries.set(key, entry);
    this.bytes += entry.bytes;
    return JSON.parse(entry.json) as ReportResult;
  }

  matchesProfile(key: string, fingerprint: string): boolean {
    return this.entries.get(key)?.profileFingerprint === fingerprint;
  }

  set(key: string, report: ReportResult, profileFingerprint = ""): void {
    this.remove(key);
    const json = JSON.stringify(report);
    const bytes = Buffer.byteLength(json, "utf8");
    if (bytes > this.maxBytes || this.maxEntries < 1) return;
    for (const [id, entry] of this.entries)
      if (entry.expires <= this.now()) this.remove(id);
    while (this.entries.size >= this.maxEntries || this.bytes + bytes > this.maxBytes)
      this.remove(this.entries.keys().next().value!);
    this.entries.set(key, { json, bytes, expires: this.now() + this.ttlMs, profileFingerprint });
    this.bytes += bytes;
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.bytes;
    this.entries.delete(key);
  }
}
