import { t } from "../../../../localization/i18n";
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
  months,
  onChange,
}: {
  month: string;
  months: string[];
  onChange: (month: string) => void;
}) {
  return (
    <FilterForm
      className="analysis-filters"
      onSubmit={(event) => event.preventDefault()}
    >
      <Disclosure
        summary={
          <>
            {t("Month · ")}
            {month}
          </>
        }
      >
        <FieldRow>
          <MonthPicker months={months} value={month} onChange={onChange} />
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
        {executive.month} · {executive.importedDays}
        {t(" of")} {executive.analysisDays ?? executive.calendarDays}
        {t(
          " eligible days imported. Monthly totals include all eligible matching rows. Missing dates remain gaps. Lower KPI averages are better. ",
        )}
      </p>
      {executive.importedDays === 0 && (
        <Panel variant="empty">
          <h2>{t("No eligible imported dates in this month")}</h2>
          <p>{t("Choose another month or import a daily CSV.")}</p>
        </Panel>
      )}
      <div className="analysis-executive-grid">
        <Plot
          kind="area-ranking"
          title={t("Top Bereiche by frequency")}
          report={report}
          onSelect={onArea}
        />
        <Plot
          kind="daily-matrix"
          title={t("Bereich frequency by day · highest first")}
          report={report}
          onSelect={onArea}
        />
        <Plot
          kind="daily-overlay"
          title={t("Frequency and alarm minutes per day")}
          report={report}
          onSelect={onArea}
        />
        <div className="analysis-executive-kpis">
          <h2>{t("Monthly KPI comparison")}</h2>
          <MetricGrid
            className="analysis-kpis"
            aria-label={t("Monthly KPI comparison")}
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
                  <small>
                    {unit}
                    {t(" · monthly daily average")}
                  </small>
                  <small>
                    {kpi.referenceKind === "goal"
                      ? t("Goal")
                      : t("Historical daily average")}
                    : {kpi.reference === null ? "—" : number(kpi.reference)}{" "}
                    {unit}
                  </small>
                  <small>
                    {t("Month total: ")}
                    {number(kpi.total)}{" "}
                    {kpi.metric === "duration"
                      ? t("alarm minutes")
                      : "occurrences"}
                  </small>
                </ComparisonCard>
              );
            })}
          </MetricGrid>
          <p className="analysis-footnote">
            {t(
              "Daily averages divide by eligible imported dates, including eligible days with no matching errors. Historical reference includes all",
            )}{" "}
            {executive.historicalDays}
            {t(
              " eligible imported dates, including this month. Explicit goals override the historical reference. Equal values are neutral; percentages are undefined against zero. ",
            )}
          </p>
        </div>
      </div>
      <p className="analysis-footnote">
        {t(
          "Areas rank by the selected month's total frequency. Up to 100 areas; scroll the ranking and matrix for more. Frequency and duration are overlaid on separately labelled axes. Alarm duration is not plant downtime. ",
        )}
      </p>
    </>
  );
}
