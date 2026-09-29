import type { ReactNode } from "react";
import { Button, PageHeading } from "../../../../design/components";

export function HandoverHeading({
  onHome,
  viewLabel,
  onBack,
  actions,
}: {
  onHome: () => void;
  viewLabel: string;
  onBack?: () => void;
  actions?: ReactNode;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <PageHeading
        eyebrow="Operations"
        title={
          <span className="handover-breadcrumb">
            <Button variant="text" className="handover-home" onClick={onHome}>
              Shift Handover
            </Button>
            <span aria-hidden="true" className="handover-breadcrumb-separator">
              /
            </span>
            {onBack ? (
              <>
                <Button
                  variant="text"
                  className="handover-home"
                  onClick={onBack}
                >
                  {viewLabel}
                </Button>
                <span
                  aria-hidden="true"
                  className="handover-breadcrumb-separator"
                >
                  /
                </span>
                <span aria-current="page">Details</span>
              </>
            ) : (
              <span aria-current="page">{viewLabel}</span>
            )}
          </span>
        }
        description="What happened. What needs attention. What comes next."
        actions={actions}
      />
    </nav>
  );
}
