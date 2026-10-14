import { useEffect, useState } from "react";
import { Alert, Button, Field, Input, Select } from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { AssetDomainApplication } from "../../application/domain";
import type { ReferencePage, RegistryReference } from "../../domain/models";
/** Bounded async lookup keeps registry size independent from an editor's initial payload. */
export function AssetReferencePicker({
  application,
  label,
  value,
  currentLabel = "",
  onChange,
  excludeId = "",
  disabled = false,
  accept
}: {
  application: AssetDomainApplication;
  label: string;
  value: string;
  currentLabel?: string;
  onChange: (asset: RegistryReference | null) => void;
  excludeId?: string;
  disabled?: boolean;
  accept?: (id: string, page: ReferencePage) => boolean;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState<ReferencePage>({
      assets: [],
      enrichments: [],
      total: 0,
      nextCursor: ""
    }),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      application.references({
        search,
        limit: 30
      }).then(p => {
        if (active) {
          setPage(p);
          setError("");
        }
      }).catch(e => {
        if (active) setError(e.message);
      });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [application, search]);
  const choices = page.assets.filter(a => a.id !== excludeId && (!accept || accept(a.id, page)));
  return <div><Field>{t("Search")}: {label}<Input aria-label={t("Search") + ": " + label} value={search} maxLength={200} disabled={disabled} onChange={e => setSearch(e.target.value)} /></Field><Field>{label}<Select aria-label={label} disabled={disabled} value={value} onChange={e => onChange(page.assets.find(a => a.id === e.target.value) ?? null)}><option value="">{t("Not linked")}</option>{choices.map(a => <option key={a.id} value={a.id}>{a.code}</option>)}{value && !choices.some(a => a.id === value) && <option value={value}>{currentLabel || value}</option>}</Select></Field>{error && <Alert>{error}</Alert>}<small>{page.total} {t("registry matches")}; {choices.length} {t("choices in this page")}</small>{page.nextCursor && <Button disabled={disabled} onClick={() => application.references({
      search,
      cursor: page.nextCursor,
      limit: 30
    }).then(next => setPage(p => ({
      ...next,
      assets: [...p.assets, ...next.assets],
      enrichments: [...p.enrichments, ...next.enrichments]
    }))).catch(e => setError(e.message))}>{t("Load more assets")}</Button>}</div>;
}
