import type { ReactNode } from "react";
import { MetricCard } from "./Surfaces";

/** Presentation only: the caller supplies comparison meaning and formatted values. */
export function ComparisonCard({
  label,
  value,
  state,
  comparison,
  children,
  compact = false,
  action,
  layout = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  state: "better" | "worse" | "equal" | "unavailable";
  comparison: ReactNode;
  children?: ReactNode;
  compact?: boolean;
  action?: ReactNode;
  layout?: "default" | "row";
}) {
  return (
    <MetricCard
      label={label}
      value={value}
      className={`iop-comparison iop-comparison--${layout} ${compact ? "iop-comparison--compact" : ""} ${action ? "iop-comparison--with-action" : ""}`}
      data-state={state}
    >
      {action && <div className="iop-comparison-action">{action}</div>}
      <p className="iop-comparison-result">{comparison}</p>
      {children}
    </MetricCard>
  );
}
