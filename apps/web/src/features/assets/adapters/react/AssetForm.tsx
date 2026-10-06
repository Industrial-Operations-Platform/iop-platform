import { useState } from "react";
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
import {
  contentFromEquipment,
  type AssetsApplication,
} from "../../application/assets";
import {
  emptyAlias,
  emptyAsset,
  type Asset,
  type AssetContent,
  type Context,
  type EquipmentCandidate,
  type SaveInput,
} from "../../domain/models";
import { assetStatusLabel } from "./labels";
import { AssetAliasFields } from "./AssetAliasFields";
import { AssetEquipmentPicker } from "./AssetEquipmentPicker";

const componentTypes = ["Cassette", "Motor roller", "Photoelectric sensor"];
export function AssetForm({
  application,
  context,
  asset,
  pending,
  save,
  cancel,
}: {
  application: AssetsApplication;
  context: Context;
  asset?: Asset;
  pending: boolean;
  save: (input: SaveInput) => void;
  cancel: () => void;
}) {
  const [key] = useState(() => application.newKey());
  const [content, setContent] = useState<AssetContent>(() =>
    asset
      ? {
          ...asset.content,
          name: asset.content.code,
          aliases: asset.content.aliases.map((alias) => ({ ...alias })),
        }
      : emptyAsset(),
  );
  const [note, setNote] = useState("");
  const [equipmentError, setEquipmentError] = useState("");
  const [otherType, setOtherType] = useState(
    !!content.type && !componentTypes.includes(content.type),
  );
  const change = <K extends keyof AssetContent>(
    field: K,
    value: AssetContent[K],
  ) => setContent((current) => ({ ...current, [field]: value }));
  const chooseEquipment = (candidate: EquipmentCandidate) => {
    try {
      const updated = contentFromEquipment(content, candidate);
      setContent(updated);
      setEquipmentError("");
    } catch (exception) {
      setEquipmentError((exception as Error).message);
    }
  };
  return (
    <Panel>
      <h2>{t(asset ? "Edit asset" : "Register asset")}</h2>
      {equipmentError && <Alert>{t(equipmentError)}</Alert>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({
            key: asset ? "" : key,
            id: asset?.id ?? "",
            expectedRevision: asset?.revision ?? 0,
            note,
            content: { ...content, name: content.code },
          });
        }}
      >
        <fieldset disabled={pending} className="assets-fields">
          <AssetEquipmentPicker
            application={application}
            context={context}
            locationId={content.locationId}
            code={content.code}
            select={chooseEquipment}
            onLocationChange={(id) => change("locationId", id)}
          />
          <p className="assets-muted">
            {t(
              "One exact asset code identifies each current component. Use a manual code when it is absent from the source; physical verification remains a separate step.",
            )}
          </p>
          <Field>
            {t("Equipment identifier (Betriebsmittelkennzeichen)")}
            <Input
              required
              maxLength={160}
              value={content.code}
              onChange={(event) => {
                const code = event.target.value;
                setContent((current) => ({
                  ...current,
                  code,
                  name: code,
                  aliases: current.aliases.filter(
                    (alias) =>
                      !["analytics", "site-equipment"].includes(
                        alias.namespace,
                      ) || alias.code === code,
                  ),
                }));
              }}
            />
          </Field>
          {asset && (
            <p className="assets-muted">
              {t(
                "Changing the identifier replaces source links with different codes. Earlier revisions preserve the previous identity and links.",
              )}
            </p>
          )}
          <FieldRow>
            <Field>
              {t("Component type")}
              <Select
                value={otherType ? "other" : content.type}
                onChange={(event) => {
                  const selected = event.target.value;
                  setOtherType(selected === "other");
                  change("type", selected === "other" ? "" : selected);
                }}
              >
                <option value="">{t("Not recorded")}</option>
                {componentTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
                <option value="other">{t("Other component")}</option>
              </Select>
            </Field>
            {otherType && (
              <Field>
                {t("Other component type")}
                <Input
                  maxLength={100}
                  value={content.type}
                  onChange={(event) => change("type", event.target.value)}
                />
              </Field>
            )}
            <Field>
              {t("Location")}
              <Select
                value={content.locationId}
                onChange={(event) => change("locationId", event.target.value)}
              >
                <option value="">{t("Not recorded")}</option>
                {context.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <Field>
            {t("Manual group / location within Bereich")}
            <Input
              maxLength={200}
              value={content.locationDetails ?? ""}
              placeholder={t("For example: buffer 1 or buffer 2")}
              onChange={(event) =>
                change("locationDetails", event.target.value)
              }
            />
          </Field>
          <Field>
            {t("Asset identity status")}
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
          <p className="assets-muted">
            {t(
              "Unverified: physical identity awaits review. Validated: identity was confirmed with a note. Retired: retained for history and hidden from the current directory. These states do not describe location or machine operation.",
            )}
          </p>
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
              rows={3}
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
                disabled={content.aliases.length >= 30}
                onClick={() =>
                  change("aliases", [
                    ...content.aliases,
                    { ...emptyAlias(), code: content.code },
                  ])
                }
              />
            </div>
            <p className="assets-muted">
              {t(
                "Analysis supplies measured evidence, Handover keeps reported problems, and Maintenance records the intervention. Open each source from the digital record; source links do not confirm that equipment is working.",
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
                  <AssetAliasFields
                    application={application}
                    context={context}
                    alias={alias}
                    code={content.code}
                    locationId={content.locationId}
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
