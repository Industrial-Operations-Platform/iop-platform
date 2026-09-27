import { useId } from "react";
import { Field, Input } from "./Controls";

/** Shared editable value control with optional suggestions; matching belongs to the caller. */
export function ValueFilter({
  label,
  value,
  options = [],
  hint = "Type an exact value; up to 200 suggestions.",
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  options?: string[];
  hint?: string;
  inputMode?: "numeric" | "decimal";
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <Field className="iop-value-filter">
      {label}
      <Input
        aria-label={label + " filter"}
        aria-describedby={id + "-hint"}
        list={id}
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <small id={id + "-hint"}>{hint}</small>
    </Field>
  );
}
