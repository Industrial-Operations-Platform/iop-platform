import { useEffect, useState } from "react";
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
}: {
  application: WorkforceApplication;
  timeZone: string;
  open: () => void;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [date, setDate] = useState(today);
  const [view, setView] = useState<"day" | "week">("day");
  const [board, setBoard] = useState<Board>();
  const [error, setError] = useState("");
  const dates = view === "day" ? [date] : weekDates(date);
  const from = dates[0],
    to = dates.at(-1)!;
  useEffect(() => {
    let active = true;
    setBoard(undefined);
    setError("");
    void application
      .board(from, to)
      .then((value) => {
        if (active) setBoard(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [application, from, to]);
  return (
    <Panel aria-label={t("Your assignment")}>
      <div className="workforce-personal-heading">
        <div>
          <h2>{t("Your assignment")}</h2>
          <p className="workforce-availability">
            {t("Your shifts, departments and duties")}
          </p>
        </div>
      </div>
      <div className="iop-scope-toolbar">
        <DateField
          label={t("Assignment date")}
          value={date}
          required
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
        {date !== today && (
          <Button variant="text" onClick={() => setDate(today)}>
            {t("Today")}
          </Button>
        )}
      </div>
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
      {error ? (
        <Alert>{error}</Alert>
      ) : !board ? (
        <p role="status">{t("Loading…")}</p>
      ) : (
        <div className="workforce-start-days">
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
      <Actions>
        <Button variant="secondary" onClick={open}>
          {t("Workforce & shifts")}
        </Button>
      </Actions>
    </Panel>
  );
}
