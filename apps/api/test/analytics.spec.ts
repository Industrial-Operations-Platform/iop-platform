import {
  dimensionReference,
  decodeCursor,
} from "../src/modules/oip/adapters/postgres/analytics";
import {
  AnalyticsError,
  validateQuery,
  exactTotal,
} from "../src/modules/oip/domain/analytics";
const base = {
  revision: "r1." + "A".repeat(43),
  from: "2026-07-01",
  toExclusive: "2026-07-04",
};
const ref = "d1." + "A".repeat(43);
describe("bounded analytical input", () => {
  test.each([
    null,
    [],
    {},
    { ...base, extra: true },
    { ...base, from: "2026-02-30" },
    { ...base, toExclusive: "2026-07-01" },
    { ...base, toExclusive: "2027-07-04" },
    { ...base, pageSize: 0 },
    { ...base, pageSize: 101 },
    { ...base, pageSize: 1.5 },
    { ...base, sectors: [] },
    { ...base, sectors: null },
    { ...base, sectors: [ref.repeat(2)] },
    { ...base, sectors: Array(101).fill(ref) },
    { ...base, messages: [ref], excludedMessages: [ref] },
    { ...base, cursor: "A".repeat(4097) },
  ])("rejects invalid selection %#", (input) => {
    expect(() => validateQuery(input)).toThrow(AnalyticsError);
  });
  test("canonical sets, exact integer edge and explicit overflow", () => {
    expect(validateQuery({ ...base, sectors: [ref, ref] }).sectors).toEqual([
      ref,
    ]);
    expect(exactTotal("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => exactTotal("9007199254740992")).toThrow(
      "analytics_total_out_of_range",
    );
    expect(() => decodeCursor("not-a-cursor")).toThrow("invalid_selection");
  });
  test("reference tuples preserve boundaries, Unicode and scope", () => {
    const source = {
      organizationId: "org",
      siteId: "site",
      sourceId: "source",
    } as Parameters<typeof dimensionReference>[0];
    expect(dimensionReference(source, "equipment", ["A|B", "C"])).not.toBe(
      dimensionReference(source, "equipment", ["A", "B|C"]),
    );
    expect(dimensionReference(source, "area", ["Ä"])).not.toBe(
      dimensionReference({ ...source, siteId: "other" }, "area", ["Ä"]),
    );
    expect(
      dimensionReference(source, "sector", ["mapped", "Unclassified"]),
    ).not.toBe(dimensionReference(source, "sector", ["unclassified"]));
  });
});
