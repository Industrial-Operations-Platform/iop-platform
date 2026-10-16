import { useEffect, useRef, useState } from "react";
import { Actions, Alert, Button, DateField, Disclosure, Field, FieldRow, Input, PageStack, Panel, Select, Textarea } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { ImprovementApplication } from "../../application/improvement";
import { emptyComparison, type ActionView, type Comparison, type ComparisonSelection } from "../../domain/models";
import { ComparisonResult } from "./ComparisonResult";
export function ImprovementComparison({
  application,
  action,
  pending,
  onSaved
}: {
  application: ImprovementApplication;
  action: ActionView;
  pending: boolean;
  onSaved: () => void;
}) {
  const [id] = useState(() => application.newId());
  const [selection, setSelection] = useState<ComparisonSelection>(() => ({
    ...emptyComparison(),
    scope: action.data.assetId ? "asset" : "selection"
  }));
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const request = useRef<number | null>(null);
  useEffect(() => () => { generation.current++; request.current = null; }, [application, action.id, action.revision]);
  const change = (next: ComparisonSelection) => {
    generation.current++;
    request.current = null;
    setBusy(false);
    setSelection(next);
    setPreview(null);
    setError("");
  };
  async function run(save: boolean) {
    if (request.current !== null || pending) return;
    const token = ++generation.current;
    request.current = token;
    setBusy(true);
    setError("");
    try {
      if (save) {
        await application.saveComparison({
          id,
          actionId: action.id,
          expectedRevision: action.revision,
          selection,
          note
        });
        if (generation.current === token) onSaved();
      } else {
        const result = await application.compare({ actionId: action.id, expectedRevision: action.revision, selection });
        if (generation.current === token) setPreview(result);
      }
    } catch (e) {
      if (generation.current === token) setError((e as Error).message);
    } finally {
      if (generation.current === token) { request.current = null; setBusy(false); }
    }
  }
  return <Disclosure summary={t("Before and after comparison")} variant="panel"><PageStack><form onSubmit={e => {
        e.preventDefault();
        void run(false);
      }}><fieldset className="iop-improvement-fields" disabled={busy || pending}><PageStack>
    <p>{t("Use non-overlapping periods and the same exact source selection. Date ends are exclusive. Missing imports are never treated as zero.")}</p>
    <FieldRow><DateField label={t("Before from")} required value={selection.before.from} onChange={e => change({
            ...selection,
            before: {
              ...selection.before,
              from: e.target.value
            }
          })} /><DateField label={t("Before end (exclusive)")} required value={selection.before.toExclusive} onChange={e => change({
            ...selection,
            before: {
              ...selection.before,
              toExclusive: e.target.value
            }
          })} /></FieldRow>
    <FieldRow><DateField label={t("After from")} required value={selection.after.from} onChange={e => change({
            ...selection,
            after: {
              ...selection.after,
              from: e.target.value
            }
          })} /><DateField label={t("After end (exclusive)")} required value={selection.after.toExclusive} onChange={e => change({
            ...selection,
            after: {
              ...selection.after,
              toExclusive: e.target.value
            }
          })} /></FieldRow>
    <Field>{t("Comparison source scope")}<Select value={selection.scope} onChange={e => change({
            ...selection,
            scope: e.target.value as ComparisonSelection["scope"],
            filters: {
              sector: "",
              area: "",
              equipment: "",
              message: ""
            }
          })}>{action.data.assetId && <option value="asset">{t("Exact aliases of the linked asset")}</option>}<option value="selection">{t("Explicit source filters")}</option></Select></Field>
    {selection.scope === "selection" && <><p>{t("Enter at least one exact source value. These fields are source evidence, not verified physical identities.")}</p><FieldRow>{(["sector", "area", "equipment", "message"] as const).map(key => <Field key={key}>{t({
                sector: "Source sector",
                area: "Source area",
                equipment: "Source equipment code",
                message: "Source message"
              }[key])}<Input maxLength={1000} value={selection.filters[key]} onChange={e => change({
                ...selection,
                filters: {
                  ...selection.filters,
                  [key]: e.target.value
                }
              })} /></Field>)}</FieldRow></>}
    <Actions className="iop-form-actions"><Button type="submit" variant="primary" disabled={busy || pending}>{t("Calculate observed comparison")}</Button></Actions>
  </PageStack></fieldset></form>{error && <Alert>{error}</Alert>}{preview && <><ComparisonResult comparison={preview} />{action.canEdit && <Panel><PageStack><Field>{t("Comparison evidence note")}<Textarea disabled={busy || pending} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></Field><Actions className="iop-form-actions"><Button disabled={busy || pending} onClick={() => void run(true)}>{t("Save comparison evidence")}</Button></Actions><p>{t("Saving recomputes both periods on the server and retains the resulting source revision. Preview values may change if new data is admitted before saving.")}</p></PageStack></Panel>}</>}
  </PageStack></Disclosure>;
}
