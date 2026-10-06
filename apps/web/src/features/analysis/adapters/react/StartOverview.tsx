import { locale, t } from "../../../../localization/i18n";
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
  new Intl.NumberFormat(locale(), {
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
  workforce,
  maintenance,
  onSectorChange,
  canReadAnalytics = true,
}: {
  application: AnalysisWorkspace;
  context: DemoContext;
  openAnalysis: () => void;
  profileLabel?: string;
  authenticated?: boolean;
  operational?: ReactNode;
  workforce?: ReactNode;
  maintenance?: ReactNode;
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
    <section className="analysis-start" aria-label={t("Start page")}>
      <PageHeading
        title={
          context.user
            ? t("Welcome, {0}", [context.user.name])
            : t("Welcome to IOP")
        }
        description={t("Your department, open work and important updates.")}
        actions={
          canReadAnalytics ? (
            <Button onClick={openAnalysis}>{t("Open Data Analysis")}</Button>
          ) : undefined
        }
      />
      {!context.user ? (
        <Panel variant="empty">
          <h2>{t("Select your local user")}</h2>
          <p>
            {t("Select a user in the header to see the available information.")}
          </p>
        </Panel>
      ) : (
        <>
          <div className="analysis-home-grid">
            <Panel>
              <span className="analysis-home-label">{t("Profile")}</span>
              <h2>{context.user.name}</h2>
              <p>
                {authenticated
                  ? t("Local account")
                  : t("Local demonstration account")}
              </p>
              <p className="analysis-home-muted">
                {profileLabel
                  ? t("Profile: {0}", [profileLabel])
                  : t("Team and role profile: not configured.")}
              </p>
            </Panel>
            {workforce ?? (
              <Panel>
                <span className="analysis-home-label">
                  {t("Your week · Not connected ")}
                </span>
                <h2>{t("Shifts & departments")}</h2>
                <p>
                  {t(
                    "Your weekly shifts and departments worked will appear here.",
                  )}
                </p>
                <p className="analysis-home-muted">
                  {t("No workforce information is available yet. ")}
                </p>
              </Panel>
            )}
          </div>
          {operational}
          {maintenance}
          {canReadAnalytics && (
            <Panel
              className="analysis-home-summary"
              aria-label={t("Analytical summary")}
            >
              <div className="analysis-home-heading">
                <div>
                  <span className="analysis-home-label">
                    {t("Data Analysis · v1 ")}
                  </span>
                  <h2>
                    {operational
                      ? t("Site-wide analytical snapshot")
                      : t("Analytical snapshot")}
                  </h2>
                  <p>
                    {selection
                      ? t("Latest imported month · {0}", [
                          selection.from.slice(0, 7),
                        ])
                      : t("Latest imported month")}
                  </p>
                </div>
                <RefreshButton
                  label={t("Refresh overview")}
                  busy={loading}
                  onClick={() => setRefresh((n) => n + 1)}
                />
              </div>
              {!operational && base && (
                <Field>
                  {t("Sector / Halle ")}
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
                    <option value="">{t("All sectors")}</option>
                    {(base.options.sector ?? []).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {loading ? (
                <p role="status">{t("Loading analytical overview…")}</p>
              ) : error ? (
                <Alert>
                  {error instanceof Error
                    ? error.message
                    : t("The overview could not be loaded. Try refreshing.")}
                </Alert>
              ) : !report ? (
                <p>
                  {t(
                    "No analytical history is available yet. An authorized operator can import a daily CSV in Data Analysis. ",
                  )}
                </p>
              ) : (
                <>
                  <MetricGrid>
                    <MetricCard
                      label={t("Reported alarm frequency")}
                      value={formatNumber(report.totals.frequency)}
                    />
                    <MetricCard
                      label={t("Imported dates this month")}
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
                      ? t("Areas classified under {0}.", [sector])
                      : t("Recorded activity by sector.")}{" "}
                    {t(
                      "Alarm totals do not indicate whether equipment is blocked or repaired. Missing dates do not mean zero activity. ",
                    )}
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
                  {t("Operational updates · Not connected ")}
                </span>
                <h2>{t("From your technicians")}</h2>
                <p>
                  {t(
                    "Important published reports, repair notes and handovers will appear here. ",
                  )}
                </p>
                <p className="analysis-home-muted">
                  {t(
                    "There is no publication source yet. This is a placeholder. ",
                  )}
                </p>
              </Panel>
              <Panel>
                <span className="analysis-home-label">
                  {t("Equipment status · Not connected ")}
                </span>
                <h2>{t("Blocked & restored equipment")}</h2>
                <p>
                  {t(
                    "Equipment restrictions, completed repairs and their sector will appear here. ",
                  )}
                </p>
                <p className="analysis-home-muted">
                  {t(
                    "Status is unknown until operational records are available. ",
                  )}
                </p>
              </Panel>
            </div>
          )}
        </>
      )}
    </section>
  );
}
