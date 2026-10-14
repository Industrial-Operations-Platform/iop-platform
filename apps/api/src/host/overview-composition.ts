import type { Pool } from 'pg';
import type { Assets } from '../modules/assets/application/assets';
import type { Handover } from '../modules/shift-handover/application/handover';
import type { Maintenance } from '../modules/maintenance/application/maintenance';
import type { OipReports } from '../modules/oip/application/reporting';
import { composeOperationalOverview, siteToday } from '../modules/operational-overview/adapters/composition';
import { ancestors, nextDate, OverviewError, type AreaInput, type Card, type Location, type ShiftContext } from '../modules/operational-overview/domain/overview';
import { evaluateSiteAccess } from '../modules/users-rbac';
import { sitePersonProfile } from '../modules/users-rbac/adapters/postgres/site-people';
import { runSiteOperation, SiteAccessDeniedError } from '../persistence/site-operation';
/** Receiving-owned projection of actual formal records. The producer owns validation and storage. */
export interface OverviewFormalRecord {
    id: string;
    state: string;
    departmentLabel: string;
    areaLabel: string;
    content: {
        title: string;
        summary: string;
        departmentId: string;
        areaId: string;
    };
    shift: OverviewShift;
}
export interface OverviewShift {
    id: string;
    date: string;
    label: string;
    targetId: string;
    targetLabel: string;
    startsAt: string;
    endsAt: string;
}
export interface OverviewFormalPort {
    query(actor: string, selection: {
        from: string;
        to: string;
        departmentId: string;
        areaId: string;
        cursor: string;
    }): Promise<{
        records: OverviewFormalRecord[];
        total: number;
        nextCursor: string;
    }>;
    previous(actor: string, selection: {
        id: string;
    }): Promise<{
        shift: OverviewShift | null;
        record: OverviewFormalRecord | null;
        overlaps: boolean;
        pendingTotal: number;
    }>;
}
export interface OverviewScope {
    organizationId: string;
    siteId: string;
    siteTimeZone: string;
}
export interface OverviewModules {
    assets: Assets;
    handover: Handover;
    maintenance: Maintenance;
    formalHandover?: OverviewFormalPort;
    reports?: Pick<OipReports, 'query'>;
}
export interface OverviewCatalogLocation extends Location {
    sectorKey?: string;
}
const card = (record: OverviewFormalRecord): Card => ({
    source: 'shift', id: record.id, title: record.content.title || record.shift.label,
    summary: `${record.shift.startsAt} / ${record.shift.endsAt} · ${record.content.summary}`.slice(0, 400),
    locationId: record.content.areaId || record.content.departmentId,
    locationLabel: [record.departmentLabel, record.areaLabel].filter(Boolean).join(' · '),
    status: record.state, date: record.shift.date, assetId: '',
});
/** A separate bounded source page; previous means actual producer-selected shift interval. */
export function formalOverviewReader(formal: OverviewFormalPort, locations: readonly Location[]) {
    return async (actor: string, selection: AreaInput): Promise<ShiftContext> => {
        const chain = ancestors(selection.locationId, locations);
        const departmentId = chain.find(location => location.role === 'department')?.id ?? '';
        const areaId = chain.find(location => location.role === 'area')?.id ?? '';
        if (!departmentId || chain[0]?.role === 'location')
            return { coverage: 'unmapped', options: [], current: null, previous: null, total: 0, nextCursor: '', note: 'Formal shifts require a configured department or area target.' };
        const page = await formal.query(actor, { from: selection.date, to: selection.date, departmentId, areaId, cursor: selection.recordCursor ?? '' });
        if (page.records.length > 50 || !Number.isSafeInteger(page.total) || page.total < page.records.length || page.nextCursor.length > 4000)
            throw new OverviewError('overview_unavailable');
        const selected = page.records.find(record => record.id === selection.recordId);
        if (selection.recordId && !selected)
            throw new OverviewError('invalid_overview');
        const prior = selected ? await formal.previous(actor, { id: selected.id }) : null;
        const previous = prior?.record ? card(prior.record) : prior?.shift ? {
            source: 'shift' as const, id: '', title: prior.shift.label,
            summary: `${prior.shift.startsAt} / ${prior.shift.endsAt}`, locationId: prior.shift.targetId,
            locationLabel: prior.shift.targetLabel, status: 'unrecorded', date: prior.shift.date, assetId: '',
        } : null;
        return { coverage: 'available', options: page.records.map(card), total: page.total, nextCursor: page.nextCursor,
            current: selected ? card(selected) : null, previous,
            note: prior?.overlaps ? 'The actual previous shift overlaps the selected interval.' : selected ? 'Previous context uses the actual preceding Workforce shift interval.' : 'Select an actual formal record to resolve its previous shift.' };
    };
}
/** Any existing authorized source can establish identity; no source grants another. */
export function overviewProfileReader(pool: Pool, source: OverviewScope) {
    const permissions = ['workforce.read', 'handover.read', 'assets.read', 'maintenance.read', 'analytics.read', 'handover.records.manage'] as const;
    return async (actor: string): Promise<string> => {
        for (const permission of permissions) {
            try {
                return await runSiteOperation(pool, { ...source, userId: actor, permissions: [permission] }, transaction => sitePersonProfile(transaction, source.organizationId, source.siteId, actor));
            } catch (error) {
                if (!(error instanceof SiteAccessDeniedError)) throw error;
            }
        }
        throw new SiteAccessDeniedError();
    };
}
export function composePlatformOverview(pool: Pool, source: OverviewScope, locations: readonly OverviewCatalogLocation[], modules: OverviewModules) {
    const profile = overviewProfileReader(pool, source);
    const allowed = async (actor: string, permission: string) => {
        try {
            return await runSiteOperation(pool, { ...source, userId: actor, permissions: [permission] }, async (transaction) => (await evaluateSiteAccess(transaction, { ...source, userId: actor, permissions: [permission] })).allowed);
        }
        catch (error) {
            if (error instanceof SiteAccessDeniedError)
                return false;
            throw error;
        }
    };
    return composeOperationalOverview({ locations, timeZone: source.siteTimeZone, today: siteToday(source.siteTimeZone), profile, allowed,
        assets: modules.assets, handover: modules.handover, maintenance: modules.maintenance,
        ...(modules.formalHandover ? { formalShifts: formalOverviewReader(modules.formalHandover, locations) } : {}),
        ...(modules.reports ? { analytics: departmentAnalyticsReader(modules.reports, locations) } : {}),
    });
}
/** Source identities are explicit configuration. Area labels are never analytics keys. */
export function departmentAnalyticsReader(reports: Pick<OipReports, 'query'>, locations: readonly OverviewCatalogLocation[]) {
    return async (actor: string, selection: AreaInput) => {
        const location = locations.find(value => value.id === selection.locationId);
        const from = selection.date, toExclusive = nextDate(from);
        if (location?.role !== 'department' || !location.sectorKey)
            return { coverage: 'unmapped' as const, from, toExclusive, frequency: null, seconds: null, records: null, importDates: [], note: 'Analytical measures require an explicit source mapping for the selected location.' };
        const result = await reports.query(actor, { from, toExclusive, dimension: 'area', period: 'day', metric: 'frequency', filters: { sector: [location.sectorKey] }, search: '', page: 1 });
        return { coverage: 'available' as const, from, toExclusive, frequency: result.totals.frequency, seconds: result.totals.seconds, records: result.totals.records,
            importDates: result.dates.filter(date => date >= from && date < toExclusive), note: 'Measures use the explicit department source mapping and admitted reporting dates.' };
    };
}
