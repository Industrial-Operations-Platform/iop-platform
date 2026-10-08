import { t } from "../../../../localization/i18n";
import { MeetingCanvas } from "./MeetingCanvas";
import { EntrySummaryCards } from "./EntrySummaryCards";
import { useEffect, useState, type ReactNode } from "react";
import {
  DepartmentScope,
  Actions,
  AddButton,
  IconButton,
  ActionIcon,
  Alert,
  Button,
  Dialog,
  Disclosure,
  DateField,
  Panel,
  ViewNavigation,
} from "../../../../design/components";
import {
  meetingSelection,
  matrixSelection,
  type HandoverApplication,
} from "../../application/handover";
import {
  emptySelection,
  type Choice,
  type Context,
  type Entry,
  type Page,
  type Selection,
} from "../../domain/models";
import { EntryMatrix } from "./Entries";
import { EntryDetail } from "./EntryDetail";
import { EntryForm, today } from "./EntryForm";
import { HandoverFilters } from "./HandoverFilters";

import { HandoverHeading } from "./HandoverHeading";
import "./handover.css";
const blankPage: Page = { entries: [], nextCursor: "", total: 0 };
type View = "journal" | "matrix" | "meeting";
export function HandoverWorkspace({
  application,
  dailyOverview = false,
  initialEntry = "",
  initialHighlights = false,
  initialPending = false,
  initialAttention = false,
  departmentId = "",
  onDepartmentChange,
  onEntryOpened,
  onHome,
  onMaintenance,
  onPeople,
  onOpenMaintenance,
  renderPeople,
}: {
  application: HandoverApplication;
  dailyOverview?: boolean;
  initialEntry?: string;
  initialHighlights?: boolean;
  initialPending?: boolean;
  initialAttention?: boolean;
  departmentId?: string;
  onDepartmentChange?: (id: string) => void;
  onEntryOpened?: () => void;
  onHome?: () => void;
  onMaintenance?: (entry: Entry) => void;
  onPeople?: () => void;
  onOpenMaintenance?: (id: string) => void;
  renderPeople?: (date: string) => ReactNode;
}) {
  const [context, setContext] = useState<Context | null>(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<View>(
    initialHighlights || initialPending || initialAttention
      ? "matrix"
      : "meeting",
  );
  const [day, setDay] = useState("");
  const [selection, setSelection] = useState<Selection>({
    ...emptySelection,
    departmentId,
    highlights: initialHighlights,
    attention: initialAttention,
    state: initialPending ? "pending" : "",
    excludeAttention: initialPending,
  });
  const [draft, setDraft] = useState(selection),
    [searching, setSearching] = useState(false);
  const [filtered, setFiltered] = useState(
    initialHighlights || initialPending || initialAttention,
  );
  const [matrixHistory, setMatrixHistory] = useState(
    initialHighlights || initialPending || initialAttention,
  );
  const query =
    view === "matrix" ? matrixSelection(selection, matrixHistory) : view === "journal"
      ? { ...selection, ...(filtered ? {} : { from: day || today(context?.timeZone ?? "UTC"), to: day || today(context?.timeZone ?? "UTC") }), mine: true }
      : selection;
  const [page, setPage] = useState(blankPage);
  const [outstanding, setOutstanding] = useState<
    { category: Choice; page: Page }[]
  >([]);
  const [sections, setSections] = useState<{ category: Choice; page: Page }[]>(
    [],
  );
  const [creating, setCreating] = useState<string | null>(null),
    [detail, setDetail] = useState(initialEntry);
  const meetingLabel = dailyOverview ? "Daily overview" : "Meeting preparation";
  const viewLabels: Record<View, string> = {
    meeting: meetingLabel,
    journal: "Journal",
    matrix: "Department matrix",

  };
  useEffect(() => {
    onEntryOpened?.();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const load = async () => {
      if (view === "meeting") {
        const settings = context ?? (await application.context());
        const selected = meetingSelection(
          day || today(settings.timeZone),
          selection.departmentId,
          view === "meeting" && dailyOverview,
        );
        const [result, unresolved] = await Promise.all([
          application.board(selected),
          application.board(
            {
              ...selected,
              from: "",
              to: today(settings.timeZone),
              departmentId: selection.departmentId,
              state: "pending",
            },
            true,
          ),
        ]);
        if (active) {
          setContext(result.context);
          setSections(result.sections);
          setOutstanding(unresolved.sections);
        }
      } else {
        const result = await application.open(query);
        if (active) {
          setContext(result.context);
          setPage(result.current);
        }
      }
    };
    void load()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    application,
    selection,
    view,
    refresh,
    dailyOverview,
    day,
    matrixHistory,
  ]);
  const apply = (next: Selection) => {
    setSelection({ ...next, cursor: "" });
    setDraft({ ...next, cursor: "" });
  };
  const goHome = () => {
    if (onHome) {
      onHome();
      return;
    }
    setDetail("");
    setView("meeting");
    setDay("");
    setFiltered(false);
    setSearching(false);
    setCreating(null);
    apply({ ...emptySelection, departmentId: selection.departmentId });
  };
  const open = (id: string) => {
    setDetail(id);
    setCreating(null);
  };
  const equipmentHistory = (entry: Entry) => {
    apply({
      ...emptySelection,
      equipmentReferenceId: entry.equipmentReferenceId,
    });
    setFiltered(true);
    setMatrixHistory(true);
    setView("matrix");
    setDetail("");
  };
  const more = async () => {
    setBusy(true);
    setError("");
    try {
      const base = page;
      const next = await application.list({
        ...query,
        cursor: base.nextCursor,
      });
      const merged = { ...next, entries: [...base.entries, ...next.entries] };
      setPage(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load entries.");
    } finally {
      setBusy(false);
    }
  };
  const moreCategory = async (categoryId: string, unresolved = false) => {
    const section = (unresolved ? outstanding : sections).find(
      (s) => s.category.id === categoryId,
    );
    if (!section?.page.nextCursor) return;
    setBusy(true);
    setError("");
    try {
      const next = await application.list({
        ...meetingSelection(
          day || today(context!.timeZone),
          selection.departmentId,
          view === "meeting" && dailyOverview,
        ),
        ...(unresolved
          ? {
              from: "",
              to: today(context!.timeZone),
              departmentId: selection.departmentId,
              state: "pending" as const,
            }
          : {}),
        ...(!unresolved && section.category.workflow === "information" ? { from: "", to: "", departmentId: "", areaId: "", displayOn: day || today(context!.timeZone) } : {}),
        categoryId,
        cursor: section.page.nextCursor,
      });
      (unresolved ? setOutstanding : setSections)((current) =>
        current.map((s) =>
          s.category.id === categoryId
            ? {
                ...s,
                page: {
                  ...next,
                  entries: [...s.page.entries, ...next.entries],
                },
              }
            : s,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load entries.");
    } finally {
      setBusy(false);
    }
  };
  const returnToJournal = () => {
    setDetail("");
    setFiltered(false);
    apply({ ...emptySelection, departmentId: selection.departmentId });
  };
  const categoryLabel =
    view === "journal" && filtered
      ? context?.categories.find(
          (category) => category.id === selection.categoryId,
        )?.label
      : undefined;
  const journalTrail = categoryLabel
    ? [
        { label: t("Journal"), onSelect: returnToJournal },
        {
          label: categoryLabel,
          ...(detail ? { onSelect: () => setDetail("") } : {}),
        },
        ...(detail ? [{ label: t("Details") }] : []),
      ]
    : undefined;
  if (detail && context)
    return (
      <EntryDetail
        key={detail}
        id={detail}
        context={context}
        application={application}
        trail={journalTrail}
        viewLabel={viewLabels[view]}
        onHome={goHome}
        close={() => setDetail("")}
        onChanged={() => setRefresh((n) => n + 1)}
        onEquipment={equipmentHistory}
        onMaintenance={onMaintenance}
        onReference={(reference) => reference.source === "handover" ? open(reference.id) : onOpenMaintenance?.(reference.id)}
      />
    );
  return (
    <section aria-label={t("Shift Handover")} className="handover-workspace">
      <HandoverHeading
        trail={journalTrail}
        viewLabel={viewLabels[view]}
        onHome={goHome}
        actions={
          <Actions>
            <AddButton
              label={t("New entry")}
              disabled={!context}
              onClick={() => {
                setSearching(false);
                setCreating("");
              }}
            />
            {(view === "matrix" || view === "journal") && (
              <IconButton
                label={t("Search history")}
                disabled={!context}
                onClick={() => {
                  setDraft(selection);
                  setSearching(true);
                }}
              >
                <ActionIcon name="search" />
              </IconButton>
            )}
          </Actions>
        }
      />
      {context && (
        <div className="iop-scope-toolbar">
          {!(view === "meeting" && dailyOverview) && (
            <DepartmentScope
              value={selection.departmentId}
              disabled={busy}
              choices={context.locations.filter((l) => l.role === "department")}
              onChange={(id) => {
                onDepartmentChange?.(id);
                apply({
                  ...selection,
                  departmentId: id,
                  areaId: "",
                  equipmentReferenceId: "",
                });
              }}
            />
          )}
          {view === "journal" && (
            <DateField
              label={
                view === "journal"
                  ? t("Journal date")
                  : dailyOverview
                    ? t("Overview date")
                    : t("Meeting date")
              }
              required
              disabled={busy}
              value={day || today(context.timeZone)}
              onChange={(e) => {
                if (!e.target.value) return;
                setDay(e.target.value);
                setFiltered(false);
                apply({
                  ...emptySelection,
                  departmentId: selection.departmentId,
                });
              }}
            />
          )}
          {view === "matrix" && !matrixHistory && (
            <p>{t("Pending work and today’s updates")}</p>
          )}
          {view === "journal" && <p>{t("Your Journal · entries you published")}</p>}
        </div>
      )}
      <ViewNavigation
        label={t("Handover views")}
        selected={view}
        items={(Object.entries(viewLabels) as [View, string][]).map(
          ([id, label]) => ({
            id,
            label,
            disabled: busy || !context,
          }),
        )}
        onSelect={(next) => {
          if (busy || !context) return;
          setView(next);
          setMatrixHistory(false);
          setFiltered(false);
          apply({
            ...emptySelection,
            departmentId: selection.departmentId,
            mine: next === "journal",
          });
        }}
      />
      {error && !creating && <Alert>{error}</Alert>}
      {filtered && !categoryLabel && (
        <Actions>
          <p>
            {t(
              view === "matrix" && !matrixHistory
                ? "Filtered matrix"
                : "Filtered history ",
            )}
            {selection.categoryId
              ? ` · ${context?.categories.find((c) => c.id === selection.categoryId)?.label ?? ""}`
              : ""}
          </p>
          <Button
            variant="text"
            onClick={() => {
              setFiltered(false);
              setMatrixHistory(false);
              apply({
                ...emptySelection,
                departmentId: selection.departmentId,
                mine: view === "journal",
              });
            }}
          >
            {t("Clear search ")}
          </Button>
        </Actions>
      )}
      {loading ? (
        <p role="status">{t("Loading handover…")}</p>
      ) : (
        !error && (
          <>
            {view === "meeting" ? (
              <>
                <div className="handover-section-heading">
                  <h2>{t(meetingLabel)}</h2>
                  <div className="iop-scope-toolbar">
                    <DateField
                      label={
                        dailyOverview ? t("Overview date") : t("Meeting date")
                      }
                      required
                      disabled={busy}
                      value={day || today(context!.timeZone)}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setDay(e.target.value);
                        setFiltered(false);
                        apply({
                          ...emptySelection,
                          departmentId: selection.departmentId,
                        });
                      }}
                    />
                    <Button variant="text" onClick={() => setDay("")}>
                      {t("Today")}
                    </Button>
                  </div>
                </div>
                {dailyOverview && (
                  <p className="handover-muted">
                    {t("All users · All departments")}
                  </p>
                )}
                <MeetingCanvas
                  sections={sections}
                  openIssueTotal={outstanding.reduce((total, section) => total + section.page.total, 0)}
                  onPeople={onPeople}
                  peopleContent={renderPeople?.(day || today(context!.timeZone))}
                  open={open}
                  more={(id) => moreCategory(id)}
                  busy={busy}
                  add={(category) => setCreating(category.id)}
                  canAdd={(category) =>
                    category.canPublish !== false && (!category.coordinatorOnly || !!context?.canCoordinate)
                  }
                />
              </>
            ) : (
              <>
                <div className="handover-results-heading">
                  <h2>{categoryLabel ?? t(viewLabels[view])}</h2>
                  <p>
                    {page.total}
                    {t(" entries · Showing ")}
                    {page.entries.length}
                  </p>
                </div>
                {!page.entries.length && (
                  <Panel variant="empty">
                    <h2>{t("No updates for this selection")}</h2>
                    <p>{t("Share an update or search earlier history.")}</p>
                  </Panel>
                )}
                {(page.entries.length > 0 || view === "matrix") &&
                  (view === "matrix" ? (
                    <EntryMatrix
                      entries={page.entries}
                      selection={selection}
                      people={context?.people ?? []}
                      onFilter={(value) => {
                        apply(value);
                        setFiltered(true);
                      }}
                      externalLabel={
                        context?.externalSystemLabel ?? t("Work reference")
                      }
                      open={open}
                    />
                  ) : (
                    <EntrySummaryCards
                      entries={page.entries}
                      open={open}
                      expanded
                      personal
                    />
                  ))}
                {page.nextCursor && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void more()}
                  >
                    {t("More entries ")}
                  </Button>
                )}
              </>
            )}
            {(view === "meeting") && (
              <Disclosure
                summary={t("Department status · {0} open issues", [
                  outstanding.reduce(
                    (total, section) => total + section.page.total,
                    0,
                  ),
                ])}
                variant="panel"
              >
                {dailyOverview && view === "meeting" && (
                  <DepartmentScope
                    value={selection.departmentId}
                    choices={context!.locations.filter(
                      (location) => location.role === "department",
                    )}
                    onChange={(id) => apply({ ...selection, departmentId: id })}
                  />
                )}
                <p>
                  {t("Current unresolved topics through {0}", [
                    today(context!.timeZone),
                  ])}
                </p>
                <MeetingCanvas
                  sections={outstanding}
                  open={open}
                  more={(id) => moreCategory(id, true)}
                  busy={busy}
                  outstanding
                />
              </Disclosure>
            )}
          </>
        )
      )}
      {searching && context && creating === null && (
        <Dialog
          title={t("Search handover history")}
          onClose={() => setSearching(false)}
        >
          <HandoverFilters
            context={context}
            draft={draft}
            setDraft={setDraft}
            disabled={busy}
            onApply={() => {
              apply(draft);
              setMatrixHistory(true);
              setFiltered(true);
              setSearching(false);
            }}
            onReset={() =>
              setDraft({
                ...emptySelection,
                departmentId: selection.departmentId,
                mine: view === "journal",
              })
            }
          />
        </Dialog>
      )}
      {creating !== null && context && (
        <Dialog
          title={t("New handover entry")}
          busy={busy}
          onClose={() => setCreating(null)}
        >
          {error && <Alert>{error}</Alert>}
          <EntryForm
            application={application}
            context={context}
            defaults={{
              date: day || today(context.timeZone),
              ...(creating ? { categoryId: creating } : {}),
            }}
            pending={busy}
            onCancel={() => setCreating(null)}
            onSave={async (content, issue, responsibleId) => {
              setBusy(true);
              setError("");
              try {
                const entry = await application.publish({
                  content,
                  issue,
                  responsibleId,
                });
                open(entry.id);
                setRefresh((n) => n + 1);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Publication failed.",
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </Dialog>
      )}
    </section>
  );
}
