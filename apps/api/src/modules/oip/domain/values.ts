export class AnalyticsError extends Error {
  constructor(
    readonly code:
      | "invalid_selection"
      | "unavailable_reference"
      | "analytics_revision_changed"
      | "analytics_total_out_of_range"
      | "invalid_publication",
  ) {
    super(code);
  }
}
export function exactTotal(value: string | number): number {
  const integer = BigInt(value);
  if (integer < 0n || integer > BigInt(Number.MAX_SAFE_INTEGER))
    throw new AnalyticsError("analytics_total_out_of_range");
  return Number(integer);
}
export function dateLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
