import { useEffect, useId, useState } from "react";
import { t } from "../../../../localization/i18n";
import { Button, Field, FieldRow, Input, Select } from "../../../../design/components";
import type { AnalysisWorkspace } from "../../application/workspace";
import type { ReportingProfile } from "../../domain/models";
import { labels } from "./labels";

type Rules = NonNullable<ReportingProfile["excludedValues"]>;
export function AnalysisExclusions({ application, rules, disabled, onChange }: {
  application: AnalysisWorkspace;
  rules: Rules;
  disabled: boolean;
  onChange: (rules: Rules) => void;
}) {
  const listId = useId();
  const [messages, setMessages] = useState<string[]>([]);
  const hasRules = rules.length > 0;
  useEffect(() => {
    if (!hasRules) return;
    let active = true;
    void application.messageOptions().then(values => { if (active) setMessages(values); }).catch(() => {
      // Suggestions are optional; exact values can still be entered manually.
    });
    return () => { active = false; };
  }, [application, hasRules]);
  return (
    <section aria-label={t("Analysis exclusions")}>
      <h3>{t("Analysis exclusions")}</h3>
      <p>{t("Exclude rows matching any exact prepared value from reports, KPI comparisons and analytical history. Original imports remain available. Remove a rule to include those rows again.")}</p>
      {rules.length === 0 && <p>{t("No values are excluded from analysis.")}</p>}
      {rules.map((rule, index) => {
        const patch = (change: Partial<Rules[number]>) => onChange(rules.map((value, i) => i === index ? { ...value, ...change } : value));
        return (
          <FieldRow key={index} className="analysis-exclusion-rule">
            <Field>
              {t("Exclusion field {0}", [index + 1])}
              <Select disabled={disabled} value={rule.field} onChange={event => patch({ field: event.target.value as Rules[number]["field"] })}>
                {(["message", "area", "equipment", "type", "messageGroup"] as const).map(field => (
                  <option key={field} value={field}>{labels[field]}</option>
                ))}
              </Select>
            </Field>
            <Field>
              {t("Excluded value {0}", [index + 1])}
              <Input disabled={disabled} required maxLength={4096} value={rule.value}
                list={rule.field === "message" ? listId : undefined}
                onChange={event => patch({ value: event.target.value })} />
            </Field>
            <Button variant="secondary" disabled={disabled} onClick={() => onChange(rules.filter((_, i) => i !== index))}>
              {t("Remove exclusion {0}", [index + 1])}
            </Button>
          </FieldRow>
        );
      })}
      <datalist id={listId}>{messages.map(message => <option key={message} value={message} />)}</datalist>
      <Button variant="secondary" disabled={disabled || rules.length >= 1000}
        onClick={() => onChange([...rules, { field: "message", value: "" }])}>
        {t("Add exclusion")}
      </Button>
      <p className="analysis-footnote">{t("Changes take effect after saving historical preparation and apply to existing and future imports.")}</p>
    </section>
  );
}
