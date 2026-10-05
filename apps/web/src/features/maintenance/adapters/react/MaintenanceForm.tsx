import { useState } from "react";
import {
  Actions,
  Button,
  DateField,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
  Textarea,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { MaintenanceApplication } from "../../application/maintenance";
import {
  emptyRecord,
  statuses,
  type Catalog,
  type MaintenanceRecord,
  type SaveInput,
} from "../../domain/models";
import { statusLabel } from "./labels";

export function MaintenanceForm({
  application,
  catalog,
  record,
  pending,
  save,
  cancel,
}: {
  application: MaintenanceApplication;
  catalog: Catalog;
  record?: MaintenanceRecord;
  pending: boolean;
  save: (input: SaveInput) => void;
  cancel: () => void;
}) {
  const [id] = useState(() => record?.id ?? application.newId());
  const [data, setData] = useState(
    () => record?.data ?? emptyRecord(catalog.settings.priorities[0]?.id),
  );
  const [reason, setReason] = useState("");
  const change = <K extends keyof typeof data>(
    key: K,
    value: (typeof data)[K],
  ) => setData((current) => ({ ...current, [key]: value }));
  const canReassign = record ? record.canReassign : catalog.canCoordinate;
  return (
    <Panel>
      <h2>{t(record ? "Edit maintenance" : "New maintenance")}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ id, expectedRevision: record?.revision ?? 0, data, reason });
        }}
      >
        <fieldset disabled={pending} className="maintenance-fields">
          <Field>
            {t("Title")}
            <Input
              required
              maxLength={160}
              value={data.title}
              onChange={(event) => change("title", event.target.value)}
            />
          </Field>
          <Field>
            {t("Work details")}
            <Textarea
              rows={5}
              maxLength={8000}
              value={data.details}
              onChange={(event) => change("details", event.target.value)}
            />
          </Field>
          <FieldRow>
            <Field>
              {t("Location")}
              <Select
                required
                value={data.locationId}
                onChange={(event) => change("locationId", event.target.value)}
              >
                <option value="">—</option>
                {catalog.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Asset")}
              <Select
                value={data.assetId}
                onChange={(event) => change("assetId", event.target.value)}
              >
                <option value="">{t("No asset linked")}</option>
                {catalog.assets
                  .filter(
                    (asset) =>
                      asset.status !== "retired" || asset.id === data.assetId,
                  )
                  .map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                      {asset.status === "unverified"
                        ? ` · ${t("Unverified")}`
                        : ""}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field>
              {t("Priority")}
              <Select
                required
                value={data.priorityId}
                onChange={(event) => change("priorityId", event.target.value)}
              >
                {catalog.settings.priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <FieldRow>
            <Field>
              {t("Responsible person")}
              <Select
                value={data.assigneeId}
                disabled={!canReassign}
                onChange={(event) => change("assigneeId", event.target.value)}
              >
                <option value="">{t("Unassigned")}</option>
                {catalog.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Team")}
              <Select
                value={data.teamId}
                disabled={!canReassign}
                onChange={(event) => change("teamId", event.target.value)}
              >
                <option value="">—</option>
                {catalog.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Status")}
              <Select
                value={data.status}
                disabled={!record}
                onChange={(event) =>
                  change("status", event.target.value as typeof data.status)
                }
              >
                {(record ? statuses : ["open" as const]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <DateField
              label={t("Due date")}
              value={data.dueDate}
              onChange={(event) => change("dueDate", event.target.value)}
            />
          </FieldRow>
          {data.status === "blocked" && (
            <Field>
              {t("Blocked reason")}
              <Textarea
                required
                rows={3}
                maxLength={2000}
                value={data.blockedReason}
                onChange={(event) =>
                  change("blockedReason", event.target.value)
                }
              />
            </Field>
          )}
          <Field>
            {t("Work outcome")}
            <Textarea
              required={data.status === "done"}
              rows={3}
              maxLength={4000}
              value={data.outcome}
              onChange={(event) => change("outcome", event.target.value)}
            />
          </Field>
          <Field>
            {t("External reference")}
            <Input
              maxLength={200}
              value={data.externalReference}
              onChange={(event) =>
                change("externalReference", event.target.value)
              }
            />
          </Field>
          {record && (
            <Field>
              {t("Change reason")}
              <Textarea
                required
                rows={2}
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
          )}
          <Actions className="iop-form-actions">
            <Button variant="secondary" onClick={cancel}>
              {t("Cancel")}
            </Button>
            <Button type="submit">{t("Save maintenance")}</Button>
          </Actions>
        </fieldset>
      </form>
    </Panel>
  );
}
