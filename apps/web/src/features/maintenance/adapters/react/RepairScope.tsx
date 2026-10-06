import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Actions,
  Alert,
  Badge,
  Button,
  Field,
  Panel,
  Select,
  Textarea,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { MaintenanceApplication } from "../../application/maintenance";
import type {
  EquipmentReference,
  LinkedEntry,
  RelatedEntry,
  RelatedPage,
} from "../../domain/models";

export interface ReportPresentation {
  renderReportCards?: (
    entries: RelatedEntry[],
    open: (id: string) => void,
  ) => ReactNode;
  openReport?: (id: string) => void;
}

export function RepairScope({
  application,
  locationId,
  equipment,
  links,
  change,
  reviewReady,
  renderReportCards,
  openReport,
  refreshToken = 0,
  completed = false,
}: {
  application: MaintenanceApplication;
  locationId: string;
  equipment: EquipmentReference[];
  links: LinkedEntry[];
  change?: (links: LinkedEntry[]) => void;
  reviewReady?: (ready: boolean) => void;
  refreshToken?: number;
  completed?: boolean;
} & ReportPresentation) {
  const [page, setPage] = useState<RelatedPage>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const epoch = useRef(0);
  const previousScope = useRef("");
  const equipmentKey = JSON.stringify(equipment);
  useEffect(() => {
    const current = ++epoch.current;
    const scope = JSON.stringify([locationId, equipmentKey]);
    const displayedCount =
      scope === previousScope.current ? (page?.entries.length ?? 0) : 0;
    if (scope !== previousScope.current) setPage(undefined);
    previousScope.current = scope;
    setError("");
    if (!locationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void application
      .related({ locationId, equipment }, displayedCount)
      .then((value) => {
        if (current === epoch.current) setPage(value);
      })
      .catch((exception) => {
        if (current === epoch.current) setError(exception.message);
      })
      .finally(() => {
        if (current === epoch.current) setLoading(false);
      });
    return () => {
      epoch.current += 1;
    };
  }, [application, locationId, equipmentKey, attempt, refreshToken]);
  const pending =
    page?.entries.filter((entry) =>
      ["open", "in-progress"].includes(entry.issueState),
    ) ?? [];
  const reviewed =
    !loading &&
    !error &&
    (!locationId || !!page) &&
    !page?.nextCursor &&
    pending.every((entry) => {
      const link = links.find((value) => value.id === entry.id);
      return (
        !!link &&
        (link.disposition === "exclude"
          ? !!link.reason.trim()
          : link.expectedRevision === entry.revision)
      );
    });
  useEffect(() => {
    reviewReady?.(reviewed);
  }, [reviewed, reviewReady]);
  const loadMore = async () => {
    if (!page?.nextCursor || loading) return;
    const current = epoch.current;
    setLoading(true);
    try {
      const next = await application.related({
        locationId,
        equipment,
        cursor: page.nextCursor,
      });
      if (current === epoch.current)
        setPage({ ...next, entries: [...page.entries, ...next.entries] });
    } catch (exception) {
      if (current === epoch.current) setError((exception as Error).message);
    } finally {
      if (current === epoch.current) setLoading(false);
    }
  };
  const update = (entry: RelatedEntry, disposition: string, reason = "") => {
    const other = links.filter((value) => value.id !== entry.id);
    change?.(
      disposition
        ? [
            ...other,
            {
              id: entry.id,
              expectedRevision: entry.revision,
              disposition: disposition as LinkedEntry["disposition"],
              reason,
            },
          ]
        : other,
    );
  };
  const groups = change
    ? [{ label: "Reports to review", entries: page?.entries ?? [] }]
    : [
        {
          label: "Included in this repair",
          entries:
            page?.entries.filter((entry) =>
              links.some(
                (link) =>
                  link.id === entry.id && link.disposition === "include",
              ),
            ) ?? [],
        },
        {
          label: "Excluded from this repair",
          entries:
            page?.entries.filter((entry) =>
              links.some(
                (link) =>
                  link.id === entry.id && link.disposition === "exclude",
              ),
            ) ?? [],
        },
        {
          label: "Related context",
          entries:
            page?.entries.filter(
              (entry) => !links.some((link) => link.id === entry.id),
            ) ?? [],
        },
      ];
  return (
    <section
      className="maintenance-fields"
      aria-label={t("Related operational reports")}
    >
      <div className="maintenance-collection-heading">
        <h3>{t("Related operational reports")}</h3>
        <Button
          variant="text"
          disabled={loading}
          onClick={() => setAttempt((value) => value + 1)}
        >
          {t("Reload reports")}
        </Button>
      </div>
      <p className="maintenance-muted">
        {t(
          change
            ? "Reports match the selected place and exact equipment identifiers. Review each open issue before completing maintenance."
            : "Included reports belong to this intervention. Exclusions and related context remain outside its repair scope. Open a source card to read its full history.",
        )}
      </p>
      {completed && (
        <p className="maintenance-muted">
          {t(
            "Completion closes included open reports only. Excluded reports and related context retain their own status.",
          )}
        </p>
      )}
      {error && <Alert>{t(error)}</Alert>}
      {loading && <p role="status">{t("Loading related reports…")}</p>}
      {!locationId && <p>{t("Select a location to find related reports.")}</p>}
      {page && (
        <p>
          {t("Showing {0} of {1} related reports.", [
            page.entries.length,
            page.total,
          ])}
        </p>
      )}
      {groups
        .filter((group) => group.entries.length)
        .map((group) => (
          <section
            className="maintenance-related-group"
            key={group.label}
            aria-label={t(group.label)}
          >
            <h4>
              {t(group.label)} <Badge>{group.entries.length}</Badge>
            </h4>
            <div className="maintenance-related-reports">
              {group.entries.map((entry) => {
                const link = links.find((value) => value.id === entry.id);
                return (
                  <Panel key={entry.id} className="maintenance-related-report">
                    <Badge
                      tone={
                        link?.disposition === "include" ? "info" : "neutral"
                      }
                    >
                      {t(
                        link?.disposition === "include"
                          ? "Included in this repair"
                          : link?.disposition === "exclude"
                            ? "Excluded from this repair"
                            : "Related context",
                      )}
                    </Badge>
                    {!change &&
                      link?.disposition === "exclude" &&
                      link.reason && (
                        <p>
                          <strong>{t("Exclusion reason")}: </strong>
                          {link.reason}
                        </p>
                      )}
                    {renderReportCards ? (
                      renderReportCards([entry], (id) => openReport?.(id))
                    ) : (
                      <Button
                        variant="text"
                        onClick={() => openReport?.(entry.id)}
                      >
                        {entry.content.summary}
                      </Button>
                    )}
                    {change ? (
                      <>
                        <Field>
                          {t("Maintenance scope")}
                          <Select
                            aria-label={t("Scope for {0}", [
                              entry.content.summary,
                            ])}
                            value={link?.disposition ?? ""}
                            onChange={(event) =>
                              update(entry, event.target.value, link?.reason)
                            }
                          >
                            <option value="">{t("Not reviewed")}</option>
                            <option value="include">
                              {t("Include in this repair")}
                            </option>
                            <option value="exclude">
                              {t("Exclude from this repair")}
                            </option>
                          </Select>
                        </Field>
                        {link?.disposition === "exclude" && (
                          <Field>
                            {t("Exclusion reason")}
                            <Textarea
                              required
                              maxLength={2000}
                              rows={2}
                              value={link.reason}
                              onChange={(event) =>
                                update(entry, "exclude", event.target.value)
                              }
                            />
                          </Field>
                        )}
                        {link?.disposition === "include" &&
                          ["open", "in-progress"].includes(entry.issueState) &&
                          link.expectedRevision !== entry.revision && (
                            <>
                              <Alert>
                                {t(
                                  "This report changed. Select its scope again before completing maintenance.",
                                )}
                              </Alert>
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  update(entry, "include", link.reason)
                                }
                              >
                                {t("Confirm latest report")}
                              </Button>
                            </>
                          )}
                      </>
                    ) : null}
                  </Panel>
                );
              })}
            </div>
          </section>
        ))}
      {page?.nextCursor && (
        <Actions>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {t("Load more reports")}
          </Button>
        </Actions>
      )}
      {page && !page.entries.length && (
        <p>{t("No reports match this repair scope.")}</p>
      )}
    </section>
  );
}
