import { t } from "../../localization/i18n";
import { Field, Select } from "./Controls";
/** One department context, shared by Start and operational workspaces. */
export function DepartmentScope({
  value,
  onChange,
  choices,
  label = "Selected department",
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  choices: { id: string; label: string }[];
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Field className="iop-department-scope">
      <span>{t("Department / Halle")}</span>
      <Select
        aria-label={t(label)}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("All departments")}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
