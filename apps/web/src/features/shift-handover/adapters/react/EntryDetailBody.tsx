import { Badge } from "../../../../design/components";
import type { Entry } from "../../domain/models";
import { issueLabel, issueTone } from "./entry-labels";

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
          {entry.departmentLabel || "Site-wide information"}
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
              Reported {c.condition.replaceAll("-", " ")}
            </Badge>
          )}
          <span>{entry.categoryLabel}</span>
          {entry.highlighted && <Badge>Highlighted</Badge>}
          {c.discuss && <Badge>Discuss in meeting</Badge>}
        </div>
        {c.equipmentCode && (
          <p className="handover-detail-reference">
            <span className="handover-card-equipment">{c.equipmentCode}</span>
            <span className="handover-muted">Unverified reference</span>
          </p>
        )}
      </div>
      <div className="handover-detail-layout">
        <div className="handover-detail-description">
          <h3>Description</h3>
          <p className="handover-prose">
            {c.details || "No additional details."}
          </p>
          {followUp.length > 0 && (
            <dl className="handover-detail-follow-up">
              {followUp.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="handover-prose">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <dl className="handover-detail-facts">
          {(entry.responsibleName || entry.issueState !== "none") && (
            <div>
              <dt>Responsible</dt>
              <dd>{entry.responsibleName || "Unassigned"}</dd>
            </div>
          )}
          <div>
            <dt>Entry date</dt>
            <dd>
              <time dateTime={c.date}>{c.date}</time>
            </dd>
          </div>
          <div>
            <dt>Reported by</dt>
            <dd>{entry.authorName}</dd>
          </div>
          {c.externalReference && (
            <div>
              <dt>External work reference</dt>
              <dd>{c.externalReference}</dd>
            </div>
          )}
          {c.dueDate && (
            <div className="handover-detail-dates">
              <dt>Due date</dt>
              <dd>
                <time dateTime={c.dueDate}>{c.dueDate}</time>
              </dd>
            </div>
          )}
          {c.feedbackDueDate && (
            <div className="handover-detail-dates">
              <dt>Feedback due</dt>
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
