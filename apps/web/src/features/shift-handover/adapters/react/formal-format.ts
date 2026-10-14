import { locale, t } from "../../../../localization/i18n";
export function formalInstant(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale(), { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formalState(state: string): string {
  return t(({ draft: "Draft", open: "Open", closed: "Closed", created: "Created", corrected: "Corrected",
    published: "Published", acknowledged: "Acknowledged" } as Record<string, string>)[state] ?? state);
}
