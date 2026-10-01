import type { ComponentProps } from "react";
import { Field, Input } from "./Controls";

/** Labelled calendar-day selection with native editing and picker semantics. */
export function DateField({
  label,
  variant = "surface",
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
  variant?: "surface" | "form";
}) {
  return (
    <Field className={`iop-date-field iop-date-field--${variant} ${className}`}>
      <span>{label}</span>
      <Input {...props} type="date" />
    </Field>
  );
}
