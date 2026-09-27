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
export function Alert({ className = "", ...props }: ComponentProps<"p">) {
  return <p role="alert" {...props} className={`iop-alert ${className}`} />;
}
export function MetricGrid({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return <div {...props} className={`iop-metric-grid ${className}`} />;
}
export function MetricCard({
  label,
  value,
  children,
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <Panel {...props} variant="metric">
      <span className="iop-metric-label">{label}</span>
      <strong className="iop-metric-value">{value}</strong>
      {children}
    </Panel>
  );
}
/** Keep semantic table content with the caller, including captions and headers. */
export function Table({ className = "", ...props }: ComponentProps<"table">) {
  return <table {...props} className={`iop-table ${className}`} />;
}
export function TableViewport({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return <div {...props} className={`iop-table-viewport ${className}`} />;
}
