import { useEffect, useRef, useState } from 'react';
import { Actions, Alert, Badge, Button, Disclosure } from '../../../../design/components';
import { t } from '../../../../localization/i18n';
import type { LocatorApplication } from '../../application/locator';
import type { ModelPreview } from '../../domain/models';

const statusLabel = (status: ModelPreview['status']) => t({
  ready: 'Ready to prepare', current: 'Already prepared',
  'manual-edits-preserved': 'Manual edits preserved',
  'not-initialized': 'Initialize reference scene first',
  'manual-review-required': 'Manual review required',
}[status]);

/** Administrator composition only. Each scene has its own revision guard and transaction. */
export function ModelPreparation({ application, disabled, refresh }: {
  application: LocatorApplication; disabled: boolean; refresh: () => Promise<void>;
}) {
  const [models, setModels] = useState<ModelPreview[]>(), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [progress, setProgress] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const preview = async () => {
    setBusy(true); setError(''); setProgress('');
    try { const result = await application.modelPreview(); if (mounted.current) setModels(result.models); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : t('Prepared models are unavailable.')); }
    finally { if (mounted.current) setBusy(false); }
  };
  const apply = async () => {
    const ready = models?.filter(m => m.status === 'ready') ?? [];
    setBusy(true); setError('');
    let applied = 0, preserved = 0;
    try {
      for (const model of ready) {
        if (!mounted.current) break;
        const result = await application.applyModel(model.sceneId, model.expectedRevision);
        if (result.status === 'applied') applied++; else preserved++;
        if (mounted.current) setProgress(`${t('Prepared scenes:')} ${applied} / ${ready.length}. ${t('Preserved scenes:')} ${preserved}.`);
      }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : t('Prepared models are unavailable.')); }
    finally {
      if (mounted.current) {
        try { await refresh(); const result = await application.modelPreview(); if (mounted.current) setModels(result.models); }
        catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : t('Prepared models are unavailable.')); }
        if (mounted.current) setBusy(false);
      }
    }
  };
  return <Disclosure summary="Prepared area models">
    <p>{t('Prepare reusable conveyor, motor and photoelectric sensor identities from the private drawings. Labels and physical positions remain provisional. Manual edits and registered asset links are preserved.')}</p>
    <Actions><Button variant="secondary" disabled={disabled || busy} onClick={() => void preview()}>{t('Review prepared models')}</Button>
      {models?.some(m => m.status === 'ready') && <Button disabled={disabled || busy} onClick={() => void apply()}>{t('Apply ready models')} ({models.filter(m => m.status === 'ready').length})</Button>}</Actions>
    {error && <Alert>{error}</Alert>}{progress && <p role="status">{progress}</p>}
    {models?.length === 0 && <p>{t('No prepared models are installed. Import the private model candidates first.')}</p>}
    {models && <ul className="locator-list">{models.map(m => <li key={m.referenceId}><strong>{m.referenceName}</strong> <Badge>{statusLabel(m.status)}</Badge><p>{m.componentCount} {t('components')} · {m.motors} {t('motors')} · {m.photoelectricSensors} {t('photoelectric sensors')} · {m.conveyors} {t('conveyors')}</p></li>)}</ul>}
  </Disclosure>;
}
