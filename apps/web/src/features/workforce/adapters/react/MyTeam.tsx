import { Badge, Button, Panel, Table, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { Board, RecordEntry } from "../../domain/models";
import { teamDistribution, type TeamDay } from "../../domain/team-distribution";
import { dutyLabels, statusLabels } from "./labels";

function TeamDayCell({ day, board, personName, select }: {
  day: TeamDay;
  board: Board;
  personName: string;
  select: (record: RecordEntry) => void;
}) {
  const schedule = day.schedule;
  const working = schedule && ["work", "training", "maintenance"].includes(schedule.data.status);
  return <div className="workforce-team-day">
    <Badge tone={working ? "info" : "neutral"}>
      {schedule ? t(statusLabels[schedule.data.status]) : t("No schedule yet")}
    </Badge>
    {schedule && working && <div className="workforce-team-hours">
      {day.shiftLabel && <span>{t(day.shiftLabel)}</span>}
      <span>{schedule.data.start}–{schedule.data.end}</span>
    </div>}
    {day.unassigned && <span className="workforce-team-unassigned">{t("Not assigned")}</span>}
    {day.assignments.map((assignment) => {
      const data = assignment.data;
      const shift = board.settings.shifts.find((item) => item.id === data.shiftId)?.label || data.shiftLabel || data.shiftId;
      const zone = board.settings.targets.find((item) => item.id === data.targetId)?.label || data.targetLabel;
      const context = [t(shift), zone, t(dutyLabels[data.duty]), `${data.start}–${data.end}`].filter(Boolean).join(", ");
      return <Button key={assignment.id} variant="text" className="workforce-team-assignment"
        aria-label={t("View assignment for {0} on {1}: {2}", [personName, day.date, context])}
        onClick={() => select({ ...assignment, personName })}>
        <strong>{t(shift)}</strong>
        {zone && <span>{zone}</span>}
        <span>{t(dutyLabels[data.duty])}</span>
        <small>{data.start}–{data.end}</small>
        {data.date !== day.date && <small>{t("Continues from {0}", [data.date])}</small>}
      </Button>;
    })}
  </div>;
}

export function MyTeam({ board, dates, date, select }: {
  board: Board;
  dates: string[];
  date: string;
  select: (record: RecordEntry) => void;
}) {
  const teams = teamDistribution(board, dates);
  return <div className="workforce-team-distribution">
    <Panel>
      <h2>{t("My team")}</h2>
      <p className="workforce-availability">{t("Your primary teams, planned availability and assignments for the week.")}</p>
      <p className="workforce-availability">{t("Based on recorded schedules and assignments; attendance is not tracked.")}</p>
      {!teams.length && <p className="workforce-empty">{t("No primary team is assigned to you.")}</p>}
    </Panel>
    {teams.map((team) => <Panel key={team.id} aria-label={team.label}>
      <div className="workforce-personal-heading">
        <h2>{team.label}</h2>
        <Badge>{team.members.length === 1 ? t("1 worker") : t("{0} workers", [team.members.length])}</Badge>
      </div>
      {team.members.length ? <TableViewport className="workforce-team-viewport" aria-label={t("Team distribution for {0}", [team.label])}>
        <Table variant="records" className="workforce-team-table" aria-label={t("Team distribution for {0}", [team.label])}>
          <thead><tr>
            <th scope="col" data-align="text">{t("Person")}</th>
            {dates.map((day) => <th scope="col" key={day} data-selected={day === date || undefined}>
              <time dateTime={day}>{new Intl.DateTimeFormat(locale(), { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(day + "T12:00:00Z"))}</time>
            </th>)}
          </tr></thead>
          <tbody>{team.members.map((member) => <tr key={member.person.id}>
            <th scope="row" data-align="text"><span>{member.person.name}</span>{member.technicalLevel && <small>{member.technicalLevel}</small>}</th>
            {member.days.map((day) => <td key={day.date} data-align="text" data-selected={day.date === date || undefined}>
              <TeamDayCell day={day} board={board} personName={member.person.name} select={select} />
            </td>)}
          </tr>)}</tbody>
        </Table>
      </TableViewport> : <p className="workforce-empty">{t("No workers in this team")}</p>}
    </Panel>)}
  </div>;
}
