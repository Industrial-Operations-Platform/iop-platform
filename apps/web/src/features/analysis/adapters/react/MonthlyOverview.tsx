import {
  ComparisonCard,
  Disclosure,
  FieldRow,
  FilterForm,
  Panel,
  MetricGrid,
  MonthPicker,
} from "../../../../design/components";
import type { Report } from "../../domain/models";
import { number } from "../echarts/charts";
import { Plot } from "./Plot";

export function ExecutiveMonthControls({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(event) => event.preventDefault()}
    >
      <Disclosure summary={<>Month · {month}</>}>
        <FieldRow>
          <MonthPicker value={month} onChange={onChange} />
        </FieldRow>
      </Disclosure>
    </FilterForm>
  );
}
export function MonthlyOverview({
  report,
  onArea,
}: {
  report: Report;
  onArea: (area: string) => void;
}) {
  const executive = report.monthlyExecutive;
  if (!executive) return null;
  return (
    <>
      <p className="analysis-footnote">
        {executive.month} · {executive.importedDays} of {executive.calendarDays}{" "}
        days imported. Monthly totals include all matching rows. Missing dates
        remain gaps. Lower KPI averages are better.
      </p>
      {executive.importedDays === 0 && (
        <Panel variant="empty">
          <h2>No imported dates in this month</h2>
          <p>Choose another month or import a daily CSV.</p>
        </Panel>
      )}
      <div className="analysis-executive-grid">
        <Plot
          kind="area-ranking"
          title="Top Bereiche by frequency"
          report={report}
          onSelect={onArea}
        />
        <Plot
          kind="daily-matrix"
          title="Bereich frequency by day · highest first"
          report={report}
          onSelect={onArea}
        />
        <Plot
          kind="daily-overlay"
          title="Frequency and alarm minutes per day"
          report={report}
          onSelect={onArea}
        />
        <div className="analysis-executive-kpis">
          <h2>Monthly KPI comparison</h2>
          <MetricGrid
            className="analysis-kpis"
            aria-label="Monthly KPI comparison"
          >
            {executive.kpis.map((kpi) => {
              const unit =
                kpi.metric === "duration"
                  ? "alarm minutes/day"
                  : "occurrences/day";
              const change =
                kpi.changePercent === null
                  ? ""
                  : ` · ${kpi.changePercent > 0 ? "+" : ""}${number(kpi.changePercent)}%`;
              const text = {
                better: "Below reference",
                worse: "Above reference",
                equal: "At reference",
                unavailable: "No imported coverage",
              }[kpi.status];
              return (
                <ComparisonCard
                  key={kpi.id}
                  label={kpi.label}
                  value={kpi.average === null ? "—" : number(kpi.average)}
                  state={kpi.status}
                  comparison={text + change}
                >
                  <small>{unit} · monthly daily average</small>
                  <small>
                    {kpi.referenceKind === "goal"
                      ? "Goal"
                      : "Historical daily average"}
                    : {kpi.reference === null ? "—" : number(kpi.reference)}{" "}
                    {unit}
                  </small>
                  <small>
                    Month total: {number(kpi.total)}{" "}
                    {kpi.metric === "duration"
                      ? "alarm minutes"
                      : "occurrences"}
                  </small>
                </ComparisonCard>
              );
            })}
          </MetricGrid>
          <p className="analysis-footnote">
            Daily averages divide by imported dates, including imported days
            with no matching errors. Historical reference includes all{" "}
            {executive.historicalDays} imported dates, including this month.
            Explicit goals override the historical reference. Equal values are
            neutral; percentages are undefined against zero.
          </p>
        </div>
      </div>
      <p className="analysis-footnote">
        Areas rank by the selected month's total frequency. Up to 100 areas;
        scroll the ranking and matrix for more. Frequency and duration are
        overlaid on separately labelled axes. Alarm duration is not plant
        downtime.
      </p>
    </>
  );
}
