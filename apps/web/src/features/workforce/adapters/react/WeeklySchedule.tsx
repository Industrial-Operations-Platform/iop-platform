import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  DateField,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { WorkforceApplication } from "../../application/workforce";
import { entries, type Board } from "../../domain/models";
import {
  applyChoice,
  hasWorkingHours,
  scheduleChoice,
  weekDrafts,
  type ScheduleDayDraft,
} from "../../domain/weekly-schedule";
import {
  defaultAnalysisPeriod,
  proposalInput,
  type ProposalDrafts,
  type ScheduleProposalPreview,
} from "../../domain/schedule-proposal";
import { ScheduleProposalView } from "./ScheduleProposalView";
import { statusLabels } from "./labels";

function dayLabel(date: string) {
  return new Intl.DateTimeFormat(locale(), {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}
function Choices({ board, date }: { board: Board; date?: string }) {
  return (
    <>
      {board.settings.shifts
        .filter(
          (shift) => !date || shift.days.includes(new Date(date).getUTCDay()),
        )
        .map((shift) => (
          <option key={shift.id} value={"shift:" + shift.id}>
            {shift.label} · {shift.start}–{shift.end}
          </option>
        ))}
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={"status:" + value}>
          {t(value === "work" ? "Custom work hours" : label)}
        </option>
      ))}
    </>
  );
}

export function WeeklySchedule({
  board,
  weekStart,
  application,
  loading,
  refresh,
  initialUserId = "",
  cancel,
}: {
  cancel: () => void;
  initialUserId?: string;
  board: Board;
  weekStart: string;
  application: WorkforceApplication;
  loading: boolean;
  refresh: () => void;
}) {
  const [userId, setUserId] = useState(initialUserId);
  const [baseline, setBaseline] = useState(board);
  const [peopleDrafts, setPeopleDrafts] = useState<ProposalDrafts>({});
  const [preview, setPreview] = useState<ScheduleProposalPreview>();
  const [period, setPeriod] = useState(() => defaultAnalysisPeriod(weekStart));
  const [selected, setSelected] = useState<string[]>([]);
  const [preset, setPreset] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number>();
  const original = weekDrafts(baseline, userId, weekStart);
  const drafts = peopleDrafts[userId] ?? original;
  const setDrafts = (
    change: ScheduleDayDraft[] | ((days: ScheduleDayDraft[]) => ScheduleDayDraft[]),
  ) => {
    setPreview(undefined);
    setPeopleDrafts((current) => ({
      ...current,
      [userId]: typeof change === "function" ? change(current[userId] ?? original) : change,
    }));
  };
  // Keep original revisions while drafts exist, even if the parent board reloads.
  useEffect(() => {
    if (!Object.keys(peopleDrafts).length) setBaseline(board);
  }, [board]);
  useEffect(() => {
    const days = weekDrafts(baseline, userId, weekStart);
    setSelected(days.slice(0, 5).map((day) => day.date));
    setError("");
  }, [userId, weekStart]);
  const proposal = proposalInput(baseline, weekStart, peopleDrafts);
  const changeCount = proposal.weeks.reduce(
    (count, week) => count + week.days.length, 0,
  );
  const busy = pending || loading;
  const update = (index: number, change: Partial<ScheduleDayDraft>) => {
    setSaved(undefined);
    setDrafts((current) =>
      current.map((day, i) => (i === index ? { ...day, ...change } : day)),
    );
  };
  const submit = async () => {
    setPending(true);
    setError("");
    try {
      if (preview) {
        const result = await application.saveProposal(proposal);
        setSaved(result.changed);
        setPeopleDrafts({});
        setPreview(undefined);
        refresh();
      } else {
        setPreview(await application.previewProposal({ ...proposal, ...period }));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel className="workforce-week-editor">
      <h2>{t("Enter weekly shifts")}</h2>
      <p>
        {t(
          "Edit several people in this week, preview the proposed schedule and compare workloads before saving.",
        )}
      </p>
      {error && <Alert>{t(error)}</Alert>}
      {saved !== undefined && (
        <p role="status">{t("Saved {0} schedule days.", [saved])}</p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <fieldset className="workforce-week-fields" disabled={busy}>
          <Field>
            {t("Person")}
            <Select
              aria-label={t("Person")}
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setSaved(undefined);
              }}
            >
              <option value="">{t("Select a person")}</option>
              {baseline.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
          {userId && (
            <>
              <FieldRow className="workforce-week-preset">
                <Field>
                  {t("Apply shift or status")}
                  <Select
                    aria-label={t("Apply shift or status")}
                    value={preset}
                    onChange={(event) => setPreset(event.target.value)}
                  >
                    <option value="">{t("Choose a shift or status")}</option>
                    <Choices board={baseline} />
                  </Select>
                </Field>
                <Button
                  variant="secondary"
                  disabled={!preset || !selected.length}
                  onClick={() => {
                    setSaved(undefined);
                    setDrafts((days) =>
                      days.map((day) =>
                        selected.includes(day.date)
                          ? applyChoice(day, preset, baseline.settings)
                          : day,
                      ),
                    );
                  }}
                >
                  {t("Apply to selected days")}
                </Button>
              </FieldRow>
              <Actions className="workforce-selection-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setSelected(drafts.slice(0, 5).map((day) => day.date))
                  }
                >
                  {t("Select weekdays")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSelected(drafts.map((day) => day.date))}
                >
                  {t("Select all days")}
                </Button>
                <Button variant="secondary" onClick={() => setSelected([])}>
                  {t("Clear selection")}
                </Button>
              </Actions>
              <p>
                {t(
                  "Shift presets apply only on their configured active days. Unplanned days stay empty.",
                )}
              </p>
              <div className="workforce-week-days">
                {drafts.map((day, index) => {
                  const assignments = entries(board, "assignment").filter(
                    (record) =>
                      record.data.userId === userId &&
                      record.data.date === day.date,
                  );
                  return (
                    <section
                      className={`workforce-week-day ${selected.includes(day.date) ? "workforce-week-day--selected" : ""}`}
                      key={day.date}
                      aria-label={dayLabel(day.date)}
                    >
                      <Field layout="inline">
                        <Input
                          type="checkbox"
                          checked={selected.includes(day.date)}
                          onChange={(event) =>
                            setSelected((dates) =>
                              event.target.checked
                                ? [...dates, day.date]
                                : dates.filter((date) => date !== day.date),
                            )
                          }
                        />
                        {dayLabel(day.date)}
                      </Field>
                      <Field>
                        {t("Shift or status")}
                        <Select
                          aria-label={t("Shift or status")}
                          value={scheduleChoice(day, baseline.settings)}
                          onChange={(event) =>
                            update(
                              index,
                              applyChoice(
                                day,
                                event.target.value,
                                baseline.settings,
                              ),
                            )
                          }
                        >
                          <option value="" disabled={!!original[index]?.status}>
                            {t("Not planned")}
                          </option>
                          <Choices board={baseline} date={day.date} />
                        </Select>
                      </Field>
                      {hasWorkingHours(day.status) && (
                        <FieldRow>
                          <Field>
                            {t("Start time")}
                            <Input
                              type="time"
                              required
                              value={day.start}
                              onChange={(event) =>
                                update(index, { start: event.target.value })
                              }
                            />
                          </Field>
                          <Field>
                            {t("End time")}
                            <Input
                              type="time"
                              required
                              value={day.end}
                              onChange={(event) =>
                                update(index, { end: event.target.value })
                              }
                            />
                          </Field>
                        </FieldRow>
                      )}
                      {assignments.map((record) => (
                        <p className="workforce-existing-duty" key={record.id}>
                          {t("Existing assignment")}:{" "}
                          {record.data.targetLabel || t("Duty")} ·{" "}
                          {record.data.start}–{record.data.end}
                        </p>
                      ))}
                    </section>
                  );
                })}
              </div>
              <p>
                {t(
                  "Existing zone and phone assignments are kept. A conflicting schedule change is rejected without saving any day.",
                )}
              </p>
            </>
          )}
          {!!changeCount && <>
            <p role="status">{t(
              "Unsaved proposal: {0} people, {1} changed days.",
              [proposal.weeks.length, changeCount],
            )}</p>
            <FieldRow>
              <DateField label={t("Analysis from")} required value={period.from}
                max={weekStart} onChange={(event) => {
                  setPeriod({ ...period, from: event.target.value });
                  setPreview(undefined);
                }} />
              <DateField label={t("Analysis to")} required value={period.to}
                min={drafts[6]?.date} onChange={(event) => {
                  setPeriod({ ...period, to: event.target.value });
                  setPreview(undefined);
                }} />
            </FieldRow>
            <p>{t(
              "Choose up to 93 days including the edited week. Totals describe personal schedules, not attendance or paid hours.",
            )}</p>
            {preview && <ScheduleProposalView
              board={baseline} weekStart={weekStart}
              drafts={peopleDrafts} preview={preview}
            />}
          </>}
          <Actions className="iop-form-actions">
            <Button variant="secondary" onClick={cancel}>
              {t("Cancel")}
            </Button>
            {!!changeCount && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPeopleDrafts({});
                    setPreview(undefined);
                    setBaseline(board);
                    setError("");
                    setSaved(undefined);
                  }}
                >
                  {t("Discard proposal")}
                </Button>
                <Button type="submit">
                  {pending ? t("Processing…") : preview ? t("Save proposal") : t("Preview proposal")} ({changeCount})
                </Button>
              </>
            )}
          </Actions>
        </fieldset>
      </form>
    </Panel>
  );
}
