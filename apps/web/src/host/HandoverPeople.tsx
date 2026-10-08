import { useEffect, useState } from "react";
import { Alert } from "../design/components";
import { t } from "../localization/i18n";
import type { WorkforceApplication } from "../features/workforce/application/workforce";
import type { Board } from "../features/workforce/domain/models";
import { DailyPlan } from "../features/workforce/adapters/react/PlanBoard";

/** Meeting preparation reads the same dated planning source and presentation. */
export function HandoverPeople({ application, date, open }: {
  application: WorkforceApplication;
  date: string;
  open: () => void;
}) {
  const [board, setBoard] = useState<Board>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void application.board(date, date).then((result) => { if (active) setBoard(result); })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [application, date]);
  if (error) return <Alert>{error}</Alert>;
  if (!board) return <p role="status">{t("Loading assignments…")}</p>;
  return <DailyPlan board={board} date={date} select={open} />;
}
