import type { HandoverApplication } from "../../application/handover";
import { EquipmentPicker } from "./EquipmentPicker";
import { withinLocation } from "../../domain/models";
import { useState } from "react";
import {
  Actions,
  Button,
  Disclosure,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
  Textarea,
} from "../../../../design/components";
import type { Content, Context, Entry } from "../../domain/models";
export function today(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function EntryForm({
  context,
  application,
  defaults,
  entry,
  pending,
  onSave,
  onCancel,
}: {
  context: Context;
  application: HandoverApplication;
  defaults?: Partial<Content>;
  entry?: Entry;
  pending: boolean;
  onSave: (
    content: Content,
    issue: boolean,
    responsibleId: string,
    note: string,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Content>(
    entry?.content ?? {
      date: today(context.timeZone),
      categoryId: context.categories[0].id,
      summary: "",
      details: "",
      departmentId: "",
      areaId: "",
      equipmentCode: "",
      equipmentNamespace: "site-equipment",
      condition: "",
      externalReference: "",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: false,
      ...defaults,
    },
  );
  const [issue, setIssue] = useState(
      entry ? entry.issueState !== "none" : false,
    ),
    [responsible, setResponsible] = useState(entry?.responsibleId ?? ""),
    [note, setNote] = useState("");
  const field = <K extends keyof Content>(key: K, next: Content[K]) =>
    setValue((v) => ({ ...v, [key]: next }));
  return (
    <Panel>
      <form
        aria-label={entry ? "Correct entry" : "New handover entry"}
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(value, issue, responsible, note);
        }}
      >
        <p>
          Write the short update you would share at handover. Add details when
          needed.
        </p>
        <fieldset disabled={pending} className="handover-fields">
          <FieldRow>
            <Field>
              Date
              <Input
                type="date"
                required
                disabled={!context.canCoordinate}
                value={value.date}
                onChange={(e) => field("date", e.target.value)}
              />
            </Field>
            <Field>
              Category
              <Select
                aria-label="Category"
                value={value.categoryId}
                onChange={(e) => field("categoryId", e.target.value)}
              >
                {context.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <Field>
            Summary
            <Input
              autoFocus
              required
              maxLength={240}
              value={value.summary}
              onChange={(e) => field("summary", e.target.value)}
            />
          </Field>
          <FieldRow>
            <Field>
              Department / Halle
              <Select
                aria-label="Department / Halle"
                value={value.departmentId}
                onChange={(e) =>
                  setValue((v) => ({
                    ...v,
                    departmentId: e.target.value,
                    areaId: "",
                    equipmentCode: "",
                    condition: "",
                  }))
                }
              >
                <option value="">Site-wide information</option>
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
              Area / Bereich
              <Select
                aria-label="Area / Bereich"
                value={value.areaId}
                disabled={!value.departmentId}
                onChange={(e) =>
                  setValue((v) => ({
                    ...v,
                    areaId: e.target.value,
                    equipmentCode: "",
                    condition: "",
                  }))
                }
              >
                <option value="">No specific area</option>
                {context.locations
                  .filter(
                    (l) =>
                      l.role === "area" &&
                      withinLocation(
                        l.id,
                        value.departmentId,
                        context.locations,
                      ),
                  )
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
              </Select>
            </Field>
          </FieldRow>
          {!context.locations.length && (
            <p>
              No departments are configured yet. You can publish site-wide
              information.
            </p>
          )}
          <EquipmentPicker
            application={application}
            departmentId={value.departmentId}
            areaId={value.areaId}
            value={value.equipmentCode}
            disabled={pending}
            onChange={(equipmentCode) =>
              setValue((v) => ({
                ...v,
                equipmentCode,
                equipmentNamespace: "site-equipment",
                ...(!equipmentCode ? { condition: "" } : {}),
              }))
            }
          >
            <Field>
              Reported condition
              <Select
                aria-label="Reported condition"
                disabled={!value.equipmentCode}
                value={value.condition}
                onChange={(e) => {
                  field("condition", e.target.value as Content["condition"]);
                  if (
                    ["damaged", "inspection-needed", "blocked"].includes(
                      e.target.value,
                    )
                  )
                    setIssue(true);
                }}
              >
                <option value="">Not reported</option>
                <option value="damaged">Damaged</option>
                <option value="inspection-needed">Inspection needed</option>
                <option value="blocked">Blocked</option>
                <option value="repaired">Repaired</option>
                <option value="restored">Restored</option>
              </Select>
            </Field>
          </EquipmentPicker>
          {value.equipmentCode && (
            <p>
              Component reference · Unverified. This report records an
              observation.
            </p>
          )}
          <Field layout="inline">
            <Input
              type="checkbox"
              checked={value.discuss}
              onChange={(e) => field("discuss", e.target.checked)}
            />
            Discuss in meeting
          </Field>
          <Disclosure
            summary="Details, work reference and problem analysis"
            variant="panel"
          >
            <Field>
              Details
              <Textarea
                maxLength={4000}
                value={value.details}
                onChange={(e) => field("details", e.target.value)}
              />
            </Field>
            <Field>
              {context.externalSystemLabel} reference
              <Input
                maxLength={160}
                value={value.externalReference}
                onChange={(e) => field("externalReference", e.target.value)}
              />
            </Field>
            {(["challenge", "cause", "measure"] as const).map((key) => (
              <Field key={key}>
                {key[0].toUpperCase() + key.slice(1)}
                <Textarea
                  maxLength={2000}
                  value={value[key]}
                  onChange={(e) => field(key, e.target.value)}
                />
              </Field>
            ))}
            <FieldRow>
              <Field>
                Due date
                <Input
                  type="date"
                  value={value.dueDate}
                  onChange={(e) => field("dueDate", e.target.value)}
                />
              </Field>
              <Field>
                Feedback due
                <Input
                  type="date"
                  value={value.feedbackDueDate}
                  onChange={(e) => field("feedbackDueDate", e.target.value)}
                />
              </Field>
            </FieldRow>
          </Disclosure>
          {!entry && (
            <>
              <Field layout="inline">
                <Input
                  type="checkbox"
                  checked={issue}
                  onChange={(e) => {
                    setIssue(e.target.checked);
                    if (!e.target.checked) setResponsible("");
                  }}
                />
                Track as an open issue
              </Field>
              {issue && (
                <Field>
                  Responsible person
                  <Select
                    aria-label="Responsible person"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
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
            </>
          )}
          {entry && (
            <Field>
              Reason for correction
              <Textarea
                required
                maxLength={4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          )}
          <Actions>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : entry
                  ? "Save correction"
                  : "Publish update"}
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </Actions>
        </fieldset>
      </form>
    </Panel>
  );
}
