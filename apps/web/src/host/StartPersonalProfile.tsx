import { useEffect, useState } from "react";
import { Alert, Badge, Panel, RefreshButton } from "../design/components";
import { locale, t } from "../localization/i18n";
import type { WorkforceApplication } from "../features/workforce/application/workforce";
import type { PersonalSummary } from "../features/workforce/domain/models";
import { entries } from "../features/workforce/domain/models";
import type { HandoverApplication } from "../features/shift-handover/application/handover";
import "./start.css";

export function StartPersonalProfile({
  name,
  profileLabel,
  workforce,
  handover,
  onDepartment,
}: {
  name: string;
  profileLabel: string;
  workforce: WorkforceApplication;
  handover?: HandoverApplication;
  onDepartment: (id: string) => void;
}) {
  const [summary, setSummary] = useState<PersonalSummary>();
  const [closed, setClosed] = useState<number>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    setClosed(undefined);
    void workforce
      .summary()
      .then(async (value) => {
        if (!active) return;
        setSummary(value);
        const results = await Promise.allSettled([
          workforce.board(value.today, value.today),
          handover?.list({
            resolvedFrom: value.previousFrom,
            resolvedTo: value.previousTo,
            resolvedForMe: true,
          }),
        ]);
        if (!active) return;
        const board = results[0];
        const targets =
          board.status === "fulfilled"
            ? entries(board.value, "assignment").filter(
                (r) => r.data.userId === value.actorId && r.data.targetId,
              )
            : [];
        const current = targets.find(
          (r) =>
            Date.parse(r.data.startsAt) <= Date.now() &&
            Date.now() < Date.parse(r.data.endsAt),
        );
        onDepartment(
          current?.data.targetId ||
            targets[0]?.data.targetId ||
            value.homeTargetId,
        );
        if (results[1].status === "fulfilled" && results[1].value)
          setClosed(results[1].value.total);
        if (results.some((r) => r.status === "rejected"))
          setError("Some personal information is unavailable. Try refreshing.");
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          onDepartment("");
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [workforce, handover, onDepartment, version]);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <Panel className="start-profile" aria-label={t("Profile")}>
      <div className="start-profile-heading">
        <span className="start-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="start-profile-identity">
          <span className="start-caption">{t("Profile")}</span>
          <h2>{name}</h2>
          <Badge tone="info">{t(profileLabel)}</Badge>
        </div>
        <RefreshButton
          label={t("Refresh personal overview")}
          busy={busy}
          onClick={() => setVersion((v) => v + 1)}
        />
      </div>
      {error && <Alert>{t(error)}</Alert>}
      {busy && !summary ? (
        <p role="status">{t("Loading personal overview…")}</p>
      ) : (
        summary && (
          <>
            <dl className="start-profile-context">
              <div>
                <dt>{t("Home department")}</dt>
                <dd>{summary.homeTargetLabel || t("Not assigned")}</dd>
              </div>
              <div>
                <dt>{t("Team")}</dt>
                <dd>{summary.teamLabel || t("Not assigned")}</dd>
              </div>
            </dl>
            <div className="start-personal-metrics">
              <div>
                <strong>{closed ?? "—"}</strong>
                <span>{t("Assigned reports resolved")}</span>
                <small>{summary.previousFrom.slice(0, 7)}</small>
              </div>
              <div>
                <strong>{summary.scheduledDays}</strong>
                <span>{t("Scheduled working days")}</span>
                <small>{summary.previousFrom.slice(0, 7)}</small>
              </div>
              <div>
                <strong>{summary.saturdays}</strong>
                <span>{t("Saturdays")}</span>
                <small>{t("This month through today")}</small>
              </div>
              <div>
                <strong>{summary.sundays}</strong>
                <span>{t("Sundays")}</span>
                <small>{t("This month through today")}</small>
              </div>
            </div>
            <div className="start-shift-share">
              <h3>{t("Your shifts last month")}</h3>
              {summary.shifts.length ? (
                summary.shifts.map((shift) => (
                  <div key={shift.id} className="start-shift-row">
                    <span>{t(shift.label)}</span>
                    <progress
                      max={100}
                      value={shift.percentage}
                      aria-label={t(shift.label)}
                    />
                    <strong>
                      {new Intl.NumberFormat(locale(), {
                        maximumFractionDigits: 0,
                      }).format(shift.percentage)}
                      %
                    </strong>
                  </div>
                ))
              ) : (
                <p className="start-caption">
                  {t("No working shifts recorded for last month.")}
                </p>
              )}
            </div>
            <p className="start-caption">
              {t(
                "Based on recorded schedules and assignments; attendance is not tracked.",
              )}
            </p>
          </>
        )
      )}
    </Panel>
  );
}
