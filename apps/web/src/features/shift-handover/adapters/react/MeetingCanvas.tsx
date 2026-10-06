import { t } from "../../../../localization/i18n";
import { AddButton, Button, Panel } from "../../../../design/components";
import type { Choice, Page } from "../../domain/models";
import { EntrySummaryCards } from "./EntrySummaryCards";

export function MeetingCanvas({
  sections,
  open,
  more,
  busy,
  outstanding = false,
  add,
  canAdd,
}: {
  sections: { category: Choice; page: Page }[];
  open: (id: string) => void;
  more: (categoryId: string) => Promise<void>;
  busy: boolean;
  outstanding?: boolean;
  add?: (category: Choice) => void;
  canAdd?: (category: Choice) => boolean;
}) {
  return (
    <div
      className="handover-meeting-canvas"
      aria-label={t(
        outstanding ? "Outstanding department topics" : "Daily category canvas",
      )}
    >
      {sections.map(({ category, page }) => (
        <Panel
          key={category.id}
          aria-label={t(outstanding ? "Outstanding {0}" : "{0} section", [
            t(category.label),
          ])}
          className="handover-meeting-section"
        >
          <div className="handover-section-heading">
            <h3>{t(category.label)}</h3>
            <span>{page.total}</span>
            {add && (!canAdd || canAdd(category)) && <AddButton label={t("Add {0} update", [t(category.label)])} disabled={busy} onClick={() => add(category)} />}
          </div>
          <EntrySummaryCards entries={page.entries} open={open} />
          {!page.total && (
            <p className="handover-muted">
              {t(
                outstanding
                  ? "No unresolved issues."
                  : "No entries for this day.",
              )}
            </p>
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
