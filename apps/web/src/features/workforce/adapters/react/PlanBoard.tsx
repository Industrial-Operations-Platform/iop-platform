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
export function AssignmentCard({
  record,
  board,
  select,
  showShift = true,
}: {
  record: RecordEntry<"assignment">;
  board: Board;
  select: (r: RecordEntry) => void;
  showShift?: boolean;
}) {
  const a = record.data;
  return (
    <button className="workforce-assignment" onClick={() => select(record)}>
      <strong>{record.personName}</strong>
      {showShift && (
        <Badge>
          {board.settings.shifts.find((shift) => shift.id === a.shiftId)
            ?.label ??
            a.shiftLabel ??
            a.shiftId}
        </Badge>
      )}
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
        <Table className="workforce-board">
          <caption>{t("Weekly plan")}</caption>
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
                            <div className="workforce-slot">
                              {found.map((record) => (
                                <AssignmentCard
                                  key={record.id}
                                  record={record}
                                  board={board}
                                  select={select}
                                  showShift={false}
                                />
                              ))}
                              {!found.length && (
                                <span className="workforce-empty">—</span>
                              )}
                            </div>
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
          {visibleShifts(board)
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((shift) => {
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
                  {leaders.map((record) => (
                    <AssignmentCard
                      key={record.id}
                      record={record}
                      board={board}
                      select={select}
                      showShift={false}
                    />
                  ))}
                  {!leaders.length && (
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
        <div className="workforce-card-grid">
          {visibleTargets(board).map((target) => (
            <section className="workforce-zone" key={target.id}>
              <h3>{target.label}</h3>
              {assignments
                .filter(
                  (r) =>
                    r.data.targetId === target.id && r.data.duty !== "leader",
                )
                .map((r) => (
                  <AssignmentCard
                    key={r.id}
                    record={r}
                    board={board}
                    select={select}
                  />
                ))}
              {!assignments.some((r) => r.data.targetId === target.id) && (
                <p>{t("No assignment yet")}</p>
              )}
            </section>
          ))}
        </div>
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
