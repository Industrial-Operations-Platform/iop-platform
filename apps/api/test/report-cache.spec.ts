import { ReportCache } from "../src/modules/oip/adapters/postgres/report-cache";
import { PgReportRepository } from "../src/modules/oip/adapters/postgres/reports";
import type { PgReportingProfiles } from "../src/modules/oip/adapters/postgres/reporting-profiles";
import { reportRequest, type ReportResult } from "../src/modules/oip/domain/report";
import { OipReports } from "../src/modules/oip/application/reporting";

const selection = reportRequest({ from: "2026-10-01", toExclusive: "2026-11-01", dimension: "area", period: "day", metric: "frequency" });
function fixture() {
  let allowed = true;
  const snapshot = {
    profile_version: "initial", profile_fingerprint: "initial-config", publications: [{ id: "publication-1", date: "2026-10-01" }],
    projection_valid: true, totals: { frequency: "12", seconds: "90", records: "2" },
    kpi_values: [], executive: [], options: [], option_counts: {}, groups: [],
    frequency_groups: [], duration_groups: [], group_count: 0, timeline: [],
    series: [], monthly: [], records: [], unclassified: 0,
  };
  const query = jest.fn(async (sql: string) => ({ rows: sql.startsWith("SET LOCAL") ? [] : [structuredClone(snapshot)] }));
  const run = jest.fn(async (_actor: string, _write: boolean, callback: (tx: { query: typeof query }) => Promise<ReportResult>) => {
    if (!allowed) throw new Error("access denied");
    return callback({ query });
  });
  const profiles = { source: { organizationId: "org", siteId: "site", sourceId: "source" }, initial: {}, initialVersion: "initial", run } as unknown as PgReportingProfiles;
  const reports = new OipReports(new PgReportRepository(profiles));
  const fullReads = () => query.mock.calls.filter(([sql]) => sql.includes("ready AS MATERIALIZED")).length;
  return { reports, snapshot, query, run, fullReads, deny: () => { allowed = false; } };
}

test("repeated reports skip aggregation while rechecking scoped current authority and projection", async () => {
  const f = fixture();
  const first = await f.reports.query("reader", selection);
  first.totals.frequency = 999;
  const repeated = await f.reports.query("reader", { ...selection, revision: first.revision });
  expect(repeated.totals.frequency).toBe(12);
  expect(repeated.selection.revision).toBe(first.revision);
  expect(f.fullReads()).toBe(1);
  expect(f.run).toHaveBeenCalledTimes(2);
  expect(f.query.mock.calls.some(([sql]) => sql.includes("FROM analytics.fact_hitliste CROSS JOIN p"))).toBe(true);
  f.deny();
  await expect(f.reports.query("reader", selection)).rejects.toThrow("access denied");
  expect(f.fullReads()).toBe(1);
});

test("publication/profile changes invalidate cached reports and stale revisions still fail", async () => {
  const f = fixture();
  const first = await f.reports.query("reader", selection);
  f.snapshot.publications.push({ id: "publication-2", date: "2026-10-02" });
  await expect(f.reports.query("reader", { ...selection, revision: first.revision })).rejects.toThrow("analytics_revision_changed");
  expect(f.fullReads()).toBe(2);
  const second = await f.reports.query("reader", selection);
  f.snapshot.profile_version = "changed-profile";
  const third = await f.reports.query("reader", selection);
  expect(third.revision).not.toBe(second.revision);
  expect(f.fullReads()).toBe(3);
  f.snapshot.profile_fingerprint = "legacy-configuration";
  await f.reports.query("reader", selection);
  expect(f.fullReads()).toBe(4);
  f.snapshot.projection_valid = false;
  await expect(f.reports.query("reader", selection)).rejects.toThrow("analytics_projection_unavailable");
});

test("different actors, date ranges and filters do not share incorrect cached values", async () => {
  const f = fixture();
  await f.reports.query("reader", selection);
  await f.reports.query("other-reader", selection);
  await f.reports.query("reader", { ...selection, from: "2026-10-02" });
  await f.reports.query("reader", { ...selection, filters: { area: ["A", "B"] } });
  await f.reports.query("reader", { ...selection, filters: { area: ["B", "A", "A"] } });
  expect(f.fullReads()).toBe(4);
});

test("report values expire, use bounded LRU space, and cannot be changed by callers", () => {
  let now = 0;
  const cache = new ReportCache(2, 1024, 100, () => now);
  const report = { revision: "r", totals: { frequency: 1 } } as ReportResult;
  cache.set("one", report);
  report.totals.frequency = 9;
  expect(cache.get("one")!.totals.frequency).toBe(1);
  cache.set("two", report);
  cache.get("one");
  cache.set("three", report);
  expect(cache.get("two")).toBeUndefined();
  now = 100;
  expect(cache.get("one")).toBeUndefined();
  expect(cache.get("three")).toBeUndefined();
  cache.set("oversized", { ...report, records: [{ message: "x".repeat(2000) }] } as ReportResult);
  expect(cache.get("oversized")).toBeUndefined();
  const small = new ReportCache(20, 100, 100, () => now);
  small.set("one", report);
  small.set("two", report);
  small.set("three", report);
  expect(small.get("one")).toBeUndefined();
  expect(small.get("three")).toBeDefined();
});
