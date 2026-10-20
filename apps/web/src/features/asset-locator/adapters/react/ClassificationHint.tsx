import { useEffect, useState } from 'react';
import { Alert, Button, Disclosure } from '../../../../design/components';
import { t } from '../../../../localization/i18n';
import type { LocatorApplication } from '../../application/locator';
import type { Classification, ComponentKind } from '../../domain/models';

export function ClassificationHint({ application, assetId, kind, disabled, onApply }: {
  application: LocatorApplication; assetId: string; kind: ComponentKind; disabled: boolean;
  onApply: (kind: 'photoelectric-sensor') => void;
}) {
  const [result, setResult] = useState<Classification>(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [request, setRequest] = useState(0);
  useEffect(() => {
    setResult(undefined); setError('');
    if (!request || !assetId) { setBusy(false); return; }
    let active = true; setBusy(true);
    void application.classification(assetId).then(value => { if (active) setResult(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : t('Classification evidence is unavailable.')); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [application, assetId, request]);
  return <Disclosure summary="Source-message classification">
    <p>{t('Alarm text can suggest a component type. A message about a photoelectric sensor may concern a child of the registered equipment. Review the symbol and exact asset link before applying it.')}</p>
    <Button variant="secondary" disabled={disabled || busy || !assetId} onClick={() => setRequest(v => v + 1)}>{t('Check imported alarm evidence')}</Button>
    {!assetId && <p>{t('Link an exact registered asset first.')}</p>}{error && <Alert>{error}</Alert>}
    {result && result.assetId === assetId && <><p>{t(result.coverage === 'unmapped' ? 'No exact source mapping is available.' : result.coverage === 'limited' ? 'Evidence is a bounded sample; other messages may exist.' : 'Exact source evidence is available.')}</p>
      {result.suggestedKind ? <><p><strong>{t('Suggested type: Photoelectric sensor')}</strong> · {result.matchedMessages} {t('matching messages in this sample.')}</p>
        {kind !== result.suggestedKind && <Button variant="secondary" disabled={disabled} onClick={() => onApply(result.suggestedKind as 'photoelectric-sensor')}>{t('Apply suggestion to draft')}</Button>}</> : <p>{t('No supported classification hint in this sample.')}</p>}
      {result.sources.map(source => <div key={source.sourceId + ':' + source.area + ':' + source.code}><h4>{source.area} / {source.code}</h4><p className="locator-muted">{source.total} {t('imported messages')} · {t(source.origin)}</p><ul className="locator-list">{source.evidence.map(row => <li key={row.importId + ':' + row.sourceRecordNumber}><strong>{row.message}</strong><p className="locator-muted">{row.reportingDate} · {t('Import')} {row.importId} · {t('Source record')} {row.sourceRecordNumber}</p></li>)}</ul></div>)}
    </>}
  </Disclosure>;
}
