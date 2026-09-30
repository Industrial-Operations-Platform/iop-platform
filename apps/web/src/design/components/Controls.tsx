import { t } from "../../localization/i18n";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "./Surfaces";

export function RefreshButton({
  busy,
  label = "Refresh",
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  busy: boolean;
  label?: string;
}) {
  return (
    <Button
      {...props}
      variant="secondary"
      className={`iop-refresh ${className}`}
      disabled={busy || props.disabled}
      aria-label={t(label)}
      title={t(label)}
      aria-busy={busy}
    >
      <svg
        className={busy ? "iop-refresh-spinning" : ""}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 17.9 17" />
      </svg>
    </Button>
  );
}

export function CollectionAction({
  children,
  count,
  className = "",
  ...props
}: ComponentProps<"button"> & { count: number }) {
  return (
    <Button
      {...props}
      variant="secondary"
      className={`iop-collection-action ${className}`}
    >
      <span>{children}</span>
      <Badge>{count}</Badge>
      <span aria-hidden="true">→</span>
    </Button>
  );
}

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
