import { useEffect, useState } from 'react';
import { Alert, Button, DateField, DepartmentScope, Field, MetricCard, MetricGrid, Panel, RefreshButton, SectionHeading, Select } from '../../../../design/components';
import { locale, t } from '../../../../localization/i18n';
import type { OperationalOverviewApplication } from '../../application/overview';
import { descendants, type Context, type AreaResult, type Target } from '../../domain/models';
import { coverageLabel, SourceCard, SourceGroups } from './SourceGroups';
import './overview.css';
export function AreaOverview({ application, onNavigate, initialLocationId = '', homeVisit = 0 }: {
    application: OperationalOverviewApplication;
    onNavigate: (target: Target) => void;
    initialLocationId?: string;
    homeVisit?: number;
}) {
    const [context, setContext] = useState<Context>(), [locationId, setLocationId] = useState(initialLocationId), [date, setDate] = useState(''), [recordId, setRecordId] = useState(''), [recordCursor, setRecordCursor] = useState(''), [result, setResult] = useState<AreaResult>(), [error, setError] = useState(''), [pending, setPending] = useState(false), [version, setVersion] = useState(0), [contextAttempt, setContextAttempt] = useState(0);
    useEffect(() => { let active = true; setPending(true); setError(''); setContext(undefined); setResult(undefined); application.context().then(value => { if (!active)
        return; setContext(value); setDate(value.today); setLocationId(initialLocationId || value.locations.find(l => l.role === 'department')?.id || value.locations[0]?.id || ''); setRecordId(''); setRecordCursor(''); }).catch(reason => { if (active)
        setError((reason as Error).message); }).finally(() => { if (active)
        setPending(false); }); return () => { active = false; }; }, [application, initialLocationId, homeVisit, contextAttempt]);
    useEffect(() => { if (!context || !locationId || !date) {
        setResult(undefined);
        return;
    } let active = true; setPending(true); setError(''); setResult(undefined); application.area({ locationId, date, recordId, recordCursor }).then(value => { if (active)
        setResult(value); }).catch(reason => { if (active)
        setError((reason as Error).message); }).finally(() => { if (active)
        setPending(false); }); return () => { active = false; }; }, [application, context, locationId, date, recordId, recordCursor, version]);
    const chain = () => { let current = context?.locations.find(l => l.id === locationId); const seen = new Set<string>(); while (current && !seen.has(current.id)) {
        if (current.role === 'department')
            return current.id;
        seen.add(current.id);
        current = context?.locations.find(l => l.id === current?.parentId);
    } return ''; };
    const departmentId = chain(), choices = descendants(departmentId, context?.locations ?? []).filter(l => l.role !== 'department');
    const format = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value);
    return <div className="overview-workspace"><SectionHeading section="Area overview" view={result?.location.label ?? 'Selected location'} onHome={() => { setLocationId(context?.locations.find(l => l.role === 'department')?.id ?? ''); setRecordId(''); setRecordCursor(''); }} description="Operational context from independently authorized source modules." actions={<RefreshButton busy={pending} onClick={() => context ? setVersion(v => v + 1) : setContextAttempt(attempt => attempt + 1)}/>}/>
  {error && <Alert>{error}</Alert>}{context && <div className="iop-scope-toolbar"><DepartmentScope value={departmentId} onChange={id => { setLocationId(id); setRecordId(''); setRecordCursor(''); }} choices={context.locations.filter(l => l.role === 'department').map(l => ({ id: l.id, label: l.label }))}/><DepartmentScope value={locationId === departmentId ? '' : locationId} caption="Area / location" label="Selected area" emptyLabel="Whole selected department" choices={choices} onChange={id => { setLocationId(id || departmentId); setRecordId(''); setRecordCursor(''); }}/><DateField label={t('Journal date')} value={date} onChange={event => { setDate(event.target.value); setRecordId(''); setRecordCursor(''); }}/></div>}
  {pending && <p role="status">{t('Loading authorized area context…')}</p>}{context && !context.locations.length && <Panel variant="empty">{t('No configured operational locations are available.')}</Panel>}
  {result && <><Panel><p>{t('Journal entries use the selected calendar date. Pending issues and work show their current state, including older unresolved records.')}</p><p className="overview-summary">{t('This view does not establish live equipment health or historical state at the selected date.')}{' '}{t('Site time zone:')}{' '}{result.timeZone}</p></Panel><SourceGroups groups={result.groups} onNavigate={onNavigate}/>
   <Panel><h2>{t('Formal shift context')}</h2><p className="overview-coverage">{coverageLabel(result.shifts.coverage)}</p>{result.shifts.options.length > 0 && <Field>{t('Explicit shift record')}<Select value={recordId} onChange={event => setRecordId(event.target.value)}><option value="">{t('Select an actual shift record')}</option>{result.shifts.options.map(c => <option key={c.id} value={c.id}>{c.title} — {c.date}</option>)}</Select></Field>}{result.shifts.coverage === 'available' && <p>{result.shifts.options.length} / {result.shifts.total ?? result.shifts.options.length}</p>}{result.shifts.nextCursor && <Button variant="secondary" onClick={() => { setRecordId(''); setRecordCursor(result.shifts.nextCursor ?? ''); }}>{t('Next formal record page')}</Button>}{recordCursor && <Button variant="secondary" onClick={() => { setRecordId(''); setRecordCursor(''); }}>{t('First formal record page')}</Button>}<p className="overview-summary">{t(result.shifts.note)}</p>{result.shifts.current && <><h3>{t('Selected actual shift')}</h3><ul className="overview-results"><SourceCard card={result.shifts.current} onNavigate={onNavigate}/></ul></>}{result.shifts.previous && <><h3>{t('Previous actual shift')}</h3><ul className="overview-results"><SourceCard card={result.shifts.previous} onNavigate={onNavigate}/></ul></>}</Panel>
   <Panel><h2>{t('Optional analytical context')}</h2><p className="overview-coverage">{coverageLabel(result.analytics.coverage)} · {result.analytics.from} / {result.analytics.toExclusive}</p><p className="overview-summary">{t(result.analytics.note)}</p>{result.analytics.coverage === 'available' && <><MetricGrid><MetricCard label="Alarm frequency" value={format(result.analytics.frequency)}/><MetricCard label="Accumulated alarm seconds" value={format(result.analytics.seconds)}/><MetricCard label="Source aggregate records" value={format(result.analytics.records)}/></MetricGrid><p>{t('Imported reporting dates:')}{' '}{result.analytics.importDates.join(', ') || t('No admitted import for this period')}</p><p className="overview-summary">{t('Accumulated alarm duration is not plant downtime. Missing imports are not zero measures.')}</p><Button variant="secondary" onClick={() => onNavigate({ source: 'analytics', id: date, locationId })}>{t('Open analytical source view')}</Button></>}</Panel>
  </>}
 </div>;
}
