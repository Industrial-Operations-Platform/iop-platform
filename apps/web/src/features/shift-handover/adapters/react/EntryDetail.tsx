import { FollowUpForm } from "./FollowUpForm";
import { useEffect, useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Disclosure,
  Dialog,
  Panel,
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
import { HandoverHeading } from "./HandoverHeading";
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
  const [following, setFollowing] = useState(false);
  const [initialState, setInitialState] = useState<IssueState | undefined>();
  useEffect(() => {
    let current = true;
    setHistory(null);
    setError("");
    application
      .history(id)
      .then((h) => {
        if (current) {
          setHistory(h);
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
      setFollowing(false);
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
      <HandoverHeading onHome={close} />
      {error && !editing && !following && <Alert>{error}</Alert>}
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
            {(e.latestUpdate ||
              history.revisions.find(
                (r) => r.action === "follow-up" || r.action === "state",
              )) && (
              <div className="handover-preview">
                <h3>Latest update</h3>
                <p className="handover-prose">
                  {e.latestUpdate?.note ??
                    history.revisions.find(
                      (r) => r.action === "follow-up" || r.action === "state",
                    )?.note}
                </p>
              </div>
            )}
            <Actions>
              <Button
                onClick={() => {
                  setInitialState(undefined);
                  setFollowing(true);
                }}
              >
                Add follow-up
              </Button>
              {canProgress && e.issueState !== "none" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInitialState(
                      e.issueState === "resolved" ? "open" : "resolved",
                    );
                    setFollowing(true);
                  }}
                >
                  {e.issueState === "resolved" ? "Reopen issue" : "Close issue"}
                </Button>
              )}
              {canProgress && e.issueState === "none" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInitialState("open");
                    setFollowing(true);
                  }}
                >
                  Track as issue
                </Button>
              )}

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
          {editing && (
            <Dialog
              title="Correct entry"
              busy={busy}
              onClose={() => setEditing(false)}
            >
              {error && <Alert>{error}</Alert>}
              <EntryForm
                application={application}
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
            </Dialog>
          )}
          {following && (
            <Dialog
              title="Follow-up and coordination"
              busy={busy}
              onClose={() => setFollowing(false)}
            >
              {error && <Alert>{error}</Alert>}
              <FollowUpForm
                entry={e}
                context={context}
                pending={busy}
                initialState={initialState}
                onSave={change}
                onCancel={() => setFollowing(false)}
              />
            </Dialog>
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
