import { dimensions, type Dimension, type ReportRequest } from "./models";

/** An ancestor change invalidates all following criteria in the filter row. */
export function changeReportFilter(
  filters: ReportRequest["filters"],
  field: Dimension,
  value: string,
): NonNullable<ReportRequest["filters"]> {
  return Object.fromEntries(
    dimensions.slice(0, dimensions.indexOf(field) + 1).flatMap((key) => {
      const values = key === field ? (value ? [value] : []) : filters?.[key];
      return values?.length ? [[key, values]] : [];
    }),
  );
}
