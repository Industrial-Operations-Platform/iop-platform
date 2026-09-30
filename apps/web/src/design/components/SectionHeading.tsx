import type { ReactNode } from "react";
import { t } from "../../localization/i18n";
import { Button } from "./Controls";
import { PageHeading } from "./Layout";

/** Title-first navigation shared by operational sections and their detail pages. */
export function SectionHeading({
  section,
  view,
  onHome,
  onBack,
  description,
  actions,
}: {
  section: string;
  view: string;
  onHome: () => void;
  onBack?: () => void;
  description?: ReactNode;
  actions?: ReactNode;
}) {
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
            {onBack ? (
              <>
                <Button
                  variant="text"
                  className="iop-breadcrumb-link"
                  onClick={onBack}
                >
                  {t(view)}
                </Button>
                <span aria-hidden="true" className="iop-breadcrumb-separator">
                  /
                </span>
                <span aria-current="page">{t("Details")}</span>
              </>
            ) : (
              <span aria-current="page">{t(view)}</span>
            )}
          </span>
        }
        description={description}
        actions={actions}
      />
    </nav>
  );
}
