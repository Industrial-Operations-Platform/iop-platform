import {
  Button,
  Panel,
  Table,
  TableViewport,
} from "../../../../design/components";
import type { Entry } from "../../domain/models";
export const issueLabel = (state: Entry["issueState"]) =>
  ({
    none: "Information",
    open: "Open",
    "in-progress": "In progress",
    resolved: "Resolved",
  })[state];
export function EntryBody({ entry }: { entry: Entry }) {
  const c = entry.content;
  return (
    <div className="handover-body">
      <p className="handover-meta">
        {entry.categoryLabel} · {c.date} · {entry.authorName} ·{" "}
        {issueLabel(entry.issueState)}
        {entry.highlighted ? " · Highlighted" : ""}
        {c.discuss ? " · Discuss in meeting" : ""}
      </p>
      <p>
        {entry.departmentLabel || "Site-wide"}
        {entry.areaLabel ? ` / ${entry.areaLabel}` : ""}
        {c.equipmentCode ? ` / ${c.equipmentCode} · Unverified reference` : ""}
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
            (entry.issueState !== "none" ? "Unassigned" : ""),
          "Due date": c.dueDate,
          "Feedback due": c.feedbackDueDate,
        })
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
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
}: {
  entries: Entry[];
  open: (id: string) => void;
}) {
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
    <TableViewport>
      <Table>
        <caption>Department handover matrix</caption>
        <thead>
          <tr>
            {[
              "Date",
              "What?",
              "Details",
              externalLabel,
              "Due date",
              "Responsible person",
              "Status",
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
              <td>{e.content.date}</td>
              <th scope="row">
                <Button variant="text" onClick={() => open(e.id)}>
                  {e.content.summary}
                </Button>
                <small>
                  {e.departmentLabel || "Site-wide"} · {e.categoryLabel}
                </small>
              </th>
              <td>{e.content.details || "—"}</td>
              <td>{e.content.externalReference || "—"}</td>
              <td>{e.content.dueDate || "—"}</td>
              <td>{e.responsibleName || "Unassigned"}</td>
              <td>{issueLabel(e.issueState)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableViewport>
  );
}

export function MeetingEntries({
  entries,
  categories,
  open,
}: {
  entries: Entry[];
  categories: { id: string; label: string }[];
  open: (id: string) => void;
}) {
  const categoryIds = [
    ...new Set([
      ...categories.map((c) => c.id),
      ...entries.map((e) => e.content.categoryId),
    ]),
  ];
  return (
    <>
      {categoryIds.map((categoryId) => {
        const group = entries.filter(
          (entry) => entry.content.categoryId === categoryId,
        );
        if (!group.length) return null;
        const departments = [
          ...new Set(group.map((entry) => entry.content.departmentId)),
        ];
        return (
          <section key={categoryId}>
            <h2>
              {categories.find((c) => c.id === categoryId)?.label ??
                group[0].categoryLabel}
            </h2>
            {departments.map((departmentId) => {
              const updates = group.filter(
                (entry) => entry.content.departmentId === departmentId,
              );
              return (
                <section key={departmentId}>
                  <h3>
                    {updates[0].departmentLabel || "Site-wide information"}
                  </h3>
                  <EntryCards entries={updates} open={open} />
                </section>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
