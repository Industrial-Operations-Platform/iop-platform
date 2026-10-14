import { OperationalOverview, type Reads, type SourcePage } from '../application/overview';
import { ancestors, type Location, type AreaInput, type Analytics, type ShiftContext, type Card } from '../domain/overview';
import type { Assets } from '../../assets/application/assets';
import type { Handover } from '../../shift-handover/application/handover';
import { emptySelection } from '../../shift-handover/domain/handover';
import type { Maintenance } from '../../maintenance/application/maintenance';
import { SiteAccessDeniedError } from '../../../persistence/site-operation';
/** Composition invokes source-owned public use cases. It never queries private source tables. */
export function composeOperationalOverview(options: {
    locations: readonly Location[];
    timeZone: string;
    today: () => string;
    profile: (actor: string) => Promise<string>;
    allowed: (actor: string, permission: string) => Promise<boolean>;
    assets: Assets;
    handover: Handover;
    maintenance: Maintenance;
    analytics?: (actor: string, query: AreaInput) => Promise<Analytics>;
    formalShifts?: (actor: string, query: AreaInput) => Promise<ShiftContext>;
}): OperationalOverview {
    const path = (id: string) => { const chain = ancestors(id, options.locations), department = chain.find(l => l.role === 'department'); return { departmentId: department?.id ?? '', areaId: chain.find(l => l.role === 'area')?.id ?? '' }; };
    const reads: Reads = { allowed: options.allowed, profile: options.profile,
        assets: async (actor, query): Promise<SourcePage> => { const page = await options.assets.query(actor, { search: query.search, locationId: query.locationId, cursor: query.cursor, status: 'current' }); return { items: page.assets.map(asset => ({ source: 'assets', id: asset.id, title: asset.content.code, summary: [asset.content.name, asset.content.type, asset.content.description].filter(Boolean).join(' · ').slice(0, 400), locationId: asset.content.locationId, locationLabel: options.locations.find(l => l.id === asset.content.locationId)?.label ?? '', status: asset.content.status, date: asset.updatedAt, assetId: asset.id })), total: page.total, nextCursor: page.nextCursor }; },
        handover: async (actor, query): Promise<SourcePage> => { if (options.locations.find(l => l.id === query.locationId)?.role === 'location')
            return { coverage: 'unmapped', items: [], total: 0, nextCursor: '' }; const location = path(query.locationId), page = await options.handover.list(actor, { ...emptySelection, ...location, search: query.search, cursor: query.cursor, state: query.pending ? 'pending' : '', from: query.pending ? '' : query.date, to: query.pending ? '' : query.date }); return { items: page.entries.map(entry => ({ source: 'handover', id: entry.id, title: entry.content.summary, summary: entry.content.details.slice(0, 400), locationId: entry.content.areaId || entry.content.departmentId, locationLabel: [entry.departmentLabel, entry.areaLabel].filter(Boolean).join(' · '), status: entry.issueState, date: entry.content.date, assetId: (entry.content as typeof entry.content & {
                    assetId?: string;
                }).assetId ?? '' })), total: page.total, nextCursor: page.nextCursor }; },
        maintenance: async (actor, query): Promise<SourcePage> => { const page = await options.maintenance.query(actor, { locationId: query.locationId, search: query.search, cursor: query.cursor, limit: 50, history: true, ...(query.pending ? { status: query.status as 'open' | 'in-progress' | 'blocked' } : {}) }); return { items: page.records.map(record => ({ source: 'maintenance', id: record.id, title: record.data.title, summary: record.data.details.slice(0, 400), locationId: record.data.locationId, locationLabel: record.locationLabel, status: record.data.status, date: record.data.dueDate || record.updatedAt, assetId: record.data.assetId })), total: page.total, nextCursor: page.nextCursor }; },
        ...(options.analytics ? { analytics: options.analytics } : {}), ...(options.formalShifts ? { shifts: options.formalShifts } : {}),
        isDenied: error => error instanceof SiteAccessDeniedError || !!(error && typeof error === 'object' && 'code' in error && ['asset_denied', 'handover_denied', 'maintenance_denied', 'analytics_denied'].includes(String(error.code)))
    };
    return new OperationalOverview(reads, options.locations, options.timeZone, options.today);
}
export function siteToday(timeZone: string): () => string { return () => { const values = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const get = (name: string) => values.find(p => p.type === name)?.value ?? ''; return `${get('year')}-${get('month')}-${get('day')}`; }; }
