import { AnalysisCalendar } from "../src/modules/oip/domain/analysis-calendar";

test("calendar uses source dates and ISO weekdays, retaining Saturdays and unrestricted defaults", () => {
  const calendar = new AnalysisCalendar([7, 7]);
  expect(calendar.excludedWeekdays).toEqual([7]);
  expect(calendar.includes("2026-07-04")).toBe(true);
  expect(calendar.includes("2026-07-05")).toBe(false);
  expect(calendar.includes("2026-07-06")).toBe(true);
  expect(new AnalysisCalendar().includes("2026-07-05")).toBe(true);
  expect(calendar.count("2026-07-01", "2026-08-01")).toBe(27);
  expect(calendar.count("2026-02-01", "2026-03-01")).toBe(24);
  expect(calendar.count("2024-02-01", "2024-03-01")).toBe(25);
  expect(calendar.count("2026-03-29", "2026-03-30")).toBe(0);
  expect(calendar.count("2026-10-25", "2026-10-26")).toBe(0);
});
test("calendar validates configuration and freezes a copy of weekday exclusions", () => {
  for (const day of [0, 8, -1, 2.5, NaN, Infinity])
    expect(() => new AnalysisCalendar([day])).toThrow(
      "Invalid analysis calendar weekday",
    );
  const days = [7];
  const calendar = new AnalysisCalendar(days);
  days[0] = 6;
  expect(calendar.excludedWeekdays).toEqual([7]);
  expect(Object.isFrozen(calendar.excludedWeekdays)).toBe(true);
});
