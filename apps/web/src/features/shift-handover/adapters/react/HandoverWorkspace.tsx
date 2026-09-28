import { HandoverFilters } from "./HandoverFilters";
import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  PageHeading,
  Panel,
  ViewNavigation,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import {
  emptySelection,
  type Context,
  type Entry,
  type Page,
  type Selection,
} from "../../domain/models";
import { EntryCards, EntryMatrix, MeetingEntries } from "./Entries";
import { EntryDetail } from "./EntryDetail";
import { EntryForm, today } from "./EntryForm";
import "./handover.css";
const blankPage: Page = { entries: [], nextCursor: "", total: 0 };
export function HandoverWorkspace({
  application,
  initialEntry = "",
  initialHighlights = false,
  onEntryOpened,
}: {
  application: HandoverApplication;
  initialEntry?: string;
  initialHighlights?: boolean;
  onEntryOpened?: () => void;
}) {
  const [context, setContext] = useState<Context | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<"journal" | "matrix" | "meeting">("journal"),
    [selection, setSelection] = useState<Selection>({
      ...emptySelection,
      highlights: initialHighlights,
    }),
    [draft, setDraft] = useState<Selection>({
      ...emptySelection,
      highlights: initialHighlights,
    });
  const [page, setPage] = useState<Page>(blankPage),
    [pending, setPending] = useState<Page>(blankPage),
    [creating, setCreating] = useState(false),
    [detail, setDetail] = useState(initialEntry);
  useEffect(() => {
    onEntryOpened?.();
  }, []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    void application
      .open(selection, view === "meeting")
      .then((result) => {
        if (current) {
          setContext(result.context);
          setPage(result.current);
          setPending(result.pending);
        }
      })
      .catch((error) => {
        if (current) setError(error.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [application, selection, view, refresh]);
  const open = (id: string) => {
    setDetail(id);
    setCreating(false);
  };
  const history = (entry: Entry) => {
    const s = {
      ...emptySelection,
      equipmentReferenceId: entry.equipmentReferenceId,
    };
    setDraft(s);
    setSelection(s);
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
  if (detail && context)
    return (
      <EntryDetail
        key={detail}
        id={detail}
        context={context}
        application={application}
        close={() => setDetail("")}
        onChanged={() => setRefresh((n) => n + 1)}
        onEquipment={history}
      />
    );
  return (
    <section aria-label="Shift Handover" className="handover-workspace">
      <PageHeading
        eyebrow="Operations"
        title="Shift Handover"
        description="Share what happened. Keep the next team informed."
        actions={
          <Actions>
            <Button
              disabled={!context || busy}
              onClick={() => setCreating(true)}
            >
              New entry
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRefresh((n) => n + 1)}
            >
              Refresh
            </Button>
          </Actions>
        }
      />
      {error && <Alert>{error}</Alert>}
      {creating && context && (
        <EntryForm
          context={context}
          pending={busy}
          onCancel={() => setCreating(false)}
          onSave={async (content, issue, responsibleId) => {
            setBusy(true);
            setError("");
            try {
              const entry = await application.publish({
                content,
                issue,
                responsibleId,
              });
              setCreating(false);
              open(entry.id);
              setRefresh((n) => n + 1);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Publication failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      <ViewNavigation
        label="Handover views"
        selected={view}
        items={[
          { id: "journal", label: "Journal" },
          { id: "matrix", label: "Department matrix" },
          { id: "meeting", label: "Meeting preparation" },
        ]}
        onSelect={(next) => {
          setView(next);
          if (
            next === "meeting" &&
            context &&
            !selection.from &&
            !selection.to
          ) {
            const date = today(context.timeZone);
            const s = { ...selection, from: date, to: date, cursor: "" };
            setSelection(s);
            setDraft(s);
          }
        }}
      />
      {context && (
        <HandoverFilters
          context={context}
          draft={draft}
          setDraft={setDraft}
          disabled={loading || busy}
          onApply={() => setSelection({ ...draft, cursor: "" })}
          onReset={() => {
            setDraft({ ...emptySelection });
            setSelection({ ...emptySelection });
          }}
        />
      )}
      {loading ? (
        <p role="status">Loading handover…</p>
      ) : (
        !error && (
          <>
            <p>
              {page.total} matching entries · Showing {page.entries.length}
            </p>
            {!page.entries.length && (
              <Panel variant="empty">
                <h2>No entries for this selection</h2>
                <p>
                  Publish an update or adjust the filters to read earlier
                  history.
                </p>
              </Panel>
            )}
            {view === "matrix" ? (
              <EntryMatrix
                entries={page.entries}
                externalLabel={
                  context?.externalSystemLabel ?? "External reference"
                }
                open={open}
              />
            ) : view === "meeting" ? (
              <>
                <p>
                  Meeting dates select recorded updates. Open issues below
                  include earlier dates.
                </p>
                <MeetingEntries
                  entries={page.entries}
                  categories={context?.categories ?? []}
                  open={open}
                />
              </>
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
            {view === "meeting" && (
              <section>
                <h2>Open issues across dates</h2>
                <p>
                  {pending.total} unresolved · Showing {pending.entries.length}
                </p>
                <EntryCards entries={pending.entries} open={open} />
                {!pending.entries.length && (
                  <p>No unresolved issues for these filters.</p>
                )}
                {pending.nextCursor && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void more(true)}
                  >
                    More open issues
                  </Button>
                )}
              </section>
            )}
          </>
        )
      )}
    </section>
  );
}
