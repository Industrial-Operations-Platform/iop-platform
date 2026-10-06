import { Badge } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { MaintenanceSnapshot } from "../../domain/models";
import { statusLabel, statusTone } from "./labels";
export function MaintenanceDetails({
  record,
  timeZone,
}: {
  record: MaintenanceSnapshot;
  timeZone: string;
}) {
  const { data } = record;
  const instant = (value: string) =>
    new Date(value).toLocaleString(locale(), { timeZone });
  return (
    <>
      <h2>{data.title}</h2>
      <div className="maintenance-metadata">
        <Badge tone={statusTone(data.status)}>{statusLabel(data.status)}</Badge>
        <Badge>{record.priorityLabel || data.priorityId}</Badge>
        <Badge>
          {t(
            {
              corrective: "Corrective",
              preventive: "Preventive",
              inspection: "Inspection",
            }[data.category ?? "corrective"],
          )}
        </Badge>
      </div>
      <div className="maintenance-detail-layout">
        <div className="maintenance-narrative">
          <section>
            <h3>{t("Work details")}</h3>
            <p>{data.details || t("No work details recorded.")}</p>
          </section>
          {data.blockedReason && (
            <section>
              <h3>{t("Blocked reason")}</h3>
              <p>{data.blockedReason}</p>
            </section>
          )}
          {data.outcome && (
            <section>
              <h3>{t("Work outcome")}</h3>
              <p>{data.outcome}</p>
            </section>
          )}
        </div>
        <dl className="iop-detail-fields">
          {[
            ["Location", record.locationLabel || "—"],
            ["Repair target / manual zone", data.repairTarget || "—"],
            [
              "Equipment identifiers (Betriebsmittelkennzeichen)",
              data.equipment?.map((reference) => reference.code).join(", ") ||
                "—",
            ],
            ["Asset", record.assetName || "—"],
            ["Responsible person", record.assigneeName || t("Unassigned")],
            ["Team", record.teamLabel || "—"],
            ["Due date", data.dueDate || "—"],
            ["External reference", data.externalReference || "—"],
            ["Recorded by", record.authorName],
            ["Created", instant(record.createdAt)],
            ["Updated", instant(record.updatedAt)],
            ["Revision", String(record.revision)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{t(label)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
