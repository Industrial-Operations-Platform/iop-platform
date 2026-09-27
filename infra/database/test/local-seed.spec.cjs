const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { createHash } = require("node:crypto");
const { seedHistory } = require("../../../scripts/local/initialize.cjs");
const {
  validateCsv,
} = require("../../../apps/api/dist/modules/integrations/csv-adapter");
let directory, files, retained, runtime;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "iop-local-seed-"));
  retained = new Map();
  files = ["20260701", "20260703", "20260705"].map((date) => {
    const filename = `Hitliste-${date}.csv`,
      bytes = readFileSync(
        join(
          __dirname,
          "../../../fixtures/analytical-poc/valid",
          date === "20260705" ? "Hitliste-20260701.csv" : filename,
        ),
      );
    const p = validateCsv(filename, bytes).prepared;
    writeFileSync(join(directory, filename), bytes);
    return {
      filename,
      date: p.reportingDate,
      records: p.dataRecordCount,
      frequency: p.totalReportedFrequency,
      seconds: p.totalAccumulatedAlarmSeconds,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      lineage: p.records.map((_, i) => ({
        factId: String(i + 1),
        sourceHitlisteId: String(i + 1),
      })),
    };
  });
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify({
      format: 1,
      source: "analytics.fact_hitliste",
      archiveSha256: "a".repeat(64),
      files,
    }),
  );
  runtime = {
    batches: {
      history: async () =>
        [...retained].map(([date]) => ({
          reportingDate: date,
          importId: date,
          outcome: "succeeded",
        })),
      original: async (_, id) => retained.get(id),
    },
    submit: jest.fn(async (_, filename, bytes) => {
      retained.set(files.find((f) => f.filename === filename).date, bytes);
      return { outcome: "succeeded" };
    }),
    reports: {
      query: jest.fn(async (_, query) => {
        expect(query.period).toBe("day");
        return {
          timeline: files.map((f) => ({
            period: f.date,
            records: f.records,
            frequency: f.frequency,
            seconds: f.seconds,
          })),
        };
      }),
    },
  };
  jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
  jest.restoreAllMocks();
});
test("seed restarts preserve matching bytes and later uploads without duplicate submissions", async () => {
  await seedHistory(runtime, "admin", directory, runtime.reports);
  expect(runtime.submit).toHaveBeenCalledTimes(3);
  retained.set("2026-08-01", Buffer.from("later user upload"));
  await seedHistory(runtime, "admin", directory, runtime.reports);
  expect(runtime.submit).toHaveBeenCalledTimes(3);
  expect(retained.get("2026-08-01").toString()).toBe("later user upload");
});
test("a conflict on the last seed date is detected before importing the first date", async () => {
  retained.set(files[1].date, Buffer.from("different retained data"));
  await expect(
    seedHistory(runtime, "admin", directory, runtime.reports),
  ).rejects.toThrow("conflicts");
  expect(runtime.submit).not.toHaveBeenCalled();
});
test("damaged file or mismatched manifest totals fail before any submission", async () => {
  writeFileSync(join(directory, files[1].filename), "corrupt");
  await expect(
    seedHistory(runtime, "admin", directory, runtime.reports),
  ).rejects.toThrow("manifest");
  expect(runtime.submit).not.toHaveBeenCalled();
});
test("failed import stops later dates and does not replay automatically", async () => {
  runtime.submit.mockResolvedValue({ outcome: "failed" });
  await expect(
    seedHistory(runtime, "admin", directory, runtime.reports),
  ).rejects.toThrow("stopped");
  expect(runtime.submit).toHaveBeenCalledTimes(1);
});

test("stored analytical measures must match every seed date", async () => {
  runtime.reports.query.mockResolvedValue({ timeline: [] });
  await expect(
    seedHistory(runtime, "admin", directory, runtime.reports),
  ).rejects.toThrow("Stored seed reconciliation failed");
});
