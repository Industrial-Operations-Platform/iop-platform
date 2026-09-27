import { useState } from "react";
import {
  Alert,
  Button,
  Field,
  Input,
  Panel,
  Table,
  TableViewport,
  ViewNavigation,
} from "../../../../design/components";
import type { AnalysisWorkspace } from "../../application/workspace";
import type { ImportReview, ImportSummary } from "../../domain/models";
import { ProfileEditor } from "./ProfileEditor";
import { ExecutiveSettings } from "./ExecutiveSettings";
import { ImportReviewPanel, importOutcome } from "./ImportReviewPanel";

/** Filename preview for the Hitliste integration. The server validates admission. */
export function previewReportingDate(filename: string): string | null {
  const match = /^Hitliste-([0-9]{4})([0-9]{2})([0-9]{2})\.csv$/.exec(filename);
  if (!match || match[1] === "0000") return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
}

export function ImportWorkspace({
  application,
  history,
  onImported,
}: {
  application: AnalysisWorkspace;
  history: ImportSummary[];
  onImported: () => void;
}) {
  const [section, setSection] = useState<"imports" | "preparation" | "kpis">(
    "imports",
  );
  const [pending, setPending] = useState(false);
  return (
    <>
      <ViewNavigation
        label="Administration sections"
        selected={section}
        onSelect={setSection}
        items={[
          { id: "imports", label: "Import files", disabled: pending },
          { id: "preparation", label: "Data preparation", disabled: pending },
          { id: "kpis", label: "KPI settings & goals", disabled: pending },
        ]}
      />
      {section === "imports" && (
        <ImportFiles
          application={application}
          history={history}
          onImported={onImported}
          pending={pending}
          setPending={setPending}
        />
      )}
      {section === "preparation" && (
        <ProfileEditor application={application} onSaved={onImported} />
      )}
      {section === "kpis" && (
        <ExecutiveSettings
          initiallyExpanded
          application={application}
          onSaved={onImported}
        />
      )}
    </>
  );
}

function ImportFiles({
  application,
  history,
  onImported,
  pending,
  setPending,
}: {
  application: AnalysisWorkspace;
  history: ImportSummary[];
  onImported: () => void;
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<unknown>();
  const [review, setReview] = useState<ImportReview | null>(null);
  const date = file ? previewReportingDate(file.name) : null;
  const duplicate = date
    ? history.find((h) => h.reportingDate === date && h.outcome === "succeeded")
    : undefined;
  const invalidSize =
    !!file && (file.size === 0 || file.size > 5 * 1024 * 1024);
  const canUpload =
    !!file && !!date && confirmed && !invalidSize && !duplicate && !pending;
  const upload = async () => {
    if (!file || !canUpload) return;
    setPending(true);
    setError(undefined);
    setReview(null);
    try {
      setReview(
        await application.gateway.upload(file.name, await file.arrayBuffer()),
      );
      setConfirmed(false);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
      onImported();
    }
  };
  const inspect = async (id: string, recover = false) => {
    setPending(true);
    setError(undefined);
    setReview(null);
    try {
      setReview(await application.gateway.review(id, recover));
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
      if (recover) onImported();
    }
  };
  return (
    <>
      <Panel className="analysis-import">
        <h2>Add a daily CSV</h2>
        <p>
          Files and accepted rows persist in the database. An existing reporting
          date cannot be replaced.
        </p>
        <p>
          Hitliste-YYYYMMDD.csv · UTF-16 LE with BOM · semicolon separated ·
          maximum 5 MiB.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void upload();
          }}
        >
          <Field>
            CSV file
            <Input
              type="file"
              accept=".csv"
              disabled={pending}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setConfirmed(false);
                setReview(null);
                setError(undefined);
              }}
            />
          </Field>
          {file && (
            <>
              <p>
                Selected file: <strong>{file.name}</strong> ·{" "}
                {file.size.toLocaleString("en")} bytes
              </p>
              {!date && (
                <Alert>
                  Use a filename with a valid reporting date:
                  Hitliste-YYYYMMDD.csv.
                </Alert>
              )}
              {invalidSize && (
                <Alert>Choose a nonempty CSV of at most 5 MiB.</Alert>
              )}
              {date && (
                <Field layout="inline">
                  <Input
                    type="checkbox"
                    checked={confirmed}
                    disabled={pending || !!duplicate}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  Confirm reporting date: {date}
                </Field>
              )}
              {duplicate && (
                <Alert>
                  This reporting date already has an accepted file:{" "}
                  {duplicate.originalFilename}. Review the existing import;
                  uploading it again would not add data.
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => void inspect(duplicate.importId)}
                  >
                    Review existing import
                  </Button>
                </Alert>
              )}
              <p>
                The server validates the CSV and reports row counts and
                diagnostics after processing.
              </p>
            </>
          )}
          <Button type="submit" disabled={!canUpload}>
            {pending ? "Processing CSV…" : "Import CSV"}
          </Button>
        </form>
        {error ? (
          <Alert>
            {error instanceof Error
              ? error.message
              : "The import operation could not be completed."}{" "}
            Refresh import history and review any received attempt before
            retrying.
          </Alert>
        ) : null}
      </Panel>
      {review && (
        <ImportReviewPanel
          review={review}
          originalUrl={application.gateway.originalUrl(review.importId)}
        />
      )}
      <Panel className="analysis-import">
        <h2>Import history</h2>
        <p>
          Review accepted files and unsuccessful attempts. Counts shown here are
          saved rows; Review includes inspection details.
        </p>
        {history.length === 0 ? (
          <p>No import attempts are available yet.</p>
        ) : (
          <TableViewport>
            <Table>
              <thead>
                <tr>
                  <th>File / reporting date</th>
                  <th>Received</th>
                  <th>Outcome</th>
                  <th>Admitted rows</th>
                  <th>Bytes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.importId}>
                    <th>
                      {h.originalFilename}
                      <small>{h.reportingDate}</small>
                    </th>
                    <td>{h.receivedAt}</td>
                    <td>
                      {importOutcome(h)}
                      {h.reasonCode && <small>{h.reasonCode}</small>}
                    </td>
                    <td>{h.admittedRecordCount ?? "Unknown"}</td>
                    <td>{h.byteLength}</td>
                    <td>
                      <Button
                        disabled={pending}
                        onClick={() => void inspect(h.importId)}
                      >
                        Review
                      </Button>
                      {h.outcome === "received" && (
                        <Button
                          disabled={pending}
                          onClick={() => void inspect(h.importId, true)}
                        >
                          Recover import outcome
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableViewport>
        )}
      </Panel>
    </>
  );
}
