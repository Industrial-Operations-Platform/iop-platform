import { Input } from "./Controls";

/** Checkboxes allow nonconsecutive months without modifier keys. */
export function MonthMultiPicker({
  value,
  months,
  onChange,
}: {
  value: string[];
  months: string[];
  onChange: (months: string[]) => void;
}) {
  return (
    <fieldset className="iop-month-picker">
      <legend>Months to compare</legend>
      <div className="iop-month-choices">
        {[...new Set([...months, ...value])]
          .sort()
          .reverse()
          .map((month) => (
            <label key={month}>
              <Input
                type="checkbox"
                checked={value.includes(month)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...value, month].sort()
                      : value.filter((item) => item !== month),
                  )
                }
              />
              {new Intl.DateTimeFormat("en-GB", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(month + "-01T00:00:00Z"))}
            </label>
          ))}
      </div>
    </fieldset>
  );
}
