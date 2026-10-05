import { useEffect, useState } from "react";
import { Alert, Button } from "../design/components";
import { t } from "../localization/i18n";
import type { HandoverApplication } from "../features/shift-handover/application/handover";
import type { Context } from "../features/shift-handover/domain/models";
import { EntryDetail } from "../features/shift-handover/adapters/react/EntryDetail";

/** The host composes report details without discarding the maintenance workspace. */
export function MaintenanceEntryDetail({
  application,
  id,
  back,
}: {
  application: HandoverApplication;
  id: string;
  back: () => void;
}) {
  const [context, setContext] = useState<Context>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void application
      .context()
      .then((value) => {
        if (active) setContext(value);
      })
      .catch((exception) => {
        if (active) setError(exception.message);
      });
    return () => {
      active = false;
    };
  }, [application]);
  if (error)
    return (
      <>
        <Button variant="secondary" onClick={back}>
          {t("Return to maintenance")}
        </Button>
        <Alert>{t(error)}</Alert>
      </>
    );
  if (!context) return <p role="status">{t("Loading entry…")}</p>;
  return (
    <EntryDetail
      id={id}
      application={application}
      context={context}
      close={back}
      onHome={back}
      viewLabel="Related operational reports"
      trail={[
        { label: t("Maintenance"), onSelect: back },
        { label: t("Related operational reports"), onSelect: back },
        { label: t("Details") },
      ]}
      onChanged={() => undefined}
    />
  );
}
