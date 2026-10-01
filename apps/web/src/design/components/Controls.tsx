import { t } from "../../localization/i18n";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "./Surfaces";

/** Neutral, equally sized actions for compact toolbars. */
export function IconButton({
  label,
  className = "",
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <Button
      {...props}
      variant="secondary"
      className={`iop-icon-button iop-toolbar-icon ${className}`}
      aria-label={label}
      title={label}
    />
  );
}

export function AddButton({
  label,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { label: string }) {
  return (
    <IconButton {...props} label={label}>
      <svg
        className="iop-toolbar-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </IconButton>
  );
}

export function FilterButton({
  label,
  active = false,
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      {...props}
      variant="text"
      className={`iop-icon-button iop-filter-button ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
      </svg>
    </Button>
  );
}

export function EditButton({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "children"> & { label: string }) {
  return (
    <Button
      {...props}
      variant="secondary"
      className={`iop-icon-button ${className}`}
      aria-label={label}
      title={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m16 3 5 5M4 15l-1 6 6-1L21 8a2 2 0 0 0-5-5Z" />
      </svg>
    </Button>
  );
}

export function DeleteButton({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"button">, "children"> & { label: string }) {
  return (
    <Button
      {...props}
      variant="danger"
      className={`iop-icon-button ${className}`}
      aria-label={label}
      title={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </svg>
    </Button>
  );
}

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
    <IconButton
      {...props}
      label={t(label)}
      className={`iop-refresh ${className}`}
      disabled={busy || props.disabled}
      aria-busy={busy}
    >
      <svg
        className={`iop-toolbar-glyph ${busy ? "iop-refresh-spinning" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 4v6h-6" />
        <path d="M20 10a8 8 0 1 0-1.8 7.2" />
      </svg>
    </IconButton>
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
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "text" | "danger";
}) {
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
