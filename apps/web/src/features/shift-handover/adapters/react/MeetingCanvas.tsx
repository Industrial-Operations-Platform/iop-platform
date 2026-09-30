import { t } from "../../../../localization/i18n";
import { Button, Panel } from "../../../../design/components";
import type { Choice, Page } from "../../domain/models";
import { EntrySummaryCards } from "./EntrySummaryCards";

export function MeetingCanvas({
  sections,
  open,
  more,
  busy,
}: {
  sections: { category: Choice; page: Page }[];
  open: (id: string) => void;
  more: (categoryId: string) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div
      className="handover-meeting-canvas"
      aria-label={t("Daily category canvas")}
    >
      {sections.map(({ category, page }) => (
        <Panel
          key={category.id}
          aria-label={t("{0} section", [t(category.label)])}
          className="handover-meeting-section"
        >
          <div className="handover-section-heading">
            <h3>{t(category.label)}</h3>
            <span>{page.total}</span>
          </div>
          <EntrySummaryCards entries={page.entries} open={open} />
          {!page.total && (
            <p className="handover-muted">{t("No entries for this day.")}</p>
          )}
          {page.nextCursor && (
            <Button
              variant="text"
              disabled={busy}
              onClick={() => void more(category.id)}
            >
              {t("More ")}
              {t(category.label)}
              {t(" entries · ")}
              {page.entries.length}
              {t(" of")} {page.total}
            </Button>
          )}
        </Panel>
      ))}
    </div>
  );
}
