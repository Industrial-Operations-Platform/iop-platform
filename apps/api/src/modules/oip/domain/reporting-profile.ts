import { AnalyticsError } from "./values";
// ECMAScript whitespace, shared with the PostgreSQL normalization adapter.
export const labelWhitespace =
  "\u0009\u000a\u000b\u000c\u000d \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";
export const reportDimensions = [
  "sector",
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
  "frequency",
  "duration",
] as const;
export type ReportDimension = (typeof reportDimensions)[number];
export const textFields = [
  "area",
  "equipment",
  "message",
  "type",
  "messageGroup",
] as const;
export type TextField = (typeof textFields)[number];
export interface ReportingProfile {
  normalization: {
    trim: boolean;
    unicodeNfc: boolean;
    collapseWhitespace: boolean;
  };
  unclassifiedLabel: string;
  areaSectors: { area: string; sector: string }[];
  aliases: { field: TextField; from: string; to: string }[];
}
export interface CompiledProfile extends ReportingProfile {
  compiled: {
    areas: Record<string, string>;
    aliases: Record<string, Record<string, string>>;
  };
}
export interface ProfileResult {
  version: string;
  profile: ReportingProfile;
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const fail = (): never => {
  throw new AnalyticsError("invalid_selection");
};
const text = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= 4096 &&
  !/[\x00-\x1f\x7f]/.test(v);
export function normalizeLabel(
  s: string,
  n: ReportingProfile["normalization"],
): string {
  let value = n.unicodeNfc ? s.normalize("NFC") : s;
  if (n.trim) value = value.trim();
  if (n.collapseWhitespace) value = value.replace(/\s+/gu, " ");
  return value;
}
export function compileProfile(value: unknown): CompiledProfile {
  if (
    !obj(value) ||
    Object.keys(value).sort().join(",") !==
      "aliases,areaSectors,normalization,unclassifiedLabel" ||
    !obj(value.normalization)
  )
    fail();
  const v = value as unknown as ReportingProfile,
    n = v.normalization;
  if (
    Object.keys(n).sort().join(",") !== "collapseWhitespace,trim,unicodeNfc" ||
    Object.values(n).some((x) => typeof x !== "boolean") ||
    !text(v.unclassifiedLabel) ||
    ![v.areaSectors, v.aliases].every(
      (x) => Array.isArray(x) && x.length <= 1000,
    )
  )
    fail();
  const norm = (x: unknown) => {
    if (!text(x)) fail();
    const y = normalizeLabel(x as string, n);
    if (!y) fail();
    return y;
  };
  const aliases: CompiledProfile["compiled"]["aliases"] = Object.create(null),
    areas: Record<string, string> = Object.create(null);
  for (const a of v.aliases) {
    if (
      !obj(a) ||
      Object.keys(a).sort().join(",") !== "field,from,to" ||
      !textFields.includes(a.field)
    )
      fail();
    const from = norm(a.from),
      to = norm(a.to);
    aliases[a.field] ??= Object.create(null);
    if (Object.hasOwn(aliases[a.field], from)) fail();
    aliases[a.field][from] = to;
  }
  // One explicit replacement per value. Chains are rejected to prevent ambiguous interpretation.
  for (const map of Object.values(aliases))
    for (const [from, to] of Object.entries(map))
      if (from !== to && Object.hasOwn(map, to)) fail();
  const alias = (field: string, x: unknown) => {
    const y = norm(x);
    return aliases[field]?.[y] ?? y;
  };
  for (const a of v.areaSectors) {
    if (!obj(a) || Object.keys(a).sort().join(",") !== "area,sector") fail();
    const area = alias("area", a.area);
    if (Object.hasOwn(areas, area)) fail();
    areas[area] = norm(a.sector);
  }

  return { ...v, compiled: { areas, aliases } };
}
