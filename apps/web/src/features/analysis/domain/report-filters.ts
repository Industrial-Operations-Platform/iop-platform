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

/** Complete only missing ancestors confirmed unique by the full scoped report. */
export function completeReportAncestors(
  filters: ReportRequest["filters"],
  ancestors: Partial<Record<Dimension, string[]>> = {},
): NonNullable<ReportRequest["filters"]> {
  const result = { ...filters };
  const deepest = dimensions.reduce((last, field, index) => filters?.[field]?.length ? index : last, -1);
  for (const field of dimensions.slice(0, Math.max(0, deepest))) {
    const values = ancestors[field];
    if (!result[field]?.length && values?.length === 1 && values[0]) result[field] = [...values];
  }
  return result;
}
