import { Button } from "../../../../design/components";
import type { Entry } from "../../domain/models";

export function EntrySummaryCards({
  entries,
  open,
}: {
  entries: Entry[];
  open: (id: string) => void;
}) {
  return (
    <div className="handover-summary-cards">
      {entries.map((entry) => (
        <Button
          key={entry.id}
          variant="secondary"
          className="handover-summary-card"
          onClick={() => open(entry.id)}
        >
          <strong>{entry.content.summary}</strong>
          <span>{entry.departmentLabel || "Site-wide information"}</span>
        </Button>
      ))}
    </div>
  );
}
