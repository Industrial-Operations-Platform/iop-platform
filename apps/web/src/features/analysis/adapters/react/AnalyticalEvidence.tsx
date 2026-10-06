import { useEffect, useState } from "react";
import {
  Alert,
  Panel,
  RefreshButton,
  SectionHeading,
  Table,
  TableText,
  TableViewport,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AnalysisWorkspace } from "../../application/workspace";
import type { SourceRowsResult } from "../../domain/models";

/** Exact original contributing row, accessed through the analytical gateway. */
export function AnalyticalEvidence({
  application,
  sourceId,
  onHome,
  onBack,
}: {
  application: AnalysisWorkspace;
  sourceId: string;
  onHome: () => void;
  onBack: () => void;
}) {
  const [result, setResult] = useState<SourceRowsResult | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(true);
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    let active = true;
    setPending(true);
    setError(false);
    setResult(null);
    void application
      .sourceEvidence(sourceId)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [application, sourceId, visit]);
  const fields = [
    ["line", "Source line"],
    ["sector", "Sector"],
    ["area", "Area"],
    ["equipment", "Equipment code"],
    ["message", "Message"],
    ["type", "Type"],
    ["messageGroup", "Message group"],
    ["frequency", "Frequency"],
    ["minutes", "Accumulated alarm minutes"],
  ] as const;
  return (
    <>
      <SectionHeading
        section="Data analysis"
        view="Source evidence"
        onHome={onHome}
        onBack={onBack}
        trail={[
          { label: t("Assets"), onSelect: onBack },
          { label: t("Source evidence") },
        ]}
        description={t(
          "Daily aggregate evidence preserves its reporting label; it does not identify an individual incident.",
        )}
        actions={
          <RefreshButton
            label={t("Reload source evidence")}
            busy={pending}
            onClick={() => setVisit((value) => value + 1)}
          />
        }
      />
      {error && (
        <Alert>
          {t(
            "Source evidence could not be loaded. Your access or reporting preparation may have changed.",
          )}
        </Alert>
      )}
      <Panel>
        <p>
          {t("Source reference")}: {sourceId}
        </p>
        {pending ? (
          <p role="status">{t("Loading…")}</p>
        ) : result?.records.length ? (
          <TableViewport aria-label={t("Source evidence")}>
            <Table aria-label={t("Source evidence")}>
              <thead>
                <tr>
                  <th scope="col">{t("Field")}</th>
                  <th scope="col">{t("Value")}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(([key, label]) => (
                  <tr key={key}>
                    <th scope="row">{t(label)}</th>
                    <td>
                      <TableText>
                        {String(result.records[0][key] ?? "")}
                      </TableText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableViewport>
        ) : (
          <p>{t("The contributing source row is unavailable.")}</p>
        )}
      </Panel>
    </>
  );
}
