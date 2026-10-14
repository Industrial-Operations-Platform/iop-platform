import { Badge, Button, Panel } from '../../../../design/components';
import { t } from '../../../../localization/i18n';
import { navigation, type Card, type Group, type Target } from '../../domain/models';
export function coverageLabel(value: string) { const labels: Record<string, string> = { available: 'Available', 'not-authorized': 'Not authorized', unavailable: 'Unavailable', 'not-configured': 'Not configured', unmapped: 'Mapping pending' }; return t(labels[value] ?? value); }
export function sourceLabel(source: string) { const labels: Record<string, string> = { areas: 'Configured areas', assets: 'Registered assets', handover: 'Handover reports', maintenance: 'Maintenance work', analytics: 'Data Analysis', shifts: 'Formal shift context' }; return t(labels[source] ?? source); }
export function groupLabel(group: Group) { if (group.source === 'handover')
    return t(group.view === 'pending' ? 'Current pending Handover issues' : group.view === 'daily' ? 'Handover entries on the selected date' : 'Handover reports'); if (group.source === 'maintenance' && group.view !== 'search')
    return t('Maintenance work') + ' · ' + t(group.view); return sourceLabel(group.source); }
export function SourceCard({ card, onNavigate }: {
    card: Card;
    onNavigate: (target: Target) => void;
}) { return <li className="overview-result"><Button variant="text" disabled={!card.id} onClick={() => onNavigate(navigation(card))}>{card.title}</Button>{card.summary && <p className="overview-summary">{card.summary}</p>}<div className="overview-metadata"><span>{card.locationLabel}</span>{card.status && <Badge>{t(card.status)}</Badge>}{card.date && <span>{card.date}</span>}</div></li>; }
export function SourceGroups({ groups, onNavigate, onMore, pending = false }: {
    groups: Group[];
    onNavigate: (target: Target) => void;
    onMore?: (group: Group) => void;
    pending?: boolean;
}) { return <div className="overview-groups">{groups.map(group => <Panel key={group.source + ':' + group.view}><h2>{groupLabel(group)}</h2><p className="overview-coverage">{coverageLabel(group.coverage)}{group.coverage === 'available' ? ' · ' + group.items.length + ' / ' + group.total : ''}</p>{group.coverage === 'available' && <><ul className="overview-results">{group.items.map(card => <SourceCard key={card.source + ':' + card.id} card={card} onNavigate={onNavigate}/>)}</ul>{!group.items.length && <p>{t('No matching records in this authorized source.')}</p>}{group.nextCursor && onMore ? <Button variant="secondary" disabled={pending} onClick={() => onMore(group)}>{t('Load more from this source')}</Button> : group.total > group.items.length && <p className="overview-summary">{t('The source has more records. Refine the selection or open its full view.')}</p>}</>}</Panel>)}</div>; }
