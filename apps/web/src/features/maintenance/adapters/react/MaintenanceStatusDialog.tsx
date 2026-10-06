import { useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Dialog,
  Field,
  Input,
  Textarea,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { MaintenanceApplication } from "../../application/maintenance";
import { statusChange } from "../../application/maintenance";
import type { MaintenanceRecord, SaveInput, Status } from "../../domain/models";
import { RepairScope, type ReportPresentation } from "./RepairScope";
import { statusLabel } from "./labels";
export function MaintenanceStatusDialog({
  record,
  status,
  application,
  pending,
  save,
  cancel,
  renderReportCards,
  openReport,
  reportRefresh,
  suspended,
  error,
}: {
  record: MaintenanceRecord;
  status: Status;
  application: MaintenanceApplication;
  pending: boolean;
  save: (input: SaveInput) => Promise<void>;
  cancel: () => void;
  reportRefresh: number;
  suspended: boolean;
  error: string;
} & ReportPresentation) {
  const [outcome, setOutcome] = useState(record.data.outcome);
  const [reason, setReason] = useState("");
  const [links, setLinks] = useState(record.data.linkedEntries ?? []);
  const [reviewed, setReviewed] = useState(false);
  const [tasks, setTasks] = useState(false);
  const [place, setPlace] = useState(false);
  const done = status === "done";
  const valid =
    !done ||
    (reviewed &&
      tasks &&
      place &&
      !!outcome.trim() &&
      !!record.data.locationId);
  return (
    <Dialog
      title={
        done
          ? t("Complete maintenance")
          : t("Move to {0}", [statusLabel(status)])
      }
      onClose={cancel}
      busy={pending}
      suspended={suspended}
    >
      {error && <Alert>{t(error)}</Alert>}
      <form
        aria-label={t("Change maintenance status")}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !pending)
            void save(
              statusChange(record, status, {
                outcome,
                reason,
                linkedEntries: links,
              }),
            );
        }}
      >
        <fieldset disabled={pending} className="maintenance-fields">
          <h3>{record.data.title}</h3>
          <dl className="iop-detail-fields">
            <div>
              <dt>{t("Location")}</dt>
              <dd>{record.locationLabel || t("Not assigned")}</dd>
            </div>
            <div>
              <dt>{t("Repair target / manual zone")}</dt>
              <dd>{record.data.repairTarget || "—"}</dd>
            </div>
            <div>
              <dt>{t("Equipment identifiers (Betriebsmittelkennzeichen)")}</dt>
              <dd>
                {record.data.equipment?.map((r) => r.code).join(", ") || "—"}
              </dd>
            </div>
          </dl>
          {done ? (
            <>
              <Field>
                {t("Work outcome")}
                <Textarea
                  required
                  maxLength={4000}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </Field>
              <Field layout="inline">
                <Input
                  type="checkbox"
                  checked={tasks}
                  onChange={(e) => setTasks(e.target.checked)}
                />
                {t("All tasks in this maintenance are complete.")}
              </Field>
              <Field layout="inline">
                <Input
                  type="checkbox"
                  checked={place}
                  onChange={(e) => setPlace(e.target.checked)}
                />
                {t(
                  "I confirm the workplace and equipment shown above are correct.",
                )}
              </Field>
              <RepairScope
                application={application}
                locationId={record.data.locationId}
                equipment={record.data.equipment ?? []}
                links={links}
                change={setLinks}
                reviewReady={setReviewed}
                renderReportCards={renderReportCards}
                openReport={openReport}
                refreshToken={reportRefresh}
              />
            </>
          ) : (
            <Field>
              {t(
                status === "blocked"
                  ? "Blocked reason"
                  : "Reason for reopening",
              )}
              <Textarea
                required
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          )}
          <Actions className="iop-form-actions">
            <Button type="submit" disabled={pending || !valid}>
              {t(done ? "Mark as done" : "Save status")}
            </Button>
            <Button variant="secondary" onClick={cancel}>
              {t("Cancel")}
            </Button>
          </Actions>
        </fieldset>
      </form>
    </Dialog>
  );
}
