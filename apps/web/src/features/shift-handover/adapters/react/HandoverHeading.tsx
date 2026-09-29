import type { ReactNode } from "react";
import { Button, PageHeading } from "../../../../design/components";

export function HandoverHeading({
  onHome,
  actions,
}: {
  onHome?: () => void;
  actions?: ReactNode;
}) {
  const heading = (
    <PageHeading
      eyebrow="Operations"
      title={
        onHome ? (
          <span className="handover-breadcrumb">
            <Button variant="text" className="handover-home" onClick={onHome}>
              Shift Handover
            </Button>
            <span aria-hidden="true" className="handover-breadcrumb-separator">
              /
            </span>
            <span aria-current="page">Details</span>
          </span>
        ) : (
          "Shift Handover"
        )
      }
      description="What happened. What needs attention. What comes next."
      actions={actions}
    />
  );
  return onHome ? <nav aria-label="Breadcrumb">{heading}</nav> : heading;
}
