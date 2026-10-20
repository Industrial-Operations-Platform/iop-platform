import { t } from "../../localization/i18n";
import { Field, Select } from "./Controls";

/** Native selection in the shared compact caption/value context surface. */
export function CompactSelect({
  caption,
  label = caption,
  value,
  onChange,
  choices,
  emptyLabel,
  disabled = false,
  className = "",
}: {
  caption: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  choices: readonly { id: string; label: string }[];
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field layout="inline" className={`iop-context-field iop-compact-select ${className}`}>
      <span>{t(caption)}</span>
      <Select aria-label={t(label)} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
        {emptyLabel !== undefined && <option value="">{t(emptyLabel)}</option>}
        {choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
      </Select>
    </Field>
  );
}
