import {
  Badge,
  Disclosure,
  Table,
  TableText,
  TableViewport,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { Asset, Context } from "../../domain/models";
import { assetStatusLabel } from "./labels";
export function AssetDetails({
  asset,
  context,
  timeZone,
}: {
  asset: Asset;
  context: Context;
  timeZone: string;
}) {
  const { content } = asset;
  const instant = (value: string) =>
    new Date(value).toLocaleString(locale(), { timeZone });
  return (
    <>
      <div className="assets-collection-heading">
        <h2>{content.code}</h2>
        <Badge tone={content.status === "validated" ? "success" : "neutral"}>
          {assetStatusLabel(content.status)}
        </Badge>
      </div>
      <dl className="iop-detail-fields">
        {[
          ...(content.name !== content.code
            ? [["Original recorded name", content.name]]
            : []),
          ["Component type", content.type || "—"],
          [
            "Manual group / location within Bereich",
            content.locationDetails || "—",
          ],
          [
            "Location",
            context.locations.find(
              (location) => location.id === content.locationId,
            )?.label || "—",
          ],
          ["Recorded by", asset.authorName],
          ["Created", instant(asset.createdAt)],
          ["Updated", instant(asset.updatedAt)],
          ["Revision", String(asset.revision)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="assets-muted">
        {t(
          "Identity status records verification or retirement. It does not describe the location or establish whether equipment is operating.",
        )}
      </p>
      {content.description && (
        <section>
          <h3>{t("Asset description")}</h3>
          <p className="assets-prose">{content.description}</p>
        </section>
      )}
      {content.validationNote && (
        <section>
          <h3>{t("Validation note")}</h3>
          <p className="assets-prose">{content.validationNote}</p>
        </section>
      )}
      <Disclosure variant="divided" summary={t("Exact source aliases")}>
        {content.aliases.length ? (
          <TableViewport>
            <Table aria-label={t("Exact source aliases")}>
              <thead>
                <tr>
                  {[
                    "Source namespace",
                    "Source ID",
                    "Source equipment code",
                    "Department",
                    "Area",
                    "Source sector",
                    "Source area",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {t(label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.aliases.map((alias, index) => (
                  <tr key={index}>
                    {[
                      alias.namespace,
                      alias.sourceId,
                      alias.code,
                      context.locations.find(
                        (location) => location.id === alias.departmentId,
                      )?.label || alias.departmentId,
                      context.locations.find(
                        (location) => location.id === alias.areaId,
                      )?.label || alias.areaId,
                      alias.sector,
                      alias.area,
                    ].map((value, position) => (
                      <td key={position}>
                        <TableText>{value || "—"}</TableText>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableViewport>
        ) : (
          <p>
            {t(
              "No source aliases configured. Maintenance can still link directly to this asset.",
            )}
          </p>
        )}
      </Disclosure>
    </>
  );
}
