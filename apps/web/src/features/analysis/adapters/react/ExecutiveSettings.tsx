import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Disclosure,
  Field,
  FieldRow,
  Input,
  Select,
} from "../../../../design/components";
import type { AnalysisWorkspace } from "../../application/workspace";
import type {
  ExecutiveKpiDefinition,
  ProfileResult,
} from "../../domain/models";

export function ExecutiveSettings({
  application,
  onSaved,
  initiallyExpanded = false,
}: {
  application: AnalysisWorkspace;
  onSaved: () => void;
  initiallyExpanded?: boolean;
}) {
  const [messages, setMessages] = useState<string[]>([]);
  const [value, setValue] = useState<ProfileResult | null>(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string>(),
    [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setError(undefined);
    setValue(null);
    void Promise.all([
      application.gateway.profile(),
      application.messageOptions(),
    ])
      .then(([result, options]) => {
        if (active) {
          setValue(result);
          setMessages(options);
        }
      })
      .catch(() => {
        if (active)
          setError("KPI settings could not be loaded. Retry loading settings.");
      });
    return () => {
      active = false;
    };
  }, [application, reload]);
  const edit = (definitions: ExecutiveKpiDefinition[]) => {
    if (!value) return;
    setSaved(false);
    setValue({
      ...value,
      profile: { ...value.profile, executiveKpis: definitions },
    });
  };
  const save = async () => {
    if (!value) return;
    setPending(true);
    setError(undefined);
    setSaved(false);
    try {
      setValue(await application.gateway.saveProfile(value));
      setSaved(true);
      onSaved();
    } catch {
      setError(
        "Settings could not be saved. Check the values, or reload saved settings if another edit changed them.",
      );
    } finally {
      setPending(false);
    }
  };
  const definitions = value?.profile.executiveKpis ?? [];
  return (
    <Disclosure
      className="analysis-executive-settings"
      variant="panel"
      summary={t("KPI settings & goals")}
      open={initiallyExpanded || undefined}
    >
      <p>
        {t(
          "Choose up to eight KPIs. Choose an exact prepared Meldetext for each KPI. Goals use the same daily-average unit as the KPI; leave a goal empty to compare with all imported history. Lower is better. ",
        )}
      </p>
      {error && <Alert>{error}</Alert>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {definitions.map((definition, index) => {
          const patch = (change: Partial<ExecutiveKpiDefinition>) =>
            edit(
              definitions.map((d, i) =>
                i === index ? { ...d, ...change } : d,
              ),
            );
          return (
            <FieldRow className="analysis-kpi-setting" key={definition.id}>
              <Field>
                {t("Label ")}
                {index + 1}
                <Input
                  required
                  maxLength={160}
                  disabled={pending}
                  value={definition.label}
                  onChange={(e) => patch({ label: e.target.value })}
                />
              </Field>
              <Field>
                {t("Meldetext ")}
                {index + 1}
                <Select
                  aria-label={t("Meldetext {0}", [index + 1])}
                  required
                  disabled={pending}
                  value={definition.message}
                  onChange={(e) =>
                    patch({
                      message: e.target.value,
                      label:
                        definition.label === definition.message ||
                        definition.label === "New KPI"
                          ? e.target.value
                          : definition.label,
                    })
                  }
                >
                  <option value="" disabled>
                    {t("Select an error ")}
                  </option>
                  {definition.message &&
                    !messages.includes(definition.message) && (
                      <option value={definition.message}>
                        {definition.message}
                        {t(" (not in current history) ")}
                      </option>
                    )}
                  {messages
                    .filter(
                      (message) =>
                        message === definition.message ||
                        !definitions.some(
                          (d, i) => i !== index && d.message === message,
                        ),
                    )
                    .map((message) => (
                      <option key={message} value={message}>
                        {message}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field>
                {t("Measure ")}
                {index + 1}
                <Select
                  disabled={pending}
                  value={definition.metric}
                  onChange={(e) =>
                    patch({
                      metric: e.target.value as "frequency" | "duration",
                      goal: null,
                    })
                  }
                >
                  <option value="frequency">{t("Occurrences/day")}</option>
                  <option value="duration">{t("Alarm minutes/day")}</option>
                </Select>
              </Field>
              <Field>
                {t("Goal ")}
                {index + 1}
                <Input
                  type="number"
                  min="0"
                  step="any"
                  disabled={pending}
                  value={definition.goal ?? ""}
                  onChange={(e) =>
                    patch({
                      goal:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Button
                disabled={pending}
                variant="secondary"
                onClick={() => edit(definitions.filter((_, i) => i !== index))}
              >
                {t("Remove KPI ")}
                {index + 1}
              </Button>
            </FieldRow>
          );
        })}
        <Button
          disabled={
            !value ||
            pending ||
            definitions.length >= 8 ||
            !messages.some(
              (message) => !definitions.some((d) => d.message === message),
            )
          }
          variant="secondary"
          onClick={() =>
            edit([
              ...definitions,
              {
                id: crypto.randomUUID(),
                label: "New KPI",
                message: "",
                metric: "frequency",
                goal: null,
              },
            ])
          }
        >
          {t("Add KPI ")}
        </Button>{" "}
        <Button type="submit" disabled={!value || pending}>
          {pending ? t("Saving KPI settings…") : t("Save KPI settings")}
        </Button>{" "}
        <Button
          disabled={pending}
          variant="secondary"
          onClick={() => {
            setSaved(false);
            setReload((n) => n + 1);
          }}
        >
          {t("Reload saved settings ")}
        </Button>
      </form>
      {saved && <p role="status">{t("KPI settings saved.")}</p>}
    </Disclosure>
  );
}
