import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Field,
  Panel,
  Select,
  RefreshButton,
  CollectionAction,
  ViewNavigation,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type { Context, Page } from "../../domain/models";
import { EntryCards } from "./Entries";
import "./handover.css";
const blank: Page = { entries: [], total: 0, nextCursor: "" };
export function HandoverHighlights({
  application,
  departmentId,
  onDepartmentChange,
  open,
}: {
  application: HandoverApplication;
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  open: (
    id?: string,
    collection?: "highlights" | "pending" | "attention",
  ) => void;
}) {
  const [view, setView] = useState<"attention" | "pending" | "highlights">(
    "attention",
  );
  const [context, setContext] = useState<Context | null>(null);
  const [pending, setPending] = useState(blank),
    [attention, setAttention] = useState(blank),
    [highlights, setHighlights] = useState(blank);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([
      application.context(),
      application.list({ departmentId, state: "pending" }),
      application.list({ departmentId, attention: true }),
      application.list({ highlights: true }),
    ])
      .then(([c, p, a, h]) => {
        if (active) {
          setContext(c);
          setPending(p);
          setAttention(a);
          setHighlights(h);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, departmentId, refresh]);
  const selected = { attention, pending, highlights }[view];
  const viewLabel = {
    attention: "Needs attention",
    pending: "Open reports",
    highlights: "Shift Handover",
  }[view];
  const emptyMessage = {
    attention: "No issues need attention for this selection.",
    pending: "No open issues have been reported for this selection.",
    highlights: "No active highlights.",
  }[view];
  return (
    <Panel
      className="handover-highlights"
      aria-label="Operational handover updates"
    >
      <div className="handover-section-heading">
        <div>
          <h2>Your department at a glance</h2>
          <p>Open work and important updates for the next team.</p>
        </div>
        <RefreshButton
          label="Refresh updates"
          busy={loading}
          onClick={() => setRefresh((n) => n + 1)}
        />
      </div>
      {context && (
        <Field className="handover-department-filter">
          <span>Department / Halle</span>
          <Select
            aria-label="Start department"
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All departments</option>
            {context.locations
              .filter((l) => l.role === "department")
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
          </Select>
        </Field>
      )}
      {loading ? (
        <p role="status">Loading operational updates…</p>
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          <ViewNavigation
            placement="summary"
            label="Operational updates"
            selected={view}
            onSelect={setView}
            items={[
              {
                id: "attention",
                label: "Needs attention",
                count: attention.total,
                description: "Blocked equipment or overdue action / feedback.",
              },
              {
                id: "pending",
                label: "Open reports",
                count: pending.total,
                description: "Open or in progress, ready for follow-up.",
              },
              {
                id: "highlights",
                label: "Shift Handover",
                count: highlights.total,
                description: "Selected updates for everyone at your site.",
              },
            ]}
          />
          <section
            className="handover-highlight-content"
            aria-label={viewLabel}
          >
            <div className="handover-section-heading">
              <h3>{viewLabel}</h3>
              <p className="handover-muted">
                {view === "highlights"
                  ? "Site-wide highlights"
                  : departmentId
                    ? "Selected department"
                    : "All departments"}
                {selected.total > 0 &&
                  ` · Showing ${Math.min(selected.entries.length, 3)} of ${selected.total}`}
              </p>
            </div>
            <EntryCards
              compact
              entries={selected.entries.slice(0, 3)}
              open={(id) => open(id)}
            />
            {!selected.total && (
              <p className="handover-empty">{emptyMessage}</p>
            )}
            {selected.total > 0 && (
              <CollectionAction
                count={selected.total}
                onClick={() => open(undefined, view)}
              >
                {view === "highlights"
                  ? "View all highlights"
                  : view === "pending"
                    ? "View all open issues"
                    : "View all attention items"}
              </CollectionAction>
            )}
          </section>
        </>
      )}
      <Actions>
        <Button variant="secondary" onClick={() => open()}>
          Open Shift Handover
        </Button>
      </Actions>
    </Panel>
  );
}
