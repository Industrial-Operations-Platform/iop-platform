import type { ReactNode } from "react";
import { t } from "../../localization/i18n";
import { Button } from "./Controls";
import { PageHeading } from "./Layout";

export interface BreadcrumbItem {
  label: string;
  onSelect?: () => void;
}

/** Title-first navigation shared by operational sections and their detail pages. */
export function SectionHeading({
  section,
  view,
  onHome,
  onBack,
  description,
  actions,
  trail,
}: {
  section: string;
  view: string;
  onHome: () => void;
  onBack?: () => void;
  description?: ReactNode;
  actions?: ReactNode;
  trail?: BreadcrumbItem[];
}) {
  const crumbs =
    trail ??
    (onBack
      ? [{ label: t(view), onSelect: onBack }, { label: t("Details") }]
      : [{ label: t(view) }]);
  return (
    <nav aria-label={t("Breadcrumb")}>
      <PageHeading
        title={
          <span className="iop-breadcrumb">
            <Button
              variant="text"
              className="iop-breadcrumb-link"
              onClick={onHome}
            >
              {t(section)}
            </Button>
            <span aria-hidden="true" className="iop-breadcrumb-separator">
              /
            </span>
            {crumbs.map((crumb, index) => (
              <span className="iop-breadcrumb-part" key={index}>
                {index > 0 && (
                  <span aria-hidden="true" className="iop-breadcrumb-separator">
                    /
                  </span>
                )}
                {crumb.onSelect ? (
                  <Button
                    variant="text"
                    className="iop-breadcrumb-link"
                    onClick={crumb.onSelect}
                  >
                    {crumb.label}
                  </Button>
                ) : (
                  <span
                    aria-current={
                      index === crumbs.length - 1 ? "page" : undefined
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </span>
        }
        description={description}
        actions={actions}
      />
    </nav>
  );
}
