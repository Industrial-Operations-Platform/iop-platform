import {
  Badge,
  Button,
  Panel,
  Table,
  TableViewport,
} from "../../../../design/components";
import {
  entries,
  visibleTargets,
  visibleShifts,
  type Board,
  type RecordEntry,
} from "../../domain/models";
import { locale, t } from "../../../../localization/i18n";
import { dutyLabels, statusLabels } from "./labels";

function AssignmentSlot({
  records,
  select,
  showPhone = true,
}: {
  records: RecordEntry<"assignment">[];
  select: (record: RecordEntry) => void;
  showPhone?: boolean;
}) {
  return (
    <div className="workforce-slot">
      {records.map((record) => (
        <button
          type="button"
          className="workforce-person"
          key={record.id}
          onClick={() => select(record)}
        >
          <span>{record.personName}</span>
          {showPhone && record.data.phone && (
            <svg
              role="img"
              aria-label={t("Phone")}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>{t("Phone")}</title>
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
            </svg>
          )}
        </button>
      ))}
      {!records.length && <span className="workforce-empty">—</span>}
    </div>
  );
}

export function AssignmentCard({
  record,
  board,
  select,
  compact = false,
}: {
  record: RecordEntry<"assignment">;
  board: Board;
  select: (r: RecordEntry) => void;
  compact?: boolean;
}) {
  const a = record.data;
  return (
    <button
      type="button"
      className="workforce-assignment"
      onClick={() => select(record)}
    >
      <strong>{record.personName}</strong>
      <Badge>
        {board.settings.shifts.find((shift) => shift.id === a.shiftId)?.label ??
          a.shiftLabel ??
          a.shiftId}
      </Badge>
      {!compact && (
        <>
          <span>
            {a.start}–{a.end}
          </span>
          <span>
            {board.settings.targets.find((t) => t.id === a.targetId)?.label ??
              a.targetLabel ??
              t(dutyLabels[a.duty])}
          </span>
          {a.phone && (
            <span>
              ☎{" "}
              {a.phone === "maintenance"
                ? t("Maintenance")
                : (board.settings.targets.find((t) => t.id === a.phone)?.phone ??
                  a.phoneLabel ??
                  a.phone)}
            </span>
          )}
        </>
      )}
    </button>
  );
}
export function PlanBoard({
  board,
  dates,
  select,
}: {
  board: Board;
  dates: string[];
  select: (r: RecordEntry) => void;
}) {
  const assignments = entries(board, "assignment").sort(
    (a, b) =>
      a.data.startsAt.localeCompare(b.data.startsAt) ||
      a.personName.localeCompare(b.personName),
  );
  const rows = [
    {
      id: "leaders",
      label: t("Shift leaders"),
      test: (r: RecordEntry<"assignment">) => r.data.duty === "leader",
    },
    ...visibleTargets(board).map((target) => ({
      id: target.id,
      label: target.label,
      test: (r: RecordEntry<"assignment">) =>
        r.data.duty === "zone" && r.data.targetId === target.id,
    })),
    {
      id: "floating",
      label: t("Floating support"),
      test: (r: RecordEntry<"assignment">) => r.data.duty === "floating",
    },
    {
      id: "maintenance",
      label: t("Maintenance"),
      test: (r: RecordEntry<"assignment">) => r.data.duty === "maintenance",
    },
  ];
  const shifts = visibleShifts(board).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return (
    <Panel>
      <TableViewport aria-label={t("Weekly plan")}>
        <Table className="workforce-board" aria-label={t("Weekly plan")}>
          <thead>
            <tr>
              <th rowSpan={2} scope="col">
                {t("Zone")}
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  colSpan={Math.max(1, shifts.length)}
                  scope="colgroup"
                  className="workforce-day-heading"
                >
                  {new Intl.DateTimeFormat(locale(), {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "UTC",
                  }).format(new Date(date))}
                </th>
              ))}
            </tr>
            <tr>
              {dates.flatMap((date) =>
                shifts.length
                  ? shifts.map((shift, index) => (
                      <th
                        key={date + shift.id}
                        scope="col"
                        className={index === 0 ? "workforce-day-start" : ""}
                      >
                        {shift.label}
                        <small>
                          {shift.start}–{shift.end}
                        </small>
                      </th>
                    ))
                  : [
                      <th key={date} scope="col">
                        {t("No shifts configured")}
                      </th>,
                    ],
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {dates.flatMap((date) =>
                  shifts.length
                    ? shifts.map((shift, index) => {
                        const found = assignments.filter(
                          (record) =>
                            record.data.date === date &&
                            record.data.shiftId === shift.id &&
                            row.test(record),
                        );
                        return (
                          <td
                            key={date + shift.id}
                            className={index === 0 ? "workforce-day-start" : ""}
                          >
                            <AssignmentSlot records={found} select={select} />
                          </td>
                        );
                      })
                    : [<td key={date}>—</td>],
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableViewport>
    </Panel>
  );
}
export function DailyPlan({
  board,
  date,
  select,
}: {
  board: Board;
  date: string;
  select: (r: RecordEntry) => void;
}) {
  const assignments = entries(board, "assignment")
      .filter((r) => r.data.date === date)
      .sort(
        (a, b) =>
          a.data.startsAt.localeCompare(b.data.startsAt) ||
          a.personName.localeCompare(b.personName),
      ),
    schedules = entries(board, "schedule").filter((r) => r.data.date === date),
    own = assignments.filter((r) => r.data.userId === board.actorId),
    personal = schedules.find((r) => r.data.userId === board.actorId);
  const shifts = visibleShifts(board).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return (
    <>
      <Panel>
        <h2>{t("Your assignment")}</h2>
        {personal ? (
          <p>
            <Badge>{t(statusLabels[personal.data.status])}</Badge>{" "}
            {personal.data.start}{" "}
            {personal.data.end && "– " + personal.data.end}
          </p>
        ) : (
          <p>{t("No schedule yet")}</p>
        )}
        <div className="workforce-card-grid">
          {own.map((r) => (
            <AssignmentCard
              key={r.id}
              record={r}
              board={board}
              select={select}
            />
          ))}
        </div>
        {!own.length && <p>{t("No assignment yet")}</p>}
      </Panel>
      <Panel>
        <h2>{t("Shift leaders")}</h2>
        <div className="workforce-card-grid">
          {shifts.map((shift) => {
            const leaders = assignments.filter(
              (record) =>
                record.data.duty === "leader" &&
                record.data.shiftId === shift.id,
            );
            return (
              <section
                className="workforce-leader-shift"
                key={shift.id}
                aria-label={shift.label}
              >
                <h3>{shift.label}</h3>
                {leaders.length ? (
                  <AssignmentSlot
                    records={leaders}
                    select={select}
                    showPhone={false}
                  />
                ) : (
                  <p className="workforce-empty">
                    {t("No shift leader assigned")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </Panel>
      <Panel>
        <h2>{t("Other zones")}</h2>
        <TableViewport aria-label={t("Other zones")}>
          <Table className="workforce-board" aria-label={t("Other zones")}>
            <thead>
              <tr>
                <th scope="col">{t("Zone")}</th>
                {shifts.map((shift) => (
                  <th key={shift.id} scope="col">
                    {shift.label}
                  </th>
                ))}
                {!shifts.length && (
                  <th scope="col">{t("No shifts configured")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleTargets(board).map((target) => (
                <tr key={target.id}>
                  <th scope="row">{target.label}</th>
                  {shifts.map((shift) => (
                    <td key={shift.id}>
                      <AssignmentSlot
                        records={assignments.filter(
                          (record) =>
                            record.data.targetId === target.id &&
                            record.data.shiftId === shift.id &&
                            record.data.duty !== "leader",
                        )}
                        select={select}
                      />
                    </td>
                  ))}
                  {!shifts.length && <td>—</td>}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      </Panel>
      <Panel>
        <h2>
          {t("Floating support")} · {t("Maintenance")}
        </h2>
        <div className="workforce-card-grid">
          {assignments
            .filter((r) => ["floating", "maintenance"].includes(r.data.duty))
            .map((r) => (
              <AssignmentCard
                key={r.id}
                record={r}
                board={board}
                select={select}
                compact
              />
            ))}
        </div>
      </Panel>
    </>
  );
}
export function ScheduleList({
  board,
  date,
  select,
}: {
  board: Board;
  date: string;
  select: (r: RecordEntry) => void;
}) {
  return (
    <Panel>
      <h2>{t("Personal schedules")}</h2>
      <TableViewport>
        <Table
          className="workforce-schedules"
          aria-label={t("Personal schedules")}
        >
          <thead>
            <tr>
              {["Person", "Status", "Start time", "End time", "Source"].map(
                (l) => (
                  <th key={l}>{t(l)}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {entries(board, "schedule")
              .filter((r) => r.data.date === date)
              .sort((a, b) => a.personName.localeCompare(b.personName))
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    <Button
                      variant="text"
                      className="workforce-schedule-person"
                      onClick={() => select(r)}
                    >
                      {r.personName}
                    </Button>
                  </td>
                  <td>
                    <Badge>{t(statusLabels[r.data.status])}</Badge>
                  </td>
                  <td>{r.data.start}</td>
                  <td>{r.data.end}</td>
                  <td>{r.data.source}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </TableViewport>
    </Panel>
  );
}
