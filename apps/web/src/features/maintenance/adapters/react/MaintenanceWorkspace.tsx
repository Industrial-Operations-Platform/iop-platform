import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Actions,
  AddButton,
  Alert,
  Button,
  Disclosure,
  Panel,
  RefreshButton,
  SearchControl,
  SectionHeading,
  ViewNavigation,
} from "../../../../design/components";
import { locale, t } from "../../../../localization/i18n";
import type { MaintenanceApplication } from "../../application/maintenance";
import type {
  Catalog,
  History,
  MaintenanceRecord,
  Page,
  Priority,
  SaveInput,
  Selection,
  Status,
} from "../../domain/models";
import { MaintenanceCollection } from "./MaintenanceCollection";
import { MaintenanceStatusDialog } from "./MaintenanceStatusDialog";
import { statusChange } from "../../application/maintenance";
import { statuses } from "../../domain/models";
import { statusLabel } from "./labels";
import { MaintenanceDetails } from "./MaintenanceDetails";
import { MaintenanceFilters } from "./MaintenanceFilters";
import { MaintenanceForm } from "./MaintenanceForm";
import { PriorityConfiguration } from "./PriorityConfiguration";
import "./maintenance.css";
import { RepairScope, type ReportPresentation } from "./RepairScope";
import type { EquipmentLookup } from "./EquipmentScope";

export function MaintenanceWorkspace({
  application,
  profile,
  timeZone,
  homeVisit = 0,
  initialRecordId = "",
  initialMyWork = false,
  onOpenAsset,
  lookupEquipment,
  renderReportCards,
  renderReport,
  initialDraft,
  onDraftConsumed,
}: {
  application: MaintenanceApplication;
  profile?: string;
  timeZone: string;
  homeVisit?: number;
  initialRecordId?: string;
  initialMyWork?: boolean;
  onOpenAsset?: (id: string) => void;
  lookupEquipment?: EquipmentLookup;
  renderReport?: (id: string, back: () => void) => ReactNode;
  initialDraft?: Partial<SaveInput["data"]>;
  onDraftConsumed?: () => void;
} & Pick<ReportPresentation, "renderReportCards">) {
  const [reportId, setReportId] = useState("");
  const [reportRefresh, setReportRefresh] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const reportScroll = useRef(0);
  const reportFocus = useRef<HTMLElement | null>(null);
  const openReport = (id: string) => {
    reportScroll.current = window.scrollY;
    reportFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setReportId(id);
    window.scrollTo(0, 0);
  };
  const closeReport = () => {
    setReportId("");
    setReportRefresh((value) => value + 1);
    window.requestAnimationFrame(() => {
      reportFocus.current?.focus({ preventScroll: true });
      window.scrollTo(0, reportScroll.current);
    });
  };
  const [catalog, setCatalog] = useState<Catalog>();
  const [page, setPage] = useState<Page>();
  const [selection, setSelection] = useState<Selection>({});
  const [tab, setTab] = useState("board");
  const [version, setVersion] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<MaintenanceRecord>();
  const [selectedId, setSelectedId] = useState(initialRecordId);
  const [history, setHistory] = useState<History>();
  const [form, setForm] = useState(false);
  const [statusDialog, setStatusDialog] = useState<Status>();
  const queryEpoch = useRef(0);
  const detailEpoch = useRef(0);
  const pending = catalogLoading || queryLoading || detailLoading || saving;
  const leaveDetails = () => {
    detailEpoch.current += 1;
    setSelected(undefined);
    setSelectedId("");
    setHistory(undefined);
    setDetailLoading(false);
    setDetailError("");
    setForm(false);
    setStatusDialog(undefined);
  };
  const goHome = () => {
    leaveDetails();
    setDraft(undefined);
    setTab("board");
    setSelection({});
  };
  useEffect(() => {
    goHome();
    setDraft(initialDraft);
    if (initialDraft) {
      setForm(true);
      onDraftConsumed?.();
    }
    if (initialMyWork) setTab("mine");
    if (initialRecordId) setSelectedId(initialRecordId);
  }, [homeVisit, initialRecordId, initialMyWork]);
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError("");
    void application
      .catalog()
      .then((value) => {
        if (active) setCatalog(value);
      })
      .catch((exception) => {
        if (active) setCatalogError(exception.message);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, version]);
  useEffect(() => {
    const epoch = ++queryEpoch.current;
    if (!catalog || tab === "config") {
      setQueryLoading(false);
      return;
    }
    setQueryLoading(true);
    setQueryError("");
    setPage(undefined);
    void application
      .query({
        ...selection,
        ...(tab === "mine" ? { assigneeId: catalog.actorId } : {}),
        cursor: "",
        limit: tab === "board" ? 100 : 20,
      })
      .then((value) => {
        if (queryEpoch.current === epoch) setPage(value);
      })
      .catch((exception) => {
        if (queryEpoch.current === epoch) setQueryError(exception.message);
      })
      .finally(() => {
        if (queryEpoch.current === epoch) setQueryLoading(false);
      });
    return () => {
      queryEpoch.current += 1;
    };
  }, [application, catalog?.actorId, tab, selection, version]);
  useEffect(() => {
    const epoch = ++detailEpoch.current;
    if (!selectedId) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError("");
    void application
      .history(selectedId)
      .then((value) => {
        if (detailEpoch.current === epoch) {
          setSelected(value.record);
          setHistory(value);
        }
      })
      .catch((exception) => {
        if (detailEpoch.current === epoch) setDetailError(exception.message);
      })
      .finally(() => {
        if (detailEpoch.current === epoch) setDetailLoading(false);
      });
    return () => {
      detailEpoch.current += 1;
    };
  }, [application, selectedId, version]);
  const canAdminister =
    catalog?.canAdminister && (!profile || profile === "administrator");
  const canContribute = catalog?.canContribute && profile !== "executive";
  const canCoordinate =
    catalog?.canCoordinate &&
    (!profile || ["administrator", "team-leader"].includes(profile));
  const canEdit =
    selected?.canEdit &&
    canContribute &&
    (canCoordinate ||
      selected.authorId === catalog?.actorId ||
      selected.data.assigneeId === catalog?.actorId);
  const view =
    {
      board: "Board",
      records: "Records",
      mine: "My work",
      config: "Configuration",
    }[tab] ?? "Board";
  const refresh = () => setVersion((current) => current + 1);
  const select = (record: MaintenanceRecord) => {
    setSelected(record);
    setSelectedId(record.id);
    setForm(false);
    setHistory(undefined);
  };
  const save = async (input: SaveInput) => {
    const epoch = detailEpoch.current;
    setSaving(true);
    setError("");
    try {
      const record = await application.save(input);
      if (detailEpoch.current === epoch) {
        setSelected(record);
        setSelectedId(record.id);
        setForm(false);
        setStatusDialog(undefined);
      }
      setMessage("Maintenance saved.");
      refresh();
    } catch (exception) {
      if (detailEpoch.current === epoch) setError((exception as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const saveSettings = async (priorities: Priority[]) => {
    if (!catalog) return;
    setSaving(true);
    setError("");
    try {
      const settings = await application.settings(
        catalog.settings.revision,
        priorities,
      );
      setCatalog({ ...catalog, settings });
      setMessage("Configuration saved.");
      refresh();
    } catch (exception) {
      setError((exception as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const loadMore = async () => {
    if (!page?.nextCursor || !catalog || queryLoading) return;
    const epoch = queryEpoch.current;
    setQueryLoading(true);
    setQueryError("");
    try {
      const next = await application.query({
        ...selection,
        ...(tab === "mine" ? { assigneeId: catalog.actorId } : {}),
        cursor: page.nextCursor,
        limit: tab === "board" ? 100 : 20,
      });
      if (queryEpoch.current === epoch)
        setPage({ ...next, records: [...page.records, ...next.records] });
    } catch (exception) {
      if (queryEpoch.current === epoch)
        setQueryError((exception as Error).message);
    } finally {
      if (queryEpoch.current === epoch) setQueryLoading(false);
    }
  };
  const earlierRevisions = async () => {
    if (!selected || !history?.nextBefore || detailLoading) return;
    const epoch = detailEpoch.current;
    setDetailLoading(true);
    setDetailError("");
    try {
      const next = await application.history(selected.id, history.nextBefore);
      if (detailEpoch.current === epoch)
        setHistory({
          ...next,
          revisions: [...history.revisions, ...next.revisions],
        });
    } catch (exception) {
      if (detailEpoch.current === epoch)
        setDetailError((exception as Error).message);
    } finally {
      if (detailEpoch.current === epoch) setDetailLoading(false);
    }
  };
  return (
    <>
      <div
        className={`maintenance-workspace${reportId ? " maintenance-context-hidden" : ""}`}
        aria-hidden={reportId ? true : undefined}
      >
        <SectionHeading
          section="Maintenance"
          view={view}
          onHome={goHome}
          onBack={selectedId || form ? leaveDetails : undefined}
          description={t(
            "Track technical work, responsibility and recorded outcomes.",
          )}
          actions={
            <Actions>
              <RefreshButton busy={pending} disabled={form} onClick={refresh} />
              {!selectedId && !form && canContribute && (
                <AddButton
                  label={t("New maintenance")}
                  onClick={() => {
                    setDraft(undefined);
                    setForm(true);
                  }}
                />
              )}
              {!selectedId && !form && tab !== "config" && (
                <SearchControl
                  label={t("Search maintenance")}
                  placeholder={t(
                    "Title, repair target, equipment code or reference",
                  )}
                  value={selection.search ?? ""}
                  onChange={(search) =>
                    setSelection({ ...selection, search, cursor: "" })
                  }
                />
              )}
            </Actions>
          }
        />
        {[statusDialog ? "" : error, catalogError, queryError, detailError]
          .filter(Boolean)
          .map((value, index) => (
            <Alert key={index}>{t(value)}</Alert>
          ))}
        {message && <p role="status">{t(message)}</p>}
        {!catalog && (
          <Panel>
            {t(catalogLoading ? "Loading…" : "Reload to try again.")}
          </Panel>
        )}
        {catalog && (
          <>
            {!selectedId && !form && (
              <ViewNavigation
                label={t("Maintenance")}
                placement="tabs"
                selected={tab}
                onSelect={(value) => {
                  leaveDetails();
                  setTab(value);
                }}
                items={[
                  { id: "board", label: t("Board") },
                  { id: "records", label: t("Records") },
                  { id: "mine", label: t("My work") },
                  ...(canAdminister
                    ? [{ id: "config", label: t("Configuration") }]
                    : []),
                ]}
              />
            )}
            {form && (canEdit || (!selected && canContribute)) ? (
              <MaintenanceForm
                key={selected?.id ?? "new"}
                application={application}
                catalog={{ ...catalog, canCoordinate: !!canCoordinate }}
                record={
                  selected
                    ? {
                        ...selected,
                        canReassign: selected.canReassign && !!canCoordinate,
                      }
                    : undefined
                }
                pending={saving}
                lookupEquipment={lookupEquipment}
                renderReportCards={renderReportCards}
                openReport={openReport}
                reportRefresh={reportRefresh}
                initialData={draft}
                save={(input) => void save(input)}
                cancel={() => setForm(false)}
              />
            ) : selected ? (
              <Panel>
                <MaintenanceDetails record={selected} timeZone={timeZone} />
                {canEdit && (
                  <section
                    aria-label={t("Maintenance workflow")}
                    className="maintenance-status-actions"
                  >
                    <h3>{t("Move maintenance")}</h3>
                    <Actions>
                      {statuses
                        .filter((status) => status !== selected.data.status)
                        .map((status) => (
                          <Button
                            key={status}
                            variant={
                              status === "done" ? undefined : "secondary"
                            }
                            disabled={pending}
                            onClick={() => {
                              setError("");
                              if (
                                status === "done" ||
                                status === "blocked" ||
                                selected.data.status === "done"
                              )
                                setStatusDialog(status);
                              else void save(statusChange(selected, status));
                            }}
                          >
                            {status === "done"
                              ? t("Mark as done")
                              : t("Move to {0}", [statusLabel(status)])}
                          </Button>
                        ))}
                    </Actions>
                  </section>
                )}
                {statusDialog && canEdit && (
                  <MaintenanceStatusDialog
                    key={`${selected.id}:${statusDialog}`}
                    record={selected}
                    status={statusDialog}
                    suspended={!!reportId}
                    error={error}
                    application={application}
                    pending={saving}
                    save={save}
                    cancel={() => setStatusDialog(undefined)}
                    renderReportCards={renderReportCards}
                    openReport={openReport}
                    reportRefresh={reportRefresh}
                  />
                )}
                <RepairScope
                  application={application}
                  locationId={selected.data.locationId}
                  equipment={selected.data.equipment ?? []}
                  links={selected.data.linkedEntries ?? []}
                  renderReportCards={renderReportCards}
                  openReport={openReport}
                  refreshToken={reportRefresh}
                  completed={selected.data.status === "done"}
                />
                <Actions className="iop-form-actions">
                  {canEdit && (
                    <Button
                      disabled={detailLoading}
                      onClick={() => setForm(true)}
                    >
                      {t("Edit")}
                    </Button>
                  )}
                  {selected.data.assetId && onOpenAsset && (
                    <Button
                      variant="secondary"
                      onClick={() => onOpenAsset(selected.data.assetId)}
                    >
                      {t("Open asset record")}
                    </Button>
                  )}
                </Actions>
                <Disclosure variant="divided" summary={t("Revision history")}>
                  {history?.revisions.map((revision) => (
                    <Disclosure
                      variant="panel"
                      key={revision.record.revision}
                      summary={`#${revision.record.revision} · ${revision.actorName} · ${new Date(revision.at).toLocaleString(locale(), { timeZone })}`}
                    >
                      <p>{revision.reason || t(revision.action)}</p>
                      <MaintenanceDetails
                        record={revision.record}
                        timeZone={timeZone}
                      />
                    </Disclosure>
                  ))}
                  {history?.nextBefore ? (
                    <Button
                      variant="secondary"
                      disabled={detailLoading}
                      onClick={() => void earlierRevisions()}
                    >
                      {t("Earlier revisions")}
                    </Button>
                  ) : null}
                </Disclosure>
              </Panel>
            ) : selectedId ? (
              <Panel>
                {t(
                  detailLoading
                    ? "Loading maintenance record…"
                    : "Reload to try again.",
                )}
              </Panel>
            ) : tab === "config" && canAdminister ? (
              <PriorityConfiguration
                key={catalog.settings.revision}
                settings={catalog.settings}
                pending={saving}
                save={(priorities) => void saveSettings(priorities)}
              />
            ) : (
              <>
                <MaintenanceFilters
                  catalog={catalog}
                  selection={selection}
                  mine={tab === "mine"}
                  change={setSelection}
                />
                {page ? (
                  <>
                    <MaintenanceCollection
                      page={page}
                      board={tab === "board"}
                      select={select}
                      selectedStatus={selection.status}
                    />
                    <Actions>
                      <p role="status">
                        {t("Showing {0} of {1} records.", [
                          page.records.length,
                          page.total,
                        ])}
                      </p>
                      {page.nextCursor && (
                        <Button
                          variant="secondary"
                          disabled={queryLoading}
                          onClick={() => void loadMore()}
                        >
                          {t("Load more")}
                        </Button>
                      )}
                    </Actions>
                  </>
                ) : (
                  <Panel>
                    {t(queryLoading ? "Loading…" : "Reload to try again.")}
                  </Panel>
                )}
              </>
            )}
          </>
        )}
      </div>
      {reportId && renderReport?.(reportId, closeReport)}
    </>
  );
}
