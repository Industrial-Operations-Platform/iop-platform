import { createHash } from "node:crypto";
import type { ImportSource } from "../../../integrations";

import { AnalyticsError, type Dimension } from "../../domain/analytics";
export const digest = (value: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("base64url");
export const scopeTuple = (s: ImportSource): string[] => [
  s.organizationId,
  s.siteId,
  s.sourceId,
];
export function dimensionReference(
  s: ImportSource,
  kind: Dimension,
  tuple: unknown[],
): string {
  return "d1." + digest([1, ...scopeTuple(s), kind, ...tuple]);
}
export function decodeCursor(token: string): Record<string, unknown> {
  try {
    const bytes = Buffer.from(token, "base64url");
    if (bytes.toString("base64url") !== token) throw new Error();
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new Error();
    return value;
  } catch {
    throw new AnalyticsError("invalid_selection");
  }
}
