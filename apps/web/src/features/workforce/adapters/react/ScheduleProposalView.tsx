import { Table, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import { weekDates, type Board } from "../../domain/models";
import { scheduleChoice, hasWorkingHours } from "../../domain/weekly-schedule";
import type { ProposalDrafts, ScheduleProposalPreview } from "../../domain/schedule-proposal";
import { statusLabels } from "./labels";

function comparison(before: number, after: number, hours = false) {
  const format = (value: number) => new Intl.NumberFormat(locale(), {
    maximumFractionDigits: 2,
  }).format(hours ? value / 60 : value);
  if (before === after) return format(after);
  return `${format(before)} → ${format(after)} (${after > before ? "+" : ""}${format(after - before)})`;
}
export function ScheduleProposalView({ board, weekStart, drafts, preview }: {
  board: Board;
  weekStart: string;
  drafts: ProposalDrafts;
  preview: ScheduleProposalPreview;
}) {
  const dates = weekDates(weekStart);
  const people = board.people.filter((person) => drafts[person.id]);
  const shifts = preview.people[0]?.after.shifts ?? [];
  const dateFormat = new Intl.DateTimeFormat(locale(), {
    weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC",
  });
  return <section className="workforce-proposal" aria-label={t("Schedule preview")}>
    <h3>{t("Schedule preview")}</h3>
    <p role="status">{t("Preview only. Nothing has been saved.")}</p>
    <TableViewport aria-label={t("Proposed weekly schedules")}>
      <Table>
        <thead><tr>
          <th scope="col">{t("Person")}</th>
          {dates.map((date) => <th key={date} scope="col">{dateFormat.format(new Date(date))}</th>)}
        </tr></thead>
        <tbody>{people.map((person) => <tr key={person.id}>
          <th scope="row">{person.name}</th>
          {drafts[person.id].map((day) => {
            const choice = scheduleChoice(day, board.settings);
            const shift = board.settings.shifts.find((item) => choice === "shift:" + item.id);
            return <td key={day.date}>
              <span>{shift?.label ?? (day.status ? t(statusLabels[day.status]) : t("Not planned"))}</span>
              {hasWorkingHours(day.status) && <small>{day.start}–{day.end}</small>}
            </td>;
          })}
        </tr>)}</tbody>
      </Table>
    </TableViewport>
    <h3>{t("Workload comparison")}</h3>
    <p>{preview.from} – {preview.to} · {t(
      "Saved → proposed (change). Weekends belong to the shift start date; hours include training and maintenance. Missing days are unknown, not days off.",
    )}</p>
    <TableViewport aria-label={t("Workload comparison")}>
      <Table>
        <thead><tr>
          <th scope="col">{t("Person")}</th>
          {[t("Scheduled days"), t("Scheduled hours"), t("Saturdays"), t("Sundays"), t("Unknown days")].map((label) =>
            <th scope="col" key={label}>{label}</th>,
          )}
          {shifts.map((shift) => <th scope="col" key={shift.id}>
            {shift.id ? shift.label : t("Other scheduled hours")}
          </th>)}
        </tr></thead>
        <tbody>{preview.people.map(({ userId, name, before, after }) => <tr key={userId}>
          <th scope="row">{name}</th>
          <td>{comparison(before.days, after.days)}</td>
          <td>{comparison(before.minutes, after.minutes, true)}</td>
          <td>{comparison(before.saturdays, after.saturdays)}</td>
          <td>{comparison(before.sundays, after.sundays)}</td>
          <td>{comparison(before.unknownDays, after.unknownDays)}</td>
          {after.shifts.map((shift, i) => <td key={shift.id}>
            {comparison(before.shifts[i]?.count ?? 0, shift.count)}
          </td>)}
        </tr>)}</tbody>
      </Table>
    </TableViewport>
  </section>;
}
