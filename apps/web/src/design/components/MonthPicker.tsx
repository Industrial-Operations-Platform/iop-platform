import { Field, Input } from "./Controls";

export function MonthPicker({
  value,
  onChange,
  label = "Month",
}: {
  value: string;
  onChange: (month: string) => void;
  label?: string;
}) {
  return (
    <Field>
      {label}
      <Input
        type="month"
        value={value}
        required
        onChange={(event) => {
          if (/^\d{4}-\d{2}$/.test(event.target.value))
            onChange(event.target.value);
        }}
      />
    </Field>
  );
}
