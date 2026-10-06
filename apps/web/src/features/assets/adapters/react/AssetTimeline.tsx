import {
  Badge,
  Button,
  DateField,
  FieldRow,
  Panel,
  ViewNavigation,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { SourceKind, Timeline } from "../../domain/models";
import { coverageLabel, sourceLabel } from "./labels";
export function AssetTimeline({
  timeline,
  from,
  to,
  source,
  pending,
  timeZone,
  onDates,
  onSource,
  loadMore,
  openSource,
}: {
  timeline?: Timeline;
  from: string;
  to: string;
  source: "" | SourceKind;
  pending: boolean;
  timeZone: string;
  onDates: (from: string, to: string) => void;
  onSource: (kind: "" | SourceKind) => void;
  loadMore: () => void;
  openSource?: (kind: SourceKind, id: string) => void;
}) {
  const records = timeline?.records ?? [];
  const total = timeline?.total ?? 0;
  const availableSources =
    timeline?.sources.filter((coverage) => coverage.status === "available") ??
    [];
  const countAvailable = source
    ? timeline?.sources.find((coverage) => coverage.kind === source)?.status ===
      "available"
    : availableSources.length > 0;
  return (
    <section className="assets-timeline" aria-label={t("Asset timeline")}>
      <FieldRow>
        <DateField
          label={t("From")}
          value={from}
          max={to || undefined}
          onChange={(event) => onDates(event.target.value, to)}
        />
        <DateField
          label={t("To")}
          value={to}
          min={from || undefined}
          onChange={(event) => onDates(from, event.target.value)}
        />
      </FieldRow>
      <p className="assets-muted">
        {t(
          "Select an inclusive date window of up to 366 days. Daily event aggregates retain their reporting date and do not represent individual incident times.",
        )}
      </p>
      {timeline && (
        <>
          <div className="assets-coverage" aria-label={t("Source coverage")}>
            {timeline.sources.map((coverage) => (
              <Panel key={coverage.kind}>
                <strong>{sourceLabel(coverage.kind)}</strong>
                <Badge
                  tone={coverage.status === "available" ? "neutral" : "warning"}
                >
                  {coverageLabel(coverage.status)}
                </Badge>
                <span>
                  {coverage.status === "available"
                    ? t("{0} records in this window", [coverage.total])
                    : t("No count available")}
                </span>
              </Panel>
            ))}
          </div>
          <ViewNavigation
            placement="tabs"
            label={t("Timeline sources")}
            selected={source || "all"}
            onSelect={(value) =>
              onSource(value === "all" ? "" : (value as SourceKind))
            }
            items={[
              {
                id: "all",
                label: t("All sources"),
                count: availableSources.length
                  ? availableSources.reduce(
                      (count, coverage) => count + coverage.total,
                      0,
                    )
                  : undefined,
              },
              ...timeline.sources.map((coverage) => ({
                id: coverage.kind,
                label: sourceLabel(coverage.kind),
                count:
                  coverage.status === "available" ? coverage.total : undefined,
              })),
            ]}
          />
          {records.map((record) => (
            <Panel key={record.id} className="assets-timeline-record">
              <div className="assets-collection-heading">
                <h3>{record.title}</h3>
                <Badge>{sourceLabel(record.kind)}</Badge>
              </div>
              <div className="assets-timeline-metadata">
                <strong>{record.date}</strong>
                <Badge>
                  {t(
                    record.periodKind === "daily-aggregate"
                      ? "Daily aggregate"
                      : "Calendar date",
                  )}
                </Badge>
                {record.recordedAt && (
                  <span>
                    {t("Recorded")}:{" "}
                    {new Date(record.recordedAt).toLocaleString(locale(), {
                      timeZone,
                    })}
                  </span>
                )}
              </div>
              <p className="assets-prose">{record.summary}</p>
              {record.periodKind === "daily-aggregate" && (
                <dl className="iop-detail-fields">
                  <div>
                    <dt>{t("Frequency")}</dt>
                    <dd>{record.frequency ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("Alarm duration (seconds)")}</dt>
                    <dd>{record.seconds ?? "—"}</dd>
                  </div>
                </dl>
              )}
              {openSource && record.sourceRecordId && (
                <Button
                  variant="secondary"
                  onClick={() => openSource(record.kind, record.sourceRecordId)}
                >
                  {t("Open source record")}
                </Button>
              )}
            </Panel>
          ))}
          {!records.length && (
            <Panel variant="empty">
              {t("No records shown for this source and date window.")}
            </Panel>
          )}
          <div className="assets-collection-heading">
            <p role="status">
              {countAvailable
                ? t("Showing {0} of {1} records.", [records.length, total])
                : t("No count available")}
            </p>
            {timeline.nextCursor && (
              <Button variant="secondary" disabled={pending} onClick={loadMore}>
                {t("Load more")}
              </Button>
            )}
          </div>
        </>
      )}
      {pending && !timeline && <Panel>{t("Loading timeline…")}</Panel>}
    </section>
  );
}
