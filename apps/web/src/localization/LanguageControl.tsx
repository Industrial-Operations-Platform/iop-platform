import { useSyncExternalStore } from "react";
import { Field, Select } from "../design/components";
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
    <Field layout="inline">
      {t("Language")}
      <Select
        aria-label={t("Language")}
        value={current}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </Select>
    </Field>
  );
}
