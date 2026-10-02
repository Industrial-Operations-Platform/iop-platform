import { t, locale } from "../../localization/i18n";
import type { ComponentProps, ReactNode } from "react";

export function Panel({
  variant = "content",
  className = "",
  ...props
}: ComponentProps<"section"> & {
  variant?: "content" | "chart" | "empty" | "metric";
}) {
  return (
    <section
      {...props}
      className={`iop-panel iop-panel--${variant} ${className}`}
    />
  );
}
export function Disclosure({
  summary,
  variant = "plain",
  className = "",
  children,
  ...props
}: ComponentProps<"details"> & {
  summary: ReactNode;
  variant?: "plain" | "panel" | "divided";
}) {
  return (
    <details
      {...props}
      className={`iop-disclosure iop-disclosure--${variant} ${className}`}
    >
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
export function Alert({
  className = "",
  children,
  ...props
}: ComponentProps<"p">) {
  return (
    <p role="alert" {...props} className={`iop-alert ${className}`}>
      {typeof children === "string" ? t(children) : children}
    </p>
  );
}
export function MetricGrid({
  layout = "default",
  className = "",
  ...props
}: ComponentProps<"div"> & { layout?: "default" | "paired" }) {
  return (
    <div
      {...props}
      className={`iop-metric-grid iop-metric-grid--${layout} ${className}`}
    />
  );
}
export function MetricCard({
  label,
  value,
  children,
  tone = "neutral",
  className = "",
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  label: ReactNode;
  value: ReactNode;
  tone?: "neutral" | "info" | "attention";
}) {
  return (
    <Panel
      {...props}
      variant="metric"
      className={`iop-metric--${tone} ${className}`}
    >
      <span className="iop-metric-label">
        {typeof label === "string" ? t(label) : label}
      </span>
      <strong className="iop-metric-value">{value}</strong>
      {children}
    </Panel>
  );
}

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "info" | "attention" | "success" | "warning";
}) {
  return (
    <span {...props} className={`iop-badge iop-badge--${tone} ${className}`} />
  );
}
/** Keep semantic table content with the caller, including captions and headers. */
export function Table({
  variant = "default",
  className = "",
  ...props
}: ComponentProps<"table"> & { variant?: "default" | "records" }) {
  return (
    <table
      {...props}
      className={`iop-table iop-table--${variant} ${className}`}
    />
  );
}
export function TableViewport({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      tabIndex={0}
      {...props}
      className={`iop-table-viewport ${className}`}
    />
  );
}
