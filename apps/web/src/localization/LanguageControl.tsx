import { useSyncExternalStore } from "react";
import { Select } from "../design/components";
import {
  language,
  setLanguage,
  subscribeLanguage,
  t,
  type Language,
} from "./i18n";
export function LanguageControl() {
  const current = useSyncExternalStore(subscribeLanguage, language);
  return (
    <label className="iop-language" title={t("Language")}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18M5 6.5h14M5 17.5h14" />
      </svg>
      <Select
        aria-label={t("Language")}
        value={current}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        <option value="de" lang="de">
          DE
        </option>
        <option value="en" lang="en">
          EN
        </option>
      </Select>
    </label>
  );
}
