import type { RecordEntry } from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { dutyLabels, statusLabels } from "./labels";

/** Use the saved labels so revision history keeps the original planning context. */
export function RecordDetails({ record }: { record: RecordEntry }) {
  const data = record.data;
  if (!("date" in data)) return <p>{t("Configuration")}</p>;
  return (
    <p>
      {data.date} · {data.start}
      {data.end && `–${data.end}`}
      {"status" in data && <> · {t(statusLabels[data.status])}</>}
      {"duty" in data && (
        <>
          {" · "}
          {t(dutyLabels[data.duty])}
          {data.shiftLabel && <> · {data.shiftLabel}</>}
          {data.targetLabel && <> · {data.targetLabel}</>}
          {data.phone && (
            <>
              {" "}
              · ☎{" "}
              {data.phone === "maintenance"
                ? t("Maintenance")
                : data.phoneLabel || data.phone}
            </>
          )}
        </>
      )}
    </p>
  );
}
