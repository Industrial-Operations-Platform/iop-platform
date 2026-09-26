import { useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  count,
  duration,
  tomorrow,
  type Context,
  type ImportSummary,
  type ImportReview,
  type Availability,
  type Analysis,
  type Selection,
  type Options,
  type Option,
  type Dimension,
} from "./api/demo";
import "./demo.css";

type View = "import" | "overview" | "detail";
const dimensionFields = {
  sector: "sectors",
  area: "areas",
  equipment: "equipment",
  message: "messages",
} as const;
function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return (
    <div className="demo-error" role="alert">
      <strong>
        {error instanceof Error
          ? error.message
          : "The service could not be reached."}
      </strong>
      {error instanceof ApiError && error.traceId && (
        <small>Reference: {error.traceId}</small>
      )}
      {retry && <button onClick={retry}>Try again / refresh data</button>}
    </div>
  );
}
export function DemoApp() {
  const [context, setContext] = useState<Context | null>(null),
    [error, setError] = useState<unknown>(null),
    [pending, setPending] = useState(true);
  const [generation, setGeneration] = useState(0);
  const load = async () => {
    setPending(true);
    setError(null);
    try {
      setContext(await api<Context>("/demo/context"));
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const choose = async (id: string) => {
    setPending(true);
    setError(null);
    setContext((c) => (c ? { ...c, user: null } : c));
    setGeneration((g) => g + 1);
    try {
      setContext(await api<Context>("/demo/user", { userId: id }));
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="demo-root">
      <a className="demo-skip" href="#demo-content">
        Skip to content
      </a>
      <header className="demo-top">
        <a className="demo-brand" href="#">
          IOP<span>Operational Intelligence</span>
        </a>
        <span className="demo-local">LOCAL DEMONSTRATION</span>
        {context?.enabled && (
          <label className="demo-user">
            Demo user
            <select
              aria-label="Demo user"
              value={context.user?.id ?? ""}
              disabled={pending}
              onChange={(e) => void choose(e.target.value)}
            >
              <option value="" disabled>
                Select a user
              </option>
              {context.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>
      <ErrorNotice error={error} retry={() => void load()} />
      {pending ? (
        <main
          id="demo-content"
          tabIndex={-1}
          className="demo-welcome"
          aria-busy="true"
        >
          <p role="status">Connecting to the platform…</p>
        </main>
      ) : !context?.enabled ? (
        <main id="demo-content" tabIndex={-1} className="demo-welcome">
          <p className="demo-kicker">LOCAL WORKSPACE</p>
          <h1>Connect your analytical workspace</h1>
          <p>The local demonstration backend is not active.</p>
          <p>
            Start it with <code>npm run demo:start</code> after{" "}
            <code>npm run demo:setup</code>.
          </p>
          <button onClick={() => void load()}>Reconnect</button>
        </main>
      ) : !context.user ? (
        <main id="demo-content" tabIndex={-1} className="demo-welcome">
          <p className="demo-kicker">WELCOME TO IOP</p>
          <h1>Your operations, explained.</h1>
          <p>
            Import a CSV, explore its results and compare it with your stored
            history.
          </p>
          <div className="demo-user-cards">
            {context.users.map((u) => (
              <button key={u.id} onClick={() => void choose(u.id)}>
                <span className="demo-avatar">{u.name.slice(0, 1)}</span>
                <strong>{u.name}</strong>
                <span>Enter workspace →</span>
              </button>
            ))}
          </div>
          <p className="demo-note">
            Local demo user selection. Third-party authentication will replace
            this step before shared use.
          </p>
        </main>
      ) : (
        <Workspace key={context.user.id + ":" + generation} context={context} />
      )}
    </div>
  );
}
function Workspace({ context }: { context: Context }) {
  const [view, setView] = useState<View>("import"),
    [availability, setAvailability] = useState<Availability | null>(null),
    [history, setHistory] = useState<ImportSummary[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null),
    [result, setResult] = useState<Analysis | null>(null),
    [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false),
    [refresh, setRefresh] = useState(0),
    [cursor, setCursor] = useState<string | undefined>(),
    [pages, setPages] = useState<(string | undefined)[]>([]);
  const [trail, setTrail] = useState<
      { label: string; selection: Selection; view: View; level: Dimension }[]
    >([]),
    [level, setLevel] = useState<Dimension>("sector");
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setError(null);
    void Promise.all([
      api<Availability>("/analytics/availability", undefined, abort.signal),
      api<ImportSummary[]>("/imports", undefined, abort.signal),
    ])
      .then(([a, h]) => {
        if (abort.signal.aborted) return;
        setAvailability(a);
        setHistory(h);
        setCursor(undefined);
        setPages([]);
        setSelection(
          (s) =>
            s ??
            (a.latestDate
              ? { from: a.latestDate, toExclusive: tomorrow(a.latestDate) }
              : null),
        );
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e);
      });
    return () => abort.abort();
  }, [refresh]);
  useEffect(() => {
    if (!selection || !availability) {
      setResult(null);
      return;
    }
    const abort = new AbortController();
    setLoading(true);
    setResult(null);
    setError(null);
    void api<Analysis>(
      "/analytics/query",
      {
        ...selection,
        revision: availability.revision,
        pageSize: 50,
        ...(cursor ? { cursor } : {}),
      },
      abort.signal,
    )
      .then((value) => {
        if (!abort.signal.aborted) setResult(value);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [selection, availability, cursor]);
  const apply = (s: Selection) => {
    setSelection(s);
    setCursor(undefined);
    setPages([]);
  };
  const navigate = (next: View) => {
    setView(next);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const file = (date: string) => {
    apply({ from: date, toExclusive: tomorrow(date) });
    setTrail([]);
    setLevel("sector");
    navigate("overview");
  };
  const allHistory = () => {
    if (!availability?.latestDate) return;
    const earliest = new Date(
      Date.parse(tomorrow(availability.latestDate)) - 366 * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    apply({
      from: availability.dates[0] < earliest ? earliest : availability.dates[0],
      toExclusive: tomorrow(availability.latestDate),
    });
    setTrail([]);
    setLevel("sector");
    navigate("overview");
  };
  const drill = (kind: Dimension, reference: string, label: string) => {
    if (!selection) return;
    setTrail((t) => [...t, { label, selection, view, level }]);
    apply({ ...selection, [dimensionFields[kind]]: [reference] });
    setLevel(
      kind === "sector" ? "area" : kind === "area" ? "equipment" : "message",
    );
    navigate("detail");
  };
  const back = () => {
    const previous = trail.at(-1);
    if (!previous) return;
    apply(previous.selection);
    setTrail((t) => t.slice(0, -1));
    setLevel(previous.level);
    navigate(previous.view);
  };
  return (
    <div className="demo-layout">
      <aside className="demo-sidebar">
        <p className="demo-kicker">WORKSPACE</p>
        <nav aria-label="Primary navigation">
          {(["import", "overview", "detail"] as View[]).map((v, i) => (
            <button
              key={v}
              aria-current={view === v ? "page" : undefined}
              onClick={() => navigate(v)}
            >
              <span>0{i + 1}</span>
              {v === "import"
                ? "Import & history"
                : v === "overview"
                  ? "Executive Overview"
                  : "Analytical detail"}
            </button>
          ))}
        </nav>
        <div className="demo-scope">
          <span className="demo-status-dot" />
          Persistent local data<strong>{context.scope?.siteId}</strong>
          <small>
            {context.scope?.sourceId}
            <br />
            {context.scope?.siteTimeZone}
          </small>
        </div>
        <p className="demo-note">
          Reporting dates are source labels. Missing imports are not zero-fault
          periods.
        </p>
      </aside>
      <main id="demo-content" tabIndex={-1} className="demo-main">
        <div className="demo-page-heading">
          <div>
            <p className="demo-kicker">
              {view === "import"
                ? "YOUR DATA, READY TO EXPLORE"
                : "VERIFIED SOURCE AGGREGATES"}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              {view === "import"
                ? "Import & history"
                : view === "overview"
                  ? "Executive Overview"
                  : "Analytical detail"}
            </h1>
            <p>
              {view === "import"
                ? "Bring in a reporting file. Keep every import traceable."
                : "Explore the selected file or your reporting history with the same calculations."}
            </p>
          </div>
          <button
            className="demo-secondary"
            onClick={() => setRefresh((r) => r + 1)}
          >
            Refresh data
          </button>
        </div>
        <ErrorNotice
          error={error}
          retry={() => {
            heading.current?.focus();
            setRefresh((r) => r + 1);
          }}
        />
        {view === "import" ? (
          <ImportPanel
            history={history}
            onImported={(date) => {
              if (mounted.current) {
                setRefresh((r) => r + 1);
                if (date) file(date);
              }
            }}
            onFile={file}
            onHistory={allHistory}
          />
        ) : !availability ? (
          <p role="status">Loading imported dates…</p>
        ) : !availability.dates.length ? (
          <section className="demo-card demo-empty">
            <h2>No imported data yet</h2>
            <p>Import your first CSV to start exploring.</p>
            <button onClick={() => navigate("import")}>Import a CSV</button>
          </section>
        ) : (
          <>
            <div className="demo-analysis-actions">
              <button onClick={allHistory}>Analyze history</button>
              <label>
                Analyze a file
                <select
                  aria-label="Analyze a file"
                  value={
                    selection &&
                    selection.toExclusive === tomorrow(selection.from)
                      ? selection.from
                      : ""
                  }
                  onChange={(e) => file(e.target.value)}
                >
                  <option value="" disabled>
                    Historical selection
                  </option>
                  {availability.dates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <span>Up to 366 reporting labels per analysis</span>
            </div>
            {selection && (
              <Filters
                key={availability.revision}
                selection={selection}
                availability={availability}
                onApply={(s) => {
                  apply(s);
                  setTrail([]);
                  setLevel("sector");
                }}
              />
            )}
            {trail.length > 0 && (
              <nav className="demo-trail" aria-label="Drill-down">
                <button onClick={back}>← Back one level</button>
                {trail.map((t, i) => (
                  <span key={i}>
                    {t.label}
                    {i < trail.length - 1 ? " / " : ""}
                  </span>
                ))}
              </nav>
            )}
            {loading ? (
              <section className="demo-card" aria-busy="true">
                <p role="status">Calculating the selected reporting data…</p>
              </section>
            ) : (
              result && (
                <>
                  <p className="demo-sr-only" role="status">
                    {result.recordCount} contributing records. Reported
                    frequency {result.reportedFrequency}. Accumulated alarm
                    duration {result.accumulatedAlarmSeconds} seconds.
                  </p>
                  <div className="demo-kpis" aria-label="Analytical totals">
                    <section className="demo-card">
                      <p>Reported frequency</p>
                      <strong data-testid="frequency-total">
                        {count(result.reportedFrequency)}
                      </strong>
                      <small>Reported occurrences</small>
                    </section>
                    <section className="demo-card">
                      <p>Accumulated alarm duration</p>
                      <strong data-testid="duration-total">
                        {count(result.accumulatedAlarmSeconds)} <em>s</em>
                      </strong>
                      <small>
                        {duration(result.accumulatedAlarmSeconds)} · not plant
                        downtime
                      </small>
                    </section>
                    <section className="demo-card">
                      <p>Contributing records</p>
                      <strong>{count(result.recordCount)}</strong>
                      <small>
                        {result.admittedDates.length} imported reporting dates
                      </small>
                    </section>
                  </div>
                  <section
                    className="demo-coverage"
                    aria-label="Source coverage"
                  >
                    <strong>
                      {result.state === "no-imports"
                        ? "No imports in this range"
                        : result.state === "no-matches"
                          ? "No matching records"
                          : "Source coverage"}
                    </strong>
                    <span>Reporting windows: unknown.</span>
                    <span>
                      {result.missingDates.length} missing reporting dates.
                    </span>
                    <span>
                      {result.unclassifiedCount} unclassified records included
                      in this selection.
                    </span>
                    <span>
                      {result.repeatedCount} repeated source records retained.
                    </span>
                    {result.missingDates.length > 0 && (
                      <details>
                        <summary>Show missing dates</summary>
                        <p>{result.missingDates.join(", ")}</p>
                      </details>
                    )}
                  </section>
                  {result.state === "ready" ? (
                    <>
                      <section className="demo-card">
                        <div className="demo-section-heading">
                          <div>
                            <h2>
                              {view === "overview"
                                ? "Where the reported alarms accumulate"
                                : "Explore contributing groups"}
                            </h2>
                            <p>
                              Choose a group to narrow the detail while
                              preserving your filters.
                            </p>
                          </div>
                          <label>
                            Group by
                            <select
                              value={level}
                              onChange={(e) =>
                                setLevel(e.target.value as Dimension)
                              }
                            >
                              <option value="sector">Sector</option>
                              <option value="area">Area</option>
                              <option value="equipment">
                                Source equipment
                              </option>
                              <option value="message">Message</option>
                            </select>
                          </label>
                        </div>
                        <div className="demo-table-wrap">
                          <table>
                            <caption>
                              {level} groups · full selection totals remain
                              above
                            </caption>
                            <thead>
                              <tr>
                                <th>Group</th>
                                <th>Frequency</th>
                                <th>Alarm duration</th>
                                <th>Records</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.groups[level].map((g) => (
                                <tr key={g.reference}>
                                  <th>
                                    <button
                                      className="demo-text-button"
                                      onClick={() =>
                                        drill(level, g.reference, g.label)
                                      }
                                    >
                                      {g.label} →
                                    </button>
                                    <div
                                      className="demo-bar"
                                      aria-hidden="true"
                                    >
                                      <span
                                        style={{
                                          width: `${result.reportedFrequency ? (g.reportedFrequency / result.reportedFrequency) * 100 : 0}%`,
                                        }}
                                      />
                                    </div>
                                  </th>
                                  <td>{count(g.reportedFrequency)}</td>
                                  <td>{count(g.accumulatedAlarmSeconds)} s</td>
                                  <td>{count(g.recordCount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {result.groupCounts[level] > 100 && (
                          <p>
                            Showing the leading 100 of{" "}
                            {count(result.groupCounts[level])} groups. Use the
                            dimension filter to inspect any group.
                          </p>
                        )}
                      </section>
                      {view === "detail" ? (
                        <section className="demo-card">
                          <h2>Contributing source records</h2>
                          <p>
                            Original file, physical line and frozen
                            classification are retained for each record.
                          </p>
                          <div className="demo-table-wrap">
                            <table className="demo-records">
                              <caption>
                                Source aggregates · page {pages.length + 1} ·
                                full totals include all pages
                              </caption>
                              <thead>
                                <tr>
                                  <th>Reporting date / source</th>
                                  <th>Area / equipment</th>
                                  <th>Message</th>
                                  <th>Frequency</th>
                                  <th>Duration</th>
                                  <th>Classification</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.records.map((r) => (
                                  <tr
                                    key={
                                      r.importId + ":" + r.sourceRecordNumber
                                    }
                                  >
                                    <td>
                                      {r.reportingDate}
                                      <details>
                                        <summary>
                                          Line {r.sourceRecordNumber} provenance
                                        </summary>
                                        <p>
                                          Import: {r.importId}
                                          <br />
                                          RAW: {r.rawId}
                                          <br />
                                          Mapping: {r.mappingRevision}
                                          <br />
                                          Original duration:{" "}
                                          {r.originalDuration}
                                        </p>
                                        <a
                                          href={`/api/v1/imports/${r.importId}/original`}
                                        >
                                          Download original CSV
                                        </a>
                                      </details>
                                    </td>
                                    <td>
                                      {r.sourceArea}
                                      <small>
                                        {r.sourceEquipmentReference}
                                      </small>
                                    </td>
                                    <td>
                                      {r.sourceMessageText}
                                      <small>
                                        Type {r.sourceMessageType} · Group{" "}
                                        {r.sourceMessageGroup}
                                      </small>
                                    </td>
                                    <td>{count(r.reportedFrequency)}</td>
                                    <td>
                                      {count(r.accumulatedAlarmSeconds)} s
                                    </td>
                                    <td>
                                      {r.sectorLabel}
                                      <small>
                                        {r.classificationStatus}
                                        {r.repeatedTuple
                                          ? " · repeated source row"
                                          : ""}
                                      </small>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="demo-pagination">
                            <button
                              disabled={!pages.length}
                              onClick={() => {
                                setCursor(pages.at(-1));
                                setPages((p) => p.slice(0, -1));
                              }}
                            >
                              Previous records
                            </button>
                            <span>Page {pages.length + 1}</span>
                            <button
                              disabled={!result.nextCursor}
                              onClick={() => {
                                setPages((p) => [...p, cursor]);
                                setCursor(result.nextCursor ?? undefined);
                              }}
                            >
                              Next records
                            </button>
                          </div>
                        </section>
                      ) : (
                        <button onClick={() => navigate("detail")}>
                          Open analytical detail →
                        </button>
                      )}
                    </>
                  ) : (
                    <section className="demo-card demo-empty">
                      <h2>
                        {result.state === "no-matches"
                          ? "No records match these filters"
                          : "This range has no imported coverage"}
                      </h2>
                      <p>
                        Adjust your selection or import the missing reporting
                        files. Zero totals here do not establish zero faults.
                      </p>
                      <button onClick={allHistory}>Reset to history</button>
                    </section>
                  )}
                </>
              )
            )}
            <p className="demo-note">
              Frequency counts source-reported occurrences. Accumulated alarm
              duration can overlap and exceed a day; it is not downtime. A
              filename date does not prove a full reporting window.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
function ImportPanel({
  history,
  onImported,
  onFile,
  onHistory,
}: {
  history: ImportSummary[];
  onImported: (date?: string) => void;
  onFile: (date: string) => void;
  onHistory: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [pending, setPending] = useState(false),
    [review, setReview] = useState<ImportReview | null>(null),
    [error, setError] = useState<unknown>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = async () => {
    if (!file) return;
    setPending(true);
    setError(null);
    setReview(null);
    try {
      const r = await api<ImportReview>("/imports", file, undefined, file.name);
      setReview(r);
      onImported();
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const inspect = async (id: string, recover = false) => {
    setPending(true);
    setError(null);
    try {
      setReview(
        await api<ImportReview>(
          `/imports/${id}${recover ? "/recover" : ""}`,
          recover ? {} : undefined,
        ),
      );
      if (recover) onImported();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <section className="demo-card demo-upload">
        <div>
          <p className="demo-kicker">ADD A REPORTING FILE</p>
          <h2>From CSV to insight</h2>
          <p>
            Upload the supported alarm-statistics export. Each accepted
            reporting date becomes part of your persistent history.
          </p>
          <p className="demo-note">
            Hitliste-YYYYMMDD.csv · UTF-16 LE with BOM · semicolon separated ·
            maximum 5 MiB. Existing reporting dates cannot be replaced.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void upload();
          }}
        >
          <label htmlFor="csv-file">CSV file</label>
          <input
            id="csv-file"
            ref={input}
            type="file"
            accept=".csv"
            disabled={pending}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button disabled={!file || pending}>
            {pending ? "Processing CSV…" : "Import CSV"}
          </button>
        </form>
      </section>
      <ErrorNotice error={error} />
      {error instanceof ApiError && error.importId && (
        <button onClick={() => void inspect(error.importId!, true)}>
          Recover import outcome
        </button>
      )}
      {pending && (
        <p role="status">
          Processing the import. Please wait before submitting another file.
        </p>
      )}
      {review && (
        <section className="demo-card" aria-label="Import result">
          <h2>
            {review.outcome === "succeeded"
              ? "Import complete"
              : review.reasonCode === "duplicate-date"
                ? "Duplicate reporting date"
                : review.outcome === "received"
                  ? "Import requires recovery"
                  : "Import not admitted"}
          </h2>
          <p>
            {review.originalFilename} · {review.outcome}
          </p>
          <p>
            {review.admittedRecordCount ?? "Unknown"} admitted records ·{" "}
            {review.rejectedRecordCount ?? "Unknown"} rejected records ·{" "}
            {review.unclassifiedCount} unclassified · {review.repeatedCount}{" "}
            repeated source rows
          </p>
          {!review.inspectionComplete && (
            <p>
              Inspection was interrupted. Remaining record counts are unknown.
            </p>
          )}
          {review.reasonCode === "duplicate-date" && (
            <p>
              This reporting date is already stored. The existing history was
              preserved and no measures were added.
            </p>
          )}
          <ul>
            {review.diagnostics.map((d, i) => (
              <li key={i}>
                {d.line ? `Line ${d.line}: ` : ""}
                {d.field ? `${d.field} — ` : ""}
                {d.reason ?? d.code}
              </li>
            ))}
          </ul>
          {review.diagnosticsTruncated && (
            <p>Only the first 100 diagnostics are shown.</p>
          )}
          <div className="demo-button-row">
            {review.outcome === "succeeded" && (
              <button onClick={() => onFile(review.reportingDate)}>
                Analyze this file
              </button>
            )}
            {review.outcome === "received" && (
              <button onClick={() => void inspect(review.importId, true)}>
                Recover interrupted import
              </button>
            )}
            <a href={`/api/v1/imports/${review.importId}/original`}>
              Download preserved original
            </a>
          </div>
        </section>
      )}
      <section className="demo-card">
        <div className="demo-section-heading">
          <div>
            <h2>Import history</h2>
            <p>
              Accepted data remains available after restarting the platform.
            </p>
          </div>
          <button
            disabled={!history.some((h) => h.outcome === "succeeded")}
            onClick={onHistory}
          >
            Analyze history
          </button>
        </div>
        {!history.length ? (
          <div className="demo-empty">
            <h3>Your reporting history starts here</h3>
            <p>
              Upload a CSV to see its results and build your historical
              analysis.
            </p>
          </div>
        ) : (
          <div className="demo-table-wrap">
            <table>
              <caption>Retained import attempts, newest first</caption>
              <thead>
                <tr>
                  <th>File / reporting date</th>
                  <th>Outcome</th>
                  <th>Records</th>
                  <th>Imported by / receipt</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.importId}>
                    <th>
                      {h.originalFilename}
                      <small>
                        {h.reportingDate} · {count(h.byteLength)} bytes
                      </small>
                    </th>
                    <td>
                      <span className={`demo-badge ${h.outcome}`}>
                        {h.reasonCode === "duplicate-date"
                          ? "duplicate"
                          : h.outcome}
                      </span>
                    </td>
                    <td>{h.admittedRecordCount ?? "—"}</td>
                    <td>
                      {h.submittedBy}
                      <small>
                        {new Date(h.receivedAt).toLocaleString("en-GB")}
                      </small>
                    </td>
                    <td>
                      <div className="demo-button-row">
                        <button
                          className="demo-secondary"
                          disabled={pending}
                          onClick={() => void inspect(h.importId)}
                        >
                          Review
                        </button>
                        {h.outcome === "succeeded" && (
                          <button onClick={() => onFile(h.reportingDate)}>
                            Analyze file
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Filters({
  selection,
  availability,
  onApply,
}: {
  selection: Selection;
  availability: Availability;
  onApply: (s: Selection) => void;
}) {
  const [draft, setDraft] = useState(selection),
    [options, setOptions] = useState<Partial<Record<Dimension, Option[]>>>({}),
    [cursors, setCursors] = useState<Partial<Record<Dimension, string | null>>>(
      {},
    ),
    [error, setError] = useState<unknown>(null),
    [pending, setPending] = useState<Dimension | null>(null);
  useEffect(() => setDraft(selection), [selection]);
  useEffect(() => {
    const abort = new AbortController();
    void Promise.all(
      (["sector", "area", "equipment", "message"] as Dimension[]).map(
        async (kind) => {
          const r = await api<Options>(
            "/analytics/options",
            { revision: availability.revision, kind, pageSize: 100 },
            abort.signal,
          );
          return { kind, r };
        },
      ),
    )
      .then((values) => {
        if (abort.signal.aborted) return;
        setOptions(
          Object.fromEntries(values.map(({ kind, r }) => [kind, r.options])),
        );
        setCursors(
          Object.fromEntries(values.map(({ kind, r }) => [kind, r.nextCursor])),
        );
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e);
      });
    return () => abort.abort();
  }, [availability.revision]);
  const more = async (kind: Dimension) => {
    setPending(kind);
    setError(null);
    try {
      const r = await api<Options>("/analytics/options", {
        revision: availability.revision,
        kind,
        pageSize: 100,
        cursor: cursors[kind],
      });
      setOptions((o) => ({ ...o, [kind]: [...(o[kind] ?? []), ...r.options] }));
      setCursors((c) => ({ ...c, [kind]: r.nextCursor }));
    } catch (e) {
      setError(e);
    } finally {
      setPending(null);
    }
  };
  const change = (key: keyof Selection, values: string[]) =>
    setDraft((d) => {
      const next = { ...d };
      if (values.length) (next as Record<string, unknown>)[key] = values;
      else delete (next as Record<string, unknown>)[key];
      return next;
    });
  return (
    <details className="demo-card demo-filters">
      <summary>
        Reporting dates & shared filters · {selection.from} to{" "}
        {selection.toExclusive} (exclusive)
        <small>
          {(["sector", "area", "equipment", "message"] as Dimension[])
            .filter((kind) => selection[dimensionFields[kind]]?.length)
            .map(
              (kind) =>
                `${kind}: ${selection[dimensionFields[kind]]!.map((ref) => options[kind]?.find((o) => o.reference === ref)?.label ?? "selected value").join(", ")}`,
            )
            .concat(
              selection.excludedMessages?.length
                ? [
                    `Excluded messages: ${selection.excludedMessages.map((ref) => options.message?.find((o) => o.reference === ref)?.label ?? "selected value").join(", ")}`,
                  ]
                : [],
            )
            .join(" · ") || "All dimensions · no message exclusions"}
        </small>
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const days =
            (Date.parse(draft.toExclusive) - Date.parse(draft.from)) / 86400000;
          if (!Number.isFinite(days) || days < 1 || days > 366) {
            setError(
              new Error("Choose a reporting range between 1 and 366 days."),
            );
            return;
          }
          onApply(draft);
        }}
      >
        <div className="demo-filter-grid">
          <label>
            From (inclusive)
            <input
              type="date"
              required
              value={draft.from}
              onChange={(e) =>
                setDraft((d) => ({ ...d, from: e.target.value }))
              }
            />
          </label>
          <label>
            To (exclusive)
            <input
              type="date"
              required
              value={draft.toExclusive}
              onChange={(e) =>
                setDraft((d) => ({ ...d, toExclusive: e.target.value }))
              }
            />
          </label>
          {(["sector", "area", "equipment", "message"] as Dimension[]).map(
            (kind) => (
              <label key={kind}>
                {kind === "equipment"
                  ? "Source equipment"
                  : kind[0].toUpperCase() + kind.slice(1)}
                <select
                  multiple
                  size={3}
                  aria-label={`${kind} filters`}
                  value={draft[dimensionFields[kind]] ?? []}
                  onChange={(e) =>
                    change(
                      dimensionFields[kind],
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                >
                  {options[kind]?.map((o) => (
                    <option key={o.reference} value={o.reference}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {cursors[kind] && (
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void more(kind)}
                  >
                    Load more {kind} options
                  </button>
                )}
              </label>
            ),
          )}
          <label>
            Exclude messages
            <select
              multiple
              size={3}
              aria-label="Excluded messages"
              value={draft.excludedMessages ?? []}
              onChange={(e) =>
                change(
                  "excludedMessages",
                  Array.from(e.target.selectedOptions, (o) => o.value),
                )
              }
            >
              {options.message?.map((o) => (
                <option key={o.reference} value={o.reference}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="demo-note">
          No selection means all values. Use Ctrl/Cmd to select or deselect
          multiple values. Selected filters remain shared across overview and
          detail.
        </p>
        <ErrorNotice error={error} />
        <div className="demo-button-row">
          <button>Apply filters</button>
          <button
            type="button"
            className="demo-secondary"
            onClick={() => {
              const s = {
                from: selection.from,
                toExclusive: selection.toExclusive,
              };
              setDraft(s);
              onApply(s);
            }}
          >
            Clear dimension filters
          </button>
        </div>
      </form>
    </details>
  );
}
