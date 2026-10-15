import { CompactSelect } from "./CompactSelect";
/** One department context, shared by Start and operational workspaces. */
export function DepartmentScope({
  value,
  onChange,
  choices,
  label = "Selected department",
  caption = "Department / Halle",
  emptyLabel = "All departments",
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  choices: { id: string; label: string }[];
  label?: string;
  caption?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  return <CompactSelect caption={caption} label={label} value={value} onChange={onChange}
    choices={choices} emptyLabel={emptyLabel} disabled={disabled} className="iop-department-scope" />;
}
