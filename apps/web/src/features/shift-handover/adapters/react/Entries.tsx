import { t } from "../../../../localization/i18n";
import {
  Badge,
  Button,
  Panel,
  Table,
  TableViewport,
} from "../../../../design/components";
import { EntrySummaryCards } from "./EntrySummaryCards";
import type { Entry } from "../../domain/models";
import { issueLabel, issueTone } from "./entry-labels";
export function EntryBody({ entry }: { entry: Entry }) {
  const c = entry.content;
  return (
    <div className="handover-body">
      <p className="handover-meta">
        {entry.categoryLabel} · {c.date} · {entry.authorName} ·{" "}
        {issueLabel(entry.issueState)}
        {entry.highlighted ? t(" · Highlighted") : ""}
        {c.discuss ? t(" · Discuss in meeting") : ""}
      </p>
      <p>
        {entry.departmentLabel || t("Site-wide")}
        {entry.areaLabel ? ` / ${entry.areaLabel}` : ""}
        {c.equipmentCode
          ? t(" / {0} · Unverified reference", [c.equipmentCode])
          : ""}
      </p>
      {c.details && <p className="handover-prose">{c.details}</p>}
      <dl className="handover-facts">
        {Object.entries({
          "Reported condition": c.condition,
          "External work reference": c.externalReference,
          Challenge: c.challenge,
          Cause: c.cause,
          Measure: c.measure,
          Responsible:
            entry.responsibleName ||
            (entry.issueState !== "none" ? t("Unassigned") : ""),
          "Due date": c.dueDate,
          "Feedback due": c.feedbackDueDate,
        })
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={t(label)}>
              <dt>{t(label)}</dt>
              <dd className="handover-prose">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
export function EntryCards({
  entries,
  open,
  compact = false,
}: {
  entries: Entry[];
  compact?: boolean;
  open: (id: string) => void;
}) {
  if (compact)
    return <EntrySummaryCards entries={entries} open={open} expanded />;
  return (
    <div className="handover-list">
      {entries.map((entry) => (
        <Panel key={entry.id}>
          <h3>
            <Button variant="text" onClick={() => open(entry.id)}>
              {entry.content.summary}
            </Button>
          </h3>
          <EntryBody entry={entry} />
        </Panel>
      ))}
    </div>
  );
}
export function EntryMatrix({
  entries,
  externalLabel,
  open,
}: {
  entries: Entry[];
  externalLabel: string;
  open: (id: string) => void;
}) {
  return (
    <TableViewport
      className="handover-matrix-surface"
      tabIndex={0}
      role="region"
      aria-label={t("Scrollable department matrix")}
    >
      <Table className="handover-matrix">
        <colgroup>
          <col className="handover-matrix-date" />
          <col className="handover-matrix-summary" />
          <col className="handover-matrix-details" />
          <col className="handover-matrix-reference" />
          <col className="handover-matrix-date" />
          <col className="handover-matrix-person" />
          <col className="handover-matrix-status" />
        </colgroup>
        <caption>{t("Department handover matrix")}</caption>
        <thead>
          <tr>
            {[
              t("Date"),
              t("What?"),
              t("Details"),
              externalLabel,
              t("Due date"),
              t("Responsible person"),
              t("Status"),
            ].map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>
                <time dateTime={e.content.date}>{e.content.date}</time>
              </td>
              <th scope="row">
                <Button variant="text" onClick={() => open(e.id)}>
                  {e.content.summary}
                </Button>
                <small>
                  {e.departmentLabel || t("Site-wide")}
                  {e.areaLabel && ` · ${e.areaLabel}`}
                </small>
                <Badge>{e.categoryLabel}</Badge>
              </th>
              <td>
                <p className="handover-matrix-excerpt">
                  {e.content.details || t("No additional details.")}
                </p>
              </td>
              <td>
                <span className="handover-matrix-reference-value">
                  {e.content.externalReference || "—"}
                </span>
              </td>
              <td>
                {e.content.dueDate ? (
                  <time dateTime={e.content.dueDate}>{e.content.dueDate}</time>
                ) : (
                  "—"
                )}
              </td>
              <td>{e.responsibleName || t("Unassigned")}</td>
              <td>
                <Badge tone={issueTone(e.issueState)}>
                  {issueLabel(e.issueState)}
                </Badge>
                {e.content.condition === "blocked" && (
                  <Badge tone="attention">{t("Reported blocked")}</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableViewport>
  );
}
