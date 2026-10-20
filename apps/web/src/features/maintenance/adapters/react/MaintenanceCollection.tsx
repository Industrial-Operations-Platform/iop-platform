import { useRef, useState, type DragEvent } from "react";
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
  type Status,
} from "../../domain/models";
import { statusLabel, statusTone } from "./labels";
function RecordCard({
  record,
  select,
  draggable,
  dragging,
  startDrag,
  endDrag,
}: {
  record: MaintenanceRecord;
  select: (record: MaintenanceRecord) => void;
  draggable: boolean;
  dragging: boolean;
  startDrag: (event: DragEvent<HTMLButtonElement>) => void;
  endDrag: () => void;
}) {
  const suppressClick = useRef(false);
  return (
    <button
      type="button"
      className="maintenance-card"
      draggable={draggable}
      data-dragging={dragging || undefined}
      onDragStart={(event) => {
        suppressClick.current = true;
        startDrag(event);
      }}
      onDragEnd={() => {
        endDrag();
        window.setTimeout(() => { suppressClick.current = false; }, 0);
      }}
      onClick={() => {
        if (!suppressClick.current) select(record);
      }}
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
  canMove = () => false,
  move,
}: {
  page: Page;
  board: boolean;
  select: (record: MaintenanceRecord) => void;
  selectedStatus?: string;
  canMove?: (record: MaintenanceRecord) => boolean;
  move?: (record: MaintenanceRecord, status: Status) => void;
}) {
  const [dragged, setDragged] = useState<MaintenanceRecord>();
  const [over, setOver] = useState<Status>();
  const endDrag = () => {
    setDragged(undefined);
    setOver(undefined);
  };
  if (board)
    return (
      <div
        className={`maintenance-board${selectedStatus ? " maintenance-board--focused" : ""}`}
        aria-label={t("Maintenance board")}
      >
        {statuses
          .filter((status) => !selectedStatus || status === selectedStatus)
          .map((status) => (
            <Panel
              key={status}
              className="maintenance-column"
              aria-label={statusLabel(status)}
              data-drop-active={over === status || undefined}
              onDragOver={(event) => {
                if (!dragged || !canMove(dragged) || dragged.data.status === status) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOver(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(undefined);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged && canMove(dragged) && dragged.data.status !== status) move?.(dragged, status);
                endDrag();
              }}
            >
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
                      draggable={!!move && canMove(record)}
                      dragging={dragged?.id === record.id}
                      startDrag={(event) => {
                        if (!move || !canMove(record)) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", record.id);
                        setDragged(record);
                      }}
                      endDrag={endDrag}
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
                <th key={label} scope="col" data-align={["Status", "Priority", "Due date"].includes(label) ? "status" : "text"}>
                  {t(label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.records.map((record) => (
              <tr key={record.id}>
                <td data-align="text">
                  <Button
                    variant="text"
                    className="maintenance-title"
                    onClick={() => select(record)}
                  >
                    <TableText>{record.data.title}</TableText>
                  </Button>
                </td>
                <td data-align="status">
                  <Badge tone={statusTone(record.data.status)}>
                    {statusLabel(record.data.status)}
                  </Badge>
                </td>
                <td data-align="status">{record.priorityLabel}</td>
                <td data-align="text">{record.locationLabel || "—"}</td>
                <td data-align="text">{record.assetName || "—"}</td>
                <td data-align="text">{record.assigneeName || t("Unassigned")}</td>
                <td data-align="text">{record.teamLabel || "—"}</td>
                <td data-align="status">{record.data.dueDate || "—"}</td>
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
