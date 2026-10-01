import { useState } from "react";
import {
  Actions,
  Button,
  DateField,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
} from "../../../../design/components";
import type {
  Assignment,
  Board,
  RecordEntry,
  SaveInput,
} from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { dutyLabels } from "./labels";
export function AssignmentForm({
  board,
  date,
  existing,
  save,
  cancel,
  pending,
}: {
  board: Board;
  date: string;
  existing?: RecordEntry<"assignment">;
  save: (input: SaveInput) => void;
  cancel: () => void;
  pending: boolean;
}) {
  const first = board.settings.shifts[0];
  const [data, setData] = useState<Assignment>(
    existing?.data ?? {
      userId: "",
      date,
      shiftId: first.id,
      targetId: "",
      duty: "zone",
      phone: "",
      start: first.start,
      end: first.end,
      startsAt: "",
      endsAt: "",
    },
  );
  const field = (key: keyof Assignment, value: string) =>
    setData((d) => ({
      ...d,
      [key]: value,
      ...(key === "targetId" || key === "duty" ? { phone: "" } : {}),
    }));
  return (
    <Panel>
      <h2>{t("Assignment details")}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save({
            kind: "assignment",
            id: existing?.id ?? "",
            expectedRevision: existing?.revision ?? 0,
            deleted: false,
            data,
          });
        }}
      >
        <FieldRow className="workforce-assignment-fields">
          <Field>
            {t("Person")}
            <Select
              required
              value={data.userId}
              onChange={(e) => field("userId", e.target.value)}
            >
              <option value="">{t("Select a person")}</option>
              {board.people
                .filter((p) =>
                  data.duty === "leader"
                    ? ["team-leader", "administrator"].includes(p.profile)
                    : p.profile !== "team-leader",
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <DateField
            label={t("Date")}
            required
            value={data.date}
            onChange={(e) => field("date", e.target.value)}
          />
          <Field>
            {t("Shift")}
            <Select
              value={data.shiftId}
              onChange={(e) => {
                const shift = board.settings.shifts.find(
                  (s) => s.id === e.target.value,
                )!;
                setData((d) => ({
                  ...d,
                  shiftId: shift.id,
                  start: shift.start,
                  end: shift.end,
                }));
              }}
            >
              {board.settings.shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {t("Duty")}
            <Select
              value={data.duty}
              onChange={(e) => field("duty", e.target.value)}
            >
              {Object.entries(dutyLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {t(label)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {t("Zone")}
            <Select
              value={data.targetId}
              onChange={(e) => field("targetId", e.target.value)}
            >
              <option value="">{t("No zone")}</option>
              {board.settings.targets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {t("Phone")}
            <Select
              value={data.phone}
              onChange={(e) => field("phone", e.target.value)}
            >
              <option value="">{t("No phone")}</option>
              {board.settings.targets
                .filter((s) => s.id === data.targetId && s.phone)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.phone}
                  </option>
                ))}
              {data.duty === "maintenance" && (
                <option value="maintenance">{t("Maintenance")}</option>
              )}
            </Select>
          </Field>
          <Field>
            {t("Start time")}
            <Input
              type="time"
              required
              value={data.start}
              onChange={(e) => field("start", e.target.value)}
            />
          </Field>
          <Field>
            {t("End time")}
            <Input
              type="time"
              required
              value={data.end}
              onChange={(e) => field("end", e.target.value)}
            />
          </Field>
        </FieldRow>
        <Actions className="iop-form-actions">
          <Button type="submit" disabled={pending}>
            {t(pending ? "Saving…" : "Save")}
          </Button>
          <Button variant="secondary" onClick={cancel}>
            {t("Cancel")}
          </Button>
        </Actions>
      </form>
    </Panel>
  );
}
