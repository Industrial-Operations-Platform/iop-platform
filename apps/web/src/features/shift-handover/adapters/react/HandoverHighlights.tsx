import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Field,
  MetricCard,
  MetricGrid,
  Panel,
  Select,
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
  open: (id?: string, highlights?: boolean, pending?: boolean) => void;
}) {
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
  const urgentIds = new Set(attention.entries.slice(0, 3).map((e) => e.id));
  return (
    <Panel aria-label="Operational handover updates">
      <div className="handover-section-heading">
        <div>
          <h2>Your department at a glance</h2>
          <p>Open work and important updates for the next team.</p>
        </div>
        <Button
          variant="text"
          disabled={loading}
          onClick={() => setRefresh((n) => n + 1)}
        >
          Refresh updates
        </Button>
      </div>
      {context && (
        <Field>
          Department / Halle
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
          <MetricGrid>
            <MetricCard label="Open issues" value={pending.total} />
            <MetricCard label="Needs attention" value={attention.total}>
              <p>Blocked equipment or overdue action / feedback.</p>
            </MetricCard>
          </MetricGrid>
          {attention.total > 0 && (
            <section>
              <h3>Needs attention</h3>
              <EntryCards
                compact
                entries={attention.entries.slice(0, 3)}
                open={(id) => open(id)}
              />
            </section>
          )}
          <section>
            <h3>Open reports</h3>
            <EntryCards
              compact
              entries={pending.entries
                .filter((e) => !urgentIds.has(e.id))
                .slice(0, 3)}
              open={(id) => open(id)}
            />
            {!pending.total && (
              <p>No open issues have been reported for this selection.</p>
            )}
            <Button variant="text" onClick={() => open(undefined, false, true)}>
              View all open issues · {pending.total}
            </Button>
          </section>
          <section>
            <h3>Shift Handover · Highlights</h3>
            <EntryCards
              compact
              entries={highlights.entries.slice(0, 3)}
              open={(id) => open(id)}
            />
            {!highlights.total && <p>No active highlights.</p>}
            <Button variant="text" onClick={() => open(undefined, true)}>
              View all highlights · {highlights.total}
            </Button>
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
