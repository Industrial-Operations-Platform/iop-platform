import type { RecordEntry } from "../../domain/models";
import { locale, t } from "../../../../localization/i18n";
import { dutyLabels, statusLabels } from "./labels";

/** Saved labels preserve the original planning context in revision history. */
export function RecordDetails({ record }: { record: RecordEntry }) {
  const data = record.data;
  if (!("date" in data)) return <p>{t("Configuration")}</p>;
  const fields = [
    [
      "Date",
      new Date(data.date + "T12:00:00Z").toLocaleDateString(locale(), {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }),
    ],
    ["Time", data.start ? `${data.start}–${data.end}` : "—"],
    ...("status" in data ? [["Status", t(statusLabels[data.status])]] : []),
    ...("duty" in data
      ? [
          ["Duty", t(dutyLabels[data.duty])],
          ["Shift", data.shiftLabel],
          ["Department / Halle", data.targetLabel],
          [
            "Phone",
            data.phone === "maintenance"
              ? t("Maintenance")
              : data.phoneLabel || data.phone,
          ],
        ]
      : []),
  ].filter(([, value]) => value);
  return (
    <dl className="iop-detail-fields">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label!)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
