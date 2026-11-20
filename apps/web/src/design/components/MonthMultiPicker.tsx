import { t, locale } from "../../localization/i18n";
import { useState } from "react";
import { Button, Field, Input, Select } from "./Controls";
import { Popover } from "./Popover";

/** Small selections stay explicit; large histories remain bounded in filter headings. */
export function monthSelectionSummary(months: readonly string[]): string {
  const selected = [...new Set(months)].sort();
  if (!selected.length) return t("No months selected");
  if (selected.length <= 3) return selected.join(", ");
  const years = [...new Set(selected.map(month => month.slice(0, 4)))];
  const coverage = years.length <= 3 ? years.join(", ") : `${years[0]}–${years.at(-1)}`;
  return t("{0} months selected · {1}", [selected.length, coverage]);
}

/** Year navigation changes presentation only; all selections remain caller-owned. */
export function MonthMultiPicker({
  value,
  months,
  onChange,
}: {
  value: string[];
  months: string[];
  onChange: (months: string[]) => void;
}) {
  const selected = [...new Set(value)].sort();
  const choices = [...new Set([...months, ...selected])].sort().reverse();
  const years = [...new Set(choices.map(month => month.slice(0, 4)))];
  const [year, setYear] = useState(selected.at(-1)?.slice(0, 4) ?? years[0] ?? "");
  const visibleYear = years.includes(year) ? year : years[0];
  const yearMonths = choices.filter(month => month.startsWith(visibleYear + "-"));
  const selectedInYear = yearMonths.filter(month => selected.includes(month)).length;
  const partialYear = selectedInYear > 0 && selectedInYear < yearMonths.length;
  const label = (month: string, short = false) => new Intl.DateTimeFormat(locale(), {
    month: short ? "short" : "long", ...(short ? {} : { year: "numeric" as const }), timeZone: "UTC",
  }).format(new Date(month + "-01T00:00:00Z"));
  return (
    <fieldset className="iop-month-picker">
      <legend>{t("Months to compare")}</legend>
      {choices.length === 0 ? <p>{t("No available months")}</p> : (
        <Popover label={t("Choose months")} placement="viewport" alignment="start" className="iop-month-popover"
          trigger={<><span>{monthSelectionSummary(selected)}</span><span aria-hidden="true">▾</span></>}>
          {close => <>
            <Field>
              {t("Year")}
              <Select aria-label={t("Year")} value={visibleYear} onChange={event => setYear(event.target.value)}>
                {years.map(item => <option key={item} value={item}>
                  {t("{0} ({1} selected)", [item, selected.filter(month => month.startsWith(item + "-")).length])}
                </option>)}
              </Select>
            </Field>
            <p className="iop-month-summary" aria-live="polite">{monthSelectionSummary(selected)}</p>
            <label className="iop-month-year-toggle">
              <Input type="checkbox" aria-label={t("Select all months in {0}", [visibleYear])}
                aria-checked={partialYear ? "mixed" : selectedInYear === yearMonths.length}
                ref={input => { if (input) input.indeterminate = partialYear; }}
                checked={selectedInYear === yearMonths.length}
                onChange={event => onChange(event.target.checked
                  ? [...new Set([...selected, ...yearMonths])].sort()
                  : selected.filter(month => !month.startsWith(visibleYear + "-")))} />
              {t("Whole year")} ({selectedInYear}/{yearMonths.length})
            </label>
            <div className="iop-month-choices" role="group" aria-label={t("Months in {0}", [visibleYear])}>
              {Array.from({ length: 12 }, (_, index) => `${visibleYear}-${String(index + 1).padStart(2, "0")}`).map(month => (
                <label key={month} data-selected={selected.includes(month)} title={label(month)}>
                  <Input type="checkbox" aria-label={label(month)} disabled={!choices.includes(month)}
                    checked={selected.includes(month)} onChange={event => onChange(event.target.checked
                      ? [...selected, month].sort() : selected.filter(item => item !== month))} />
                  {label(month, true)}
                </label>
              ))}
            </div>
            <div className="iop-month-actions">
              <Button variant="secondary" disabled={selected.length === choices.length}
                onClick={() => onChange([...choices].sort())}>{t("Select all months")}</Button>
              <Button variant="secondary" disabled={!selected.length}
                onClick={() => onChange([])}>{t("Clear month selection")}</Button>
              <Button onClick={close}>{t("Done")}</Button>
            </div>
          </>}
        </Popover>
      )}
    </fieldset>
  );
}
