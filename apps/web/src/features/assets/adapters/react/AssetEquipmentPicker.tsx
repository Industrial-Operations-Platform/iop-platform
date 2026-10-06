import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  DepartmentScope,
  Field,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AssetsApplication } from "../../application/assets";
import {
  locationParts,
  withinLocation,
  type Context,
  type EquipmentCandidate,
  type EquipmentCatalog,
} from "../../domain/models";

export function AssetEquipmentPicker({
  application,
  context,
  locationId,
  select,
  onLocationChange,
  code,
}: {
  application: AssetsApplication;
  context: Context;
  locationId: string;
  select: (candidate: EquipmentCandidate) => void;
  onLocationChange?: (locationId: string) => void;
  code: string;
}) {
  const [scope, setScope] = useState(() =>
    locationParts(locationId, context.locations),
  );
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<EquipmentCatalog>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState<EquipmentCandidate>();
  const epoch = useRef(0);
  useEffect(() => {
    if (chosen && chosen.code !== code) setChosen(undefined);
  }, [code, chosen]);
  useEffect(() => {
    const resolved = locationParts(locationId, context.locations);
    setScope((current) =>
      current.departmentId === resolved.departmentId &&
      current.areaId === resolved.areaId
        ? current
        : resolved,
    );
  }, [locationId, context.locations]);
  const departments = context.locations.filter(
    (location) =>
      location.role === "department" || (!location.role && !location.parentId),
  );
  const areas = context.locations.filter(
    (location) =>
      location.id !== scope.departmentId &&
      withinLocation(location.id, scope.departmentId, context.locations) &&
      (location.role === "area" ||
        location.role === "location" ||
        !location.role),
  );
  useEffect(() => {
    const current = ++epoch.current;
    setCatalog(undefined);
    setError("");
    if (!scope.departmentId || !scope.areaId) {
      setBusy(false);
      return;
    }
    setBusy(true);
    void application
      .equipmentCatalog({ locationId: scope.areaId, search, cursor: "" })
      .then((value) => {
        if (epoch.current === current) setCatalog(value);
      })
      .catch((exception) => {
        if (epoch.current === current) setError(exception.message);
      })
      .finally(() => {
        if (epoch.current === current) setBusy(false);
      });
    return () => {
      epoch.current += 1;
    };
  }, [application, scope.departmentId, scope.areaId, search, attempt]);
  const more = async () => {
    if (!catalog?.nextCursor || busy) return;
    const current = epoch.current;
    setBusy(true);
    try {
      const next = await application.equipmentCatalog({
        locationId: scope.areaId,
        search,
        cursor: catalog.nextCursor,
      });
      if (epoch.current === current)
        setCatalog({
          ...next,
          candidates: [...catalog.candidates, ...next.candidates],
        });
    } catch (exception) {
      if (epoch.current === current) setError((exception as Error).message);
    } finally {
      if (epoch.current === current) setBusy(false);
    }
  };
  return (
    <section
      className="assets-fields assets-equipment-picker"
      aria-label={t("Choose reported equipment")}
    >
      <h3>{t("Choose reported equipment")}</h3>
      <p className="assets-muted">
        {t(
          "Choose Halle, Bereich and one exact code. The selection prepares source links; physical identity remains unverified.",
        )}
      </p>
      <div className="iop-scope-toolbar">
        <DepartmentScope
          label="Asset Halle"
          choices={departments}
          value={scope.departmentId}
          onChange={(departmentId) => {
            setScope({ departmentId, areaId: "" });
            onLocationChange?.(departmentId);
          }}
        />
        <Field layout="inline" className="iop-context-field">
          <span>{t("Area / Bereich")}</span>
          <Select
            aria-label={t("Asset Bereich")}
            value={scope.areaId}
            disabled={!scope.departmentId}
            onChange={(event) => {
              setScope({ ...scope, areaId: event.target.value });
              onLocationChange?.(event.target.value || scope.departmentId);
            }}
          >
            <option value="">{t("Choose Bereich")}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        {t("Search reported equipment")}
        <Input
          maxLength={160}
          value={search}
          disabled={!scope.areaId}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      <Field>
        {t("Reported equipment identifier")}
        <Select
          value={
            chosen && catalog
              ? String(
                  catalog.candidates.findIndex(
                    (candidate) =>
                      JSON.stringify(candidate) === JSON.stringify(chosen),
                  ),
                )
              : ""
          }
          disabled={!catalog || busy || !scope.areaId}
          onChange={(event) => {
            if (!event.target.value) {
              setChosen(undefined);
              return;
            }
            const candidate = catalog?.candidates[Number(event.target.value)];
            if (candidate) {
              setChosen(candidate);
              select(candidate);
            }
          }}
        >
          <option value="">{t("Choose an exact code")}</option>
          {catalog?.candidates.map((candidate, index) => (
            <option key={JSON.stringify(candidate)} value={index}>
              {candidate.code}
              {candidate.sourceId
                ? ` · ${candidate.sourceId} · ${candidate.sector} / ${candidate.area}`
                : ""}
            </option>
          ))}
        </Select>
      </Field>
      {busy && <p role="status">{t("Loading equipment catalog…")}</p>}
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
      {catalog && (
        <p className="assets-muted">
          {t("Showing {0} of {1} source references.", [
            catalog.candidates.length,
            catalog.total,
          ])}
        </p>
      )}
      {catalog?.nextCursor && (
        <Button variant="text" disabled={busy} onClick={() => void more()}>
          {t("More equipment codes")}
        </Button>
      )}
      {catalog && !catalog.candidates.length && (
        <p>
          {t(
            "No reported code matches. Register an exact manual identifier below if it is absent from the source.",
          )}
        </p>
      )}
    </section>
  );
}
