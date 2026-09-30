import { useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
  Table,
  TableViewport,
  Textarea,
} from "../../../../design/components";
import type { WorkforceApplication } from "../../application/workforce";
import type { Board, ImportInput, Preview } from "../../domain/models";
import { t } from "../../../../localization/i18n";
import { statusLabels } from "./labels";
export function ScheduleImport({
  application,
  board,
  refresh,
}: {
  application: WorkforceApplication;
  board: Board;
  refresh: () => void;
}) {
  const [input, setInput] = useState<ImportInput>({
      format: "csv",
      text: "",
      userId: "",
    }),
    [preview, setPreview] = useState<Preview[]>([]),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const change = (next: Partial<ImportInput>) => {
    setInput((v) => ({ ...v, ...next }));
    setPreview([]);
    setMessage("");
    setError("");
  };
  const run = async (commit: boolean) => {
    setPending(true);
    setError("");
    try {
      if (commit) {
        await application.commit(input, preview);
        setMessage("Import completed.");
        setPreview([]);
        refresh();
      } else setPreview(await application.preview(input));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel>
      <h2>{t("Schedule import")}</h2>
      <p>
        {t(
          "Import personal schedules before assigning zones. Missing days stay unknown. Email files do not include partial absences.",
        )}
      </p>
      <p>
        <a
          download="workforce-template.csv"
          href={
            "data:text/csv;charset=utf-8," +
            encodeURIComponent(
              "userId,date,status,start,end\n" +
                (board.people[0]?.id ?? "user-id") +
                ",2026-10-01,work,05:00,14:15\n",
            )
          }
        >
          {t("Download CSV template")}
        </a>
      </p>
      <FieldRow>
        <Field>
          {t("Format")}
          <Select
            disabled={pending}
            value={input.format}
            onChange={(e) =>
              change({ format: e.target.value as ImportInput["format"] })
            }
          >
            <option value="csv">CSV</option>
            <option value="email">{t("Email")}</option>
          </Select>
        </Field>
        {input.format === "email" && (
          <Field>
            {t("Choose a person for the email")}
            <Select
              disabled={pending}
              value={input.userId}
              onChange={(e) => change({ userId: e.target.value })}
            >
              <option value="">{t("Select a person")}</option>
              {board.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field>
          {t("CSV or email file")}
          <Input
            disabled={pending}
            type="file"
            accept=".csv,.eml,.txt,.html"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 80000) {
                  setError("File must be at most 80 KB.");
                  return;
                }
                void f
                  .text()
                  .then((text) => change({ text }))
                  .catch(() => setError("The file could not be read."));
              }
            }}
          />
        </Field>
      </FieldRow>
      <Field>
        {t("Paste CSV or email content")}
        <Textarea
          rows={6}
          disabled={pending}
          value={input.text}
          onChange={(e) => change({ text: e.target.value })}
        />
      </Field>
      {error && <Alert>{t(error)}</Alert>}
      {message && <p role="status">{t(message)}</p>}
      <Actions>
        <Button
          disabled={
            pending ||
            !input.text ||
            (input.format === "email" && !input.userId)
          }
          onClick={() => void run(false)}
        >
          {t(pending ? "Preparing…" : "Preview import")}
        </Button>
        {preview.length > 0 && (
          <Button disabled={pending} onClick={() => void run(true)}>
            {t("Import plan")} (
            {preview.filter((p) => p.outcome !== "unchanged").length})
          </Button>
        )}
      </Actions>
      {preview.length > 0 && (
        <TableViewport>
          <Table>
            <caption>{t("Import preview")}</caption>
            <thead>
              <tr>
                {[
                  "Person",
                  "Date",
                  "Status",
                  "Start time",
                  "End time",
                  "Result",
                ].map((l) => (
                  <th key={l}>{t(l)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.id}>
                  <td>
                    {
                      board.people.find((person) => person.id === p.data.userId)
                        ?.name
                    }
                  </td>
                  <td>{p.data.date}</td>
                  <td>{t(statusLabels[p.data.status])}</td>
                  <td>{p.data.start}</td>
                  <td>{p.data.end}</td>
                  <td>
                    {t(
                      {
                        create: "Create",
                        replace: "Replace",
                        unchanged: "Unchanged",
                      }[p.outcome] ?? p.outcome,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableViewport>
      )}
    </Panel>
  );
}
