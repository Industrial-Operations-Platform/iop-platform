import { useState } from "react";
import {
  Actions,
  AddButton,
  Button,
  DeleteButton,
  Field,
  FieldRow,
  Input,
  Panel,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { Priority, Settings } from "../../domain/models";
export function PriorityConfiguration({
  settings,
  pending,
  save,
}: {
  settings: Settings;
  pending: boolean;
  save: (priorities: Priority[]) => void;
}) {
  const [priorities, setPriorities] = useState(() =>
    settings.priorities.map((priority) => ({ ...priority })),
  );
  return (
    <Panel>
      <div className="maintenance-collection-heading">
        <h2>{t("Maintenance priorities")}</h2>
        <AddButton
          label={t("Add priority")}
          disabled={pending || priorities.length >= 20}
          onClick={() =>
            setPriorities((current) => [
              ...current,
              {
                id: "",
                label: "",
                rank:
                  Array.from({ length: 101 }, (_, rank) => rank).find(
                    (rank) =>
                      !current.some((priority) => priority.rank === rank),
                  ) ?? 0,
              },
            ])
          }
        />
      </div>
      <p>
        {t(
          "Priority labels and order are configured for this site. Existing revisions retain their recorded labels.",
        )}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(priorities);
        }}
      >
        <fieldset disabled={pending} className="maintenance-fields">
          {priorities.map((priority, index) => {
            const change = (patch: Partial<Priority>) =>
              setPriorities((current) =>
                current.map((value, position) =>
                  position === index ? { ...value, ...patch } : value,
                ),
              );
            return (
              <FieldRow key={index}>
                <Field>
                  {t("ID")}
                  <Input
                    required
                    value={priority.id}
                    maxLength={101}
                    pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,100}"
                    onChange={(event) => change({ id: event.target.value })}
                  />
                </Field>
                <Field>
                  {t("Label")}
                  <Input
                    required
                    value={priority.label}
                    maxLength={80}
                    onChange={(event) => change({ label: event.target.value })}
                  />
                </Field>
                <Field>
                  {t("Order")}
                  <Input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={priority.rank}
                    onChange={(event) =>
                      change({ rank: Number(event.target.value) })
                    }
                  />
                </Field>
                <DeleteButton
                  label={t("Remove {0}", [priority.label || index + 1])}
                  onClick={() =>
                    setPriorities((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                />
              </FieldRow>
            );
          })}
          <Actions className="iop-form-actions">
            <Button type="submit" disabled={!priorities.length}>
              {t("Save configuration")}
            </Button>
          </Actions>
        </fieldset>
      </form>
    </Panel>
  );
}
