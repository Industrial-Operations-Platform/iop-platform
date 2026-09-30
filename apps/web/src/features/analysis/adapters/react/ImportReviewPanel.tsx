import { t } from "../../../../localization/i18n";
import {
  MetricCard,
  MetricGrid,
  Panel,
  Table,
  TableViewport,
} from "../../../../design/components";
import type { ImportReview, ImportSummary } from "../../domain/models";
import { number } from "../echarts/charts";

export function importOutcome(
  value: Pick<ImportSummary, "outcome" | "reasonCode">,
): string {
  if (value.reasonCode === "duplicate-date") return "Duplicate reporting date";
  return {
    succeeded: "Import complete",
    rejected: "Import rejected",
    failed: "Import failed",
    received: "Awaiting final outcome",
  }[value.outcome];
}

export function ImportReviewPanel({
  review,
  originalUrl,
}: {
  review: ImportReview;
  originalUrl: string;
}) {
  return (
    <Panel className="analysis-import" aria-label={t("Import review")}>
      <h2>{importOutcome(review)}</h2>
      <p role="status">
        {review.originalFilename}
        {t(" · Reporting date:")} <strong>{review.reportingDate}</strong>
      </p>
      {review.reasonCode && (
        <p>
          {t("Reason: ")}
          {review.reasonCode}
        </p>
      )}
      {review.reasonCode === "duplicate-date" && (
        <p>
          {t(
            "This date already has an accepted file. The existing data was preserved; this upload added no rows. ",
          )}
        </p>
      )}
      {review.outcome === "received" && (
        <p>
          {t(
            "The final outcome is not yet known. Use Review or Recover import outcome in the history before attempting another upload. ",
          )}
        </p>
      )}
      <MetricGrid
        className="analysis-import-counts"
        aria-label={t("File import volume")}
      >
        {[
          [t("Source rows"), review.dataRecordCount],
          [t("Admitted rows"), review.admittedRecordCount],
          [t("Rejected rows"), review.rejectedRecordCount],
          [t("File size · bytes"), review.byteLength],
        ].map(([label, value]) => (
          <MetricCard
            key={t(String(label))}
            label={t(String(label))}
            value={value === null ? t("Unknown") : number(Number(value))}
          />
        ))}
      </MetricGrid>
      <p>
        {t("Inspection:")}{" "}
        {review.inspectionComplete
          ? "complete"
          : t("partial — counts may be incomplete")}
        .
      </p>
      <TableViewport>
        <Table>
          <caption>{t("Import inspection details")}</caption>
          <thead>
            <tr>
              <th>{t("Valid inspected rows")}</th>
              <th>{t("Invalid inspected rows")}</th>
              <th>{t("Unclassified rows at import")}</th>
              <th>{t("Repeated rows within file")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{number(review.inspectedValidCount)}</td>
              <td>{number(review.inspectedInvalidCount)}</td>
              <td>{number(review.unclassifiedCount)}</td>
              <td>{number(review.repeatedCount)}</td>
            </tr>
          </tbody>
        </Table>
      </TableViewport>
      <p>
        {t(
          "Inspection counts describe checked source rows; admitted rows confirm what was saved. Repeated rows within a file are separate from a duplicate reporting date. ",
        )}
      </p>
      {review.diagnostics.length > 0 && (
        <TableViewport>
          <Table>
            <caption>{t("Import diagnostics")}</caption>
            <thead>
              <tr>
                <th>{t("Line")}</th>
                <th>{t("Field")}</th>
                <th>{t("Issue")}</th>
              </tr>
            </thead>
            <tbody>
              {review.diagnostics.map((d, i) => (
                <tr key={i}>
                  <td>{d.line ?? "—"}</td>
                  <td>{d.field ?? t("File")}</td>
                  <td>{d.reason ?? d.code}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      )}
      {review.diagnosticsTruncated && (
        <p>
          {t(
            "Only the first diagnostics are shown. Download the original file to investigate the remaining rows. ",
          )}
        </p>
      )}
      <a href={originalUrl}>{t("Download preserved original")}</a>
    </Panel>
  );
}
