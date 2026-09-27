import type { ReactNode } from "react";
import { MetricCard } from "./Surfaces";

/** Presentation only: the caller supplies comparison meaning and formatted values. */
export function ComparisonCard({
  label,
  value,
  state,
  comparison,
  children,
}: {
  label: ReactNode;
  value: ReactNode;
  state: "better" | "worse" | "equal" | "unavailable";
  comparison: ReactNode;
  children?: ReactNode;
}) {
  return (
    <MetricCard
      label={label}
      value={value}
      className="iop-comparison"
      data-state={state}
    >
      <p className="iop-comparison-result">{comparison}</p>
      {children}
    </MetricCard>
  );
}
