import { t } from "../../../../localization/i18n";
import type { ReactNode } from "react";
import { SectionHeading } from "../../../../design/components";
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
    <SectionHeading
      section="Shift Handover"
      view={viewLabel}
      onHome={onHome}
      onBack={onBack}
      description={t("What happened. What needs attention. What comes next.")}
      actions={actions}
    />
  );
}
