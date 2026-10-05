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
import type { MaintenanceApplication } from "../../application/maintenance";
import type { MaintenanceRecord } from "../../domain/models";
import { statusLabel, statusTone } from "./labels";
import "./maintenance.css";

export function MaintenanceAssignments({
  application,
  open,
}: {
  application: MaintenanceApplication;
  open: (id: string) => void;
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
  return (
    <Panel aria-label={t("Your maintenance assignments")}>
      <div className="maintenance-collection-heading">
        <h2>
          {t("Your maintenance assignments")} <Badge>{records.length}</Badge>
        </h2>
        <RefreshButton
          label={t("Refresh maintenance assignments")}
          busy={busy}
          onClick={() => setVersion((value) => value + 1)}
        />
      </div>
      {error && <Alert>{t(error)}</Alert>}
      <div className="maintenance-related-reports">
        {records.slice(0, 3).map((record) => (
          <Button
            key={record.id}
            variant="secondary"
            className="maintenance-card"
            onClick={() => open(record.id)}
          >
            <strong>{record.data.title}</strong>
            <span>
              {record.locationLabel} ·{" "}
              {record.data.repairTarget || record.assetName}
            </span>
            <span>
              <Badge tone={statusTone(record.data.status)}>
                {statusLabel(record.data.status)}
              </Badge>{" "}
              {record.priorityLabel}
            </span>
            {record.data.dueDate && (
              <span>
                {t("Due date")}: {record.data.dueDate}
              </span>
            )}
          </Button>
        ))}
      </div>
      {!records.length && (
        <p>
          {t(
            busy
              ? "Loading maintenance assignments…"
              : "No unfinished maintenance is assigned to you.",
          )}
        </p>
      )}
      {records.length > 3 && (
        <Actions>
          <Button variant="text" onClick={() => open("")}>
            {t("Open My work")}
          </Button>
        </Actions>
      )}
    </Panel>
  );
}
