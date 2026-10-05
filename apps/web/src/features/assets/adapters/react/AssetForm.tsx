import { useState, type ReactNode } from "react";
import {
  Actions,
  Alert,
  AddButton,
  Button,
  DeleteButton,
  Disclosure,
  Field,
  FieldRow,
  Input,
  Panel,
  Select,
  Textarea,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AssetsApplication } from "../../application/assets";
import {
  emptyAlias,
  emptyAsset,
  withinLocation,
  type Alias,
  type Asset,
  type AssetContent,
  type Context,
  type SaveInput,
} from "../../domain/models";
import { assetStatusLabel } from "./labels";

export interface EquipmentPickerPresentation {
  renderEquipmentPicker?: (
    scope: { locations: Context["locations"]; locationId: string },
    select: (reference: {
      code: string;
      departmentId: string;
      areaId: string;
    }) => void,
  ) => ReactNode;
}

function AliasFields({
  alias,
  context,
  change,
}: {
  alias: Alias;
  context: Context;
  change: (patch: Partial<Alias>) => void;
}) {
  const field = (
    key: keyof Alias,
    label: string,
    maxLength: number,
    required = false,
  ) => (
    <Field>
      {t(label)}
      <Input
        required={required}
        value={alias[key]}
        maxLength={maxLength}
        pattern={
          key === "sourceId" ? "[A-Za-z0-9][A-Za-z0-9_-]{0,63}" : undefined
        }
        onChange={(event) => change({ [key]: event.target.value })}
      />
    </Field>
  );
  return (
    <>
      <FieldRow>
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
              })
            }
          >
            <option value="site-equipment">
              {t("Shift Handover equipment")}
            </option>
            <option value="analytics">
              {t("Analytical source equipment")}
            </option>
            {!["site-equipment", "analytics"].includes(alias.namespace) && (
              <option value={alias.namespace}>{alias.namespace}</option>
            )}
          </Select>
        </Field>
        {field("code", "Source equipment code", 160, true)}
        {alias.namespace !== "site-equipment" &&
          field("sourceId", "Source ID", 64, alias.namespace === "analytics")}
      </FieldRow>
      {alias.namespace === "site-equipment" ? (
        <FieldRow>
          <Field>
            {t("Department")}
            <Select
              required
              value={alias.departmentId}
              onChange={(event) =>
                change({ departmentId: event.target.value, areaId: "" })
              }
            >
              <option value="">—</option>
              {context.locations
                .filter((location) =>
                  location.role
                    ? location.role === "department"
                    : !location.parentId,
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
              onChange={(event) => change({ areaId: event.target.value })}
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
      ) : (
        <FieldRow>
          {field(
            "sector",
            "Source sector",
            100,
            alias.namespace === "analytics",
          )}
          {field("area", "Source area", 160, alias.namespace === "analytics")}
        </FieldRow>
      )}
    </>
  );
}
export function AssetForm({
  application,
  context,
  asset,
  pending,
  save,
  cancel,
  renderEquipmentPicker,
}: {
  application: AssetsApplication;
  context: Context;
  asset?: Asset;
  pending: boolean;
  save: (input: SaveInput) => void;
  cancel: () => void;
} & EquipmentPickerPresentation) {
  const [key] = useState(() => application.newKey());
  const [content, setContent] = useState<AssetContent>(() =>
    asset
      ? {
          ...asset.content,
          aliases: asset.content.aliases.map((alias) => ({ ...alias })),
        }
      : emptyAsset(),
  );
  const [note, setNote] = useState("");
  const [equipmentError, setEquipmentError] = useState("");
  const change = <K extends keyof AssetContent>(
    field: K,
    value: AssetContent[K],
  ) => setContent((current) => ({ ...current, [field]: value }));
  return (
    <Panel>
      <h2>{t(asset ? "Edit asset" : "Register asset")}</h2>
      {equipmentError && <Alert>{t(equipmentError)}</Alert>}
      <p className="assets-muted">
        {t(
          "For now, assets represent exact Betriebsmittelkennzeichen and their reported system components. Keep the identity unverified until the physical survey confirms it. Select the component location explicitly.",
        )}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({
            key: asset ? "" : key,
            id: asset?.id ?? "",
            expectedRevision: asset?.revision ?? 0,
            note,
            content,
          });
        }}
      >
        <fieldset disabled={pending} className="assets-fields">
          <FieldRow>
            <Field>
              {t("Equipment identifier (Betriebsmittelkennzeichen)")}
              <Input
                required
                maxLength={160}
                value={content.code}
                onChange={(event) => change("code", event.target.value)}
              />
            </Field>
            <Field>
              {t("Asset name")}
              <Input
                required
                maxLength={200}
                value={content.name}
                onChange={(event) => change("name", event.target.value)}
              />
            </Field>
            <Field>
              {t("Asset type")}
              <Input
                maxLength={100}
                value={content.type}
                onChange={(event) => change("type", event.target.value)}
              />
            </Field>
          </FieldRow>
          {renderEquipmentPicker && (
            <Disclosure
              variant="panel"
              summary={t("Use a reported equipment identifier")}
            >
              <p className="assets-muted">
                {t(
                  "Choose a location and exact reported code to prepare an unverified component record with an explicit Handover source alias. This selection does not verify physical identity.",
                )}
              </p>
              {renderEquipmentPicker(
                {
                  locations: context.locations,
                  locationId: content.locationId,
                },
                (reference) => {
                  const alias: Alias = {
                    namespace: "site-equipment",
                    code: reference.code,
                    departmentId: reference.departmentId,
                    areaId: reference.areaId,
                    sourceId: "",
                    sector: "",
                    area: "",
                  };
                  const matches = (value: Alias) =>
                    value.namespace === alias.namespace &&
                    value.code === alias.code &&
                    value.departmentId === alias.departmentId &&
                    value.areaId === alias.areaId;
                  if (
                    content.aliases.length >= 30 &&
                    !content.aliases.some(matches)
                  ) {
                    setEquipmentError(
                      "The source alias limit is reached. Remove an alias before selecting another code.",
                    );
                    return;
                  }
                  setEquipmentError("");
                  setContent((current) => ({
                    ...current,
                    code: reference.code,
                    name:
                      !current.name || current.name === current.code
                        ? reference.code
                        : current.name,
                    locationId: reference.areaId || reference.departmentId,
                    status: "unverified",
                    validationNote: "",
                    aliases: current.aliases.some(matches)
                      ? current.aliases
                      : [...current.aliases, alias],
                  }));
                },
              )}
            </Disclosure>
          )}
          <FieldRow>
            <Field>
              {t("Location")}
              <Select
                value={content.locationId}
                onChange={(event) => change("locationId", event.target.value)}
              >
                <option value="">—</option>
                {context.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Validation status")}
              <Select
                value={content.status}
                onChange={(event) =>
                  change("status", event.target.value as AssetContent["status"])
                }
              >
                {(["unverified", "validated", "retired"] as const).map(
                  (status) => (
                    <option key={status} value={status}>
                      {assetStatusLabel(status)}
                    </option>
                  ),
                )}
              </Select>
            </Field>
          </FieldRow>
          <Field>
            {t("Validation note")}
            <Textarea
              rows={3}
              required={content.status === "validated"}
              maxLength={2000}
              value={content.validationNote}
              onChange={(event) => change("validationNote", event.target.value)}
            />
          </Field>
          <Field>
            {t("Asset description")}
            <Textarea
              rows={4}
              maxLength={4000}
              value={content.description}
              onChange={(event) => change("description", event.target.value)}
            />
          </Field>
          <section className="assets-fields">
            <div className="assets-collection-heading">
              <h3>{t("Exact source aliases")}</h3>
              <AddButton
                label={t("Add source alias")}
                disabled={pending || content.aliases.length >= 30}
                onClick={() =>
                  change("aliases", [...content.aliases, emptyAlias()])
                }
              />
            </div>
            <p className="assets-muted">
              {t(
                "Link source evidence only after verifying the complete source identity. Matching codes alone do not identify an asset.",
              )}
            </p>
            {content.aliases.map((alias, index) => (
              <Disclosure
                variant="panel"
                open
                key={index}
                summary={`${t("Source alias")} ${index + 1}`}
              >
                <div className="assets-alias-fields">
                  <AliasFields
                    alias={alias}
                    context={context}
                    change={(patch) =>
                      change(
                        "aliases",
                        content.aliases.map((value, position) =>
                          position === index ? { ...value, ...patch } : value,
                        ),
                      )
                    }
                  />
                  <Actions>
                    <DeleteButton
                      label={t("Remove source alias {0}", [index + 1])}
                      onClick={() =>
                        change(
                          "aliases",
                          content.aliases.filter(
                            (_, position) => position !== index,
                          ),
                        )
                      }
                    />
                  </Actions>
                </div>
              </Disclosure>
            ))}
            {!content.aliases.length && (
              <p>
                {t(
                  "No source aliases configured. Maintenance can still link directly to this asset.",
                )}
              </p>
            )}
          </section>
          {asset && (
            <Field>
              {t("Change reason")}
              <Textarea
                rows={2}
                required
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          )}
          <Actions className="iop-form-actions">
            <Button variant="secondary" onClick={cancel}>
              {t("Cancel")}
            </Button>
            <Button type="submit">{t("Save asset")}</Button>
          </Actions>
        </fieldset>
      </form>
    </Panel>
  );
}
