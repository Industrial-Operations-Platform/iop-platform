import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Field,
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
}: {
  application: HandoverApplication;
  departmentId: string;
  areaId: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
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
    <div>
      <Field>
        Find equipment
        <Input
          type="search"
          disabled={disabled || !areaId}
          placeholder="Filter Betriebsmittelkennzeichen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Field>
      <Field>
        Betriebsmittelkennzeichen
        <Select
          aria-label="Betriebsmittelkennzeichen"
          disabled={disabled || !areaId || loading}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">No specific equipment</option>
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
      {!areaId ? (
        <p>Select an area to choose equipment.</p>
      ) : loading ? (
        <p role="status">Loading equipment…</p>
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
                  e instanceof Error ? e.message : "Could not load equipment.",
                );
            } finally {
              if (currentQuery.current === queryKey) setLoading(false);
            }
          }}
        >
          More equipment
        </Button>
      )}
    </div>
  );
}
