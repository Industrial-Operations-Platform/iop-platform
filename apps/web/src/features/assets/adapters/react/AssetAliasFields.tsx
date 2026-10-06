import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Field,
  FieldRow,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AssetsApplication } from "../../application/assets";
import {
  withinLocation,
  type Alias,
  type Context,
  type EquipmentCatalog,
} from "../../domain/models";

function CatalogChoice({
  label,
  value,
  choices,
  disabled,
  required = true,
  change,
}: {
  label: string;
  value: string;
  choices: string[];
  disabled?: boolean;
  required?: boolean;
  change: (value: string) => void;
}) {
  return (
    <Field>
      {t(label)}
      <Select
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => change(event.target.value)}
      >
        <option value="">{t("Choose")}</option>
        {value && !choices.includes(value) && (
          <option value={value}>
            {value} · {t("Retained reference")}
          </option>
        )}
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </Select>
    </Field>
  );
}
export function AssetAliasFields({
  application,
  alias,
  code,
  locationId,
  context,
  change,
}: {
  application: AssetsApplication;
  alias: Alias;
  code: string;
  locationId: string;
  context: Context;
  change: (patch: Partial<Alias>) => void;
}) {
  const [catalog, setCatalog] = useState<EquipmentCatalog>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const epoch = useRef(0);
  useEffect(() => {
    const current = ++epoch.current;
    setCatalog(undefined);
    setError("");
    if (alias.namespace !== "analytics" || !code) {
      setBusy(false);
      return;
    }
    setBusy(true);
    void application
      .equipmentCatalog({
        locationId,
        code,
        sourceId: alias.sourceId || undefined,
        sector: alias.sector || undefined,
        area: alias.area || undefined,
        cursor: "",
      })
      .then((value) => {
        if (current === epoch.current) setCatalog(value);
      })
      .catch((exception) => {
        if (current === epoch.current) setError(exception.message);
      })
      .finally(() => {
        if (current === epoch.current) setBusy(false);
      });
    return () => {
      epoch.current += 1;
    };
  }, [
    application,
    code,
    locationId,
    alias.namespace,
    alias.sourceId,
    alias.sector,
    alias.area,
    attempt,
  ]);
  const field = (
    key: keyof Alias,
    label: string,
    maxLength: number,
    required = false,
  ) => (
    <Field>
      {t(label)}
      <Input
        maxLength={maxLength}
        required={required}
        value={alias[key]}
        onChange={(event) => change({ [key]: event.target.value })}
      />
    </Field>
  );
  return (
    <>
      <Field>
        {t("Source namespace")}
        <Select
          value={alias.namespace}
          onChange={(event) =>
            change({
              namespace: event.target.value,
              sourceId: "",
              departmentId: "",
              areaId: "",
              sector: "",
              area: "",
              code,
            })
          }
        >
          <option value="site-equipment">
            {t("Shift Handover equipment")}
          </option>
          <option value="analytics">{t("Analytical source equipment")}</option>
          {!["site-equipment", "analytics"].includes(alias.namespace) && (
            <option value={alias.namespace}>{alias.namespace}</option>
          )}
        </Select>
      </Field>
      {alias.namespace === "analytics" ? (
        <>
          <FieldRow>
            <CatalogChoice
              label="Source ID"
              value={alias.sourceId}
              choices={catalog?.sources ?? []}
              disabled={busy || !code}
              change={(sourceId) =>
                change({ sourceId, sector: "", area: "", code: "" })
              }
            />
            <CatalogChoice
              label="Source sector"
              value={alias.sector}
              choices={catalog?.sectors ?? []}
              disabled={busy || !alias.sourceId}
              change={(sector) => change({ sector, area: "", code: "" })}
            />
            <CatalogChoice
              label="Source area"
              value={alias.area}
              choices={catalog?.areas ?? []}
              disabled={busy || !alias.sourceId || !alias.sector}
              change={(area) => change({ area, code: "" })}
            />
            <CatalogChoice
              label="Source equipment code"
              value={alias.code}
              choices={[
                ...new Set(
                  (catalog?.candidates ?? [])
                    .filter(
                      (candidate) =>
                        candidate.namespace === "analytics" &&
                        candidate.sourceId === alias.sourceId &&
                        candidate.sector === alias.sector &&
                        candidate.area === alias.area,
                    )
                    .map((candidate) => candidate.code),
                ),
              ]}
              disabled={busy || !alias.sourceId || !alias.sector || !alias.area}
              change={(selected) => change({ code: selected })}
            />
          </FieldRow>
          {error && (
            <>
              <Alert>{t(error)}</Alert>
              <Button
                variant="secondary"
                onClick={() => setAttempt((value) => value + 1)}
              >
                {t("Reload equipment catalog")}
              </Button>
            </>
          )}
          <p className="assets-muted">
            {t(
              "Source choices retain the exact reported source, sector, area and code. They link measured evidence and do not establish physical identity.",
            )}
          </p>
        </>
      ) : alias.namespace === "site-equipment" ? (
        <>
          <Field>
            {t("Source equipment code")}
            <Input required readOnly value={alias.code || code} />
          </Field>
          <FieldRow>
            <Field>
              {t("Department")}
              <Select
                required
                value={alias.departmentId}
                onChange={(event) =>
                  change({ departmentId: event.target.value, areaId: "", code })
                }
              >
                <option value="">—</option>
                {context.locations
                  .filter(
                    (location) =>
                      location.role === "department" ||
                      (!location.role && !location.parentId),
                  )
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field>
              {t("Area")}
              <Select
                value={alias.areaId}
                disabled={!alias.departmentId}
                onChange={(event) =>
                  change({ areaId: event.target.value, code })
                }
              >
                <option value="">{t("None")}</option>
                {context.locations
                  .filter(
                    (location) =>
                      location.id !== alias.departmentId &&
                      withinLocation(
                        location.id,
                        alias.departmentId,
                        context.locations,
                      ),
                  )
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
              </Select>
            </Field>
          </FieldRow>
        </>
      ) : (
        <FieldRow>
          {field("code", "Source equipment code", 160, true)}
          {field("sourceId", "Source ID", 64)}
          {field("sector", "Source sector", 100)}
          {field("area", "Source area", 160)}
        </FieldRow>
      )}
    </>
  );
}
