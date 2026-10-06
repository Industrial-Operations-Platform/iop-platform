import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  DepartmentScope,
  Panel,
  RefreshButton,
  CollectionAction,
  ViewNavigation,
  Disclosure,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type { Context, Page } from "../../domain/models";
import { EntryCards } from "./Entries";
import "./handover.css";
const blank: Page = { entries: [], total: 0, nextCursor: "" };
export function HandoverHighlights({
  application,
  departmentId,
  assignedDepartmentId,
  departmentReady = true,
  onDepartmentChange,
  open,
}: {
  application: HandoverApplication;
  departmentId: string;
  assignedDepartmentId?: string;
  departmentReady?: boolean;
  onDepartmentChange: (id: string) => void;
  open: (
    id?: string,
    collection?: "highlights" | "pending" | "attention",
    selectedDepartment?: string,
  ) => void;
}) {
  const [otherDepartments, setOtherDepartments] = useState(false);
  const scopedDepartment = otherDepartments
    ? departmentId
    : (assignedDepartmentId ?? departmentId);
  const missingDepartment = !otherDepartments && assignedDepartmentId === "";
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
    if (!departmentReady) return;
    void Promise.all([
      application.context(),
      missingDepartment
        ? Promise.resolve(blank)
        : application.list({
            departmentId: scopedDepartment,
            state: "pending",
            excludeAttention: true,
          }),
      missingDepartment
        ? Promise.resolve(blank)
        : application.list({ departmentId: scopedDepartment, attention: true }),
      missingDepartment
        ? Promise.resolve(blank)
        : application.list({
            departmentId: scopedDepartment,
            highlights: true,
          }),
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
  }, [
    application,
    scopedDepartment,
    missingDepartment,
    departmentReady,
    refresh,
  ]);
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
        <>
          <p className="handover-muted">
            {context.locations.find((l) => l.id === scopedDepartment)?.label ||
              t(
                "No department assigned. Explore other departments to see updates.",
              )}
          </p>
          <Disclosure
            summary={t("Explore other departments")}
            onToggle={(event) => {
              setOtherDepartments(event.currentTarget.open);
              if (!event.currentTarget.open)
                onDepartmentChange(assignedDepartmentId ?? departmentId);
            }}
          >
            <DepartmentScope
              value={departmentId}
              onChange={onDepartmentChange}
              label="Browse departments"
              choices={context.locations.filter((l) => l.role === "department")}
            />
          </Disclosure>
        </>
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
                {scopedDepartment
                  ? context?.locations.find((l) => l.id === scopedDepartment)
                      ?.label || t("Selected department")
                  : t("All departments")}
                {selected.total > 0 &&
                  t(" · Showing {0} of {1}", [
                    Math.min(selected.entries.length, 3),
                    selected.total,
                  ])}
              </p>
            </div>
            <p className="handover-muted">
              {t(
                view === "attention"
                  ? "Blocking reports and overdue action or feedback."
                  : view === "pending"
                    ? "Other open reports. Urgent items appear in Needs attention."
                    : "Selected highlights for this department.",
              )}
            </p>
            <EntryCards
              compact
              entries={selected.entries.slice(0, 3)}
              open={(id) => open(id, undefined, scopedDepartment)}
            />
            {!selected.total && (
              <p className="handover-empty">{emptyMessage}</p>
            )}
            {selected.total > 0 && (
              <CollectionAction
                count={selected.total}
                onClick={() => open(undefined, view, scopedDepartment)}
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
        <Button
          variant="secondary"
          onClick={() => open(undefined, undefined, scopedDepartment)}
        >
          {t("Open Shift Handover ")}
        </Button>
      </Actions>
    </Panel>
  );
}
