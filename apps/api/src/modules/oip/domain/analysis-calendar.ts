/** ISO weekdays: Monday = 1, Sunday = 7. Dates are source reporting labels. */
export class AnalysisCalendar {
  readonly excludedWeekdays: readonly number[];
  constructor(excludedWeekdays: readonly number[] = []) {
    if (
      excludedWeekdays.some(
        (day) => !Number.isInteger(day) || day < 1 || day > 7,
      )
    )
      throw new Error("Invalid analysis calendar weekday");
    this.excludedWeekdays = Object.freeze(
      [...new Set(excludedWeekdays)].sort(),
    );
  }
  includes(date: string): boolean {
    return !this.excludedWeekdays.includes(
      new Date(date + "T00:00:00Z").getUTCDay() || 7,
    );
  }
  count(from: string, toExclusive: string): number {
    let count = 0;
    for (
      let day = Date.parse(from);
      day < Date.parse(toExclusive);
      day += 86400000
    )
      if (this.includes(new Date(day).toISOString().slice(0, 10))) count++;
    return count;
  }
}
