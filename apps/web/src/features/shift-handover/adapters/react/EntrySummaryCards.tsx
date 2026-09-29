import { Badge, Button } from "../../../../design/components";
import { issueLabel } from "./entry-labels";
import type { Entry } from "../../domain/models";

export function EntrySummaryCards({
  entries,
  open,
  expanded = false,
}: {
  entries: Entry[];
  open: (id: string) => void;
  expanded?: boolean;
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
          <span className="handover-card-location">
            {entry.departmentLabel || "Site-wide information"}
            {expanded && entry.areaLabel && (
              <span className="handover-card-area"> · {entry.areaLabel}</span>
            )}
          </span>
          {expanded && (
            <>
              <span className="handover-card-tags">
                <Badge
                  tone={
                    entry.issueState === "resolved"
                      ? "success"
                      : entry.issueState === "in-progress"
                        ? "info"
                        : "neutral"
                  }
                >
                  {issueLabel(entry.issueState)}
                </Badge>
                {entry.content.condition === "blocked" && (
                  <Badge tone="attention">Reported blocked</Badge>
                )}
                <span>{entry.categoryLabel}</span>
              </span>
              {entry.content.equipmentCode && (
                <span className="handover-card-equipment">
                  {entry.content.equipmentCode}
                </span>
              )}
              {(entry.latestUpdate?.note || entry.content.details) && (
                <span className="handover-excerpt">
                  {entry.latestUpdate?.note || entry.content.details}
                </span>
              )}
              {(entry.content.dueDate || entry.content.feedbackDueDate) && (
                <span className="handover-card-dates">
                  {entry.content.dueDate && (
                    <span>
                      Due{" "}
                      <time dateTime={entry.content.dueDate}>
                        {entry.content.dueDate}
                      </time>
                    </span>
                  )}
                  {entry.content.feedbackDueDate && (
                    <span>
                      Feedback{" "}
                      <time dateTime={entry.content.feedbackDueDate}>
                        {entry.content.feedbackDueDate}
                      </time>
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </Button>
      ))}
    </div>
  );
}
