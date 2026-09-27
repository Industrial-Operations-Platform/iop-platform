import {
  compileProfile,
  normalizeLabel,
} from "../src/modules/oip/domain/reporting-profile";
import { reportRequest } from "../src/modules/oip/domain/report";
import {
  ReportingProfiles,
  OipReports,
} from "../src/modules/oip/application/reporting";
import type {
  ReportingProfileRepository,
  ReportRepository,
} from "../src/modules/oip/application/ports";

const profile = {
  normalization: { trim: true, unicodeNfc: true, collapseWhitespace: true },
  unclassifiedLabel: "Nicht klassifiziert",
  areaSectors: [
    { area: "Kon.Kreuz MidiTransfer", sector: "Halle A T1" },
    { area: "Kartonzuführung L,M,S", sector: "Halle B Sky" },
  ],
  aliases: [],
};
test("normalization preserves punctuation, identity characters and decomposed Unicode", () => {
  expect(
    normalizeLabel("  Kon.Kreuz  MidiTransfer  ", profile.normalization),
  ).toBe("Kon.Kreuz MidiTransfer");
  expect(
    normalizeLabel("=0001+M\u0075\u0308ll,L5/6", profile.normalization),
  ).toBe("=0001+Müll,L5/6");
  expect(compileProfile(profile).compiled.areas["Kartonzuführung L,M,S"]).toBe(
    "Halle B Sky",
  );
});
test("ambiguous normalized mappings and chained corrections are rejected", () => {
  expect(() =>
    compileProfile({
      ...profile,
      areaSectors: [
        ...profile.areaSectors,
        { area: " Kon.Kreuz  MidiTransfer ", sector: "Other" },
      ],
    }),
  ).toThrow("invalid_selection");
  expect(() =>
    compileProfile({
      ...profile,
      aliases: [
        { field: "area", from: "A", to: "B" },
        { field: "area", from: "B", to: "C" },
      ],
    }),
  ).toThrow("invalid_selection");
});
test("profile use case validates before calling an injected repository", async () => {
  const save = jest.fn(async () => ({ version: "new", profile }));
  const repository: ReportingProfileRepository = {
    get: async () => ({ version: "old", profile }),
    save,
  };
  const service = new ReportingProfiles(repository);
  expect(await service.get("reader")).toEqual({ version: "old", profile });
  expect(() => service.save("writer", { version: "old", profile: {} })).toThrow(
    "invalid_selection",
  );
  expect(save).not.toHaveBeenCalled();
  await service.save("writer", { version: "old", profile });
  expect(save).toHaveBeenCalledWith(
    "writer",
    "old",
    expect.objectContaining({ compiled: expect.any(Object) }),
  );
});
test("report use case rejects stale snapshots without infrastructure dependencies", async () => {
  const revision = "a1." + "a".repeat(43),
    query = jest.fn();
  const repository: ReportRepository = { query };
  const service = new OipReports(repository),
    selection = {
      from: "2026-05-01",
      toExclusive: "2026-08-01",
      dimension: "equipment",
      metric: "frequency",
      period: "day",
      revision,
    };
  query.mockResolvedValue({ revision: "a1." + "b".repeat(43) });
  await expect(service.query("reader", selection)).rejects.toThrow(
    "analytics_revision_changed",
  );
  expect(query).toHaveBeenCalledWith(
    "reader",
    expect.objectContaining({ page: 1, search: "", filters: {} }),
  );
  expect(() => reportRequest({ ...selection, from: "2026-02-30" })).toThrow(
    "invalid_selection",
  );
});

test("report selectors reject array coercion instead of changing the requested measure", () => {
  const selection = {
    from: "2026-07-01",
    toExclusive: "2026-07-08",
    dimension: "area",
    period: "day",
    metric: "frequency",
  };
  expect(() => reportRequest({ ...selection, metric: ["frequency"] })).toThrow(
    "invalid_selection",
  );
  expect(() => reportRequest({ ...selection, period: ["day"] })).toThrow(
    "invalid_selection",
  );
});
