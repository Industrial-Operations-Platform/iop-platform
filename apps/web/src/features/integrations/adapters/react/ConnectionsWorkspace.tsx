import { useEffect, useState } from 'react';
import type { ConnectionsApplication } from '../../application/connections';
import type { Connection, ConnectionReadiness } from '../../domain/models';
import { Actions, Alert, Badge, Button, Disclosure, Field, Input, PageHeading, Panel, RefreshButton } from '../../../../design/components';
import { t } from '../../../../localization/i18n';
export function ConnectionsWorkspace({ application, canManage }: {
    application: ConnectionsApplication;
    canManage: boolean;
}) {
    const [connections, setConnections] = useState<ConnectionReadiness[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [draft, setDraft] = useState<Connection | null>(null), [history, setHistory] = useState<Connection[]>([]);
    async function load() {
        setBusy(true);
        setError('');
        try {
            setConnections((await application.query()).connections);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    useEffect(() => {
        let mounted = true;
        setBusy(true);
        application.query().then(data => { if (mounted)
            setConnections(data.connections); })
            .catch(e => { if (mounted)
            setError(e.message); }).finally(() => { if (mounted)
            setBusy(false); });
        return () => { mounted = false; };
    }, [application]);
    async function save() {
        if (!draft)
            return;
        setBusy(true);
        setError('');
        try {
            await application.save(draft);
            setDraft(null);
            await load();
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    function field(key: 'label' | 'endpoint' | 'contractVersion' | 'credentialReference' | 'tenantId' | 'clientId', value: string) {
        if (draft)
            setDraft({ ...draft, configuration: { ...draft.configuration, [key]: value } });
    }
    return <>
    <PageHeading title="Integrations" description="Read-only adapter contracts are ready. Real provider connections still require configuration and implementation." actions={<RefreshButton busy={busy} onClick={load}/>}/>
    {error && <Alert>{error}</Alert>}
    {busy && <p role="status">{t('Loading integration readiness…')}</p>}
    <Panel><p>{t('No live provider is connected. Saved configuration does not enable a transport or replace local sign-in.')}</p>
      {connections.map(connection => <Disclosure key={connection.configuration.kind} variant="divided" summary={<>{connection.configuration.label} <Badge tone="warning">{t(connection.status === 'disabled' ? 'Disabled' : connection.status === 'configuration-pending' ? 'Configuration pending' : 'Transport pending')}</Badge></>}>
        <p>{t('Adapter contract ready')} · {t('No verified provider connection')}</p>
        <ul>{connection.missingInputs.map(input => <li key={input}>{t(input)}</li>)}</ul>
        <Actions>{canManage && <Button variant="secondary" onClick={() => { setDraft(connection); setHistory([]); }}>{t('Edit configuration')}</Button>}
          <Button variant="secondary" onClick={async () => { try {
            setHistory((await application.history(connection.configuration.kind)).revisions);
        }
        catch (e) {
            setError((e as Error).message);
        } }}>{t('Configuration history')}</Button></Actions>
      </Disclosure>)}
    </Panel>
    {draft && <Panel><h2>{t('Configuration')} — {draft.configuration.label}</h2>
      <p>{t('Enter nonsecret metadata only. Credentials stay in private operator storage; use a logical reference here.')}</p>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <Field><span>{t('Label')}</span><Input value={draft.configuration.label} maxLength={100} onChange={e => field('label', e.target.value)} required/></Field>
        <Field><span>{t('Authorized HTTPS endpoint')}</span><Input value={draft.configuration.endpoint} maxLength={500} onChange={e => field('endpoint', e.target.value)}/></Field>
        <Field><span>{t('Reviewed contract version')}</span><Input value={draft.configuration.contractVersion} maxLength={100} onChange={e => field('contractVersion', e.target.value)}/></Field>
        <Field><span>{t('Private credential reference')}</span><Input value={draft.configuration.credentialReference} maxLength={100} onChange={e => field('credentialReference', e.target.value)}/></Field>
        {draft.configuration.kind === 'entra' && <><Field><span>{t('Tenant ID')}</span><Input value={draft.configuration.tenantId} maxLength={100} onChange={e => field('tenantId', e.target.value)}/></Field>
          <Field><span>{t('Client ID')}</span><Input value={draft.configuration.clientId} maxLength={100} onChange={e => field('clientId', e.target.value)}/></Field></>}
        <Field><span>{t('Prepare enabled connection')}</span><Input type="checkbox" checked={draft.configuration.enabled} onChange={e => setDraft({ ...draft, configuration: { ...draft.configuration, enabled: e.target.checked } })}/></Field>
        <Actions><Button type="submit" disabled={busy}>{t('Save')}</Button><Button variant="secondary" type="button" onClick={() => setDraft(null)}>{t('Cancel')}</Button></Actions>
      </form>
    </Panel>}
    {history.length > 0 && <Panel><h2>{t('Configuration history')}</h2><ol>{history.map(record => <li key={record.revision}>{record.configuration.label} · {t('Revision')} {record.revision} · {record.updatedAt}</li>)}</ol></Panel>}
  </>;
}
