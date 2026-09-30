import { useEffect, useState } from "react";
import { locale, t } from "../localization/i18n";
import {
  Alert,
  Badge,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  RefreshButton,
  Table,
  TableViewport,
} from "../design/components";
import type { AccessApplication } from "../features/access/application/access";
import type {
  AccessActivity,
  UserProfile,
} from "../features/access/domain/access";
import type { AnalysisWorkspace } from "../features/analysis/application/workspace";
import type { ImportSummary } from "../features/analysis/domain/models";

export type AdministrationTool = "imports" | "files" | "preparation" | "kpis";
const activityLabels: Record<string, string> = {
  "user.created": "Account created",
  "user.access_changed": "Profile or access changed",
  "user.name_changed": "Name changed",
  "user.deleted": "Profile deleted",
};
const outcomeLabels = {
  received: "Received",
  succeeded: "Imported",
  rejected: "Rejected",
  failed: "Failed",
};

export function AdministrationOverview({
  canImport,
  canAdminister,
  access,
  analysis,
  timeZone,
}: {
  canImport: boolean;
  canAdminister: boolean;
  access?: AccessApplication;
  analysis: AnalysisWorkspace;
  timeZone: string;
}) {
  const [accounts, setAccounts] = useState<{
    users: UserProfile[];
    activity: AccessActivity[];
  }>();
  const [latest, setLatest] = useState<ImportSummary | null>();
  const [accountError, setAccountError] = useState("");
  const [importError, setImportError] = useState("");
  const [pending, setPending] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setPending(true);
    setAccountError("");
    setImportError("");
    const accountsRequest =
      canAdminister && access
        ? Promise.all([access.users(), access.activity()])
            .then(([users, activity]) => {
              if (active) setAccounts({ users, activity });
            })
            .catch((reason) => {
              if (active) {
                setAccounts(undefined);
                setAccountError(reason.message);
              }
            })
        : Promise.resolve();
    const importsRequest = canImport
      ? analysis.gateway
          .history()
          .then((history) => {
            if (active)
              setLatest(
                [...history].sort((a, b) =>
                  b.receivedAt.localeCompare(a.receivedAt),
                )[0] ?? null,
              );
          })
          .catch((reason) => {
            if (active) {
              setLatest(undefined);
              setImportError(reason.message);
            }
          })
      : Promise.resolve();
    void Promise.all([accountsRequest, importsRequest]).finally(() => {
      if (active) setPending(false);
    });
    return () => {
      active = false;
    };
  }, [access, analysis, canImport, canAdminister, version]);
  const timestamp = (value: string) =>
    new Intl.DateTimeFormat(locale(), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(new Date(value));
  return (
    <section
      className="administration-overview"
      aria-label={t("Administration overview")}
    >
      <PageHeading
        title={t("Administration")}
        description={t(
          "Account activity and the latest source data for this site.",
        )}
        actions={
          <RefreshButton
            busy={pending}
            onClick={() => setVersion((v) => v + 1)}
          />
        }
      />
      {pending && <p role="status">{t("Loading…")}</p>}
      {canAdminister && (
        <>
          {accountError && <Alert>{accountError}</Alert>}
          <MetricGrid className="administration-metrics">
            <MetricCard
              label={t("Total users")}
              value={accounts?.users.length ?? "—"}
            />
            <MetricCard
              label={t("Active users")}
              value={
                accounts?.users.filter((user) => user.active).length ?? "—"
              }
            />
            <MetricCard
              label={t("Disabled users")}
              value={
                accounts?.users.filter((user) => !user.active).length ?? "—"
              }
            />
          </MetricGrid>
        </>
      )}
      {canImport && (
        <Panel>
          <h2>{t("Latest file received")}</h2>
          {importError ? (
            <Alert>{importError}</Alert>
          ) : latest ? (
            <>
              <p className="administration-file-name">
                <strong>{latest.originalFilename}</strong>{" "}
                <Badge
                  tone={latest.outcome === "succeeded" ? "success" : "neutral"}
                >
                  {t(outcomeLabels[latest.outcome])}
                </Badge>
              </p>
              <dl className="iop-detail-fields">
                <div>
                  <dt>{t("Received at")}</dt>
                  <dd>{timestamp(latest.receivedAt)}</dd>
                </div>
                <div>
                  <dt>{t("Submitted by")}</dt>
                  <dd>{latest.submittedBy}</dd>
                </div>
                <div>
                  <dt>{t("Reporting date")}</dt>
                  <dd>{latest.reportingDate}</dd>
                </div>
                <div>
                  <dt>{t("Imported rows")}</dt>
                  <dd>{latest.admittedRecordCount ?? "—"}</dd>
                </div>
              </dl>
            </>
          ) : latest === null ? (
            <p>{t("No files received yet.")}</p>
          ) : null}
        </Panel>
      )}
      {canAdminister && (
        <Panel>
          <h2>{t("Recent account changes")}</h2>
          <p>
            {t("Latest 20 recorded account changes. Times use {0}.", [
              timeZone,
            ])}
          </p>
          {accounts?.activity.length ? (
            <TableViewport aria-label={t("Recent account changes")}>
              <Table>
                <thead>
                  <tr>
                    {["Change", "User", "Changed by", "Recorded at"].map(
                      (label) => (
                        <th key={label} scope="col">
                          {t(label)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {accounts.activity.map((event) => (
                    <tr key={event.id}>
                      <td>{t(activityLabels[event.action] ?? event.action)}</td>
                      <th scope="row">{event.subjectName}</th>
                      <td>{event.actorName}</td>
                      <td>{timestamp(event.recordedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableViewport>
          ) : (
            accounts && <p>{t("No account changes recorded yet.")}</p>
          )}
        </Panel>
      )}
    </section>
  );
}
