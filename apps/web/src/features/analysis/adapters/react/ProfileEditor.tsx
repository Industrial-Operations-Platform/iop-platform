import { t } from "../../../../localization/i18n";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Disclosure,
  Field,
  Input,
  Panel,
  Select,
} from "../../../../design/components";
import type { AnalysisWorkspace } from "../../application/workspace";
import type { ProfileResult } from "../../domain/models";
import { labels } from "./labels";

export function ProfileEditor({
  application,
  onSaved,
}: {
  application: AnalysisWorkspace;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<ProfileResult | null>(null),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void application.gateway
      .profile()
      .then((x) => {
        if (active) setValue(x);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [application]);
  const save = async () => {
    if (!value) return;
    setPending(true);
    setError(undefined);
    setSaved(false);
    try {
      setValue(await application.gateway.saveProfile(value));
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const edit = (next: ProfileResult) => {
    setSaved(false);
    setValue(next);
  };
  const profile = value?.profile;
  return (
    <Panel className="analysis-import">
      <h2>{t("Data preparation & sector classification")}</h2>
      <p>
        {t(
          "Saving applies these rules to the complete historical analysis. Original files and imported values remain preserved. ",
        )}
      </p>
      <p>
        <strong>{t("Types:")}</strong>
        {t(
          " Häufigkeit → integer; Dauer → exact seconds, displayed as minutes; Bereich, Betriebsmittelkennzeichen, Meldetext, Typ and Meldegruppe → text. Commas, umlauts and code punctuation are preserved. ",
        )}
      </p>
      {error ? (
        <Alert>
          {error instanceof Error
            ? error.message
            : t("Preparation could not be saved.")}
        </Alert>
      ) : null}
      {value && profile && (
        <>
          <div className="analysis-checks">
            {(["trim", "unicodeNfc", "collapseWhitespace"] as const).map(
              (key) => (
                <Field key={key} layout="inline">
                  <Input
                    disabled={pending}
                    type="checkbox"
                    checked={profile.normalization[key]}
                    onChange={(e) => {
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          normalization: {
                            ...profile.normalization,
                            [key]: e.target.checked,
                          },
                        },
                      });
                    }}
                  />
                  {
                    {
                      trim: t("Trim outer spaces"),
                      unicodeNfc: t("Normalize Unicode (NFC)"),
                      collapseWhitespace: t("Collapse repeated spaces"),
                    }[key]
                  }
                </Field>
              ),
            )}
          </div>
          <Disclosure
            variant="divided"
            summary={
              <>
                {t("Area → sector rules (")}
                {profile.areaSectors.length})
              </>
            }
          >
            <div className="analysis-rule-table">
              {profile.areaSectors.map((rule, i) => (
                <div key={i}>
                  <Input
                    disabled={pending}
                    aria-label={t("Area {0}", [i + 1])}
                    value={rule.area}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.map((x, j) =>
                            j === i ? { ...x, area: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Input
                    disabled={pending}
                    aria-label={t("Sector {0}", [i + 1])}
                    value={rule.sector}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.map((x, j) =>
                            j === i ? { ...x, sector: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Button
                    disabled={pending}
                    onClick={() =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          areaSectors: profile.areaSectors.filter(
                            (_, j) => i !== j,
                          ),
                        },
                      })
                    }
                  >
                    {t("Remove rule ")}
                    {i + 1}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                edit({
                  ...value,
                  profile: {
                    ...profile,
                    areaSectors: [
                      ...profile.areaSectors,
                      { area: "", sector: "" },
                    ],
                  },
                })
              }
            >
              {t("Add area rule ")}
            </Button>
          </Disclosure>
          <Disclosure
            variant="divided"
            summary={
              <>
                {t("Explicit value corrections (")}
                {profile.aliases.length})
              </>
            }
          >
            <p>
              {t(
                "Replace one exact source value for analysis. No automatic spelling guesses. ",
              )}
            </p>
            {profile.aliases.map((alias, i) => (
              <div className="analysis-alias" key={i}>
                <Select
                  disabled={pending}
                  aria-label={t("Correction field {0}", [i + 1])}
                  value={alias.field}
                  onChange={(e) =>
                    edit({
                      ...value,
                      profile: {
                        ...profile,
                        aliases: profile.aliases.map((a, j) =>
                          j === i
                            ? {
                                ...a,
                                field: e.target.value as typeof alias.field,
                              }
                            : a,
                        ),
                      },
                    })
                  }
                >
                  {(
                    [
                      "area",
                      "equipment",
                      "message",
                      "type",
                      "messageGroup",
                    ] as const
                  ).map((f) => (
                    <option key={f} value={f}>
                      {labels[f]}
                    </option>
                  ))}
                </Select>
                {(["from", "to"] as const).map((k) => (
                  <Input
                    disabled={pending}
                    key={k}
                    aria-label={t("{0} value {1}", [k, i + 1])}
                    value={alias[k]}
                    onChange={(e) =>
                      edit({
                        ...value,
                        profile: {
                          ...profile,
                          aliases: profile.aliases.map((a, j) =>
                            j === i ? { ...a, [k]: e.target.value } : a,
                          ),
                        },
                      })
                    }
                  />
                ))}
                <Button
                  disabled={pending}
                  onClick={() =>
                    edit({
                      ...value,
                      profile: {
                        ...profile,
                        aliases: profile.aliases.filter((_, j) => j !== i),
                      },
                    })
                  }
                >
                  {t("Remove correction ")}
                  {i + 1}
                </Button>
              </div>
            ))}
            <Button
              disabled={pending}
              onClick={() =>
                edit({
                  ...value,
                  profile: {
                    ...profile,
                    aliases: [
                      ...profile.aliases,
                      { field: "area", from: "", to: "" },
                    ],
                  },
                })
              }
            >
              {t("Add value correction ")}
            </Button>
          </Disclosure>
          <Button disabled={pending} onClick={() => void save()}>
            {pending ? t("Saving…") : t("Save historical preparation")}
          </Button>
          {saved && (
            <p role="status">
              {t(
                "Preparation saved. Return to analysis to see the updated history. ",
              )}
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
