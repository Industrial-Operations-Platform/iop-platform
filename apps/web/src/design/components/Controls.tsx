import type { ComponentProps, ReactNode } from "react";

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "text" }) {
  return (
    <button
      {...props}
      type={type}
      className={`iop-button iop-button--${variant} ${className}`}
    />
  );
}
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`iop-input ${className}`} />;
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`iop-select ${className}`} />;
}
/** Native label association works for text, file, checkbox and select controls. */
export function Field({
  layout = "stack",
  className = "",
  ...props
}: ComponentProps<"label"> & { layout?: "stack" | "inline" }) {
  return (
    <label
      {...props}
      className={`iop-field iop-field--${layout} ${className}`}
    />
  );
}
export function FieldRow({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`iop-field-row ${className}`} />;
}
export function FilterForm({
  className = "",
  ...props
}: ComponentProps<"form">) {
  return <form {...props} className={`iop-filter-form ${className}`} />;
}
export function Actions({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`iop-actions ${className}`}>{children}</div>;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={`iop-input iop-textarea ${className}`} />
  );
}
