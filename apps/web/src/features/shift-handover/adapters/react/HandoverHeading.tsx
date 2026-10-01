import { t } from "../../../../localization/i18n";
import type { ReactNode } from "react";
import {
  SectionHeading,
  type BreadcrumbItem,
} from "../../../../design/components";
export function HandoverHeading({
  onHome,
  viewLabel,
  onBack,
  actions,
  trail,
}: {
  onHome: () => void;
  viewLabel: string;
  onBack?: () => void;
  actions?: ReactNode;
  trail?: BreadcrumbItem[];
}) {
  return (
    <SectionHeading
      section="Shift Handover"
      view={viewLabel}
      onHome={onHome}
      trail={trail}
      onBack={onBack}
      description={t("What happened. What needs attention. What comes next.")}
      actions={actions}
    />
  );
}
