import { t } from "../../../../localization/i18n";
import { Badge } from "../../../../design/components";
import type { Entry } from "../../domain/models";
import { issueLabel, issueTone } from "./entry-labels";
import { CategoryBadge } from "./CategoryBadge";

export function EntryDetailBody({ entry }: { entry: Entry }) {
  const c = entry.content;
  const followUp = Object.entries({
    Challenge: c.challenge,
    Cause: c.cause,
    Measure: c.measure,
  }).filter(([, value]) => value);
  return (
    <div className="handover-detail-body">
      <div className="handover-detail-context">
        <p className="handover-card-location">
          {entry.departmentLabel || t("Site-wide information")}
          {entry.areaLabel && (
            <span className="handover-card-area"> · {entry.areaLabel}</span>
          )}
        </p>
        <div className="handover-card-tags">
          <Badge tone={issueTone(entry.issueState)}>
            {issueLabel(entry.issueState)}
          </Badge>
          {c.condition && (
            <Badge tone={c.condition === "blocked" ? "attention" : "neutral"}>
              {t("Reported ")}
              {c.condition.replaceAll("-", " ")}
            </Badge>
          )}
          <CategoryBadge entry={entry} />
          {entry.highlighted && <Badge>{t("Highlighted")}</Badge>}
          {c.discuss && <Badge>{t("Discuss in meeting")}</Badge>}
        </div>
        {c.equipmentCode && (
          <p className="handover-detail-reference">
            <span className="handover-card-equipment">{c.equipmentCode}</span>
            <span className="handover-muted">{t("Unverified reference")}</span>
          </p>
        )}
      </div>
      <div className="handover-detail-layout">
        <div className="handover-detail-description">
          <h3>{t("Description")}</h3>
          <p className="handover-prose">
            {c.details || t("No additional details.")}
          </p>
          {followUp.length > 0 && (
            <dl className="handover-detail-follow-up">
              {followUp.map(([label, value]) => (
                <div key={t(label)}>
                  <dt>{t(label)}</dt>
                  <dd className="handover-prose">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <dl className="handover-detail-facts">
          {(entry.responsibleName || entry.issueState !== "none") && (
            <div>
              <dt>{t("Responsible")}</dt>
              <dd>{entry.responsibleName || t("Unassigned")}</dd>
            </div>
          )}
          <div>
            <dt>{t("Entry date")}</dt>
            <dd>
              <time dateTime={c.date}>{c.date}</time>
            </dd>
          </div>
          <div>
            <dt>{t("Reported by")}</dt>
            <dd>{entry.authorName}</dd>
          </div>
          {c.externalReference && (
            <div>
              <dt>{t("External work reference")}</dt>
              <dd>{c.externalReference}</dd>
            </div>
          )}
          {c.dueDate && (
            <div className="handover-detail-dates">
              <dt>{t("Due date")}</dt>
              <dd>
                <time dateTime={c.dueDate}>{c.dueDate}</time>
              </dd>
            </div>
          )}
          {c.feedbackDueDate && (
            <div className="handover-detail-dates">
              <dt>{t("Feedback due")}</dt>
              <dd>
                <time dateTime={c.feedbackDueDate}>{c.feedbackDueDate}</time>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
