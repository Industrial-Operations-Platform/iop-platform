import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  Field,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  Select,
  RefreshButton,
} from "../../../../design/components";
import {
  AnalysisWorkspace,
  executiveSelection,
  monthSelection,
} from "../../application/workspace";
import type { DemoContext, Report, ReportRequest } from "../../domain/models";
import { AnalysisCalendarNotice } from "./AnalysisCalendarNotice";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
  }).format(value);

/** Composes independent operational content before the compact analytical snapshot. */
export function StartOverview({
  application,
  context,
  openAnalysis,
  profileLabel,
  authenticated,
  operational,
  onSectorChange,
  canReadAnalytics = true,
}: {
  application: AnalysisWorkspace;
  context: DemoContext;
  openAnalysis: () => void;
  profileLabel?: string;
  authenticated?: boolean;
  operational?: ReactNode;
  canReadAnalytics?: boolean;
  onSectorChange?: (sector: string) => void;
}) {
  const [base, setBase] = useState<Report | null>(null);
  const [detail, setDetail] = useState<Report | null>(null);
  const [selection, setSelection] = useState<ReportRequest | null>(null);
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setBase(null);
    setDetail(null);
    setSelection(null);
    setSector("");
    onSectorChange?.("");
    setLoading(true);
    setError(undefined);
    if (!context.user || !canReadAnalytics) {
      setLoading(false);
      return;
    }
    void application
      .loadHistory()
      .then(async ({ months }) => {
        if (!active || !months.length) return;
        const request = {
          ...monthSelection(executiveSelection(months[0]), [months[0]]),
          dimension: "sector" as const,
        };
        const report = await application.report(request);
        if (active) {
          setSelection(request);
          setBase(report);
        }
      })
      .catch((reason) => {
        if (active) setError(reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, context.user?.id, refresh, canReadAnalytics]);

  useEffect(() => {
    if (!canReadAnalytics || !sector || !selection) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    setDetail(null);
    void application
      .report({
        ...selection,
        dimension: "area",
        filters: { sector: [sector] },
      })
      .then((report) => {
        if (active) setDetail(report);
      })
      .catch((reason) => {
        if (active) setError(reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, sector, selection, canReadAnalytics]);

  const report = sector ? detail : base;
  return (
    <section className="analysis-start" aria-label="Start page">
      <PageHeading
        eyebrow="Your workspace"
        title={
          context.user ? `Welcome, ${context.user.name}` : "Welcome to IOP"
        }
        description="Your department, open work and important updates."
        actions={
          canReadAnalytics ? (
            <Button onClick={openAnalysis}>Open Data Analysis</Button>
          ) : undefined
        }
      />
      {!context.user ? (
        <Panel variant="empty">
          <h2>Select your local user</h2>
          <p>Select a user in the header to see the available information.</p>
        </Panel>
      ) : (
        <>
          <div className="analysis-home-grid">
            <Panel>
              <span className="analysis-home-label">Profile</span>
              <h2>{context.user.name}</h2>
              <p>
                {authenticated
                  ? "Local account"
                  : "Local demonstration account"}
              </p>
              <p className="analysis-home-muted">
                {profileLabel
                  ? `Profile: ${profileLabel}`
                  : "Team and role profile: not configured."}
              </p>
            </Panel>
            <Panel>
              <span className="analysis-home-label">
                Your week · Not connected
              </span>
              <h2>Shifts & departments</h2>
              <p>Your weekly shifts and departments worked will appear here.</p>
              <p className="analysis-home-muted">
                No workforce information is available yet.
              </p>
            </Panel>
          </div>
          {operational}
          {canReadAnalytics && (
            <Panel
              className="analysis-home-summary"
              aria-label="Analytical summary"
            >
              <div className="analysis-home-heading">
                <div>
                  <span className="analysis-home-label">
                    Data Analysis · v1
                  </span>
                  <h2>
                    {operational
                      ? "Site-wide analytical snapshot"
                      : "Analytical snapshot"}
                  </h2>
                  <p>
                    {selection
                      ? `Latest imported month · ${selection.from.slice(0, 7)}`
                      : "Latest imported month"}
                  </p>
                </div>
                <RefreshButton
                  label="Refresh overview"
                  busy={loading}
                  onClick={() => setRefresh((n) => n + 1)}
                />
              </div>
              {!operational && base && (
                <Field>
                  Sector / Halle
                  <Select
                    value={sector}
                    disabled={loading}
                    onChange={(event) => {
                      setDetail(null);
                      setError(undefined);
                      setSector(event.target.value);
                      onSectorChange?.(event.target.value);
                    }}
                  >
                    <option value="">All sectors</option>
                    {(base.options.sector ?? []).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {loading ? (
                <p role="status">Loading analytical overview…</p>
              ) : error ? (
                <Alert>
                  {error instanceof Error
                    ? error.message
                    : "The overview could not be loaded. Try refreshing."}
                </Alert>
              ) : !report ? (
                <p>
                  No analytical history is available yet. An authorized operator
                  can import a daily CSV in Data Analysis.
                </p>
              ) : (
                <>
                  <MetricGrid>
                    <MetricCard
                      label="Reported alarm frequency"
                      value={formatNumber(report.totals.frequency)}
                    />
                    <MetricCard
                      label="Imported dates this month"
                      value={
                        report.dates.filter(
                          (date) =>
                            date >= report.selection.from &&
                            date < report.selection.toExclusive,
                        ).length
                      }
                    />
                  </MetricGrid>
                  <p className="analysis-home-muted">
                    {sector
                      ? `Areas classified under ${sector}.`
                      : "Recorded activity by sector."}{" "}
                    Alarm totals do not indicate whether equipment is blocked or
                    repaired. Missing dates do not mean zero activity.
                  </p>
                  <AnalysisCalendarNotice
                    excludedWeekdays={report.excludedWeekdays}
                  />
                </>
              )}
            </Panel>
          )}
          {!operational && (
            <div className="analysis-home-grid">
              <Panel>
                <span className="analysis-home-label">
                  Operational updates · Not connected
                </span>
                <h2>From your technicians</h2>
                <p>
                  Important published reports, repair notes and handovers will
                  appear here.
                </p>
                <p className="analysis-home-muted">
                  There is no publication source yet. This is a placeholder.
                </p>
              </Panel>
              <Panel>
                <span className="analysis-home-label">
                  Equipment status · Not connected
                </span>
                <h2>Blocked & restored equipment</h2>
                <p>
                  Equipment restrictions, completed repairs and their sector
                  will appear here.
                </p>
                <p className="analysis-home-muted">
                  Status is unknown until operational records are available.
                </p>
              </Panel>
            </div>
          )}
        </>
      )}
    </section>
  );
}
