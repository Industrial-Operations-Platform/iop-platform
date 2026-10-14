import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import { Alert, Disclosure, Field, Input, Select } from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import { withinLocation, type CanonicalAssetReference, type Context } from "../../domain/models";
export function CanonicalAssetPicker({ application, context, departmentId, areaId, value, retained, onChange }: {
  application: HandoverApplication; context: Context; departmentId: string; areaId: string; value: string;
  retained?: CanonicalAssetReference; onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState(""), [assets, setAssets] = useState<CanonicalAssetReference[]>([]), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      setError("");
      void application.assets(search).then((page) => { if (active) setAssets(page.assets); })
        .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Asset selection is unavailable."); });
    }, 200);
    return () => { active = false; clearTimeout(timeout); };
  }, [application, search]);
  const choices = assets.filter((asset) => (!departmentId || withinLocation(asset.locationId, departmentId, context.locations)) &&
    (!areaId || asset.locationId === departmentId || withinLocation(asset.locationId, areaId, context.locations)));
  if (retained && retained.id === value && !choices.some((asset) => asset.id === value)) choices.unshift(retained);
  return <Disclosure summary={t("Registered asset (optional)")}>
    <p>{t("Link a registered identity explicitly. The original equipment identifier stays in the report.")}</p>
    <Field>{t("Find registered asset")}<Input aria-label={t("Find registered asset")} value={search} maxLength={200} onChange={(e) => setSearch(e.target.value)} /></Field>
    {error && <Alert>{error}</Alert>}
    <Field>{t("Registered asset")}<Select aria-label={t("Registered asset")} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t("No canonical link")}</option>
      {choices.map((asset) => <option key={asset.id} value={asset.id}>{asset.code} · {asset.name} ({t(asset.status)})</option>)}
    </Select></Field>
  </Disclosure>;
}
