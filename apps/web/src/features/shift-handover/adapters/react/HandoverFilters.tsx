import { t } from "../../../../localization/i18n";
import { withinLocation } from "../../domain/models";
import {
  Actions,
  Button,
  DateField,
  Field,
  FieldRow,
  FilterForm,
  Input,
  Select,
} from "../../../../design/components";
import type { Context, Selection } from "../../domain/models";
export function HandoverFilters({
  context,
  draft,
  setDraft,
  disabled,
  onApply,
  onReset,
}: {
  context: Context;
  draft: Selection;
  setDraft: (selection: Selection) => void;
  disabled: boolean;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <FilterForm
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <Field>
        {t("Search ")}
        <Input
          autoFocus
          type="search"
          maxLength={240}
          placeholder={t("Summary, equipment code or work reference")}
          value={draft.search}
          onChange={(e) => setDraft({ ...draft, search: e.target.value })}
        />
      </Field>
      <FieldRow>
        <DateField
          label={t("From ")}
          value={draft.from}
          onChange={(e) => setDraft({ ...draft, from: e.target.value })}
        />
        <DateField
          label={t("Through ")}
          value={draft.to}
          onChange={(e) => setDraft({ ...draft, to: e.target.value })}
        />
        <Field>
          {t("Department filter ")}
          <Select
            aria-label={t("Department filter")}
            value={draft.departmentId}
            onChange={(e) =>
              setDraft({
                ...draft,
                departmentId: e.target.value,
                areaId: "",
                equipmentReferenceId: "",
              })
            }
          >
            <option value="">{t("All departments")}</option>
            {context.locations
              .filter((l) => l.role === "department")
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
          </Select>
        </Field>
        <Field>
          {t("Area filter ")}
          <Select
            aria-label={t("Area filter")}
            value={draft.areaId}
            onChange={(e) =>
              setDraft({
                ...draft,
                areaId: e.target.value,
                equipmentReferenceId: "",
              })
            }
          >
            <option value="">{t("All areas")}</option>
            {context.locations
              .filter(
                (l) =>
                  l.role === "area" &&
                  (!draft.departmentId ||
                    withinLocation(
                      l.id,
                      draft.departmentId,
                      context.locations,
                    )),
              )
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
          </Select>
        </Field>
        <Field>
          {t("Category filter ")}
          <Select
            aria-label={t("Category filter")}
            value={draft.categoryId}
            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
          >
            <option value="">{t("All categories")}</option>
            {context.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.label)}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t("Issue filter ")}
          <Select
            aria-label={t("Issue filter")}
            value={draft.state}
            onChange={(e) =>
              setDraft({
                ...draft,
                state: e.target.value as Selection["state"],
              })
            }
          >
            <option value="">{t("All entries")}</option>
            <option value="pending">{t("Open and in progress")}</option>
            <option value="resolved">{t("Resolved")}</option>
            <option value="none">{t("Information")}</option>
          </Select>
        </Field>
      </FieldRow>
      <Field layout="inline">
        <Input
          type="checkbox"
          checked={draft.highlights}
          onChange={(e) => setDraft({ ...draft, highlights: e.target.checked })}
        />
        {t("Start highlights only ")}
      </Field>
      {draft.equipmentReferenceId && (
        <p>
          {t(
            "Filtering one unverified equipment reference. Reset filters to see all entries. ",
          )}
        </p>
      )}
      <Actions>
        <Button type="submit" disabled={disabled}>
          {t("Search entries ")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onReset();
          }}
        >
          {t("Clear fields ")}
        </Button>
      </Actions>
    </FilterForm>
  );
}
