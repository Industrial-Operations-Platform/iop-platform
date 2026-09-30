import { useEffect, useState } from "react";
import { Alert, Button, Panel } from "../../../../design/components";
import type { WorkforceApplication } from "../../application/workforce";
import { entries, type Board } from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { statusLabels, dutyLabels } from "./labels";
export function WorkforceToday({
  application,
  timeZone,
  open,
}: {
  application: WorkforceApplication;
  timeZone: string;
  open: () => void;
}) {
  const [board, setBoard] = useState<Board>(),
    [error, setError] = useState("");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  useEffect(() => {
    let active = true;
    void application
      .board(today, today)
      .then((value) => {
        if (active) setBoard(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [application, today]);
  const own = board
      ? entries(board, "assignment").filter(
          (r) => r.data.userId === board.actorId,
        )
      : [],
    schedule = board
      ? entries(board, "schedule").find((r) => r.data.userId === board.actorId)
      : undefined;
  return (
    <Panel>
      <h2>{t("Your assignment")}</h2>
      {error ? (
        <Alert>{t(error)}</Alert>
      ) : !board ? (
        <p>{t("Loading…")}</p>
      ) : (
        <>
          <p>
            {today} ·{" "}
            {schedule
              ? t(statusLabels[schedule.data.status])
              : t("No schedule imported")}
          </p>
          {own.map((r) => (
            <p key={r.id}>
              <strong>
                {board.settings.targets.find(
                  (target) => target.id === r.data.targetId,
                )?.label || t(dutyLabels[r.data.duty])}
              </strong>{" "}
              · {r.data.start}–{r.data.end}
            </p>
          ))}
          {!own.length && <p>{t("No assignment yet")}</p>}
        </>
      )}
      <Button variant="secondary" onClick={open}>
        {t("Workforce & shifts")}
      </Button>
    </Panel>
  );
}
