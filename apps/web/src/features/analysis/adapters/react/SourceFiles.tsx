import {
  SourceFileFilters,
  sourceSortColumns as columns,
} from "./SourceFileFilters";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Field,
  Panel,
  Select,
  SortableHeader,
  Table,
  TableViewport,
} from "../../../../design/components";
import {
  cycleSourceSort,
  type AnalysisWorkspace,
} from "../../application/workspace";
import type {
  ImportSummary,
  SourceRowsRequest,
  SourceRowsResult,
} from "../../domain/models";
import { number } from "../echarts/charts";
export function SourceFiles({
  application,
  history,
}: {
  application: AnalysisWorkspace;
  history: ImportSummary[];
}) {
  const files = history.filter((file) => file.outcome === "succeeded");
  const [selection, setSelection] = useState<SourceRowsRequest | null>(() =>
    files[0] ? { importId: files[0].importId, page: 1, sort: [] } : null,
  );
  const [result, setResult] = useState<SourceRowsResult | null>(null),
    [error, setError] = useState<string>(),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    if (!selection) return;
    setLoading(true);
    setError(undefined);
    setResult(null);
    void application.gateway
      .sourceRows(selection)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active)
          setError(
            "Source rows could not be loaded. Reload the file to use its current preparation.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [application, selection]);
  if (!files.length)
    return (
      <Panel variant="empty">
        <h2>No imported files to browse</h2>
        <p>Import a daily CSV first.</p>
      </Panel>
    );
  const file = files.find((x) => x.importId === selection?.importId);
  return (
    <Panel>
      <h2>Contributing source rows</h2>
      <Field>
        Imported file
        <Select
          aria-label="Imported file"
          value={selection?.importId ?? ""}
          onChange={(e) =>
            setSelection({ importId: e.target.value, page: 1, sort: [] })
          }
        >
          {files.map((x) => (
            <option key={x.importId} value={x.importId}>
              {x.originalFilename} · {x.reportingDate}
            </option>
          ))}
        </Select>
      </Field>
      {selection && (
        <SourceFileFilters
          key={selection.importId}
          filters={selection.filters}
          options={result?.options}
          onApply={(filters) =>
            setSelection({
              importId: selection.importId,
              page: 1,
              sort: selection.sort,
              filters,
            })
          }
        />
      )}
      <p>
        Click a column title to cycle ascending, descending and off. Numbers
        show sorting priority across the whole file.
      </p>
      <p>
        Prepared values reflect the current reporting rules. The preserved
        original remains unchanged.
      </p>
      {file && (
        <a href={application.gateway.originalUrl(file.importId)}>
          Download preserved original
        </a>
      )}
      {error && (
        <>
          <Alert>{error}</Alert>
          <Button
            onClick={() =>
              selection &&
              setSelection({ ...selection, revision: undefined, page: 1 })
            }
          >
            Reload file
          </Button>
        </>
      )}
      {loading && <p role="status">Loading source rows…</p>}
      {result && selection && (
        <>
          <TableViewport>
            <Table>
              <caption>
                {file?.originalFilename} · {number(result.recordCount)} of{" "}
                {number(result.totalRecordCount ?? result.recordCount)} rows ·
                page {result.page} of {Math.max(1, result.pageCount)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  {columns.map((column) => {
                    const index = selection.sort.findIndex(
                        (x) => x.field === column.field,
                      ),
                      criterion = selection.sort[index];
                    return (
                      <SortableHeader
                        key={column.field}
                        direction={criterion?.direction}
                        priority={index + 1}
                        onClick={() =>
                          setSelection({
                            importId: selection.importId,
                            page: 1,
                            ...(selection.filters
                              ? { filters: selection.filters }
                              : {}),
                            sort: cycleSourceSort(selection.sort, column.field),
                          })
                        }
                      >
                        {column.label}
                      </SortableHeader>
                    );
                  })}
                  <th scope="col">Häufigkeit</th>
                  <th scope="col">Dauer · minutes</th>
                </tr>
              </thead>
              <tbody>
                {result.records.map((row) => (
                  <tr key={row.line}>
                    <td>{row.line}</td>
                    {columns.map((column) => (
                      <td key={column.field}>{row[column.field]}</td>
                    ))}
                    <td>{number(row.frequency)}</td>
                    <td>{number(row.minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableViewport>
          {result.recordCount === 0 && (
            <p>
              No rows match these filters. Clear or adjust the column filters.
            </p>
          )}
          <Button
            disabled={result.page <= 1}
            onClick={() =>
              setSelection({
                ...selection,
                page: result.page - 1,
                revision: result.revision,
              })
            }
          >
            Previous rows
          </Button>{" "}
          <Button
            disabled={result.page >= result.pageCount}
            onClick={() =>
              setSelection({
                ...selection,
                page: result.page + 1,
                revision: result.revision,
              })
            }
          >
            Next rows
          </Button>
        </>
      )}
      {history.length >= 1000 && (
        <small>Showing the most recent 1,000 import attempts.</small>
      )}
    </Panel>
  );
}
