import { MeetingCanvas, MeetingCards } from "./MeetingCanvas";
import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Dialog,
  Disclosure,
  Field,
  Input,
  PageHeading,
  Panel,
  Select,
  ViewNavigation,
} from "../../../../design/components";
import {
  meetingSelection,
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
import { EntryCards, EntryMatrix } from "./Entries";
import { EntryDetail } from "./EntryDetail";
import { EntryForm, today } from "./EntryForm";
import { HandoverFilters } from "./HandoverFilters";
import { CategoryBoard } from "./CategoryBoard";
import "./handover.css";
const blankPage: Page = { entries: [], nextCursor: "", total: 0 };
type View = "journal" | "matrix" | "meeting" | "mine";
export function HandoverWorkspace({
  application,
  dailyOverview = false,
  initialEntry = "",
  initialHighlights = false,
  initialPending = false,
  departmentId = "",
  onDepartmentChange,
  onEntryOpened,
  onHome,
}: {
  application: HandoverApplication;
  dailyOverview?: boolean;
  initialEntry?: string;
  initialHighlights?: boolean;
  initialPending?: boolean;
  departmentId?: string;
  onDepartmentChange?: (id: string) => void;
  onEntryOpened?: () => void;
  onHome?: () => void;
}) {
  const [context, setContext] = useState<Context | null>(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<View>("journal");
  const [selection, setSelection] = useState<Selection>({
    ...emptySelection,
    departmentId: initialHighlights ? "" : departmentId,
    highlights: initialHighlights,
    state: initialPending ? "pending" : "",
  });
  const [draft, setDraft] = useState(selection),
    [searching, setSearching] = useState(false);
  const [filtered, setFiltered] = useState(initialHighlights || initialPending);
  const [page, setPage] = useState(blankPage),
    [pending, setPending] = useState(blankPage);
  const [sections, setSections] = useState<{ category: Choice; page: Page }[]>(
    [],
  );
  const [creating, setCreating] = useState<string | null>(null),
    [detail, setDetail] = useState(initialEntry);
  const board = view === "journal" && !filtered;
  const meetingLabel = dailyOverview ? "Daily overview" : "Meeting preparation";
  useEffect(() => {
    onEntryOpened?.();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const load = async () => {
      if (board || view === "meeting") {
        const selected =
          view === "meeting"
            ? meetingSelection(
                selection.from,
                selection.departmentId,
                dailyOverview,
              )
            : selection;
        const result = await application.board(selected);
        const issues =
          view === "meeting" && !dailyOverview
            ? await application.list({
                departmentId: selected.departmentId,
                state: "pending",
              })
            : blankPage;
        if (active) {
          setContext(result.context);
          setSections(result.sections);
          setPending(issues);
        }
      } else {
        const result = await application.open(selection, false);
        if (active) {
          setContext(result.context);
          setPage(result.current);
          setPending(result.pending);
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
  }, [application, selection, view, refresh, board, dailyOverview]);
  const apply = (next: Selection) => {
    setSelection({ ...next, cursor: "" });
    setDraft({ ...next, cursor: "" });
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
    setView("journal");
    setDetail("");
  };
  const more = async (issues = false) => {
    setBusy(true);
    setError("");
    try {
      const base = issues ? pending : page;
      const next = await application.list({
        ...selection,
        ...(issues ? { from: "", to: "", state: "pending" as const } : {}),
        cursor: base.nextCursor,
      });
      const merged = { ...next, entries: [...base.entries, ...next.entries] };
      if (issues) setPending(merged);
      else setPage(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load entries.");
    } finally {
      setBusy(false);
    }
  };
  const moreCategory = async (categoryId: string) => {
    const section = sections.find((s) => s.category.id === categoryId);
    if (!section?.page.nextCursor) return;
    setBusy(true);
    setError("");
    try {
      const next = await application.list({
        ...meetingSelection(
          selection.from,
          selection.departmentId,
          dailyOverview,
        ),
        categoryId,
        cursor: section.page.nextCursor,
      });
      setSections((current) =>
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
  if (detail && context)
    return (
      <EntryDetail
        key={detail}
        id={detail}
        context={context}
        application={application}
        close={onHome ?? (() => setDetail(""))}
        onChanged={() => setRefresh((n) => n + 1)}
        onEquipment={equipmentHistory}
      />
    );
  return (
    <section aria-label="Shift Handover" className="handover-workspace">
      <PageHeading
        eyebrow="Operations"
        title="Shift Handover"
        description="What happened. What needs attention. What comes next."
        actions={
          <Actions>
            <Button
              disabled={!context}
              onClick={() => {
                setSearching(false);
                setCreating("");
              }}
            >
              New entry
            </Button>
            {view !== "meeting" && (
              <Button
                variant="secondary"
                disabled={!context}
                onClick={() => {
                  setDraft(selection);
                  setSearching(true);
                }}
              >
                Search history
              </Button>
            )}
            <Button
              variant="text"
              disabled={loading || busy}
              onClick={() => setRefresh((n) => n + 1)}
            >
              Refresh
            </Button>
          </Actions>
        }
      />
      {context && (
        <div className="handover-toolbar">
          {!(view === "meeting" && dailyOverview) && (
            <Field>
              Department / Halle
              <Select
                disabled={busy}
                aria-label="Selected department"
                value={selection.departmentId}
                onChange={(e) => {
                  const id = e.target.value;
                  onDepartmentChange?.(id);
                  apply({
                    ...selection,
                    departmentId: id,
                    areaId: "",
                    equipmentReferenceId: "",
                  });
                }}
              >
                <option value="">All departments</option>
                {context.locations
                  .filter((l) => l.role === "department")
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
              </Select>
            </Field>
          )}
          {view === "meeting" && (
            <Field>
              {dailyOverview ? "Overview date" : "Meeting date"}
              <Input
                type="date"
                aria-label={dailyOverview ? "Overview date" : "Meeting date"}
                required
                disabled={busy}
                value={selection.from}
                onChange={(e) =>
                  e.target.value &&
                  apply({
                    ...selection,
                    from: e.target.value,
                    to: e.target.value,
                  })
                }
              />
            </Field>
          )}
          <p>
            {view === "meeting" ? selection.from : today(context.timeZone)} ·{" "}
            {view === "meeting" && dailyOverview
              ? "All users · All departments"
              : view === "mine"
                ? "Entries you published"
                : "Select a department to catch up with your team"}
          </p>
        </div>
      )}
      <ViewNavigation
        label="Handover views"
        selected={view}
        items={[
          { id: "journal", label: "Journal", disabled: busy || !context },
          {
            id: "matrix",
            label: "Department matrix",
            disabled: busy || !context,
          },
          { id: "meeting", label: meetingLabel, disabled: busy || !context },
          { id: "mine", label: "My entries", disabled: busy || !context },
        ]}
        onSelect={(next) => {
          if (busy || !context) return;
          setView(next);
          setFiltered(false);
          const date = context ? today(context.timeZone) : "";
          apply({
            ...emptySelection,
            departmentId: selection.departmentId,
            mine: next === "mine",
            ...(next === "meeting"
              ? meetingSelection(date, selection.departmentId, dailyOverview)
              : {}),
          });
        }}
      />
      {error && !creating && <Alert>{error}</Alert>}
      {filtered && (
        <Actions>
          <p>
            Filtered history
            {selection.categoryId
              ? ` · ${context?.categories.find((c) => c.id === selection.categoryId)?.label ?? ""}`
              : ""}
          </p>
          <Button
            variant="text"
            onClick={() => {
              setFiltered(false);
              apply({
                ...emptySelection,
                departmentId: selection.departmentId,
                mine: view === "mine",
              });
            }}
          >
            Clear search
          </Button>
        </Actions>
      )}
      {loading ? (
        <p role="status">Loading handover…</p>
      ) : (
        !error && (
          <>
            {board ? (
              <CategoryBoard
                sections={sections}
                add={setCreating}
                open={open}
                history={(categoryId) => {
                  apply({ ...selection, categoryId });
                  setFiltered(true);
                }}
              />
            ) : view === "meeting" ? (
              <>
                <h2>{meetingLabel}</h2>
                <MeetingCanvas
                  sections={sections}
                  open={open}
                  more={moreCategory}
                  busy={busy}
                />
                {!dailyOverview && (
                  <Disclosure
                    summary={`Earlier and current open issues · ${pending.total}`}
                    variant="panel"
                  >
                    <MeetingCards entries={pending.entries} open={open} />
                    {!pending.total && <p>No unresolved issues.</p>}
                    {pending.nextCursor && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void more(true)}
                      >
                        More open issues
                      </Button>
                    )}
                  </Disclosure>
                )}
              </>
            ) : (
              <>
                <p>
                  {page.total} entries · Showing {page.entries.length}
                </p>
                {!page.entries.length && (
                  <Panel variant="empty">
                    <h2>No updates for this selection</h2>
                    <p>Share an update or search earlier history.</p>
                  </Panel>
                )}
                {view === "matrix" ? (
                  <EntryMatrix
                    entries={page.entries}
                    externalLabel={
                      context?.externalSystemLabel ?? "Work reference"
                    }
                    open={open}
                  />
                ) : (
                  <EntryCards entries={page.entries} open={open} />
                )}
                {page.nextCursor && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void more()}
                  >
                    More entries
                  </Button>
                )}
              </>
            )}
          </>
        )
      )}
      {searching && context && creating === null && (
        <Dialog
          title="Search handover history"
          onClose={() => setSearching(false)}
        >
          <HandoverFilters
            context={context}
            draft={draft}
            setDraft={setDraft}
            disabled={busy}
            onApply={() => {
              apply(draft);
              setFiltered(true);
              setSearching(false);
            }}
            onReset={() =>
              setDraft({
                ...emptySelection,
                departmentId: selection.departmentId,
                mine: view === "mine",
              })
            }
          />
        </Dialog>
      )}
      {creating !== null && context && (
        <Dialog
          title="New handover entry"
          busy={busy}
          onClose={() => setCreating(null)}
        >
          {error && <Alert>{error}</Alert>}
          <EntryForm
            application={application}
            context={context}
            defaults={{
              departmentId: selection.departmentId,
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
