import { useState } from "react";
import {
  Actions,
  Button,
  Dialog,
  Field,
  FieldRow,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import {
  clearMatrixFilter,
  type MatrixColumn,
} from "../../application/matrix-filters";
import type { Context, Selection } from "../../domain/models";
export function MatrixColumnFilter({
  column,
  label,
  selection,
  people,
  onApply,
  onClose,
}: {
  column: MatrixColumn;
  label: string;
  selection: Selection;
  people: Context["people"];
  onApply: (value: Selection) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(selection);
  return (
    <Dialog title={t("Filter {0}", [label])} onClose={onClose}>
      <form
        className="handover-column-filter"
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ ...draft, cursor: "" });
          onClose();
        }}
      >
        {(column === "date" || column === "due") && (
          <FieldRow>
            <Field>
              {t("From")}
              <Input
                autoFocus
                type="date"
                value={(column === "date" ? draft.from : draft.dueFrom) ?? ""}
                max={(column === "date" ? draft.to : draft.dueTo) || undefined}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [column === "date" ? "from" : "dueFrom"]:
                      event.target.value,
                  })
                }
              />
            </Field>
            <Field>
              {t("Through")}
              <Input
                type="date"
                value={(column === "date" ? draft.to : draft.dueTo) ?? ""}
                min={
                  (column === "date" ? draft.from : draft.dueFrom) || undefined
                }
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [column === "date" ? "to" : "dueTo"]: event.target.value,
                  })
                }
              />
            </Field>
          </FieldRow>
        )}
        {column === "reference" && (
          <Field>
            {label}
            <Input
              autoFocus
              type="search"
              maxLength={160}
              value={draft.externalReference ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  externalReference: event.target.value,
                })
              }
            />
          </Field>
        )}
        {column === "responsible" && (
          <Field>
            {label}
            <Select
              autoFocus
              value={draft.responsibleId ?? "__all"}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  responsibleId:
                    event.target.value === "__all"
                      ? undefined
                      : event.target.value,
                })
              }
            >
              <option value="__all">{t("All people")}</option>
              <option value="">{t("Unassigned")}</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
              {draft.responsibleId &&
                !people.some((person) => person.id === draft.responsibleId) && (
                  <option value={draft.responsibleId}>
                    {draft.responsibleId}
                  </option>
                )}
            </Select>
          </Field>
        )}
        {column === "status" && (
          <>
            <Field>
              {t("Issue state")}
              <Select
                autoFocus
                value={draft.state}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    state: event.target.value as Selection["state"],
                  })
                }
              >
                <option value="">{t("All entries")}</option>
                <option value="pending">{t("Open and in progress")}</option>
                <option value="open">{t("Open")}</option>
                <option value="in-progress">{t("In progress")}</option>
                <option value="resolved">{t("Resolved")}</option>
                <option value="none">{t("Information")}</option>
              </Select>
            </Field>
            <Field>
              {t("Reported condition")}
              <Select
                value={draft.condition ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    condition: event.target.value as Selection["condition"],
                  })
                }
              >
                <option value="">{t("All conditions")}</option>
                <option value="damaged">{t("Damaged")}</option>
                <option value="inspection-needed">
                  {t("Inspection needed")}
                </option>
                <option value="blocked">{t("Blocked")}</option>
                <option value="repaired">{t("Repaired")}</option>
                <option value="restored">{t("Restored")}</option>
              </Select>
            </Field>
          </>
        )}
        <Actions className="iop-form-actions">
          <Button
            variant="secondary"
            onClick={() => {
              onApply(clearMatrixFilter(selection, column));
              onClose();
            }}
          >
            {t("Clear filter")}
          </Button>
          <Button type="submit">{t("Apply filter")}</Button>
        </Actions>
      </form>
    </Dialog>
  );
}
