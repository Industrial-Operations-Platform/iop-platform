import { useState } from "react";
import {
  Button,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
} from "../../../../design/components";
import { entries, type Board, type SaveInput } from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { statusLabels } from "./labels";
export function ManualSchedule({
  board,
  date,
  save,
  pending,
}: {
  board: Board;
  date: string;
  save: (input: SaveInput) => void;
  pending: boolean;
}) {
  const [userId, setUserId] = useState(""),
    [day, setDay] = useState(date),
    [status, setStatus] = useState("work"),
    [start, setStart] = useState("05:00"),
    [end, setEnd] = useState("14:15");
  const working = ["work", "training", "maintenance"].includes(status);
  return (
    <Panel>
      <h2>{t("Manual schedule")}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const id = userId + "_" + day;
          save({
            kind: "schedule",
            id,
            expectedRevision:
              entries(board, "schedule").find((r) => r.id === id)?.revision ??
              0,
            deleted: false,
            data: {
              userId,
              date: day,
              status,
              start: working ? start : "",
              end: working ? end : "",
              startsAt: "",
              endsAt: "",
              source: "manual",
            },
          });
        }}
      >
        <FieldRow>
          <Field>
            {t("Person")}
            <Select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">{t("Select a person")}</option>
              {board.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {t("Date")}
            <Input
              required
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <Field>
            {t("Status")}
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(statusLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {t(label)}
                </option>
              ))}
            </Select>
          </Field>
          {working && (
            <>
              <Field>
                {t("Start time")}
                <Input
                  required
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field>
                {t("End time")}
                <Input
                  required
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </>
          )}
        </FieldRow>
        <Button disabled={pending} type="submit">
          {t("Save")}
        </Button>
      </form>
    </Panel>
  );
}
