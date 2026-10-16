import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Button, DateField, DetailFacts, Disclosure, Field, FieldRow, MetricCard, MetricGrid, PageStack, Panel, Select, Table, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import type { CanonicalPareto as Result, ParetoSelection } from "../../domain/models";
import { assetStateLabel } from "./AssetStateBadge";
export function CanonicalPareto({
  application
}: {
  application: AssetDomainApplication;
}) {
  const [selection, setSelection] = useState<ParetoSelection>({
      from: "",
      toExclusive: "",
      metric: "frequency",
      limit: 50
    }),
    [result, setResult] = useState<Result | null>(null),
    [loadedMetric, setLoadedMetric] = useState<ParetoSelection["metric"]>("frequency"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requestEpoch = useRef(0);
  useEffect(() => {
    setResult(null);
    return () => {
      requestEpoch.current += 1;
    };
  }, [application]);
  const changed = () => {
    requestEpoch.current += 1;
    setBusy(false);
    setError("");
  };
  const number = (v: number) => new Intl.NumberFormat(locale(), {
    maximumFractionDigits: 2
  }).format(v);
  return <PageStack><Panel><form className="iop-asset-domain-form" onSubmit={async e => {
        e.preventDefault();
        const current = ++requestEpoch.current;
        setBusy(true);
        setError("");
        try {
          const data = await application.pareto(selection);
          if (requestEpoch.current === current) {
            setResult(data);
            setLoadedMetric(data.selection.metric);
          }
        } catch (e) {
          if (requestEpoch.current === current) setError((e as Error).message);
        } finally {
          if (requestEpoch.current === current) setBusy(false);
        }
      }}><FieldRow><DateField label={t("From")} required value={selection.from} onChange={e => {
            changed();
            setSelection(s => ({
              ...s,
              from: e.target.value
            }));
          }} /><DateField label={t("End date (exclusive)")} required value={selection.toExclusive} onChange={e => {
            changed();
            setSelection(s => ({
              ...s,
              toExclusive: e.target.value
            }));
          }} /><Field>{t("Metric")}<Select value={selection.metric} onChange={e => {
              changed();
              setSelection(s => ({
                ...s,
                metric: e.target.value as ParetoSelection["metric"]
              }));
            }}><option value="frequency">{t("Reported frequency")}</option><option value="alarm-seconds">{t("Accumulated alarm seconds")}</option></Select></Field></FieldRow><Actions className="iop-form-actions"><Button type="submit" disabled={busy}>{t("Load canonical asset Pareto")}</Button><Button variant="secondary" disabled={busy} onClick={() => { changed(); setSelection({ from: "", toExclusive: "", metric: "frequency", limit: 50 }); setResult(null); }}>{t("Reset Pareto filters")}</Button></Actions></form></Panel>{busy && <p role="status">{t("Loading canonical asset Pareto…")}</p>}{error && <Alert>{error}</Alert>}{result && <>
  <p className="iop-asset-domain-muted">{t("Loaded reporting period")}: {result.selection.from} / {result.selection.toExclusive} · {t(loadedMetric === "frequency" ? "Reported frequency" : "Accumulated alarm seconds")}</p>
  <MetricGrid><MetricCard label={t("Full source total")} value={number(loadedMetric === "frequency" ? result.totals.frequency : result.totals.alarmSeconds)} /><MetricCard label={t("Explicitly mapped measure")} value={number(loadedMetric === "frequency" ? result.mapped.frequency : result.mapped.alarmSeconds)} /><MetricCard label={t("Unresolved measure")} value={number(loadedMetric === "frequency" ? result.unresolved.frequency : result.unresolved.alarmSeconds)} /></MetricGrid>
  <TableViewport><Table variant="records" aria-label={t("Canonical asset Pareto")}><thead><tr><th data-align="text">{t("Canonical asset")}</th><th data-align="number">{t("Reported frequency")}</th><th data-align="number">{t("Alarm seconds")}</th><th data-align="number">{t("Cumulative % of full total")}</th></tr></thead><tbody>{result.groups.map(g => <tr key={g.assetId}><td data-align="text">{g.assetCode || t("Unavailable")}</td><td data-align="number">{number(g.frequency)}</td><td data-align="number">{number(g.alarmSeconds)}</td><td data-align="number">{g.cumulativePercent === null ? t("Unavailable") : number(g.cumulativePercent) + "%"}</td></tr>)}{!result.groups.length && <tr><td colSpan={4}>{t("No mapped asset measures for this period.")}</td></tr>}</tbody></Table></TableViewport><p aria-live="polite">{result.groups.length} / {result.groupCount} {t("mapped asset groups")}</p><p>{t(result.limitations)}</p>
  <Disclosure summary={t("Mapping coverage and provenance")} variant="panel"><DetailFacts items={Object.entries(result.states).map(([state, count]) => ({ label: assetStateLabel(state), value: number(count) }))} /><p>{t("Missing reporting dates")}: {result.missingDates.join(", ") || t("None")}</p><p>{t("Admitted reporting dates")}: {result.admittedDates.join(", ") || t("None")}</p><p className="iop-asset-domain-provenance">{t("Projection revision")}: {result.projectionRevision}</p></Disclosure>
 </>}</PageStack>;
}
