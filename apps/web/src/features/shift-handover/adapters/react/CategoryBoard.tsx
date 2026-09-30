import { t } from "../../../../localization/i18n";
import { Button, CollectionAction, Panel } from "../../../../design/components";
import type { Choice, Page } from "../../domain/models";
import { EntrySummaryCards } from "./EntrySummaryCards";
export function CategoryBoard({
  sections,
  add,
  open,
  history,
}: {
  sections: { category: Choice; page: Page }[];
  add: (categoryId: string) => void;
  open: (id: string) => void;
  history: (categoryId: string) => void;
}) {
  return (
    <div className="handover-board">
      {sections.map(({ category, page }) => (
        <Panel key={category.id} aria-label={t(category.label)}>
          <div className="handover-section-heading">
            <h2>{t(category.label)}</h2>
            <Button
              variant="secondary"
              className="handover-add"
              aria-label={t("Add {0} entry", [t(category.label)])}
              onClick={() => add(category.id)}
            >
              +
            </Button>
          </div>
          <EntrySummaryCards entries={page.entries.slice(0, 3)} open={open} />
          {!page.total && (
            <p className="handover-muted">
              {t("No updates yet. Share what the next team should know. ")}
            </p>
          )}
          <CollectionAction
            count={page.total}
            onClick={() => history(category.id)}
          >
            {t("View history ")}
          </CollectionAction>
        </Panel>
      ))}
    </div>
  );
}
