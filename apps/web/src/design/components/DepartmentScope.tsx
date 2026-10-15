import { t } from "../../localization/i18n";
import { Field, Select } from "./Controls";
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
  return (
    <Field layout="inline" className="iop-context-field iop-department-scope">
      <span>{t(caption)}</span>
      <Select
        aria-label={t(label)}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t(emptyLabel)}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
