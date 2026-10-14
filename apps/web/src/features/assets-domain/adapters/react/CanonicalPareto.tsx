import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Button, DateField, Disclosure, Field, FieldRow, MetricCard, MetricGrid, Panel, Select, Table, TableViewport } from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import type { CanonicalPareto as Result, ParetoSelection } from "../../domain/models";
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
  return <><Panel><form onSubmit={async e => {
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
            }}><option value="frequency">{t("Reported frequency")}</option><option value="alarm-seconds">{t("Accumulated alarm seconds")}</option></Select></Field></FieldRow><Actions className="iop-form-actions"><Button type="submit" disabled={busy}>{t("Load canonical asset Pareto")}</Button></Actions></form></Panel>{error && <Alert>{error}</Alert>}{result && <>
  <MetricGrid><MetricCard label={t("Full source total")} value={number(loadedMetric === "frequency" ? result.totals.frequency : result.totals.alarmSeconds)} /><MetricCard label={t("Explicitly mapped measure")} value={number(loadedMetric === "frequency" ? result.mapped.frequency : result.mapped.alarmSeconds)} /><MetricCard label={t("Unresolved measure")} value={number(loadedMetric === "frequency" ? result.unresolved.frequency : result.unresolved.alarmSeconds)} /></MetricGrid>
  <TableViewport><Table aria-label={t("Canonical asset Pareto")}><thead><tr><th>{t("Canonical asset")}</th><th>{t("Reported frequency")}</th><th>{t("Alarm seconds")}</th><th>{t("Cumulative % of full total")}</th></tr></thead><tbody>{result.groups.map(g => <tr key={g.assetId}><td>{g.assetCode || t("Unavailable")}</td><td>{number(g.frequency)}</td><td>{number(g.alarmSeconds)}</td><td>{g.cumulativePercent === null ? t("Unavailable") : number(g.cumulativePercent) + "%"}</td></tr>)}</tbody></Table></TableViewport><p>{result.groups.length} / {result.groupCount} {t("mapped asset groups")}</p><p>{t(result.limitations)}</p>
  <Disclosure summary={t("Mapping coverage and provenance")}><p>{t("Source states")}: {Object.entries(result.states).map(([state, count]) => state + ": " + count).join("; ")}</p><p>{t("Missing reporting dates")}: {result.missingDates.join(", ") || t("None")}</p><p>{t("Admitted reporting dates")}: {result.admittedDates.join(", ") || t("None")}</p><p className="iop-asset-domain-provenance">{t("Projection revision")}: {result.projectionRevision}</p></Disclosure>
 </>}</>;
}
