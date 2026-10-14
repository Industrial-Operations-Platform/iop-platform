import { t } from "../../../../localization/i18n";
import { Actions, Button, DeleteButton, Field, FieldRow, Input, Select, Textarea } from '../../../../design/components';
import { componentKinds, type Component, type Asset } from '../../domain/models';
export function ComponentEditor({ component, assets, pending, change, duplicate, remove }: {
  component: Component;
  assets: Asset[];
  pending: boolean;
  change: (component: Component) => void;
  duplicate: () => void;
  remove: () => void;
}) {
  const field = <K extends keyof Component>(key: K, value: Component[K]) => change({ ...component, [key]: value, verification: key === 'verification' ? value as Component['verification'] : 'provisional' });
  return <fieldset disabled={pending} className="locator-fields"><legend>{t("Selected component")}</legend>
  <Field>{t("Label")}<Input value={component.label} maxLength={160} onChange={e => field('label', e.target.value)}/></Field>
  <Field>{t("Reusable component")}<Select value={component.kind} onChange={e => field('kind', e.target.value as Component['kind'])}>{componentKinds.map(k => <option key={k} value={k}>{t(k)}</option>)}</Select></Field>
  <FieldRow>{(['x', 'y'] as const).map(k => <Field key={k}>{k.toUpperCase()}{t("(0\u20131)")}<Input type="number" min={0} max={1} step={0.001} value={component[k]} onChange={e => field(k, Number(e.target.value))}/></Field>)}<Field>{t("Elevation (unknown if empty)")}<Input type="number" min={0} max={1} step={0.001} value={component.elevation ?? ''} onChange={e => field('elevation', e.target.value === '' ? null : Number(e.target.value))}/></Field></FieldRow>
  <FieldRow>{(['width', 'depth', 'height'] as const).map(k => <Field key={k}>{t(k)}{t("(schematic units)")}<Input type="number" min={0.001} max={1} step={0.001} value={component[k]} onChange={e => field(k, Number(e.target.value))}/></Field>)}</FieldRow>
  <Field>{t("Rotation (degrees)")}<Input type="number" min={-360} max={360} step={1} value={component.rotation} onChange={e => field('rotation', Number(e.target.value))}/></Field>
  <Field>{t("Registered asset link")}<Select value={component.assetId} onChange={e => field('assetId', e.target.value)}><option value="">{t("Unlinked schematic component")}</option>{assets.map(a => <option key={a.id} value={a.id}>{a.code}{t(" \u2014 ")}{a.name}</option>)}</Select></Field>
  <Field>{t("Survey / mapping evidence")}<Textarea value={component.note} maxLength={2000} onChange={e => field('note', e.target.value)}/></Field>
  <Field>{t("Placement verification")}<Select value={component.verification} onChange={e => change({ ...component, verification: e.target.value as Component['verification'] })}><option value="provisional">{t("Provisional \u2014 physical position pending")}</option><option value="surveyed" disabled={!component.assetId || component.elevation === null || !component.note.trim()}>{t("Surveyed \u2014 explicit asset, elevation and evidence")}</option></Select></Field>
  <Actions><Button variant="secondary" onClick={duplicate}>{t("Duplicate component")}</Button><DeleteButton label={t("Remove component from draft scene")} onClick={remove}/></Actions>
 </fieldset>;
}
