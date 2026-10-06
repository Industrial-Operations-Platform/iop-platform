import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Badge,
  Button,
  Panel,
  RefreshButton,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import {
  assignmentsForPeriod,
  type MaintenanceApplication,
} from "../../application/maintenance";
import type { MaintenanceRecord } from "../../domain/models";
import { statusLabel, statusTone } from "./labels";
import "./maintenance.css";

export function MaintenanceAssignments({
  application,
  open,
  period,
  embedded = false,
}: {
  application: MaintenanceApplication;
  open: (id: string) => void;
  period?: { from: string; to: string; today: string };
  embedded?: boolean;
}) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true,
      fetching = false;
    const refresh = async () => {
      if (fetching || document.visibilityState === "hidden") return;
      fetching = true;
      if (active) setBusy(true);
      try {
        const value = await application.assignments();
        if (active) {
          setRecords(value.records);
          setError("");
        }
      } catch {
        if (active)
          setError("Your maintenance assignments are unavailable. Try again.");
      } finally {
        fetching = false;
        if (active) setBusy(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [application, version]);
  const visible = period ? assignmentsForPeriod(records, period) : records;
  const Container = embedded ? "section" : Panel;
  return (
    <Container
      className="maintenance-assignments"
      aria-label={t("Your maintenance assignments")}
    >
      <div className="maintenance-collection-heading">
        <h2>
          {t("Your maintenance assignments")} <Badge>{visible.length}</Badge>
        </h2>
        <RefreshButton
          label={t("Refresh maintenance assignments")}
          busy={busy}
          onClick={() => setVersion((value) => value + 1)}
        />
      </div>
      {period && (
        <p className="maintenance-muted">
          {t("Due in this period, plus overdue work and work without a due date.")}
        </p>
      )}
      {error && <Alert>{t(error)}</Alert>}
      <div className="maintenance-assignment-cards">
        {visible.slice(0, 4).map((record) => (
          <Button
            key={record.id}
            variant="secondary"
            className="maintenance-card maintenance-assignment-card"
            onClick={() => open(record.id)}
          >
            <strong>{record.data.title}</strong>
            <span className="maintenance-assignment-context">
              {[record.locationLabel, record.data.repairTarget || record.assetName]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="maintenance-assignment-metadata">
              <Badge tone={statusTone(record.data.status)}>
                {statusLabel(record.data.status)}
              </Badge>
              <span>
                {t("Priority")}: {record.priorityLabel}
              </span>
              <span className="maintenance-assignment-due">
                {record.data.dueDate ? (
                  <>
                    {t("Due date")}: <time dateTime={record.data.dueDate}>{record.data.dueDate}</time>
                  </>
                ) : t("No due date")}
              </span>
            </span>
          </Button>
        ))}
      </div>
      {!visible.length && (
        <p>
          {t(
            busy
              ? "Loading maintenance assignments…"
              : records.length
                ? "No maintenance is due in this period."
                : "No unfinished maintenance is assigned to you.",
          )}
        </p>
      )}
      {visible.length > 4 && (
        <Actions>
          <Button variant="text" onClick={() => open("")}>
            {t("Open My work")}
          </Button>
        </Actions>
      )}
    </Container>
  );
}
