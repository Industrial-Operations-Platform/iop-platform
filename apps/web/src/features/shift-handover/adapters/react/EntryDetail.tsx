import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Disclosure,
  Field,
  Panel,
  Select,
  Textarea,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type {
  Context,
  Entry,
  History,
  IssueState,
  ChangeEntry,
} from "../../domain/models";
import { EntryBody } from "./Entries";
import { EntryForm } from "./EntryForm";
export function EntryDetail({
  id,
  context,
  application,
  close,
  onChanged,
  onEquipment,
}: {
  id: string;
  context: Context;
  application: HandoverApplication;
  close: () => void;
  onChanged: () => void;
  onEquipment: (entry: Entry) => void;
}) {
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0),
    [editing, setEditing] = useState(false);
  const [action, setAction] = useState<
      "follow-up" | "state" | "assign" | "highlight"
    >("follow-up"),
    [note, setNote] = useState(""),
    [state, setState] = useState<IssueState>("open"),
    [responsible, setResponsible] = useState("");
  useEffect(() => {
    let current = true;
    setHistory(null);
    setError("");
    application
      .history(id)
      .then((h) => {
        if (current) {
          setHistory(h);
          setResponsible(h.entry.responsibleId);
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [application, id, attempt]);
  const change = async (input: ChangeEntry) => {
    setBusy(true);
    setError("");
    try {
      await application.change(input);
      setEditing(false);
      setNote("");
      setAttempt((n) => n + 1);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The update failed.");
    } finally {
      setBusy(false);
    }
  };
  const e = history?.entry,
    canEdit = !!e && (context.canCoordinate || e.authorId === context.actorId),
    canProgress = !!e && (canEdit || e.responsibleId === context.actorId);
  return (
    <section aria-label="Handover entry" className="handover-workspace">
      <Actions>
        <Button variant="secondary" onClick={close}>
          Back to handover
        </Button>
        <Button
          variant="text"
          disabled={busy}
          onClick={() => setAttempt((n) => n + 1)}
        >
          Reload entry
        </Button>
      </Actions>
      {error && <Alert>{error}</Alert>}
      {!history && !error && <p role="status">Loading entry…</p>}
      {e && (
        <>
          <Panel>
            <h2>{e.content.summary}</h2>
            <EntryBody entry={e} />
            <p>
              Recorded {new Date(e.createdAt).toLocaleString()} · Revision{" "}
              {e.revision}
            </p>
            <Actions>
              {canEdit && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setEditing((v) => !v)}
                >
                  Correct entry
                </Button>
              )}
              {e.equipmentReferenceId && (
                <Button variant="secondary" onClick={() => onEquipment(e)}>
                  Equipment reference history
                </Button>
              )}
            </Actions>
          </Panel>
          {editing ? (
            <EntryForm
              key={e.revision}
              context={context}
              entry={e}
              pending={busy}
              onCancel={() => setEditing(false)}
              onSave={(content, _issue, _responsible, note) =>
                change({
                  id: e.id,
                  expectedRevision: e.revision,
                  action: "correct",
                  note,
                  content,
                })
              }
            />
          ) : (
            <Panel>
              <form
                className="handover-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void change({
                    id: e.id,
                    expectedRevision: e.revision,
                    action,
                    note,
                    ...(action === "state"
                      ? { state }
                      : action === "assign"
                        ? { responsibleId: responsible }
                        : action === "highlight"
                          ? { highlighted: !e.highlighted }
                          : {}),
                  });
                }}
              >
                <h3>Follow-up and coordination</h3>
                <Field>
                  Update type
                  <Select
                    aria-label="Update type"
                    disabled={busy}
                    value={action}
                    onChange={(event) => {
                      setAction(event.target.value as typeof action);
                      setState(
                        e.issueState === "open" ? "in-progress" : "open",
                      );
                    }}
                  >
                    <option value="follow-up">Add follow-up</option>
                    {canProgress && (
                      <option value="state">Change issue state</option>
                    )}
                    {context.canCoordinate && e.issueState !== "none" && (
                      <option value="assign">Assign responsibility</option>
                    )}
                    {context.canCoordinate && (
                      <option value="highlight">
                        {e.highlighted
                          ? "Withdraw Start highlight"
                          : "Highlight on Start"}
                      </option>
                    )}
                  </Select>
                </Field>
                {action === "state" && (
                  <Field>
                    Issue state
                    <Select
                      aria-label="Issue state"
                      value={state}
                      onChange={(event) =>
                        setState(event.target.value as IssueState)
                      }
                    >
                      {(["open", "in-progress", "resolved"] as const)
                        .filter(
                          (s) =>
                            s !== e.issueState &&
                            (e.issueState !== "none" || s === "open"),
                        )
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </Select>
                  </Field>
                )}
                {action === "assign" && (
                  <Field>
                    Responsible person
                    <Select
                      aria-label="Responsible person"
                      value={responsible}
                      onChange={(event) => setResponsible(event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {context.people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field>
                  {action === "state" && state === "resolved"
                    ? "Resolution outcome"
                    : "Note / reason"}
                  <Textarea
                    required
                    maxLength={4000}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </Field>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save update"}
                </Button>
              </form>
            </Panel>
          )}
          <Panel>
            <h3>History</h3>
            <p>Earlier versions and follow-up remain available.</p>
            {history.revisions.map((r) => (
              <Disclosure
                key={r.entry.revision}
                summary={`Revision ${r.entry.revision} · ${r.action} · ${r.actorName} · ${new Date(r.at).toLocaleString()}`}
              >
                <p className="handover-prose">{r.note}</p>
                <h4>{r.entry.content.summary}</h4>
                <EntryBody entry={r.entry} />
              </Disclosure>
            ))}
            {!!history.nextBefore && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void application
                    .history(id, history.nextBefore)
                    .then((h) =>
                      setHistory({
                        ...history,
                        revisions: [...history.revisions, ...h.revisions],
                        nextBefore: h.nextBefore,
                      }),
                    )
                    .catch((e) => setError(e.message))
                    .finally(() => setBusy(false));
                }}
              >
                Earlier revisions
              </Button>
            )}
          </Panel>
        </>
      )}
    </section>
  );
}
