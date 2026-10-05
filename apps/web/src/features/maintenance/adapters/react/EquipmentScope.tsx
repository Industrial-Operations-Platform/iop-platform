import { useEffect, useRef, useState } from "react";
import {
  Actions,
  AddButton,
  Button,
  DeleteButton,
  Field,
  FieldRow,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { Catalog, EquipmentReference } from "../../domain/models";

export interface EquipmentLookup {
  (selection: {
    departmentId: string;
    areaId: string;
    search: string;
    after: string;
  }): Promise<{ codes: string[]; nextCursor: string }>;
}
export function EquipmentScope({
  catalog,
  locationId,
  equipment,
  change,
  lookup,
  disabled = false,
}: {
  catalog: Pick<Catalog, "locations">;
  locationId: string;
  equipment: EquipmentReference[];
  change: (equipment: EquipmentReference[]) => void;
  lookup?: EquipmentLookup;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [after, setAfter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const epoch = useRef(0);
  let department = catalog.locations.find(
    (location) => location.id === locationId,
  );
  const seen = new Set<string>();
  while (
    department?.role !== "department" &&
    department?.parentId &&
    !seen.has(department.id)
  ) {
    seen.add(department.id);
    department = catalog.locations.find(
      (location) => location.id === department?.parentId,
    );
  }
  const departmentId =
    department?.role && department.role !== "department"
      ? ""
      : (department?.id ?? "");
  const areaId = departmentId === locationId ? selectedArea : locationId;
  const areas = catalog.locations.filter((location) => {
    let current: typeof location | undefined = location;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      if (current.parentId === departmentId)
        return location.id !== departmentId;
      visited.add(current.id);
      current = catalog.locations.find(
        (value) => value.id === current?.parentId,
      );
    }
    return false;
  });
  useEffect(() => {
    setSelectedArea("");
  }, [locationId]);
  useEffect(() => {
    let active = true;
    const requestEpoch = ++epoch.current;
    setChoices([]);
    setAfter("");
    setError("");
    if (!lookup || !departmentId || !areaId) {
      setBusy(false);
      return;
    }
    setBusy(true);
    void lookup({ departmentId, areaId, search: code, after: "" })
      .then((page) => {
        if (active && requestEpoch === epoch.current) {
          setChoices(page.codes);
          setAfter(page.nextCursor);
        }
      })
      .catch(() => {
        if (active && requestEpoch === epoch.current)
          setError(
            "Equipment choices are unavailable. Enter the exact code manually.",
          );
      })
      .finally(() => {
        if (active && requestEpoch === epoch.current) setBusy(false);
      });
    return () => {
      active = false;
      epoch.current += 1;
    };
  }, [lookup, departmentId, areaId, code]);
  const add = (value: string) => {
    const normalized = value.trim();
    if (
      !normalized ||
      !departmentId ||
      equipment.length >= 30 ||
      equipment.some(
        (reference) =>
          reference.code === normalized &&
          reference.departmentId === departmentId &&
          reference.areaId === areaId,
      )
    )
      return;
    change([
      ...equipment,
      { namespace: "site-equipment", code: normalized, departmentId, areaId },
    ]);
    setCode("");
  };
  return (
    <fieldset className="maintenance-fields" disabled={disabled}>
      <h3>{t("Equipment identifiers (Betriebsmittelkennzeichen)")}</h3>
      <p className="maintenance-muted">
        {t(
          "Select one or more exact codes in this location. Codes identify reported components provisionally; the repair target can be a cassette, motor roller or another part without a sensor.",
        )}
      </p>
      <FieldRow>
        {departmentId === locationId && !!areas.length && (
          <Field>
            {t("Equipment area")}
            <Select
              value={selectedArea}
              onChange={(event) => setSelectedArea(event.target.value)}
            >
              <option value="">{t("Manual component without an area")}</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field>
          {t("Exact equipment code")}
          <Input
            maxLength={160}
            value={code}
            disabled={!departmentId || equipment.length >= 30}
            onChange={(event) => setCode(event.target.value)}
          />
        </Field>
        <AddButton
          label={t("Add equipment code")}
          disabled={!code.trim() || !departmentId || equipment.length >= 30}
          onClick={() => add(code)}
        />
        {lookup && (
          <Field>
            {t("Reported equipment codes")}
            <Select
              aria-label={t("Reported equipment codes")}
              value=""
              disabled={
                busy || !departmentId || !areaId || equipment.length >= 30
              }
              onChange={(event) => add(event.target.value)}
            >
              <option value="">{t("Choose an exact code")}</option>
              {choices.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </FieldRow>
      {error && <p role="status">{t(error)}</p>}
      {after && (
        <Button
          variant="text"
          disabled={busy}
          onClick={() => {
            if (!lookup) return;
            const requestEpoch = epoch.current;
            setBusy(true);
            void lookup({ departmentId, areaId, search: code, after })
              .then((page) => {
                if (requestEpoch !== epoch.current) return;
                setChoices((current) => [...current, ...page.codes]);
                setAfter(page.nextCursor);
              })
              .catch(() => {
                if (requestEpoch === epoch.current)
                  setError(
                    "Equipment choices are unavailable. Enter the exact code manually.",
                  );
              })
              .finally(() => {
                if (requestEpoch === epoch.current) setBusy(false);
              });
          }}
        >
          {t("More equipment codes")}
        </Button>
      )}
      {equipment.map((reference, index) => (
        <Actions key={JSON.stringify(reference)}>
          <strong>{reference.code}</strong>
          <span className="maintenance-muted">
            {
              catalog.locations.find(
                (location) =>
                  location.id === (reference.areaId || reference.departmentId),
              )?.label
            }{" "}
            · {t("Unverified component reference")}
          </span>
          <DeleteButton
            label={t("Remove equipment code {0}", [reference.code])}
            onClick={() =>
              change(equipment.filter((_, position) => position !== index))
            }
          />
        </Actions>
      ))}
    </fieldset>
  );
}
