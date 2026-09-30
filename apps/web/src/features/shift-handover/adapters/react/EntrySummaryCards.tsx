import { t } from "../../../../localization/i18n";
import { Badge, Button } from "../../../../design/components";
import { issueLabel, issueTone } from "./entry-labels";
import type { Entry } from "../../domain/models";

export function EntrySummaryCards({
  entries,
  open,
  expanded = false,
  personal = false,
}: {
  entries: Entry[];
  open: (id: string) => void;
  expanded?: boolean;
  personal?: boolean;
}) {
  return (
    <div
      className={`handover-summary-cards${personal ? " handover-personal-cards" : ""}`}
    >
      {entries.map((entry) => (
        <Button
          key={entry.id}
          variant="secondary"
          className="handover-summary-card"
          onClick={() => open(entry.id)}
        >
          <strong>{entry.content.summary}</strong>
          <span className="handover-card-location">
            {entry.departmentLabel || t("Site-wide information")}
            {expanded && entry.areaLabel && (
              <span className="handover-card-area"> · {entry.areaLabel}</span>
            )}
          </span>
          {expanded && (
            <>
              <span className="handover-card-tags">
                <Badge tone={issueTone(entry.issueState)}>
                  {issueLabel(entry.issueState)}
                </Badge>
                {entry.content.condition === "blocked" && (
                  <Badge tone="attention">{t("Reported blocked")}</Badge>
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
              {personal && (
                <span className="handover-card-tags">
                  <span>
                    {t("Entry date")}{" "}
                    <time dateTime={entry.content.date}>
                      {entry.content.date}
                    </time>
                  </span>
                  {entry.issueState !== "none" && (
                    <span>
                      {t("Responsible · ")}
                      {entry.responsibleName || t("Unassigned")}
                    </span>
                  )}
                </span>
              )}
              {(entry.content.dueDate || entry.content.feedbackDueDate) && (
                <span className="handover-card-dates">
                  {entry.content.dueDate && (
                    <span>
                      {t("Due")}{" "}
                      <time dateTime={entry.content.dueDate}>
                        {entry.content.dueDate}
                      </time>
                    </span>
                  )}
                  {entry.content.feedbackDueDate && (
                    <span>
                      {t("Feedback")}{" "}
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
