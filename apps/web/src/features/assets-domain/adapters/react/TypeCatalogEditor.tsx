import { useState } from "react";
import { Actions, AddButton, Button, DeleteButton, Field, FieldRow, Input, Panel, Select } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AssetType, FieldKind, MetadataField, TypeCatalog } from "../../domain/models";
export function TypeCatalogEditor({
  catalog,
  pending,
  onSave
}: {
  catalog: TypeCatalog;
  pending: boolean;
  onSave: (types: AssetType[]) => void;
}) {
  const [types, setTypes] = useState(() => catalog.types.map(t => ({
      ...t,
      fields: t.fields.map(f => ({
        ...f
      }))
    }))),
    [selected, setSelected] = useState(catalog.types[0].id),
    [newId, setNewId] = useState("");
  const type = types.find(t => t.id === selected);
  const update = (patch: Partial<AssetType>) => setTypes(types => types.map(t => t.id === selected ? {
    ...t,
    ...patch
  } : t));
  const field = (index: number, patch: Partial<MetadataField>) => update({
    fields: type!.fields.map((f, i) => i === index ? {
      ...f,
      ...patch
    } : f)
  });
  return <Panel><form onSubmit={e => {
      e.preventDefault();
      onSave(types);
    }}><p>{t("Type labels and metadata fields belong to site configuration. Existing records must remain valid after a schema change.")}</p>
  <Field>{t("Type to configure")}<Select value={selected} onChange={e => setSelected(e.target.value)}>{types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</Select></Field>
  <FieldRow><Field>{t("New type identifier")}<Input value={newId} maxLength={100} onChange={e => setNewId(e.target.value)} /></Field><AddButton label={t("Add asset type")} disabled={pending || !newId || types.some(t => t.id === newId)} onClick={() => {
          setTypes(v => [...v, {
            id: newId,
            label: newId,
            active: true,
            canContain: false,
            isController: false,
            fields: []
          }]);
          setSelected(newId);
          setNewId("");
        }} /></FieldRow>
  {type && <><Field>{t("Type label")}<Input required maxLength={100} value={type.label} onChange={e => update({
            label: e.target.value
          })} /></Field><FieldRow>{(["active", "canContain", "isController"] as const).map(k => <Field key={k}><Input type="checkbox" checked={type[k]} onChange={e => update({
              [k]: e.target.checked
            })} />{t({
              active: "Type active",
              canContain: "Can contain components",
              isController: "Controller capable"
            }[k])}</Field>)}</FieldRow>
  <h2>{t("Additional structured fields")}</h2>{type.fields.map((f, i) => <FieldRow key={i}><Field>{t("Field identifier")}<Input required value={f.key} onChange={e => field(i, {
              key: e.target.value
            })} /></Field><Field>{t("Field label")}<Input required value={f.label} onChange={e => field(i, {
              label: e.target.value
            })} /></Field><Field>{t("Value kind")}<Select value={f.kind} onChange={e => field(i, {
              kind: e.target.value as FieldKind
            })}>{(["text", "number", "boolean", "date"] as const).map(k => <option key={k} value={k}>{k}</option>)}</Select></Field><Field>{t("Unit label")}<Input value={f.unit} onChange={e => field(i, {
              unit: e.target.value
            })} /></Field><Field><Input type="checkbox" checked={f.required} onChange={e => field(i, {
              required: e.target.checked
            })} />{t("Required field")}</Field><DeleteButton label={t("Remove metadata field")} onClick={() => update({
            fields: type.fields.filter((_, index) => index !== i)
          })} /></FieldRow>)}
  <AddButton label={t("Add metadata field")} disabled={pending || type.fields.length >= 30} onClick={() => update({
          fields: [...type.fields, {
            key: "",
            label: "",
            kind: "text",
            required: false,
            unit: ""
          }]
        })} />
  <Actions><DeleteButton label={t("Remove asset type")} disabled={pending || types.length === 1} onClick={() => {
            const next = types.filter(t => t.id !== type.id);
            setTypes(next);
            setSelected(next[0].id);
          }} /></Actions></>}
  <Actions className="iop-form-actions"><Button type="submit" disabled={pending}>{t("Save type catalog")}</Button></Actions>
 </form></Panel>;
}
