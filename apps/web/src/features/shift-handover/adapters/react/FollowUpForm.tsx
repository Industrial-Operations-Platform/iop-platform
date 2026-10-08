import { t } from "../../../../localization/i18n";
import { useState } from "react";
import {
  Actions,
  Button,
  Field,
  Select,
  Textarea,
} from "../../../../design/components";
import type {
  ChangeEntry,
  Context,
  Entry,
  IssueState,
} from "../../domain/models";
export function FollowUpForm({
  entry,
  context,
  pending,
  initialState,
  onSave,
  onCancel,
}: {
  entry: Entry;
  context: Context;
  pending: boolean;
  initialState?: IssueState;
  onSave: (input: ChangeEntry) => Promise<void>;
  onCancel: () => void;
}) {
  const [action, setAction] = useState<"follow-up" | "assign" | "highlight">(
    "follow-up",
  );
  const [state, setState] = useState<IssueState | "">(initialState ?? "");
  const [note, setNote] = useState(""),
    [responsible, setResponsible] = useState(entry.responsibleId);
  const canProgress =
    context.categories.find((category) => category.id === entry.content.categoryId)?.workflow !== "success" &&
    (context.canCoordinate ||
    entry.authorId === context.actorId ||
    entry.responsibleId === context.actorId);
  return (
    <form
      className="handover-form"
      aria-label={t("Follow-up and coordination")}
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          id: entry.id,
          expectedRevision: entry.revision,
          action,
          note,
          ...(action === "follow-up" && state
            ? { state }
            : action === "assign"
              ? { responsibleId: responsible }
              : action === "highlight"
                ? { highlighted: !entry.highlighted }
                : {}),
        });
      }}
    >
      <fieldset disabled={pending} className="handover-fields">
        {context.canCoordinate && (
          <Field>
            {t("Update type ")}
            <Select
              aria-label={t("Update type")}
              value={action}
              onChange={(e) => setAction(e.target.value as typeof action)}
            >
              <option value="follow-up">{t("Add follow-up")}</option>
              {entry.issueState !== "none" && (
                <option value="assign">{t("Assign responsibility")}</option>
              )}
              <option value="highlight">
                {entry.highlighted
                  ? t("Withdraw Start highlight")
                  : t("Highlight on Start")}
              </option>
            </Select>
          </Field>
        )}
        {action === "follow-up" && canProgress && (
          <Field>
            {t("Issue state ")}
            <Select
              aria-label={t("Issue state")}
              value={state}
              onChange={(e) => setState(e.target.value as typeof state)}
            >
              <option value="">{t("Keep current state")}</option>
              {(["open", "in-progress", "resolved"] as const)
                .filter(
                  (s) =>
                    s !== entry.issueState &&
                    (entry.issueState !== "none" || s === "open"),
                )
                .map((s) => (
                  <option key={s} value={s}>
                    {s === "resolved"
                      ? t("Resolved · Close issue")
                      : s === "open"
                        ? t("Open")
                        : t("In progress")}
                  </option>
                ))}
            </Select>
          </Field>
        )}
        {action === "assign" && (
          <Field>
            {t("Responsible person ")}
            <Select
              aria-label={t("Responsible person")}
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
            >
              <option value="">{t("Unassigned")}</option>
              {context.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field>
          {state === "resolved" && action === "follow-up"
            ? t("Resolution outcome")
            : t("Update / reason")}
          <Textarea
            autoFocus
            required
            maxLength={4000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <p>
          {t(
            "This update is added to the history. The original report is retained. ",
          )}
        </p>
        <Actions>
          <Button type="submit" disabled={pending}>
            {pending ? t("Saving…") : t("Save update")}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {t("Cancel ")}
          </Button>
        </Actions>
      </fieldset>
    </form>
  );
}
