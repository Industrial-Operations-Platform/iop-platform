import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Badge,
  Button,
  Field,
  Input,
  PageHeading,
  Panel,
  ViewNavigation,
} from "../../../../design/components";
import type { WorkforceApplication } from "../../application/workforce";
import {
  entries,
  weekDates,
  type Board,
  type RecordEntry,
  type Revision,
  type SaveInput,
} from "../../domain/models";
import { locale, t } from "../../../../localization/i18n";
import { AssignmentForm } from "./AssignmentForm";
import { DailyPlan, PlanBoard, ScheduleList } from "./PlanBoard";
import { ScheduleImport } from "./ScheduleImport";
import { Configuration } from "./Configuration";
import { WeeklySchedule } from "./WeeklySchedule";
import { ManualSchedule } from "./ManualSchedule";
import { RecordDetails } from "./RecordDetails";
import "./workforce.css";
export function WorkforceWorkspace({
  application,
  profile,
  timeZone,
}: {
  application: WorkforceApplication;
  profile?: string;
  timeZone: string;
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [date, setDate] = useState(today),
    [tab, setTab] = useState(
      profile === "team-leader" || profile === "administrator" ? "week" : "day",
    ),
    [board, setBoard] = useState<Board>(),
    [version, setVersion] = useState(0),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState(false),
    [schedulePerson, setSchedulePerson] = useState(""),
    [selected, setSelected] = useState<RecordEntry>(),
    [history, setHistory] = useState<Revision[]>([]);
  const dates = weekDates(date),
    from = dates[0],
    to = dates[6];
  useEffect(() => {
    let active = true;
    setPending(true);
    setError("");
    void application
      .board(from, to)
      .then((b) => {
        if (active) setBoard(b);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [application, from, to, version]);
  const canPlan =
      board?.canPlan && profile !== "technician" && profile !== "task-force",
    canAdminister =
      board?.canAdminister && (!profile || profile === "administrator");
  const refresh = () => setVersion((v) => v + 1);
  const save = async (input: SaveInput) => {
    setPending(true);
    setError("");
    try {
      await application.save(input);
      setMessage("Saved.");
      setForm(false);
      setSelected(undefined);
      refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  };
  const select = (record: RecordEntry) => {
    setSelected(record);
    setForm(false);
    setHistory([]);
  };
  const remove = async () => {
    if (!selected) return;
    setPending(true);
    try {
      await application.remove(selected);
      setSelected(undefined);
      setMessage("Deleted. History is retained.");
      refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  };
  const coverage = board
    ? board.settings.targets.filter(
        (target) =>
          !entries(board, "assignment").some(
            (r) =>
              r.data.date === date &&
              r.data.targetId === target.id &&
              r.data.duty === "zone",
          ),
      ).length
    : 0;
  return (
    <div className="workforce-workspace">
      <PageHeading
        eyebrow="IOP"
        title={t("Workforce & shifts")}
        description={`${t("Times use the site time zone.")} ${timeZone}`}
        actions={
          <Actions>
            <Field>
              {t("Date")}
              <Input
                aria-label={t("Date")}
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(e.target.value);
                    setSelected(undefined);
                    setForm(false);
                  }
                }}
              />
            </Field>
            <Button variant="secondary" disabled={pending} onClick={refresh}>
              {t("Refresh")}
            </Button>
            {canPlan && (
              <Button
                disabled={pending}
                onClick={() => {
                  setSelected(undefined);
                  setForm(true);
                }}
              >
                {t("Assign")}
              </Button>
            )}
          </Actions>
        }
      />
      {error && <Alert>{t(error)}</Alert>}
      {message && <p role="status">{t(message)}</p>}
      {pending && !board && <Panel>{t("Loading…")}</Panel>}
      {board && (
        <>
          <ViewNavigation
            label={t("Workforce & shifts")}
            selected={tab}
            placement="tabs"
            onSelect={(value) => {
              setTab(value);
              setSchedulePerson("");
              setForm(false);
              setSelected(undefined);
            }}
            items={[
              { id: "day", label: t("My day") },
              ...(canPlan
                ? [
                    { id: "week", label: t("Weekly plan") },
                    { id: "schedules", label: t("Weekly schedules") },
                  ]
                : []),
              ...(canAdminister
                ? [
                    { id: "import", label: t("Schedule import") },
                    { id: "config", label: t("Configuration") },
                  ]
                : []),
            ]}
          />
          {form && canPlan ? (
            <AssignmentForm
              key={selected?.id ?? date}
              board={board}
              date={date}
              existing={
                selected?.kind === "assignment"
                  ? (selected as RecordEntry<"assignment">)
                  : undefined
              }
              save={(input) => void save(input)}
              cancel={() => setForm(false)}
              pending={pending}
            />
          ) : selected ? (
            <Panel>
              <h2>{selected.personName || t("Assignment details")}</h2>
              <RecordDetails record={selected} />
              <Actions>
                {selected.kind === "schedule" &&
                  "userId" in selected.data &&
                  canPlan && (
                    <Button
                      onClick={() => {
                        setSchedulePerson(
                          (selected.data as { userId: string }).userId,
                        );
                        setTab("schedules");
                        setSelected(undefined);
                      }}
                    >
                      {t("Edit week")}
                    </Button>
                  )}
                {selected.kind === "assignment" && canPlan && (
                  <Button onClick={() => setForm(true)}>{t("Edit")}</Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() =>
                    void application
                      .history(selected)
                      .then(setHistory)
                      .catch((e) => setError(e.message))
                  }
                >
                  {t("History")}
                </Button>
                {canAdminister && (
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => void remove()}
                  >
                    {t("Delete")}
                  </Button>
                )}
                <Button variant="text" onClick={() => setSelected(undefined)}>
                  {t("Close")}
                </Button>
              </Actions>
              {history.map((r) => (
                <div key={r.record.revision}>
                  <p>
                    #{r.record.revision} · {r.actorName} ·{" "}
                    {new Date(r.at).toLocaleString(locale())} · {t(r.action)}
                  </p>
                  <RecordDetails record={r.record} />
                </div>
              ))}
            </Panel>
          ) : (
            <>
              {canPlan && (tab === "day" || tab === "week") && (
                <Panel>
                  <Badge tone={coverage ? "attention" : "success"}>
                    {t("Coverage gaps")}: {coverage}
                  </Badge>
                </Panel>
              )}
              {tab === "day" && (
                <DailyPlan board={board} date={date} select={select} />
              )}
              {tab === "week" && canPlan && (
                <PlanBoard board={board} dates={dates} select={select} />
              )}
              {(tab === "day" || tab === "week") && canPlan && (
                <ScheduleList board={board} date={date} select={select} />
              )}
              {tab === "schedules" && canPlan && (
                <WeeklySchedule
                  board={board}
                  weekStart={from}
                  application={application}
                  loading={pending}
                  refresh={refresh}
                  initialUserId={schedulePerson}
                />
              )}
              {tab === "import" && canAdminister && (
                <>
                  <ScheduleImport
                    application={application}
                    board={board}
                    refresh={refresh}
                  />
                  <ManualSchedule
                    board={board}
                    date={date}
                    save={(input) => void save(input)}
                    pending={pending}
                  />
                  <ScheduleList board={board} date={date} select={select} />
                </>
              )}
              {tab === "config" && canAdminister && (
                <Configuration
                  key={version}
                  board={board}
                  save={(input) => void save(input)}
                  pending={pending}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
