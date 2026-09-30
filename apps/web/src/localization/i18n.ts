import { german } from "./de";
export type Language = "en" | "de";
let override: Language | undefined;
const listeners = new Set<() => void>();
export function language(): Language {
  if (override) return override;
  try {
    const saved = localStorage.getItem("iop.language");
    if (saved === "en" || saved === "de") return saved;
  } catch {}
  return typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("de")
    ? "de"
    : "en";
}
export function setLanguage(next: Language) {
  override = next;
  try {
    localStorage.setItem("iop.language", next);
  } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((fn) => fn());
}
export function subscribeLanguage(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
/** English source text is the stable key and safe fallback. Customer data is never translated. */
export function t(source: string, values: readonly unknown[] = []): string {
  const key = source.trim();
  const translated = language() === "de" ? german[key] : undefined;
  const template =
    translated === undefined ? source : source.replace(key, translated);
  return template.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
    Number(index) < values.length
      ? String(values[Number(index)] ?? "")
      : placeholder,
  );
}
export function locale() {
  return language() === "de" ? "de-CH" : "en-GB";
}
