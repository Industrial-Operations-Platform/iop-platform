import { t } from "../../../../localization/i18n";
import { useState, type ReactNode } from "react";
import { EntryDetailBody } from "./EntryDetailBody";
import { AddButton, Badge, Button, Dialog, Panel } from "../../../../design/components";
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
  openIssueTotal,
  onPeople,
  peopleContent,
}: {
  sections: { category: Choice; page: Page }[];
  open: (id: string) => void;
  more: (categoryId: string) => Promise<void>;
  busy: boolean;
  outstanding?: boolean;
  add?: (category: Choice) => void;
  openIssueTotal?: number;
  onPeople?: () => void;
  peopleContent?: ReactNode;
  canAdd?: (category: Choice) => boolean;
}) {
  const [expanded, setExpanded] = useState<string>();
  const expandedSection = sections.find((section) => section.category.id === expanded);
  return (
    <>
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
          className={`handover-meeting-section${page.total >= (category.workflow === "information" ? 2 : 4) ? " handover-meeting-section--wide" : ""}`}
        >
          <div className="handover-section-heading">
            <h3 className="handover-meeting-title">
              {(category.workflow === "information" || (category.workflow === "people" && peopleContent)) ? <Button variant="text" onClick={() => setExpanded(category.id)}>{t(category.label)}</Button> : t(category.label)} <Badge>{page.total}</Badge>
            </h3>
            {add && (!canAdd || canAdd(category)) && <AddButton label={t("Add {0} update", [t(category.label)])} disabled={busy} onClick={() => add(category)} />}
          </div>
          {category.workflow === "technical-blocked" && !outstanding && <p className="handover-muted">
            {t("Blocked plants · corrective maintenance")}{openIssueTotal !== undefined && ` · ${t("{0} current open issues", [openIssueTotal])}`}
          </p>}
          {category.workflow === "people" && onPeople && <Button variant="text" onClick={onPeople}>{t("Workforce & shifts")}</Button>}
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
    {expandedSection && <Dialog title={t(expandedSection.category.label)} onClose={() => setExpanded(undefined)}>
      {expandedSection.category.workflow === "people" && peopleContent}
      {expandedSection.page.entries.map((entry) => <Panel key={entry.id}>
        <Button variant="text" onClick={() => { setExpanded(undefined); open(entry.id); }}>{entry.content.summary}</Button>
        <EntryDetailBody entry={entry} />
      </Panel>)}
      {!expandedSection.page.total && expandedSection.category.workflow === "information" && <p>{t("No active information.")}</p>}
      {expandedSection.page.nextCursor && <Button variant="text" disabled={busy} onClick={() => void more(expandedSection.category.id)}>{t("More information")}</Button>}
    </Dialog>}
    </>
  );
}
