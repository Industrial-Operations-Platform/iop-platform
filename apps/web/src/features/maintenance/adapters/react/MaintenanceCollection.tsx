import {
  Badge,
  Button,
  Panel,
  Table,
  TableText,
  TableViewport,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import {
  statuses,
  type Page,
  type MaintenanceRecord,
} from "../../domain/models";
import { statusLabel, statusTone } from "./labels";
function RecordCard({
  record,
  select,
}: {
  record: MaintenanceRecord;
  select: (record: MaintenanceRecord) => void;
}) {
  return (
    <button
      type="button"
      className="maintenance-card"
      onClick={() => select(record)}
    >
      <strong>{record.data.title}</strong>
      <span>
        {t(
          {
            corrective: "Corrective",
            preventive: "Preventive",
            inspection: "Inspection",
          }[record.data.category ?? "corrective"],
        )}
        {record.data.repairTarget ? ` · ${record.data.repairTarget}` : ""}
      </span>
      <span>
        {record.locationLabel || t("No location")} ·{" "}
        {record.assetName || t("No asset linked")}
      </span>
      {!!record.data.equipment?.length && (
        <span>
          {record.data.equipment.map((reference) => reference.code).join(", ")}
        </span>
      )}
      <span>
        <Badge>{record.priorityLabel}</Badge>{" "}
        {record.assigneeName || t("Unassigned")}
      </span>
      {record.data.dueDate && (
        <span>
          {t("Due date")}: {record.data.dueDate}
        </span>
      )}
    </button>
  );
}
export function MaintenanceCollection({
  page,
  board,
  select,
  selectedStatus = "",
}: {
  page: Page;
  board: boolean;
  select: (record: MaintenanceRecord) => void;
  selectedStatus?: string;
}) {
  if (board)
    return (
      <div
        className={`maintenance-board${selectedStatus ? " maintenance-board--focused" : ""}`}
        aria-label={t("Maintenance board")}
      >
        {statuses
          .filter((status) => !selectedStatus || status === selectedStatus)
          .map((status) => (
            <Panel key={status} className="maintenance-column">
              <h2>
                {statusLabel(status)}{" "}
                <Badge tone={statusTone(status)}>
                  {page.statusCounts[status]}
                </Badge>
              </h2>
              <div className="maintenance-cards">
                {page.records
                  .filter((record) => record.data.status === status)
                  .map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      select={select}
                    />
                  ))}
              </div>
              {!page.records.some(
                (record) => record.data.status === status,
              ) && (
                <p className="maintenance-muted">{t("No records shown.")}</p>
              )}
            </Panel>
          ))}
      </div>
    );
  return (
    <Panel>
      <h2>{t("Maintenance records")}</h2>
      <TableViewport>
        <Table aria-label={t("Maintenance records")} variant="records">
          <thead>
            <tr>
              {[
                "Title",
                "Status",
                "Priority",
                "Location",
                "Asset",
                "Responsible person",
                "Team",
                "Due date",
              ].map((label) => (
                <th key={label} scope="col">
                  {t(label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.records.map((record) => (
              <tr key={record.id}>
                <td>
                  <Button
                    variant="text"
                    className="maintenance-title"
                    onClick={() => select(record)}
                  >
                    <TableText>{record.data.title}</TableText>
                  </Button>
                </td>
                <td>
                  <Badge tone={statusTone(record.data.status)}>
                    {statusLabel(record.data.status)}
                  </Badge>
                </td>
                <td>{record.priorityLabel}</td>
                <td>{record.locationLabel || "—"}</td>
                <td>{record.assetName || "—"}</td>
                <td>{record.assigneeName || t("Unassigned")}</td>
                <td>{record.teamLabel || "—"}</td>
                <td>{record.data.dueDate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableViewport>
      {!page.records.length && (
        <p>{t("No maintenance matches these filters.")}</p>
      )}
    </Panel>
  );
}
