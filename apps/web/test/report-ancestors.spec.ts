import { changeReportFilter, completeReportAncestors } from "../src/features/analysis/domain/report-filters";

test("a lower criterion completes missing unique ancestors without inferring descendants", () => {
  expect(completeReportAncestors({ equipment: ["=EQ"] }, {
    sector: ["A"], area: ["Area A"], message: ["Alarm"],
  })).toEqual({ sector: ["A"], area: ["Area A"], equipment: ["=EQ"] });
  expect(completeReportAncestors({ messageGroup: ["007"] }, {
    sector: ["A"], area: ["Area A"], equipment: ["=EQ"], message: ["Alarm"], type: ["Fault"],
  })).toEqual({ sector: ["A"], area: ["Area A"], equipment: ["=EQ"], message: ["Alarm"], type: ["Fault"], messageGroup: ["007"] });
});

test("ambiguous or missing values stay unrestricted and explicit parents remain authoritative", () => {
  expect(completeReportAncestors({ area: ["Shared area"] }, { sector: ["A", "B"] })).toEqual({ area: ["Shared area"] });
  expect(completeReportAncestors({ area: ["Unknown"] }, { sector: [""] })).toEqual({ area: ["Unknown"] });
  expect(completeReportAncestors({ sector: ["A", "B"], equipment: ["=EQ"] }, { sector: ["C"], area: ["Area A"] }))
    .toEqual({ sector: ["A", "B"], area: ["Area A"], equipment: ["=EQ"] });
  expect(completeReportAncestors({}, { sector: ["A"] })).toEqual({});
  expect(completeReportAncestors({ area: ["A"] })).toEqual({ area: ["A"] });
});

test("changing or clearing a completed parent still clears downstream criteria", () => {
  const completed = completeReportAncestors({ equipment: ["=EQ"] }, { sector: ["A"], area: ["Area A"] });
  expect(changeReportFilter(completed, "sector", "B")).toEqual({ sector: ["B"] });
  expect(changeReportFilter(completed, "sector", "")).toEqual({});
});
