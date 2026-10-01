import type { ComponentProps } from "react";
import { Field, Input } from "./Controls";

/** Labelled calendar-day selection with native editing and picker semantics. */
export function DateField({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
}) {
  return (
    <Field
      layout="inline"
      className={`iop-context-field iop-date-field ${className}`}
    >
      <span>{label}</span>
      <Input {...props} type="date" />
    </Field>
  );
}
