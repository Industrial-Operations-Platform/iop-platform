import type { Report, ReportRequest } from "../domain/models";

export function reportKey(selection: ReportRequest): string {
  return JSON.stringify([
    selection.from, selection.toExclusive, selection.dimension,
    selection.period, selection.metric, selection.executive ?? false,
    selection.months ? [...new Set(selection.months)].sort() : null,
    Object.entries(selection.filters ?? {})
      .filter(([, values]) => values.length > 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([field, values]) => [field, [...new Set(values)].sort()]),
    selection.search ?? "", selection.page ?? 1, selection.revision ?? null,
  ]);
}

/** Disposable response copies owned by one composed Analysis session. */
export class AnalysisReportCache {
  private readonly entries = new Map<string, { json: string; expires: number }>();
  private characters = 0;

  constructor(
    private readonly now: () => number = Date.now,
    private readonly ttlMs = 5 * 60 * 1000,
    private readonly maxEntries = 32,
    private readonly maxCharacters = 4 * 1024 * 1024,
  ) {}

  get(selection: ReportRequest): Report | undefined {
    const key = reportKey(selection);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.remove(key);
    if (entry.expires <= this.now()) return undefined;
    this.entries.set(key, entry);
    this.characters += entry.json.length;
    return { ...JSON.parse(entry.json) as Report, selection };
  }

  set(selection: ReportRequest, report: Report): void {
    const key = reportKey(selection);
    this.remove(key);
    const json = JSON.stringify(report);
    if (json.length > this.maxCharacters || this.maxEntries < 1) return;
    for (const [entryKey, entry] of this.entries)
      if (entry.expires <= this.now()) this.remove(entryKey);
    while (this.entries.size >= this.maxEntries || this.characters + json.length > this.maxCharacters)
      this.remove(this.entries.keys().next().value!);
    this.entries.set(key, { json, expires: this.now() + this.ttlMs });
    this.characters += json.length;
  }

  clear(): void {
    this.entries.clear();
    this.characters = 0;
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) this.characters -= entry.json.length;
    this.entries.delete(key);
  }
}
