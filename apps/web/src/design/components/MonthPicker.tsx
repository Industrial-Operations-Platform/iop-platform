import { t, locale } from "../../localization/i18n";
import { Field, Select } from "./Controls";

/** Native selects open from the entire field and support scrolling and arrow keys. */
export function MonthPicker({
  value,
  months,
  onChange,
  label = "Month",
}: {
  value: string;
  months: string[];
  onChange: (month: string) => void;
  label?: string;
}) {
  const choices = [...new Set([value, ...months])].sort().reverse();
  return (
    <Field>
      {t(label)}
      <Select
        aria-label={t(label)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {choices.map((month) => (
          <option key={month} value={month}>
            {new Intl.DateTimeFormat(locale(), {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(month + "-01T00:00:00Z"))}
          </option>
        ))}
      </Select>
    </Field>
  );
}
