import { Button, Panel } from "../../../../design/components";
import type { Choice, Page } from "../../domain/models";
import { issueLabel } from "./Entries";
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
        <Panel key={category.id} aria-label={category.label}>
          <div className="handover-section-heading">
            <h2>{category.label}</h2>
            <Button
              variant="secondary"
              className="handover-add"
              aria-label={`Add ${category.label} entry`}
              onClick={() => add(category.id)}
            >
              +
            </Button>
          </div>
          {page.entries.slice(0, 3).map((entry) => (
            <article className="handover-preview" key={entry.id}>
              <Button variant="text" onClick={() => open(entry.id)}>
                {entry.content.summary}
              </Button>
              <p>
                {entry.areaLabel || entry.departmentLabel || "Site-wide"} ·{" "}
                {entry.content.date}
              </p>
              <p>
                {entry.authorName} · {issueLabel(entry.issueState)}
              </p>
            </article>
          ))}
          {!page.total && (
            <p className="handover-muted">
              No updates yet. Share what the next team should know.
            </p>
          )}
          <Button variant="text" onClick={() => history(category.id)}>
            View history · {page.total}
          </Button>
        </Panel>
      ))}
    </div>
  );
}
