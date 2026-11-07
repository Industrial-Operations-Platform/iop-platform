import { t } from "../../../../localization/i18n";
import {
  Button, ComparisonCard, DetailFacts, Disclosure, FieldRow, FilterForm,
  Panel, MetricGrid, MonthPicker, Popover,
} from "../../../../design/components";
import type { ExecutiveKpi, Report } from "../../domain/models";
import { number } from "../echarts/charts";
import { Plot } from "./Plot";

export function ExecutiveMonthControls({ month, months, onChange }: {
  month: string;
  months: string[];
  onChange: (month: string) => void;
}) {
  return (
    <FilterForm className="analysis-filters" onSubmit={event => event.preventDefault()}>
      <Disclosure summary={<>{t("Month · ")}{month}</>}>
        <FieldRow>
          <MonthPicker months={months} value={month} onChange={onChange} />
        </FieldRow>
      </Disclosure>
    </FilterForm>
  );
}

export function MonthlyOverview({ report, onArea }: {
  report: Report;
  onArea: (area: string) => void;
}) {
  const executive = report.monthlyExecutive;
  if (!executive) return null;
  return (
    <>
      <p className="analysis-footnote">
        {executive.month} · {executive.importedDays}{t(" of")} {executive.analysisDays ?? executive.calendarDays}
        {t(" eligible days imported. Monthly totals include all eligible matching rows. Missing dates remain gaps. Lower KPI averages are better. ")}
      </p>
      {executive.importedDays === 0 && (
        <Panel variant="empty">
          <h2>{t("No eligible imported dates in this month")}</h2>
          <p>{t("Choose another month or import a daily CSV.")}</p>
        </Panel>
      )}
      <div className="analysis-executive-grid">
        <Plot kind="area-ranking" title={t("Top Bereiche by frequency")} report={report} onSelect={onArea} />
        <Plot kind="daily-matrix" title={t("Bereich frequency by day · highest first")} report={report} onSelect={onArea} />
      </div>
      <div className="analysis-executive-summary">
        <Plot kind="daily-overlay" title={t("Frequency and alarm minutes per day")} report={report} onSelect={onArea} />
        <Panel variant="chart" className="analysis-executive-kpis">
          <h2>{t("Monthly KPI comparison")}</h2>
          <MetricGrid className="analysis-kpis" aria-label={t("Monthly KPI comparison")}>
            {executive.kpis.map(kpi => {
              const unit = kpi.metric === "duration" ? "alarm minutes/day" : "occurrences/day";
              const change = kpi.changePercent === null ? "" : ` · ${kpi.changePercent > 0 ? "+" : ""}${number(kpi.changePercent)}%`;
              const text = kpi.average !== null && kpi.reference === null ? "No historical reference" : {
                better: "Below reference", worse: "Above reference",
                equal: "At reference", unavailable: "No imported coverage",
              }[kpi.status];
              return (
                <ComparisonCard compact layout="row" key={executive.month + kpi.id}
                  label={kpi.label} value={kpi.average === null ? "—" : number(kpi.average)}
                  state={kpi.status} comparison={t(text) + change}
                  action={
                    <Popover label={t("Show details for {0}", [kpi.label])}
                      triggerTitle={t("Show details")} placement="viewport"
                      triggerClassName="iop-popover-toggle--minimal"
                      trigger={
                        <svg className="iop-toolbar-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                          <circle cx="12" cy="12" r="8" />
                          <path d="M12 11v6M12 7v1" />
                        </svg>
                      }>
                      {close => <KpiDetails kpi={kpi} importedDays={executive.importedDays}
                        historicalDays={executive.historicalDays} historicalFrom={executive.historicalFrom}
                        historicalToExclusive={executive.historicalToExclusive} onClose={close} />}
                    </Popover>
                  }>
                  <small>{t(unit)}</small>
                </ComparisonCard>
              );
            })}
          </MetricGrid>
        </Panel>
      </div>
      <p className="analysis-footnote">
        {t("Areas rank by the selected month's total frequency. Up to 100 areas; scroll the ranking and matrix for more. Frequency and duration are overlaid on separately labelled axes. Alarm duration is not plant downtime. ")}
      </p>
    </>
  );
}

function KpiDetails({ kpi, importedDays, historicalDays, historicalFrom, historicalToExclusive, onClose }: {
  kpi: ExecutiveKpi;
  importedDays: number;
  historicalDays: number;
  historicalFrom?: string | null;
  historicalToExclusive?: string;
  onClose: () => void;
}) {
  const unit = t(kpi.metric === "duration" ? "alarm minutes/day" : "occurrences/day");
  return (
    <div className="analysis-kpi-detail">
      <div className="analysis-kpi-detail-heading">
        <h3>{kpi.label}</h3>
        <Button variant="text" className="iop-popover-toggle--minimal"
          aria-label={t("Close details")} title={t("Close details")} onClick={onClose}>
          <svg className="iop-toolbar-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </Button>
      </div>
      <DetailFacts items={[
        { label: t(kpi.referenceKind === "goal" ? "Goal" : "Historical daily average"),
          value: kpi.reference === null ? "—" : `${number(kpi.reference)} ${unit}` },
        { label: t("Month total"), value: `${number(kpi.total)} ${t(kpi.metric === "duration" ? "alarm minutes" : "occurrences")}` },
        { label: t("Imported days"), value: number(importedDays) },
      ]} />
      <p className="analysis-footnote">
        {t("Daily averages include imported days without matching alarms. Missing dates are excluded.")}{" "}
        {historicalDays === 0 ? t("No imported history is available for comparison.") :
          t("Historical coverage: {0} eligible imported days across all available months.", [number(historicalDays)])}
        {historicalFrom && historicalToExclusive && <> {historicalFrom} – {new Date(Date.parse(historicalToExclusive) - 86400000).toISOString().slice(0, 10)}</>}
      </p>
    </div>
  );
}
