import { withinLocation } from "../../domain/models";
import {
  Actions,
  Button,
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
      <FieldRow>
        <Field>
          From
          <Input
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </Field>
        <Field>
          Through
          <Input
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </Field>
        <Field>
          Department filter
          <Select
            aria-label="Department filter"
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
        <Field>
          Area filter
          <Select
            aria-label="Area filter"
            value={draft.areaId}
            onChange={(e) =>
              setDraft({
                ...draft,
                areaId: e.target.value,
                equipmentReferenceId: "",
              })
            }
          >
            <option value="">All areas</option>
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
          Category filter
          <Select
            aria-label="Category filter"
            value={draft.categoryId}
            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
          >
            <option value="">All categories</option>
            {context.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          Issue filter
          <Select
            aria-label="Issue filter"
            value={draft.state}
            onChange={(e) =>
              setDraft({
                ...draft,
                state: e.target.value as Selection["state"],
              })
            }
          >
            <option value="">All entries</option>
            <option value="pending">Open and in progress</option>
            <option value="resolved">Resolved</option>
            <option value="none">Information</option>
          </Select>
        </Field>
        <Field>
          Search
          <Input
            maxLength={240}
            placeholder="Summary, equipment code or work reference"
            value={draft.search}
            onChange={(e) => setDraft({ ...draft, search: e.target.value })}
          />
        </Field>
      </FieldRow>
      <Field layout="inline">
        <Input
          type="checkbox"
          checked={draft.highlights}
          onChange={(e) => setDraft({ ...draft, highlights: e.target.checked })}
        />
        Start highlights only
      </Field>
      {draft.equipmentReferenceId && (
        <p>
          Filtering one unverified equipment reference. Reset filters to see all
          entries.
        </p>
      )}
      <Actions>
        <Button type="submit" disabled={disabled}>
          Apply filters
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onReset();
          }}
        >
          Reset filters
        </Button>
      </Actions>
    </FilterForm>
  );
}
