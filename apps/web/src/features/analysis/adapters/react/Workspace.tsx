import { AnalysisCalendarNotice } from "./AnalysisCalendarNotice";
import { SourceFiles } from "./SourceFiles";
import { ExecutiveMonthControls, MonthlyOverview } from "./MonthlyOverview";
import { ExecutiveSettings } from "./ExecutiveSettings";
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
  Input,
  MetricCard,
  MetricGrid,
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
  nextDate,
} from "../../application/workspace";
import {
  type DemoContext,
  type Dimension,
  type ImportReview,
  type ImportSummary,
  type ProfileResult,
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
              onClick={() => setAdministration((value) => !value)}
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
      brand={
        <>
          IOP<span>Operational Intelligence</span>
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
        <section className="analysis-start" aria-label="Start page" />
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
    [admin, setAdmin] = useState(false),
    [fileView, setFileView] = useState(false);
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
    if (!selection) return;
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
  }, [application, selection]);
  const drill = (dimension: Dimension, key: string) => {
    if (!selection) return;
    const next = drillInto(selection, template, dimension, key);
    setTemplate(next.view);
    setSelection(next.selection);
  };
  const select = (key: string) => {
    if (selection) drill(selection.dimension, key);
  };
  const showFile = (date: string) => {
    setTemplate(5);
    setSelection({
      from: date,
      toExclusive: nextDate(date),
      dimension: "area",
      period: "day",
      metric: "frequency",
      page: 1,
    });
    setAdmin(false);
  };
  return (
    <>
      <PageHeading
        title={
          administration && fileView
            ? "Files & source rows"
            : administration && admin
              ? "Import & prepare"
              : "Data analysis"
        }
        eyebrow={
          administration
            ? "Administration · Operational Intelligence"
            : "Taskforce · Operational Intelligence"
        }
        description="Daily files. One persistent reporting history."
        actions={
          <Actions>
            {" "}
            {administration && (
              <Button
                onClick={() => {
                  setFileView(false);
                  setAdmin(!admin);
                }}
              >
                {admin ? "Back to analysis" : "Import & prepare"}
              </Button>
            )}
            {administration && (
              <Button
                variant="secondary"
                onClick={() => {
                  setAdmin(false);
                  setFileView(!fileView);
                }}
              >
                {fileView ? "Back to analysis" : "Files & source rows"}
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
      ) : administration && admin ? (
        <ImportWorkspace
          application={application}
          history={history}
          onImported={() => setRefresh((x) => x + 1)}
          onFile={showFile}
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
                            title="Top groups by selected measure"
                            report={report}
                            onSelect={select}
                          />
                          <Plot
                            kind="duration"
                            title="Top groups by duration"
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
                {template === 0 && administration && (
                  <ExecutiveSettings
                    application={application}
                    onSaved={() => setRefresh((x) => x + 1)}
                  />
                )}
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
              if (selection) setSelection(selectView(selection, i));
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
function ImportWorkspace({
  application,
  history,
  onImported,
  onFile,
}: {
  application: AnalysisWorkspace;
  history: ImportSummary[];
  onImported: () => void;
  onFile: (date: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<unknown>(),
    [review, setReview] = useState<ImportReview | null>(null);
  const upload = async () => {
    if (!file) return;
    setPending(true);
    setError(undefined);
    setReview(null);
    try {
      const r = await application.gateway.upload(
        file.name,
        await file.arrayBuffer(),
      );
      setReview(r);
      onImported();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const inspect = async (id: string, recover = false) => {
    setPending(true);
    setError(undefined);
    try {
      setReview(await application.gateway.review(id, recover));
      if (recover) onImported();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Panel className="analysis-import">
        <h2>Add a daily CSV</h2>
        <p>
          Files and accepted rows persist in the database. An existing reporting
          date cannot be replaced.
        </p>
        <p>
          Hitliste-YYYYMMDD.csv · UTF-16 LE with BOM · semicolon separated ·
          maximum 5 MiB.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void upload();
          }}
        >
          <Field>
            CSV file
            <Input
              type="file"
              accept=".csv"
              disabled={pending}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Button type="submit" disabled={!file || pending}>
            {pending ? "Processing CSV…" : "Import CSV"}
          </Button>
        </form>
        <Notice error={error} />
        {review && (
          <div role="status">
            <h3>
              {review.outcome === "succeeded"
                ? "Import complete"
                : review.reasonCode === "duplicate-date"
                  ? "Duplicate reporting date"
                  : "Import " + review.outcome}
            </h3>
            <MetricGrid
              className="analysis-import-counts"
              aria-label="File import volume"
            >
              {[
                ["Source rows", review.dataRecordCount],
                ["Admitted rows", review.admittedRecordCount],
                ["Rejected rows", review.rejectedRecordCount],
                ["File size · bytes", review.byteLength],
              ].map(([label, value]) => (
                <MetricCard
                  key={label}
                  label={label}
                  value={value === null ? "Unknown" : number(Number(value))}
                />
              ))}
            </MetricGrid>
            {review.diagnostics.map((d, i) => (
              <p key={i}>
                Line {d.line}: {d.field} {d.reason ?? d.code}
              </p>
            ))}
            {review.outcome === "succeeded" && (
              <Button onClick={() => onFile(review.reportingDate)}>
                Analyze this file
              </Button>
            )}
            <a href={application.gateway.originalUrl(review.importId)}>
              Download preserved original
            </a>
          </div>
        )}
      </Panel>
      <ProfileEditor application={application} onSaved={onImported} />
      <Panel className="analysis-import">
        <h2>Import history</h2>
        <TableViewport>
          <Table>
            <thead>
              <tr>
                <th>File / date</th>
                <th>Outcome</th>
                <th>Rows</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.importId}>
                  <th>
                    {h.originalFilename}
                    <small>{h.reportingDate}</small>
                  </th>
                  <td>{h.reasonCode ?? h.outcome}</td>
                  <td>{h.admittedRecordCount ?? "—"}</td>
                  <td>
                    <Button
                      disabled={pending}
                      onClick={() => void inspect(h.importId)}
                    >
                      Review
                    </Button>
                    {h.outcome === "received" && (
                      <Button
                        disabled={pending}
                        onClick={() => void inspect(h.importId, true)}
                      >
                        Recover import outcome
                      </Button>
                    )}
                    {h.outcome === "succeeded" && (
                      <Button onClick={() => onFile(h.reportingDate)}>
                        Analyze file
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      </Panel>
    </>
  );
}
function ProfileEditor({
  application,
  onSaved,
}: {
  application: AnalysisWorkspace;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<ProfileResult | null>(null),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void application.gateway
      .profile()
      .then((x) => {
        if (active) setValue(x);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [application]);
  const save = async () => {
    if (!value) return;
    setPending(true);
    setError(undefined);
    setSaved(false);
    try {
      setValue(await application.gateway.saveProfile(value));
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const edit = (next: ProfileResult) => {
    setSaved(false);
    setValue(next);
  };
  const profile = value?.profile;
  return (
    <Panel className="analysis-import">
      <h2>Data preparation & sector classification</h2>
      <p>
        Saving applies these rules to the complete historical analysis. Original
        files and imported values remain preserved.
      </p>
      <p>
        <strong>Types:</strong> Häufigkeit → integer; Dauer → exact seconds,
        displayed as minutes; Bereich, Betriebsmittelkennzeichen, Meldetext, Typ
        and Meldegruppe → text. Commas, umlauts and code punctuation are
        preserved.
      </p>
      <Notice error={error} />
      {value && profile && (
        <>
          <div className="analysis-checks">
            {(["trim", "unicodeNfc", "collapseWhitespace"] as const).map(
              (key) => (
                <Field key={key} layout="inline">
                  <Input
                    disabled={pending}
                    type="checkbox"
                    checked={profile.normalization[key]}
                    onChange={(e) => {
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          normalization: {
                            ...profile.normalization,
                            [key]: e.target.checked,
                          },
                        },
                      });
                    }}
                  />
                  {
                    {
                      trim: "Trim outer spaces",
                      unicodeNfc: "Normalize Unicode (NFC)",
                      collapseWhitespace: "Collapse repeated spaces",
                    }[key]
                  }
                </Field>
              ),
            )}
          </div>
          <Disclosure
            variant="divided"
            summary={<>Area → sector rules ({profile.areaSectors.length})</>}
          >
            <div className="analysis-rule-table">
              {profile.areaSectors.map((rule, i) => (
                <div key={i}>
                  <Input
                    disabled={pending}
                    aria-label={`Area ${i + 1}`}
                    value={rule.area}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.map((x, j) =>
                            j === i ? { ...x, area: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Input
                    disabled={pending}
                    aria-label={`Sector ${i + 1}`}
                    value={rule.sector}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.map((x, j) =>
                            j === i ? { ...x, sector: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Button
                    disabled={pending}
                    onClick={() =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.filter(
                            (_, j) => i !== j,
                          ),
                        },
                      })
                    }
                  >
                    Remove rule {i + 1}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                edit({
                  ...value,
                  profile: {
                    ...profile,
                    areaSectors: [
                      ...profile.areaSectors,
                      { area: "", sector: "" },
                    ],
                  },
                })
              }
            >
              Add area rule
            </Button>
          </Disclosure>
          <Disclosure
            variant="divided"
            summary={<>Explicit value corrections ({profile.aliases.length})</>}
          >
            <p>
              Replace one exact source value for analysis. No automatic spelling
              guesses.
            </p>
            {profile.aliases.map((alias, i) => (
              <div className="analysis-alias" key={i}>
                <Select
                  disabled={pending}
                  aria-label={`Correction field ${i + 1}`}
                  value={alias.field}
                  onChange={(e) =>
                    edit({
                      ...value,
                      profile: {
                        ...profile,
                        aliases: profile.aliases.map((a, j) =>
                          j === i
                            ? {
                                ...a,
                                field: e.target.value as typeof alias.field,
                              }
                            : a,
                        ),
                      },
                    })
                  }
                >
                  {(
                    [
                      "area",
                      "equipment",
                      "message",
                      "type",
                      "messageGroup",
                    ] as const
                  ).map((f) => (
                    <option key={f} value={f}>
                      {labels[f]}
                    </option>
                  ))}
                </Select>
                {(["from", "to"] as const).map((k) => (
                  <Input
                    disabled={pending}
                    key={k}
                    aria-label={`${k} value ${i + 1}`}
                    value={alias[k]}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          aliases: profile.aliases.map((a, j) =>
                            j === i ? { ...a, [k]: e.target.value } : a,
                          ),
                        },
                      })
                    }
                  />
                ))}
                <Button
                  disabled={pending}
                  onClick={() =>
                    edit({
                      ...value,
                      profile: {
                        ...profile,
                        aliases: profile.aliases.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  Remove correction {i + 1}
                </Button>
              </div>
            ))}
            <Button
              disabled={pending}
              onClick={() =>
                edit({
                  ...value,
                  profile: {
                    ...profile,
                    aliases: [
                      ...profile.aliases,
                      { field: "area", from: "", to: "" },
                    ],
                  },
                })
              }
            >
              Add value correction
            </Button>
          </Disclosure>
          <Button disabled={pending} onClick={() => void save()}>
            {pending ? "Saving…" : "Save historical preparation"}
          </Button>
          {saved && (
            <p role="status">
              Preparation saved. Return to analysis to see the updated history.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
