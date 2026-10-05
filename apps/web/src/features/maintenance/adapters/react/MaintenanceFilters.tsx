import {
  Button,
  DateField,
  Disclosure,
  Field,
  FieldRow,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import { statuses, type Catalog, type Selection } from "../../domain/models";
import { statusLabel } from "./labels";
export function MaintenanceFilters({
  catalog,
  selection,
  mine,
  change,
}: {
  catalog: Catalog;
  selection: Selection;
  mine: boolean;
  change: (selection: Selection) => void;
}) {
  const field = (
    key: keyof Selection,
    label: string,
    choices: { id: string; label: string }[],
  ) => (
    <Field>
      {t(label)}
      <Select
        value={String(selection[key] ?? "")}
        onChange={(event) =>
          change({ ...selection, [key]: event.target.value, cursor: "" })
        }
      >
        <option value="">{t("All")}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
      </Select>
    </Field>
  );
  return (
    <>
      <div className="iop-scope-toolbar">
        <Field layout="inline" className="iop-context-field">
          <span>{t("Location")}</span>
          <Select
            aria-label={t("Selected location")}
            value={selection.locationId ?? ""}
            onChange={(event) =>
              change({
                ...selection,
                locationId: event.target.value,
                cursor: "",
              })
            }
          >
            <option value="">{t("All locations")}</option>
            {catalog.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.label}
              </option>
            ))}
          </Select>
        </Field>
        {mine && <p>{t("Showing work assigned to you.")}</p>}
      </div>
      <Disclosure variant="panel" summary={t("Filter maintenance")}>
        <FieldRow>
          {field(
            "status",
            "Status",
            statuses.map((status) => ({
              id: status,
              label: statusLabel(status),
            })),
          )}
          {field("priorityId", "Priority", catalog.settings.priorities)}
          {field(
            "assetId",
            "Asset",
            catalog.assets.map((asset) => ({
              id: asset.id,
              label: asset.name,
            })),
          )}
          {!mine &&
            field(
              "assigneeId",
              "Responsible person",
              catalog.people.map((person) => ({
                id: person.id,
                label: person.name,
              })),
            )}
          {field("teamId", "Team", catalog.teams)}
          <DateField
            label={t("Due from")}
            value={selection.dueFrom ?? ""}
            max={selection.dueTo || undefined}
            onChange={(event) =>
              change({ ...selection, dueFrom: event.target.value, cursor: "" })
            }
          />
          <DateField
            label={t("Completed from")}
            value={selection.doneFrom ?? ""}
            max={selection.doneTo || undefined}
            onChange={(event) =>
              change({ ...selection, doneFrom: event.target.value, cursor: "" })
            }
          />
          <DateField
            label={t("Completed to")}
            value={selection.doneTo ?? ""}
            min={selection.doneFrom || undefined}
            onChange={(event) =>
              change({ ...selection, doneTo: event.target.value, cursor: "" })
            }
          />
          <Field>
            {t("Completed work period")}
            <Select
              value={selection.history ? "history" : "operational"}
              onChange={(event) =>
                change({
                  ...selection,
                  history: event.target.value === "history",
                  cursor: "",
                })
              }
            >
              <option value="operational">
                {t("Previous and current week")}
              </option>
              <option value="history">{t("All completed history")}</option>
            </Select>
          </Field>
          <DateField
            label={t("Due to")}
            value={selection.dueTo ?? ""}
            min={selection.dueFrom || undefined}
            onChange={(event) =>
              change({ ...selection, dueTo: event.target.value, cursor: "" })
            }
          />
          <Button
            variant="secondary"
            onClick={() => change({ search: selection.search })}
          >
            {t("Clear filters")}
          </Button>
        </FieldRow>
      </Disclosure>
      <p className="maintenance-muted">
        {t(
          "Open, in-progress and blocked work stays visible until completed. Completed work defaults to the previous and current site weeks.",
        )}
      </p>
    </>
  );
}
