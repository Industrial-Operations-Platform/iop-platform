import { useEffect, useState } from "react";
import { Badge, Button, Panel } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import { entries, visibleShifts, type Board, type RecordEntry } from "../../domain/models";
import { leaderAvailability, touchesDate } from "../../domain/leader-availability";

export function ShiftLeaders({ board, date, select }: {
  board: Board;
  date: string;
  select: (record: RecordEntry) => void;
}) {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const assignments = entries(board, "assignment");
  const own = [...assignments, ...entries(board, "schedule")]
    .filter((record) => record.data.userId === board.actorId && touchesDate(record.data, date, board.timeZone))
    .map((record) => record.data);
  const leaders = assignments.filter((record) => record.data.duty === "leader" && touchesDate(record.data, date, board.timeZone));
  const workers = entries(board, "worker");
  return <Panel>
    <h2>{t("Shift leaders")}</h2>
    <p className="workforce-availability">{t("Availability follows planned working hours.")}</p>
    <div className="workforce-card-grid">
      {visibleShifts(board).sort((a, b) => a.start.localeCompare(b.start)).map((shift) => {
        const records = leaders.filter((record) => record.data.shiftId === shift.id);
        return <section className="workforce-leader-shift" key={shift.id} aria-label={shift.label}>
          <h3>{shift.label}</h3>
          {records.length ? records.map((record) => {
            const availability = leaderAvailability(record.data, own, now);
            const teams = board.settings.teams.filter((team) => team.leaderId === record.data.userId);
            return <div className="workforce-leader" key={record.id} data-availability={availability.availableNow ? "now" : availability.duringOwnShift ? "own-shift" : "scheduled"}>
              <Button variant="text" className="workforce-leader-name" onClick={() => select(record)}>{record.personName}</Button>
              <div className="workforce-leader-context">
                <Badge tone={availability.availableNow ? "success" : availability.duringOwnShift ? "info" : "neutral"}>
                  {availability.availableNow ? t("Available now") : availability.duringOwnShift ? t("During your shift") : t("Scheduled")}
                </Badge>
                <small>{record.data.start}–{record.data.end}</small>
                {availability.availableNow && availability.duringOwnShift && <small>{t("During your shift")}</small>}
              </div>
              {teams.map((team) => {
                const members = workers.filter((worker) => worker.data.teamId === team.id);
                return <details className="workforce-primary-team" key={team.id}>
                  <summary>{team.label} · {members.length}</summary>
                  {members.length ? <ul>{members.map((member) => {
                    const level = board.settings.technicalLevels?.find((item) => item.id === member.data.technicalLevelId)?.label ?? member.data.technicalLevelLabel;
                    return <li key={member.id}><span>{member.personName}</span>{level && <small>{level}</small>}</li>;
                  })}</ul> : <p className="workforce-empty">{t("No workers in this team")}</p>}
                </details>;
              })}
            </div>;
          }) : <p className="workforce-empty">{t("No shift leader assigned")}</p>}
        </section>;
      })}
    </div>
  </Panel>;
}
