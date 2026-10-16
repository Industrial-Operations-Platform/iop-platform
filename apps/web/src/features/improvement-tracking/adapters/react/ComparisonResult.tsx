import { Badge, ComparisonCard, DetailFacts, Disclosure, MetricGrid, PageStack, Panel, Table, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { Comparison } from "../../domain/models";
const value = (number: number | null) => number === null ? t("Unavailable") : new Intl.NumberFormat(locale(), {
  maximumFractionDigits: 2
}).format(number);
export function ComparisonResult({
  comparison
}: {
  comparison: Comparison;
}) {
  const metric = comparison.target.metric === "frequency" ? comparison.frequencyPerObservedDate : comparison.alarmSecondsPerObservedDate;
  return <Panel className="iop-improvement-comparison" aria-label={t("Observed before and after result")}><PageStack>
    <MetricGrid layout="paired"><ComparisonCard label={t("Before per observed reporting date")} value={value(metric.before)} state="equal" comparison={comparison.before.admittedDates.length + " " + t("admitted reporting dates")} />
      <ComparisonCard label={t("After per observed reporting date")} value={value(metric.after)} state={metric.change === null ? "unavailable" : metric.change < 0 ? "better" : metric.change > 0 ? "worse" : "equal"} comparison={metric.reductionPercent === null ? t("Percentage reduction unavailable") : value(metric.reductionPercent) + "% " + t("observed reduction")} /></MetricGrid>
    <p><Badge tone={comparison.observedTarget === "met" ? "success" : comparison.observedTarget === "not-met" ? "warning" : "neutral"}>{t("Observed target")}: {t({"not-assessable":"Not assessable",met:"Met","not-met":"Not met","not-quantified":"Not quantified"}[comparison.observedTarget])}</Badge> · {t(comparison.target.metric === "frequency" ? "Reported frequency" : "Accumulated alarm seconds")}</p>
    <TableViewport><Table aria-label={t("Source measures and coverage")}><thead><tr><th scope="col" data-align="text">{t("Period")}</th><th scope="col" data-align="number">{t("Reported frequency")}</th><th scope="col" data-align="number">{t("Alarm seconds")}</th><th scope="col" data-align="number">{t("Observed / eligible dates")}</th><th scope="col" data-align="number">{t("Missing dates")}</th></tr></thead><tbody>{(["before", "after"] as const).map(key => <tr key={key}><th scope="row" data-align="text">{t(key === "before" ? "Before" : "After")} · {comparison[key].from} – {comparison[key].toExclusive} ({t("exclusive")})</th><td data-align="number">{value(comparison[key].frequency)}</td><td data-align="number">{value(comparison[key].alarmSeconds)}</td><td data-align="number">{comparison[key].admittedDates.length} / {comparison[key].eligibleDates.length}</td><td data-align="number">{comparison[key].missingDates.length}</td></tr>)}</tbody></Table></TableViewport>
    {comparison.warnings.length > 0 && <ul>{comparison.warnings.map(w => <li key={w}>{t(w)}</li>)}</ul>}
    <p>{t(comparison.attribution)}</p>
    <Disclosure summary={t("Coverage and source provenance")}><PageStack><DetailFacts items={[
      { label: t("Source"), value: comparison.sourceId },
      { label: t("Site time zone"), value: comparison.siteTimeZone },
      { label: t("Reporting profile"), value: comparison.profileVersion },
      { label: t("Publication revision"), value: comparison.publicationRevision },
    ]} />
      {comparison.aliases.length > 0 && <p>{t("Exact asset aliases")}: {comparison.aliases.map(a => [a.sector, a.area, a.code].join(" / ")).join("; ")}</p>}
      {comparison.selection.scope === "selection" && <p>{t("Exact source filters")}: {Object.entries(comparison.selection.filters).filter(([, v]) => v).map(([k, v]) => k + ": " + v).join("; ")}</p>}
      {(["before", "after"] as const).map(key => <div key={key}><h3>{t(key === "before" ? "Before" : "After")}</h3><p>{t("Admitted dates")}: {comparison[key].admittedDates.join(", ") || t("None")}</p><p>{t("Missing dates")}: {comparison[key].missingDates.join(", ") || t("None")}</p><p>{t("Excluded calendar dates")}: {comparison[key].excludedDates.join(", ") || t("None")}</p></div>)}
    </PageStack></Disclosure>
  </PageStack></Panel>;
}
