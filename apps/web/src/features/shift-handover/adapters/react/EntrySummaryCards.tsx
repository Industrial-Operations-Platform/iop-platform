import { t } from "../../../../localization/i18n";
import { ActionIcon, Badge, Button } from "../../../../design/components";
import { issueLabel, issueTone } from "./entry-labels";
import type { Entry } from "../../domain/models";
import { CategoryBadge } from "./CategoryBadge";

export function EntrySummaryCards({
  entries,
  open,
  expanded = false,
  personal = false,
}: {
  entries: (Pick<
    Entry,
    | "id"
    | "departmentLabel"
    | "areaLabel"
    | "categoryLabel"
    | "issueState"
    | "responsibleName"
    | "latestUpdate"
  > & {
    content: Pick<
      Entry["content"],
      | "categoryId"
      | "summary"
      | "details"
      | "date"
      | "equipmentCode"
      | "dueDate"
      | "feedbackDueDate"
    > & { condition: string };
  })[];
  open: (id: string) => void;
  expanded?: boolean;
  personal?: boolean;
}) {
  return (
    <div
      className={`handover-summary-cards${expanded ? " handover-expanded-cards" : ""}${personal ? " handover-personal-cards" : ""}`}
    >
      {entries.map((entry) => (
        <Button
          key={entry.id}
          variant="secondary"
          className={`handover-summary-card${expanded ? " handover-summary-card--expanded" : ""}`}
          onClick={() => open(entry.id)}
        >
          {expanded && (
            <span className="handover-card-heading">
              <CategoryBadge entry={entry} />
              <ActionIcon name="arrow" />
            </span>
          )}
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
              {expanded && (
                <span className="handover-card-tags handover-card-personal-facts">
                  <span>
                    <span>{t("Entry date")}</span>
                    <time dateTime={entry.content.date}>
                      {entry.content.date}
                    </time>
                  </span>
                  {entry.issueState !== "none" && (
                    <span>
                      <span>{t("Responsible")}</span>
                      <strong>
                        {entry.responsibleName || t("Unassigned")}
                      </strong>
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
