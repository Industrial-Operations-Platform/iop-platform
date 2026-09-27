import { AnalysisCalendarNotice } from "./AnalysisCalendarNotice";
import { StartOverview } from "./StartOverview";
import { SourceFiles } from "./SourceFiles";
import { ExecutiveMonthControls, MonthlyOverview } from "./MonthlyOverview";
import { ImportWorkspace } from "./ImportWorkspace";
import { ReportFilters } from "./ReportFilters";
import { Plot } from "./Plot";
import { labels } from "./labels";
import {
  Actions,
  Alert,
  AppShell,
  SideNavigation,
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
        : "The operation could not be completed."}
    </Alert>
  ) : null;
}
export function WorkspaceApp({
  application,
}: {
  application: AnalysisWorkspace;
}) {
  const [page, setPage] = useState<"start" | "analysis">("start");
  const [administration, setAdministration] = useState(false);
  const [context, setContext] = useState<DemoContext | null>(null),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [connectionAttempt, setConnectionAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setPending(true);
    setError(undefined);
    void application
      .open()
      .then((c) => {
        if (active) setContext(c);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [application, connectionAttempt]);
  const choose = async (id: string) => {
    setAdministration(false);
    setPending(true);
    setError(undefined);
    setContext((c) => (c ? { ...c, user: null } : c));
    try {
      setContext(await application.gateway.chooseUser(id));
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  return (
    <AppShell
      className="analysis-app"
      mainId="analysis-main"
      skipLabel="Skip to analysis"
      header={
        <>
          {context?.user && context.canImport && (
            <Button
              variant="secondary"
              aria-pressed={administration}
              onClick={() => {
                setAdministration((value) => !value);
                setPage("analysis");
              }}
            >
              {administration ? "Taskforce view" : "Administration"}
            </Button>
          )}
          <Field layout="inline">
            User{" "}
            <Select
              aria-label="Demo user"
              value={context?.user?.id ?? ""}
              disabled={pending}
              onChange={(e) => void choose(e.target.value)}
            >
              <option value="" disabled>
                Select a user
              </option>
              {context?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        </>
      }
      brandAction={{
        label: "IOP · Go to Start",
        onClick: () => setPage("start"),
      }}
      brand={
        <>
          IOP<span>Industrial Operations Platform</span>
        </>
      }
      navigation={
        <SideNavigation
          selected={page}
          onSelect={setPage}
          items={[
            { id: "start", label: "Start" },
            { id: "analysis", label: "Data analysis" },
          ]}
        />
      }
    >
      <Notice error={error} />
      {page === "start" && context?.enabled && !error ? (
        <StartOverview
          key={context.user?.id ?? "no-user"}
          application={application}
          context={context}
          openAnalysis={() => {
            setAdministration(false);
            setPage("analysis");
          }}
        />
      ) : context?.user ? (
        <ReportWorkspace
          key={context.user.id}
          application={application}
          context={context}
          administration={administration && context.canImport}
        />
      ) : (
        <Panel variant="empty">
          <h1>Data analysis</h1>
          <p>
            {context?.enabled
              ? "Select a user in the header to open the workspace."
              : "Connect the local API to open the analytical workspace."}
          </p>
          {(!context?.enabled || !!error) && (
            <Button
              disabled={pending}
              onClick={() => setConnectionAttempt((n) => n + 1)}
            >
              {pending ? "Connecting…" : "Retry connection"}
            </Button>
          )}
        </Panel>
      )}
    </AppShell>
  );
}
function ReportWorkspace({
  application,
  context,
  administration,
}: {
  application: AnalysisWorkspace;
  context: DemoContext;
  administration: boolean;
}) {
  const [selection, setSelection] = useState<ReportRequest | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [history, setHistory] = useState<ImportSummary[]>([]),
    [months, setMonths] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [template, setTemplate] = useState(0),
    [fileView, setFileView] = useState(false);
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
            ? "Files & source rows"
            : administration
              ? "Import & prepare"
              : "Data analysis"
        }
        eyebrow={
          administration
            ? "Administration · Data Analysis"
            : "Taskforce · Data Analysis"
        }
        description={
          administration
            ? "Manage daily files, import quality and reporting settings."
            : "Daily files. One persistent reporting history."
        }
        actions={
          <Actions>
            {" "}
            {administration && (
              <Button
                aria-pressed={!fileView}
                onClick={() => setFileView(false)}
              >
                Import & prepare
              </Button>
            )}
            {administration && (
              <Button
                variant="secondary"
                aria-pressed={fileView}
                onClick={() => setFileView(true)}
              >
                Files & source rows
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setRefresh((x) => x + 1)}
            >
              Refresh history
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
            <p role="status">Loading historical analysis…</p>
          ) : !selection ? (
            <Panel variant="empty">
              <h2>Your history starts with a CSV</h2>
              <p>
                {administration
                  ? "Open Import & prepare to add a daily file."
                  : "An administrator can import daily files for analysis."}
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
                    All eligible matching historical rows contribute to totals.
                    Rankings show up to 100 of {number(report.groupCount)}{" "}
                    groups; charts show the top 10 unless stated. Duration is
                    accumulated alarm time, not plant downtime.
                  </p>
                )}
                {template !== 0 &&
                  (report.totals.records === 0 ? (
                    <Panel variant="empty">
                      <h2>No matching records</h2>
                      <p>Adjust the dates or dimension filters.</p>
                    </Panel>
                  ) : (
                    <div className="analysis-charts">
                      {template === 5 ? (
                        <>
                          <Plot
                            kind="trend"
                            title="Frequency and duration over time"
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="heatmap"
                            title="Group behavior by reporting period"
                            report={report}
                            onSelect={select}
                          />
                        </>
                      ) : (
                        <>
                          <Plot
                            kind={template === 4 ? "messages" : "monthly"}
                            title="Comparison between months"
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="scatter"
                            title="Duration versus frequency · up to 100 groups"
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="frequency"
                            title="Top 10 by frequency · Pareto"
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="duration"
                            title="Top 10 by duration · Pareto"
                            report={report}
                            onSelect={select}
                          />
                          {(template === 2 || template === 3) && (
                            <>
                              <Plot
                                kind="trend"
                                title="Frequency and duration over time"
                                report={report}
                                onSelect={select}
                              />
                              <Plot
                                kind="heatmap"
                                title="Group behavior by reporting period"
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
                  Reporting dates come from file names; reporting windows are
                  unknown. Missing dates are not zero activity. Monthly
                  comparisons use only imported dates.
                </p>
              </>
            )
          )}
          <ViewNavigation
            label="Analysis templates"
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
      summary={<> Explore data · rankings and trends </>}
    >
      <TableViewport>
        <Table>
          <caption>Group totals · {labels[report.selection.dimension]}</caption>
          <thead>
            <tr>
              <th>Group</th>
              <th>Frequency</th>
              <th>Minutes</th>
              <th>Rows</th>
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
          <caption>Historical trend</caption>
          <thead>
            <tr>
              <th>Period</th>
              <th>Frequency</th>
              <th>Minutes</th>
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
