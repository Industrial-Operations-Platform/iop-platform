import { Button, Panel } from "../../../../design/components";
import type { Choice, Entry, Page } from "../../domain/models";

export function MeetingCards({
  entries,
  open,
}: {
  entries: Entry[];
  open: (id: string) => void;
}) {
  return (
    <div className="handover-meeting-cards">
      {entries.map((entry) => (
        <Button
          key={entry.id}
          variant="secondary"
          className="handover-meeting-card"
          onClick={() => open(entry.id)}
        >
          <strong>{entry.content.summary}</strong>
          <span>{entry.departmentLabel || "Site-wide information"}</span>
        </Button>
      ))}
    </div>
  );
}

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
    <div className="handover-meeting-canvas" aria-label="Daily category canvas">
      {sections.map(({ category, page }) => (
        <Panel
          key={category.id}
          aria-label={`${category.label} section`}
          className="handover-meeting-section"
        >
          <div className="handover-section-heading">
            <h3>{category.label}</h3>
            <span>{page.total}</span>
          </div>
          <MeetingCards entries={page.entries} open={open} />
          {!page.total && (
            <p className="handover-muted">No entries for this day.</p>
          )}
          {page.nextCursor && (
            <Button
              variant="text"
              disabled={busy}
              onClick={() => void more(category.id)}
            >
              More {category.label} entries · {page.entries.length} of{" "}
              {page.total}
            </Button>
          )}
        </Panel>
      ))}
    </div>
  );
}
