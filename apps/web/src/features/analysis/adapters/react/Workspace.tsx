import { useEffect, useRef, useState } from "react";
import {
  AnalysisWorkspace,
  changeSelection,
  filterGroup,
  nextDate,
} from "../../application/workspace";
import {
  dimensions,
  type DemoContext,
  type Dimension,
  type ImportReview,
  type ImportSummary,
  type ProfileResult,
  type Report,
  type ReportRequest,
} from "../../domain/models";
import { mountChart, number, type ChartKind } from "../echarts/charts";
import "./workspace.css";

const labels: Record<Dimension, string> = {
  sector: "Sector / Halle",
  area: "Bereich",
  equipment: "Betriebsmittelkennzeichen",
  message: "Meldetext",
  type: "Typ",
  messageGroup: "Meldegruppe",
  frequency: "Häufigkeit",
  duration: "Dauer (minutes)",
};
const templates = [
  ["Halle analysis", "sector"],
  ["Bereich analysis", "area"],
  ["Equipment analysis", "equipment"],
  ["Error analysis", "message"],
  ["Daily / monthly", "area"],
  ["Pareto", "area"],
] as const;
function Notice({ error }: { error: unknown }) {
  return error ? (
    <p className="analysis-error" role="alert">
      {error instanceof Error
        ? error.message
        : "The operation could not be completed."}
    </p>
  ) : null;
}
function Plot({
  kind,
  report,
  onSelect,
  title,
}: {
  kind: ChartKind;
  report: Report;
  onSelect: (key: string) => void;
  title: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (element.current)
      return mountChart(element.current, kind, report, onSelect);
  }, [kind, report, onSelect]);
  return (
    <section className="analysis-chart">
      <h2>{title}</h2>
      <div
        ref={element}
        className="analysis-plot"
        role="img"
        aria-label={title + "; values available in the data tables below"}
      />
    </section>
  );
}
export function WorkspaceApp({
  application,
}: {
  application: AnalysisWorkspace;
}) {
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
    <div className="analysis-app">
      <a className="analysis-skip" href="#analysis-main">
        Skip to analysis
      </a>
      <header className="analysis-top">
        <label>
          User{" "}
          <select
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
          </select>
        </label>
      </header>
      <aside className="analysis-sidebar">
        <div className="analysis-logo">
          IOP<span>Operational Intelligence</span>
        </div>
        <nav aria-label="Main navigation">
          <span aria-current="page">▥ &nbsp; Data analysis</span>
        </nav>
      </aside>
      <main id="analysis-main" className="analysis-main">
        <Notice error={error} />
        {context?.user ? (
          <ReportWorkspace
            key={context.user.id}
            application={application}
            context={context}
          />
        ) : (
          <section className="analysis-empty">
            <h1>Data analysis</h1>
            <p>
              {context?.enabled
                ? "Select a user in the header to open the workspace."
                : "Connect the local API to open the analytical workspace."}
            </p>
            {(!context?.enabled || !!error) && (
              <button
                disabled={pending}
                onClick={() => setConnectionAttempt((n) => n + 1)}
              >
                {pending ? "Connecting…" : "Retry connection"}
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
function ReportWorkspace({
  application,
  context,
}: {
  application: AnalysisWorkspace;
  context: DemoContext;
}) {
  const [selection, setSelection] = useState<ReportRequest | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [history, setHistory] = useState<ImportSummary[]>([]);
  const [error, setError] = useState<unknown>(),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [template, setTemplate] = useState(0),
    [admin, setAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    void application
      .loadHistory(context.canImport)
      .then((x) => {
        if (active) {
          setHistory(x.history);
          setSelection(x.selection);
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
  }, [application, refresh]);
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
  const select = (key: string) => {
    if (selection)
      setSelection(filterGroup(selection, selection.dimension, key));
  };
  const showFile = (date: string) => {
    setSelection({
      from: date,
      toExclusive: nextDate(date),
      dimension: "sector",
      period: "day",
      metric: "frequency",
      page: 1,
    });
    setAdmin(false);
  };
  return (
    <>
      <div className="analysis-heading">
        <div>
          <p className="analysis-eyebrow">
            {context.scope?.siteId} / {context.scope?.sourceId}
          </p>
          <h1>{admin ? "Import & prepare" : "Data analysis"}</h1>
          <p>Daily files. One persistent reporting history.</p>
        </div>
        <div className="analysis-actions">
          {context.canImport && (
            <button onClick={() => setAdmin(!admin)}>
              {admin ? "Back to analysis" : "Import & prepare"}
            </button>
          )}
          <button
            className="secondary"
            onClick={() => setRefresh((x) => x + 1)}
          >
            Refresh history
          </button>
        </div>
      </div>
      <Notice error={error} />
      {admin ? (
        <ImportWorkspace
          application={application}
          history={history}
          onImported={() => setRefresh((x) => x + 1)}
          onFile={showFile}
        />
      ) : (
        <>
          {selection && (
            <Filters
              key={JSON.stringify(selection)}
              selection={selection}
              report={report}
              onApply={(s) => setSelection(s)}
            />
          )}
          {loading ? (
            <p role="status">Loading historical analysis…</p>
          ) : !selection ? (
            <section className="analysis-empty">
              <h2>Your history starts with a CSV</h2>
              <p>
                {context.canImport
                  ? "Open Import & prepare to add a daily file."
                  : "An administrator can import daily files for analysis."}
              </p>
            </section>
          ) : (
            report && (
              <>
                <div className="analysis-kpis">
                  <section>
                    <span>Reported frequency</span>
                    <strong>{number(report.totals.frequency)}</strong>
                  </section>
                  <section>
                    <span>Accumulated duration · minutes</span>
                    <strong>{number(report.totals.minutes)}</strong>
                  </section>
                  <section>
                    <span>Source rows</span>
                    <strong>{number(report.totals.records)}</strong>
                  </section>
                  <section>
                    <span>Imported dates in range</span>
                    <strong>
                      {
                        report.dates.filter(
                          (d) =>
                            d >= selection.from && d < selection.toExclusive,
                        ).length
                      }
                    </strong>
                  </section>
                </div>
                <p className="analysis-footnote">
                  All matching historical rows contribute to totals. Rankings
                  show up to 100 of {number(report.groupCount)} groups; charts
                  show the top 10 unless stated. {report.unclassifiedCount}{" "}
                  unclassified rows. Duration is accumulated alarm time, not
                  plant downtime.
                </p>
                {report.totals.records === 0 ? (
                  <section className="analysis-empty">
                    <h2>No matching records</h2>
                    <p>Adjust the dates or dimension filters.</p>
                  </section>
                ) : (
                  <div className="analysis-charts">
                    {template === 4 ? (
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
                    ) : template === 5 ? (
                      <>
                        <Plot
                          kind="pareto"
                          title="Pareto · cumulative share of the full total"
                          report={report}
                          onSelect={select}
                        />
                        <Plot
                          kind="scatter"
                          title="Duration versus frequency"
                          report={report}
                          onSelect={select}
                        />
                      </>
                    ) : (
                      <>
                        <Plot
                          kind={template === 3 ? "messages" : "monthly"}
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
                        {(template === 1 || template === 2) && (
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
                )}
                <DataTables
                  report={report}
                  onSelect={select}
                  onPage={(page) =>
                    setSelection({
                      ...selection,
                      page,
                      revision: report.revision,
                    })
                  }
                  original={(id) =>
                    context.canImport
                      ? application.gateway.originalUrl(id)
                      : undefined
                  }
                />
                <p className="analysis-footnote">
                  Reporting dates come from file names; reporting windows are
                  unknown. Missing dates are not zero activity. Monthly
                  comparisons use only imported dates.
                </p>
              </>
            )
          )}
          <nav className="analysis-tabs" aria-label="Analysis templates">
            {templates.map(([title, dimension], i) => (
              <button
                key={title}
                aria-pressed={template === i}
                onClick={() => {
                  setTemplate(i);
                  if (selection)
                    setSelection(changeSelection(selection, { dimension }));
                }}
              >
                {title}
              </button>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
function Filters({
  selection,
  report,
  onApply,
}: {
  selection: ReportRequest;
  report: Report | null;
  onApply: (s: ReportRequest) => void;
}) {
  const [draft, setDraft] = useState(selection);
  return (
    <form
      className="analysis-filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(changeSelection(draft, {}));
      }}
    >
      <div className="analysis-filter-row">
        <label>
          From
          <input
            type="date"
            required
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </label>
        <label>
          To (exclusive)
          <input
            type="date"
            required
            value={draft.toExclusive}
            onChange={(e) =>
              setDraft({ ...draft, toExclusive: e.target.value })
            }
          />
        </label>
        <label>
          Group by
          <select
            value={draft.dimension}
            onChange={(e) =>
              setDraft({ ...draft, dimension: e.target.value as Dimension })
            }
          >
            {dimensions.map((d) => (
              <option key={d} value={d}>
                {labels[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Measure
          <select
            value={draft.metric}
            onChange={(e) =>
              setDraft({
                ...draft,
                metric: e.target.value as ReportRequest["metric"],
              })
            }
          >
            <option value="frequency">Frequency</option>
            <option value="duration">Duration · minutes</option>
          </select>
        </label>
        <label>
          Period
          <select
            value={draft.period}
            onChange={(e) =>
              setDraft({
                ...draft,
                period: e.target.value as ReportRequest["period"],
              })
            }
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>
        <label>
          Search all fields
          <input
            value={draft.search ?? ""}
            maxLength={200}
            onChange={(e) => setDraft({ ...draft, search: e.target.value })}
          />
        </label>
        <button>Apply filters</button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onApply(changeSelection(selection, { filters: {}, search: "" }))
          }
        >
          Clear filters
        </button>
      </div>
      <details>
        <summary>
          Filter a sector, location, equipment code or error ·{" "}
          {Object.values(selection.filters ?? {}).flat().length} selected
        </summary>
        <div className="analysis-filter-row">
          {dimensions.map((d) => (
            <label key={d}>
              {labels[d]}
              <input
                aria-label={labels[d] + " filter"}
                list={"values-" + d}
                value={draft.filters?.[d]?.[0] ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    filters: {
                      ...draft.filters,
                      [d]: e.target.value ? [e.target.value] : [],
                    },
                  })
                }
              />
              <datalist id={"values-" + d}>
                {report?.options[d]?.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <small>
                {d === "duration" ? "Exact seconds for this filter. " : ""}Type
                an exact value; up to 200 suggestions.
              </small>
            </label>
          ))}
        </div>
      </details>
    </form>
  );
}
function DataTables({
  report,
  onSelect,
  onPage,
  original,
}: {
  report: Report;
  onSelect: (key: string) => void;
  onPage: (n: number) => void;
  original: (id: string) => string | undefined;
}) {
  return (
    <details className="analysis-data">
      <summary>Explore data · rankings, trends and original rows</summary>
      <div className="analysis-table">
        <table>
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
                  <button
                    className="text-button"
                    onClick={() => onSelect(g.key)}
                  >
                    {report.selection.dimension === "duration"
                      ? number(Number(g.key) / 60)
                      : g.key}
                  </button>
                </th>
                <td>{number(g.frequency)}</td>
                <td>{number(g.minutes)}</td>
                <td>{g.records}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="analysis-table">
        <table>
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
        </table>
      </div>
      <div className="analysis-table">
        <table>
          <caption>
            Contributing source rows · page {report.page} of {report.pageCount}
          </caption>
          <thead>
            <tr>
              {[
                "Date",
                "Sector",
                "Bereich",
                "Betriebsmittelkennzeichen",
                "Meldetext",
                "Typ",
                "Meldegruppe",
                "Häufigkeit",
                "Dauer · minutes",
                "Original",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.records.map((r) => (
              <tr key={r.importId + ":" + r.line}>
                <td>{r.date}</td>
                <td>{r.sector}</td>
                <td>{r.area}</td>
                <td>{r.equipment}</td>
                <td>{r.message}</td>
                <td>{r.type}</td>
                <td>{r.messageGroup}</td>
                <td>{number(r.frequency)}</td>
                <td>{number(r.minutes)}</td>
                <td>
                  {original(r.importId) ? (
                    <a href={original(r.importId)}>Line {r.line}</a>
                  ) : (
                    <>Line {r.line}</>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        disabled={report.page <= 1}
        onClick={() => onPage(report.page - 1)}
      >
        Previous rows
      </button>{" "}
      <button
        disabled={report.page >= report.pageCount}
        onClick={() => onPage(report.page + 1)}
      >
        Next rows
      </button>
    </details>
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
      <section className="analysis-import">
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
          <label>
            CSV file
            <input
              type="file"
              accept=".csv"
              disabled={pending}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button disabled={!file || pending}>
            {pending ? "Processing CSV…" : "Import CSV"}
          </button>
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
            <p>
              {review.admittedRecordCount ?? "Unknown"} admitted rows ·{" "}
              {review.rejectedRecordCount ?? "Unknown"} rejected rows
            </p>
            {review.diagnostics.map((d, i) => (
              <p key={i}>
                Line {d.line}: {d.field} {d.reason ?? d.code}
              </p>
            ))}
            {review.outcome === "succeeded" && (
              <button onClick={() => onFile(review.reportingDate)}>
                Analyze this file
              </button>
            )}
            <a href={application.gateway.originalUrl(review.importId)}>
              Download preserved original
            </a>
          </div>
        )}
      </section>
      <ProfileEditor application={application} onSaved={onImported} />
      <section className="analysis-import">
        <h2>Import history</h2>
        <div className="analysis-table">
          <table>
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
                    <button
                      disabled={pending}
                      onClick={() => void inspect(h.importId)}
                    >
                      Review
                    </button>
                    {h.outcome === "received" && (
                      <button
                        disabled={pending}
                        onClick={() => void inspect(h.importId, true)}
                      >
                        Recover import outcome
                      </button>
                    )}
                    {h.outcome === "succeeded" && (
                      <button onClick={() => onFile(h.reportingDate)}>
                        Analyze file
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
  const profile = value?.profile;
  return (
    <section className="analysis-import">
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
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={profile.normalization[key]}
                    onChange={(e) => {
                      setSaved(false);
                      setValue({
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
                </label>
              ),
            )}
          </div>
          <details>
            <summary>
              Area → sector rules ({profile.areaSectors.length})
            </summary>
            <div className="analysis-rule-table">
              {profile.areaSectors.map((rule, i) => (
                <div key={i}>
                  <input
                    aria-label={`Area ${i + 1}`}
                    value={rule.area}
                    onChange={(e) =>
                      setValue({
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
                  <input
                    aria-label={`Sector ${i + 1}`}
                    value={rule.sector}
                    onChange={(e) =>
                      setValue({
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
                  <button
                    onClick={() =>
                      setValue({
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
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setValue({
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
            </button>
          </details>
          <details>
            <summary>
              Explicit value corrections ({profile.aliases.length})
            </summary>
            <p>
              Replace one exact source value for analysis. No automatic spelling
              guesses.
            </p>
            {profile.aliases.map((alias, i) => (
              <div className="analysis-alias" key={i}>
                <select
                  aria-label={`Correction field ${i + 1}`}
                  value={alias.field}
                  onChange={(e) =>
                    setValue({
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
                </select>
                {(["from", "to"] as const).map((k) => (
                  <input
                    key={k}
                    aria-label={`${k} value ${i + 1}`}
                    value={alias[k]}
                    onChange={(e) =>
                      setValue({
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
                <button
                  onClick={() =>
                    setValue({
                      ...value,
                      profile: {
                        ...profile,
                        aliases: profile.aliases.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  Remove correction {i + 1}
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setValue({
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
            </button>
          </details>
          <button disabled={pending} onClick={() => void save()}>
            {pending ? "Saving…" : "Save historical preparation"}
          </button>
          {saved && (
            <p role="status">
              Preparation saved. Return to analysis to see the updated history.
            </p>
          )}
        </>
      )}
    </section>
  );
}
