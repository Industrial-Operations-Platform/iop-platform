import { useState } from "react";
import { Actions, Button, DateField, DeleteButton, Field, FieldRow, Input, Panel, Select, Textarea } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import { emptyEnrichment, type Context, type Detail, type EnrichmentData, type RegistryReference, type SaveEnrichment } from "../../domain/models";
import type { AssetDomainApplication } from "../../application/domain";
import { AssetReferencePicker } from "./AssetReferencePicker";
export function EnrichmentEditor({
  application,
  context,
  detail,
  pending,
  onSave,
  onCancel
}: {
  application: AssetDomainApplication;
  context: Context;
  detail: Detail;
  pending: boolean;
  onSave: (input: SaveEnrichment) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<EnrichmentData>(() => detail.enrichment?.data ?? emptyEnrichment()),
    [reason, setReason] = useState(""),
    [controller, setController] = useState<RegistryReference | null>(null),
    [channel, setChannel] = useState("");
  const type = context.catalog.types.find(t => t.id === data.typeId);
  const change = <K extends keyof EnrichmentData,>(key: K, value: EnrichmentData[K]) => setData(d => ({
    ...d,
    [key]: value
  }));
  function metadata(key: string, value: string | number | boolean | undefined) {
    setData(d => {
      const metadata = {
        ...d.metadata
      };
      if (value === undefined) delete metadata[key];else metadata[key] = value;
      return {
        ...d,
        metadata
      };
    });
  }
  return <Panel><form onSubmit={e => {
      e.preventDefault();
      onSave({
        assetId: detail.asset.id,
        expectedRevision: detail.enrichment?.revision ?? 0,
        reason,
        data
      });
    }}>
  <p>{detail.asset.code} · {t("Registry lifecycle")}: {detail.asset.status}</p><Field>{t("Configured asset type")}<Select value={data.typeId} onChange={e => {
          const next = context.catalog.types.find(t => t.id === e.target.value)!;
          setData(d => ({
            ...d,
            typeId: next.id,
            metadata: Object.fromEntries(Object.entries(d.metadata).filter(([key]) => next.fields.some(f => f.key === key)))
          }));
        }}>{context.catalog.types.filter(t => t.active || t.id === data.typeId).map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</Select></Field>
  <FieldRow><Field>{t("Manufacturer")}<Input maxLength={200} value={data.manufacturer} onChange={e => change("manufacturer", e.target.value)} /></Field><Field>{t("Model")}<Input maxLength={200} value={data.model} onChange={e => change("model", e.target.value)} /></Field><Field>{t("Serial number")}<Input maxLength={200} value={data.serial} onChange={e => change("serial", e.target.value)} /></Field></FieldRow>
  <FieldRow>{type?.fields.map(field => field.kind === "date" ? <DateField key={field.key} label={field.label} required={field.required} value={String(data.metadata[field.key] ?? "")} onChange={e => metadata(field.key, e.target.value || undefined)} /> : <Field key={field.key}>{field.label}{field.unit ? " (" + field.unit + ")" : ""}{field.kind === "boolean" ? <Select required={field.required} value={data.metadata[field.key] === undefined ? "" : String(data.metadata[field.key])} onChange={e => metadata(field.key, e.target.value === "" ? undefined : e.target.value === "true")}><option value="">{t("Not recorded")}</option><option value="true">{t("Yes")}</option><option value="false">{t("No")}</option></Select> : <Input required={field.required} type={field.kind === "number" ? "number" : "text"} step={field.kind === "number" ? "any" : undefined} maxLength={2000} value={String(data.metadata[field.key] ?? "")} onChange={e => metadata(field.key, e.target.value === "" ? undefined : field.kind === "number" ? Number(e.target.value) : e.target.value)} />}</Field>)}</FieldRow>
  <h2>{t("Composition and controllers")}</h2><p>{t("Composition is separate from physical location and controller connections. Cycles are rejected on the server.")}</p>
  <AssetReferencePicker application={application} label={t("Composition parent")} value={data.parentId} currentLabel={detail.related.find(r => r.id === data.parentId)?.code} excludeId={detail.asset.id} onChange={a => change("parentId", a?.id ?? "")} accept={(id, page) => !!context.catalog.types.find(t => t.id === page.enrichments.find(e => e.assetId === id)?.typeId)?.canContain} />
  <AssetReferencePicker application={application} label={t("Controller target")} value={controller?.id ?? ""} currentLabel={controller?.code} excludeId={detail.asset.id} onChange={setController} accept={(id, page) => !!context.catalog.types.find(t => t.id === page.enrichments.find(e => e.assetId === id)?.typeId)?.isController} />
  <FieldRow><Field>{t("Controller channel")}<Input value={channel} maxLength={160} onChange={e => setChannel(e.target.value)} /></Field><Button disabled={!controller || pending} onClick={() => {
          if (controller) {
            change("controllers", [...data.controllers, {
              kind: "controlled-by",
              targetId: controller.id,
              channel
            }]);
            setController(null);
            setChannel("");
          }
        }}>{t("Add controller connection")}</Button></FieldRow>
  {data.controllers.map((r, index) => <p key={index}>{t("Controlled by")}: {detail.related.find(a => a.id === r.targetId)?.code || t("Selected controller")} · {r.channel || t("Channel not recorded")} <DeleteButton label={t("Remove controller connection")} onClick={() => change("controllers", data.controllers.filter((_, i) => i !== index))} /></p>)}
  <h2>{t("Survey software review")}</h2><p>{t("These are attributed software decisions. Actual physical inspection and evidence remain operator responsibilities.")}</p><Field>{t("Survey decision")}<Select value={data.survey.status} onChange={e => change("survey", {
          ...data.survey,
          status: e.target.value as EnrichmentData["survey"]["status"]
        })}><option value="pending">{t("Pending")}</option><option value="validated">{t("Validated")}</option><option value="rejected">{t("Rejected")}</option></Select></Field>
  <Field>{t("Survey notes")}<Textarea required={data.survey.status !== "pending"} maxLength={4000} value={data.survey.note} onChange={e => change("survey", {
          ...data.survey,
          note: e.target.value
        })} /></Field><Field>{t("Survey evidence reference")}<Input required={data.survey.status !== "pending"} maxLength={400} value={data.survey.evidenceReference} onChange={e => change("survey", {
          ...data.survey,
          evidenceReference: e.target.value
        })} /></Field>
  <Field>{t("Change reason")}<Textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></Field><Actions className="iop-form-actions"><Button disabled={pending} onClick={onCancel}>{t("Cancel")}</Button><Button type="submit" disabled={pending}>{t("Save asset model")}</Button></Actions>
 </form></Panel>;
}
