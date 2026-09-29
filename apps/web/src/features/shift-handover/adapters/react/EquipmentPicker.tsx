import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Field,
  FieldRow,
  Input,
  Select,
} from "../../../../design/components";
import type { HandoverApplication } from "../../application/handover";
import type { EquipmentPage } from "../../domain/models";

export function EquipmentPicker({
  application,
  departmentId,
  areaId,
  value,
  onChange,
  disabled,
  children,
}: {
  application: HandoverApplication;
  departmentId: string;
  areaId: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const queryKey = JSON.stringify([departmentId, areaId, search]);
  const currentQuery = useRef(queryKey);
  currentQuery.current = queryKey;
  const [page, setPage] = useState<EquipmentPage>({
    codes: [],
    nextCursor: "",
  });
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setPage({ codes: [], nextCursor: "" });
    setError("");
    if (!departmentId || !areaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      application
        .equipment({ departmentId, areaId, search, after: "" })
        .then((result) => {
          if (active) setPage(result);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [application, departmentId, areaId, search]);
  return (
    <div className="handover-component-picker">
      <FieldRow>
        <Field>
          Find component
          <Input
            type="search"
            disabled={disabled || !areaId}
            placeholder="Filter Betriebsmittelkennzeichen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field>
          Betriebsmittelkennzeichen
          <Select
            aria-label="Betriebsmittelkennzeichen"
            disabled={disabled || !areaId || loading}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">No specific component</option>
            {value && !page.codes.includes(value) && (
              <option value={value}>{value} · Current selection</option>
            )}
            {page.codes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
        {children}
      </FieldRow>
      <p className="handover-muted">
        Betriebsmittelkennzeichen identifies a component, such as a sensor or
        motor.
      </p>
      {!areaId ? (
        <p>Select an area to choose a component.</p>
      ) : loading ? (
        <p role="status">Loading components…</p>
      ) : (
        !page.codes.length && (
          <p>No imported codes match. You can still report on this area.</p>
        )
      )}
      {error && <Alert>{error}</Alert>}
      {page.nextCursor && (
        <Button
          variant="text"
          disabled={disabled || loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              const next = await application.equipment({
                departmentId,
                areaId,
                search,
                after: page.nextCursor,
              });
              if (currentQuery.current === queryKey)
                setPage({ ...next, codes: [...page.codes, ...next.codes] });
            } catch (e) {
              if (currentQuery.current === queryKey)
                setError(
                  e instanceof Error ? e.message : "Could not load components.",
                );
            } finally {
              if (currentQuery.current === queryKey) setLoading(false);
            }
          }}
        >
          More components
        </Button>
      )}
    </div>
  );
}
