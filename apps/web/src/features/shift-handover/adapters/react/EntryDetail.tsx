import { locale, t } from "../../../../localization/i18n";
import { FollowUpForm } from "./FollowUpForm";
import { useEffect, useState } from "react";
import {
  type BreadcrumbItem,
  Actions,
  Alert,
  Button,
  Disclosure,
  Dialog,
  Panel,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type {
  CompletedReference,
  Context,
  Entry,
  History,
  IssueState,
  ChangeEntry,
} from "../../domain/models";
import { EntryDetailBody } from "./EntryDetailBody";
import { EntryForm } from "./EntryForm";
import { HandoverHeading } from "./HandoverHeading";
export function EntryDetail({
  id,
  context,
  application,
  close,
  onHome,
  viewLabel,
  trail,
  onChanged,
  onEquipment,
  onMaintenance,
  onReference,
}: {
  id: string;
  context: Context;
  application: HandoverApplication;
  close: () => void;
  onHome: () => void;
  viewLabel: string;
  trail?: BreadcrumbItem[];
  onChanged: () => void;
  onEquipment?: (entry: Entry) => void;
  onMaintenance?: (entry: Entry) => void;
  onReference?: (reference: CompletedReference) => void;
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
  const e = history?.entry;
  const category = context.categories.find((choice) => choice.id === e?.content.categoryId);
  const categoryWritable = category?.canPublish !== false && (context.canCoordinate || !category?.coordinatorOnly);
  const canEdit = !!e && !e.deleted && categoryWritable && (context.canCoordinate || e.authorId === context.actorId);
  const canProgress = !!e && !e.deleted && categoryWritable && category?.workflow !== "success" &&
    (canEdit || e.responsibleId === context.actorId);
  return (
    <section aria-label={t("Handover entry")} className="handover-workspace">
      <HandoverHeading
        onHome={onHome}
        viewLabel={viewLabel}
        onBack={close}
        trail={trail}
      />
      {error && !editing && !following && <Alert>{error}</Alert>}
      {!history && !error && <p role="status">{t("Loading entry…")}</p>}
      {e && (
        <>
          <Panel className="handover-detail-panel">
            <h2>{e.content.summary}</h2>
            <EntryDetailBody entry={e} onReference={onReference} />
            <p className="handover-detail-recorded">
              {t("Recorded ")}
              {new Date(e.createdAt).toLocaleString(locale())}
              {t(" · Revision")} {e.revision}
            </p>
            {(e.latestUpdate ||
              history.revisions.find(
                (r) => r.action === "follow-up" || r.action === "state",
              )) && (
              <div className="handover-preview">
                <h3>{t("Latest update")}</h3>
                <p className="handover-prose">
                  {e.latestUpdate?.note ??
                    history.revisions.find(
                      (r) => r.action === "follow-up" || r.action === "state",
                    )?.note}
                </p>
              </div>
            )}
            <Actions className="handover-entry-actions">
              {onMaintenance && !e.deleted && (
                <Button variant="secondary" onClick={() => onMaintenance(e)}>
                  {t("Plan maintenance")}
                </Button>
              )}
              {context.canDelete && !e.deleted && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    void application
                      .remove(e)
                      .then(() => {
                        onChanged();
                        close();
                      })
                      .catch((reason) => setError(reason.message))
                      .finally(() => setBusy(false));
                  }}
                >
                  {t("Delete entry")}
                </Button>
              )}
              {categoryWritable && <Button
                onClick={() => {
                  setInitialState(undefined);
                  setFollowing(true);
                }}
              >
                {t("Add follow-up ")}
              </Button>}
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
                  {e.issueState === "resolved"
                    ? t("Reopen issue")
                    : t("Close issue")}
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
                  {t("Track as issue ")}
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setEditing((v) => !v)}
                >
                  {t("Correct entry ")}
                </Button>
              )}
              {e.equipmentReferenceId && onEquipment && (
                <Button variant="secondary" onClick={() => onEquipment(e)}>
                  {t("Equipment reference history ")}
                </Button>
              )}
            </Actions>
          </Panel>
          {editing && (
            <Dialog
              title={t("Correct entry")}
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
              title={t("Follow-up and coordination")}
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
          <Panel className="handover-detail-history">
            <h3>{t("History")}</h3>
            <p>{t("Earlier versions and follow-up remain available.")}</p>
            {history.revisions.map((r) => (
              <Disclosure
                variant="panel"
                key={r.entry.revision}
                summary={t("Revision {0} · {1} · {2} · {3}", [
                  r.entry.revision,
                  r.action,
                  r.actorName,
                  new Date(r.at).toLocaleString(locale()),
                ])}
              >
                <p className="handover-prose">{r.note}</p>
                <h4>{r.entry.content.summary}</h4>
                <EntryDetailBody entry={r.entry} />
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
                {t("Earlier revisions ")}
              </Button>
            )}
          </Panel>
        </>
      )}
    </section>
  );
}
