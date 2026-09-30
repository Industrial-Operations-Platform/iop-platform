import { t } from "../../../../localization/i18n";
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
      aria-label={t("Operational handover updates")}
    >
      <div className="handover-section-heading">
        <div>
          <h2>{t("Your department at a glance")}</h2>
          <p>{t("Open work and important updates for the next team.")}</p>
        </div>
        <RefreshButton
          label={t("Refresh updates")}
          busy={loading}
          onClick={() => setRefresh((n) => n + 1)}
        />
      </div>
      {context && (
        <Field className="handover-department-filter">
          <span>{t("Department / Halle")}</span>
          <Select
            aria-label={t("Start department")}
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">{t("All departments")}</option>
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
        <p role="status">{t("Loading operational updates…")}</p>
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          <ViewNavigation
            placement="tabs"
            label={t("Operational updates")}
            selected={view}
            onSelect={setView}
            items={[
              {
                id: "attention",
                label: t("Needs attention"),
                count: attention.total,
              },
              {
                id: "pending",
                label: t("Open reports"),
                count: pending.total,
              },
              {
                id: "highlights",
                label: t("Shift Handover"),
                count: highlights.total,
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
                  ? t("Site-wide highlights")
                  : departmentId
                    ? t("Selected department")
                    : t("All departments")}
                {selected.total > 0 &&
                  t(" · Showing {0} of {1}", [
                    Math.min(selected.entries.length, 3),
                    selected.total,
                  ])}
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
                  ? t("View all highlights")
                  : view === "pending"
                    ? t("View all open issues")
                    : t("View all attention items")}
              </CollectionAction>
            )}
          </section>
        </>
      )}
      <Actions>
        <Button variant="secondary" onClick={() => open()}>
          {t("Open Shift Handover ")}
        </Button>
      </Actions>
    </Panel>
  );
}
