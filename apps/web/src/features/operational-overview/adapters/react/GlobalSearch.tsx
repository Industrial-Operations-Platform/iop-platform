import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Field, Panel, SearchControl, Select } from '../../../../design/components';
import { t } from '../../../../localization/i18n';
import type { OperationalOverviewApplication } from '../../application/overview';
import { emptyCursors, type Context, type Cursors, type Group, type SearchResult, type Target } from '../../domain/models';
import { SourceGroups } from './SourceGroups';
import './overview.css';
export function GlobalSearch({ application, onNavigate, sessionKey = '' }: {
    application: OperationalOverviewApplication;
    onNavigate: (target: Target) => void;
    sessionKey?: string;
}) {
    const [query, setQuery] = useState(''), [locationId, setLocationId] = useState(''), [context, setContext] = useState<Context>(), [result, setResult] = useState<SearchResult>(), [error, setError] = useState(''), [pending, setPending] = useState(false), [cursors, setCursors] = useState<Cursors>(emptyCursors);
    const root = useRef<HTMLDivElement>(null), generation = useRef(0);
    useEffect(() => { let active = true; setQuery(''); setResult(undefined); setContext(undefined); setCursors(emptyCursors()); application.context().then(value => { if (active)
        setContext(value); }).catch(reason => { if (active)
        setError((reason as Error).message); }); return () => { active = false; generation.current++; }; }, [application, sessionKey]);
    useEffect(() => { if (!query.trim()) {
        setResult(undefined);
        setPending(false);
        generation.current++;
        return;
    } const token = ++generation.current; setPending(true); setError(''); const timer = setTimeout(() => { application.search({ query, locationId, cursors }).then(value => { if (token === generation.current)
        setResult(value); }).catch(reason => { if (token === generation.current)
        setError((reason as Error).message); }).finally(() => { if (token === generation.current)
        setPending(false); }); }, 250); return () => { clearTimeout(timer); generation.current++; }; }, [application, query, locationId, cursors]);
    useEffect(() => { const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target))
        setQuery(''); }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside); }, []);
    const change = (value: string) => { setQuery(value.slice(0, 160)); setCursors(emptyCursors()); setResult(undefined); };
    const navigate = (target: Target) => { setQuery(''); onNavigate(target); };
    const more = (group: Group) => { if (['assets', 'handover', 'maintenance'].includes(group.source))
        setCursors(current => ({ ...current, [group.source]: group.nextCursor })); };
    return <div ref={root} className="overview-global-search" onKeyDown={event => { if (event.key === 'Escape') {
        setQuery('');
        root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    } }}><SearchControl label={t('Global search')} placeholder={t('Search assets, areas, reports and work')} value={query} onChange={change}/>{query.trim() && <Panel className="overview-search-panel" role="region" aria-label={t('Global search results')}><div className="overview-search-heading"><h2>{t('Global search')}</h2><Button variant="text" onClick={() => change('')}>{t('Clear search')}</Button></div><Field>{t('Location scope')}<Select value={locationId} onChange={event => { setLocationId(event.target.value); setCursors(emptyCursors()); setResult(undefined); }}><option value="">{t('Entire authorized site')}</option>{context?.locations.map(l => <option value={l.id} key={l.id}>{l.label}</option>)}</Select></Field>{pending && <p role="status">{t('Searching authorized sources…')}</p>}{error && <Alert>{error}</Alert>}{result && <SourceGroups groups={result.groups} onNavigate={navigate} onMore={more} pending={pending}/>}<p className="overview-summary">{t('Each source checks current access independently. Results are bounded and grouped; unavailable access is not a zero count.')}</p></Panel>}</div>;
}
