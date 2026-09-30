import { t } from "../../../../localization/i18n";
import { AnalysisCalendarNotice } from "./AnalysisCalendarNotice";
import { SourceFiles } from "./SourceFiles";
import { ExecutiveMonthControls, MonthlyOverview } from "./MonthlyOverview";
import { ImportWorkspace } from "./ImportWorkspace";
import { ReportFilters } from "./ReportFilters";
import { Plot } from "./Plot";
import { labels } from "./labels";
import {
  Actions,
  Alert,
  Button,
  Disclosure,
  Field,
  PageHeading,
  Panel,
  Select,
  Table,
  TableViewport,
  ViewNavigation,
} from "../../../../design/components";
import { useEffect, useState } from "react";
import {
  AnalysisWorkspace,
  executiveSelection,
  drillInto,
  selectView,
  reportViews,
} from "../../application/workspace";
import {
  type DemoContext,
  type Dimension,
  type ImportSummary,
  type Report,
  type ReportRequest,
} from "../../domain/models";
import { number } from "../echarts/charts";
import "./workspace.css";

function Notice({ error }: { error: unknown }) {
  return error ? (
    <Alert>
      {error instanceof Error
        ? error.message
        : t("The operation could not be completed.")}
    </Alert>
  ) : null;
}
export function ReportWorkspace({
  application,
  context,
  administration,
  initialAdministrationTool = "imports",
}: {
  application: AnalysisWorkspace;
  context: DemoContext;
  administration: boolean;
  initialAdministrationTool?: "imports" | "files" | "preparation" | "kpis";
}) {
  const [selection, setSelection] = useState<ReportRequest | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [history, setHistory] = useState<ImportSummary[]>([]),
    [months, setMonths] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [template, setTemplate] = useState(0),
    [fileView, setFileView] = useState(initialAdministrationTool === "files");
  useEffect(() => {
    if (!administration) setFileView(false);
  }, [administration]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    void application
      .loadHistory(administration)
      .then((x) => {
        if (active) {
          setHistory(x.history);
          setMonths(x.months);
          setSelection((current) =>
            current
              ? { ...current, revision: undefined, page: 1 }
              : x.selection
                ? template === 0
                  ? executiveSelection(
                      new Date(Date.parse(x.selection!.toExclusive) - 86400000)
                        .toISOString()
                        .slice(0, 7),
                    )
                  : selectView(x.selection, template)
                : null,
          );
          if (!x.selection) setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [application, refresh, administration]);
  useEffect(() => {
    let active = true;
    setReport(null);
    if (!selection || administration) return;
    setLoading(true);
    setError(undefined);
    void application
      .report(selection)
      .then((r) => {
        if (active) setReport(r);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, selection, administration]);
  const drill = (dimension: Dimension, key: string) => {
    if (!selection) return;
    const next = drillInto(selection, template, dimension, key);
    setTemplate(next.view);
    setSelection(next.selection);
  };
  const select = (key: string) => {
    if (selection) drill(selection.dimension, key);
  };
  return (
    <>
      <PageHeading
        title={
          administration && fileView
            ? t("Files & source rows")
            : administration
              ? t("Import & prepare")
              : t("Data analysis")
        }
        eyebrow={
          administration
            ? t("Administration · Data Analysis")
            : t("Operations · Data Analysis")
        }
        description={
          administration
            ? t("Manage daily files, import quality and reporting settings.")
            : t("Daily files. One persistent reporting history.")
        }
        actions={
          <Actions>
            {" "}
            {administration && (
              <Button
                aria-pressed={!fileView}
                onClick={() => setFileView(false)}
              >
                {t("Import & prepare ")}
              </Button>
            )}
            {administration && (
              <Button
                variant="secondary"
                aria-pressed={fileView}
                onClick={() => setFileView(true)}
              >
                {t("Files & source rows ")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setRefresh((x) => x + 1)}
            >
              {t("Refresh history ")}
            </Button>
          </Actions>
        }
      />
      <Notice error={error} />
      {administration && fileView ? (
        <SourceFiles
          key={refresh + history.map((x) => x.importId).join(",")}
          application={application}
          history={history}
        />
      ) : administration ? (
        <ImportWorkspace
          initialSection={
            initialAdministrationTool === "files"
              ? "imports"
              : initialAdministrationTool
          }
          application={application}
          history={history}
          onImported={() => setRefresh((x) => x + 1)}
        />
      ) : (
        <>
          {selection && template === 0 && (
            <ExecutiveMonthControls
              months={months}
              month={selection.from.slice(0, 7)}
              onChange={(month) => setSelection(executiveSelection(month))}
            />
          )}
          {selection && template !== 0 && (
            <ReportFilters
              key={JSON.stringify(selection)}
              selection={selection}
              months={months}
              view={template}
              report={report}
              onApply={(s) => setSelection(s)}
            />
          )}
          {loading ? (
            <p role="status">{t("Loading historical analysis…")}</p>
          ) : !selection ? (
            <Panel variant="empty">
              <h2>{t("Your history starts with a CSV")}</h2>
              <p>
                {administration
                  ? t("Open Import & prepare to add a daily file.")
                  : t("An administrator can import daily files for analysis.")}
              </p>
            </Panel>
          ) : (
            report && (
              <>
                <AnalysisCalendarNotice
                  excludedWeekdays={report.excludedWeekdays}
                />
                {template === 0 && (
                  <MonthlyOverview
                    report={report}
                    onArea={(area) => drill("area", area)}
                  />
                )}
                {template !== 0 && (
                  <p className="analysis-footnote">
                    {t(
                      "All eligible matching historical rows contribute to totals. Rankings show up to 100 of ",
                    )}
                    {number(report.groupCount)}{" "}
                    {t(
                      "groups; charts show the top 10 unless stated. Duration is accumulated alarm time, not plant downtime. ",
                    )}
                  </p>
                )}
                {template !== 0 &&
                  (report.totals.records === 0 ? (
                    <Panel variant="empty">
                      <h2>{t("No matching records")}</h2>
                      <p>{t("Adjust the dates or dimension filters.")}</p>
                    </Panel>
                  ) : (
                    <div className="analysis-charts">
                      {template === 5 ? (
                        <>
                          <Plot
                            kind="trend"
                            title={t("Frequency and duration over time")}
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="heatmap"
                            title={t("Group behavior by reporting period")}
                            report={report}
                            onSelect={select}
                          />
                        </>
                      ) : (
                        <>
                          <Plot
                            kind={template === 4 ? "messages" : "monthly"}
                            title={t("Comparison between months")}
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="scatter"
                            title={t(
                              "Duration versus frequency · up to 100 groups",
                            )}
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="frequency"
                            title={t("Top 10 by frequency · Pareto")}
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="duration"
                            title={t("Top 10 by duration · Pareto")}
                            report={report}
                            onSelect={select}
                          />
                          {(template === 2 || template === 3) && (
                            <>
                              <Plot
                                kind="trend"
                                title={t("Frequency and duration over time")}
                                report={report}
                                onSelect={select}
                              />
                              <Plot
                                kind="heatmap"
                                title={t("Group behavior by reporting period")}
                                report={report}
                                onSelect={select}
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                <DataTables report={report} onSelect={select} />
                <p className="analysis-footnote">
                  {t(
                    "Reporting dates come from file names; reporting windows are unknown. Missing dates are not zero activity. Monthly comparisons use only imported dates. ",
                  )}
                </p>
              </>
            )
          )}
          <ViewNavigation
            label={t("Analysis templates")}
            selected={template}
            items={reportViews.map(({ title }, id) => ({ id, label: title }))}
            onSelect={(i) => {
              setTemplate(i);
              if (selection) setSelection(selectView(selection, i, months));
            }}
          />
        </>
      )}
    </>
  );
}
function DataTables({
  report,
  onSelect,
}: {
  report: Report;
  onSelect: (key: string) => void;
}) {
  return (
    <Disclosure
      className="analysis-data"
      variant="panel"
      summary={<>{t(" Explore data · rankings and trends ")}</>}
    >
      <TableViewport>
        <Table>
          <caption>
            {t("Group totals · ")}
            {labels[report.selection.dimension]}
          </caption>
          <thead>
            <tr>
              <th>{t("Group")}</th>
              <th>{t("Frequency")}</th>
              <th>{t("Minutes")}</th>
              <th>{t("Rows")}</th>
            </tr>
          </thead>
          <tbody>
            {report.groups.map((g) => (
              <tr key={g.key}>
                <th>
                  <Button variant="text" onClick={() => onSelect(g.key)}>
                    {report.selection.dimension === "duration"
                      ? number(Number(g.key) / 60)
                      : g.key}
                  </Button>
                </th>
                <td>{number(g.frequency)}</td>
                <td>{number(g.minutes)}</td>
                <td>{g.records}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableViewport>
      <TableViewport>
        <Table>
          <caption>{t("Historical trend")}</caption>
          <thead>
            <tr>
              <th>{t("Period")}</th>
              <th>{t("Frequency")}</th>
              <th>{t("Minutes")}</th>
            </tr>
          </thead>
          <tbody>
            {report.timeline.map((p) => (
              <tr key={p.period}>
                <th>{p.period}</th>
                <td>{number(p.frequency)}</td>
                <td>{number(p.minutes)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableViewport>
    </Disclosure>
  );
}
