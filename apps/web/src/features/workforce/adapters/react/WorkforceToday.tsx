import { useEffect, useState, type ReactNode } from "react";
import {
  Actions,
  Alert,
  Badge,
  Button,
  DateField,
  Panel,
  ViewNavigation,
} from "../../../../design/components";
import type { WorkforceApplication } from "../../application/workforce";
import { entries, weekDates, type Board } from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { statusLabels, dutyLabels } from "./labels";
import "./workforce.css";
export function WorkforceToday({
  application,
  timeZone,
  open,
  relatedWork,
}: {
  application: WorkforceApplication;
  timeZone: string;
  open: () => void;
  relatedWork?: (period: { from: string; to: string; today: string }) => ReactNode;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [date, setDate] = useState(today);
  const [view, setView] = useState<"day" | "week">("day");
  const [loaded, setLoaded] = useState<{
    board: Board;
    from: string;
    date: string;
  }>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const week = weekDates(date);
  const from = week[0],
    to = week.at(-1)!;
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    void application
      .board(from, to)
      .then((value) => {
        if (active) setLoaded({ board: value, from, date });
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [application, from, to]);
  // One loaded week supports both views without a second request or empty flash.
  const displayedDate = loaded && loaded.from !== from ? loaded.date : date;
  const dates = view === "day" ? [displayedDate] : weekDates(displayedDate);
  const board = loaded?.board;
  const period = { from: dates[0], to: dates.at(-1)!, today };
  const selectDate = (next: string) => {
    if (!next) return;
    setLoaded((value) =>
      value && value.from === from ? { ...value, date } : value,
    );
    setDate(next);
  };
  return (
    <Panel
      className="workforce-start-assignment"
      aria-label={t("Your assignment")}
    >
      <div className="workforce-personal-heading">
        <div>
          <h2>{t("Your assignment")}</h2>
          <p className="workforce-availability">
            {t("Your shifts, departments and duties")}
          </p>
        </div>
      </div>
      <div className="workforce-start-controls">
        <ViewNavigation
          placement="inline"
          label={t("Assignment period")}
          selected={view}
          onSelect={setView}
          items={[
            { id: "day", label: t("Day") },
            { id: "week", label: t("Week") },
          ]}
        />
        <DateField
          label={t("Assignment date")}
          value={date}
          required
          onChange={(e) => selectDate(e.target.value)}
        />
        {date !== today && (
          <Button variant="text" onClick={() => selectDate(today)}>
            {t("Today")}
          </Button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="workforce-start-content" aria-busy={busy}>
        {!board ? (
          busy && <p role="status">{t("Loading…")}</p>
        ) : (
          <div className={`workforce-start-days workforce-start-days--${view}`}>
            {dates.map((day) => {
              const own = entries(board, "assignment").filter(
                (r) => r.data.userId === board.actorId && r.data.date === day,
              );
              const schedule = entries(board, "schedule").find(
                (r) => r.data.userId === board.actorId && r.data.date === day,
              );
              const shift = board.settings.shifts.find(
                (s) =>
                  s.start === schedule?.data.start &&
                  s.end === schedule?.data.end,
              );
              return (
                <section
                  className="workforce-start-day"
                  key={day}
                  aria-label={day}
                >
                  <div className="workforce-personal-heading">
                    <strong>{day}</strong>
                    <Badge>
                      {schedule
                        ? t(statusLabels[schedule.data.status])
                        : t("No schedule yet")}
                    </Badge>
                  </div>
                  {schedule?.data.start && (
                    <p className="workforce-personal-hours">
                      {shift && `${t(shift.label)} · `}
                      {schedule.data.start}–{schedule.data.end}
                    </p>
                  )}
                  {own.map((r) => (
                    <div key={r.id} className="workforce-start-duty">
                      <strong>
                        {r.data.targetLabel ||
                          board.settings.targets.find(
                            (target) => target.id === r.data.targetId,
                          )?.label ||
                          t(dutyLabels[r.data.duty])}
                      </strong>
                      <span>
                        {r.data.shiftLabel ||
                          board.settings.shifts.find(
                            (s) => s.id === r.data.shiftId,
                          )?.label}{" "}
                        · {r.data.start}–{r.data.end}
                      </span>
                      <Badge tone="info">{t(dutyLabels[r.data.duty])}</Badge>
                    </div>
                  ))}
                  {!own.length && (
                    <p className="workforce-availability">
                      {t("No assignment yet")}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
      <p className="workforce-start-loading" role="status">
        {busy && board ? t("Updating assignments…") : ""}
      </p>
      <Actions>
        <Button variant="secondary" onClick={open}>
          {t("Workforce & shifts")}
        </Button>
      </Actions>
      {relatedWork?.(period)}
    </Panel>
  );
}
