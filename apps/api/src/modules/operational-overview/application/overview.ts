import { OverviewError, selection, areaSelection, within, nextDate, type Location, type Card, type Group, type Source, type SearchInput, type AreaInput, type Analytics, type ShiftContext, type AreaResult, type Coverage } from '../domain/overview';
export interface SourcePage {
    items: Card[];
    total: number;
    nextCursor: string;
    coverage?: 'unmapped';
}
export interface Reads {
    profile(actor: string): Promise<string>;
    allowed(actor: string, permission: string): Promise<boolean>;
    assets(actor: string, query: {
        search: string;
        locationId: string;
        cursor: string;
    }): Promise<SourcePage>;
    handover(actor: string, query: {
        search: string;
        locationId: string;
        cursor: string;
        date: string;
        pending: boolean;
    }): Promise<SourcePage>;
    maintenance(actor: string, query: {
        search: string;
        locationId: string;
        cursor: string;
        date: string;
        pending: boolean;
        status?: string;
    }): Promise<SourcePage>;
    analytics?(actor: string, query: AreaInput): Promise<Analytics>;
    shifts?(actor: string, query: AreaInput): Promise<ShiftContext>;
    isDenied(error: unknown): boolean;
}
const permission = { assets: 'assets.read', handover: 'handover.read', maintenance: 'maintenance.read', analytics: 'analytics.read', shifts: 'handover.records.manage' };
export class OperationalOverview {
    constructor(private readonly reads: Reads, private readonly locations: readonly Location[], private readonly timeZone: string, private readonly today: () => string) { }
    async context(actor: string) { const grants = await this.grants(actor); if (!Object.values(grants).some(Boolean) && !(await this.reads.allowed(actor, 'workforce.read')))
        throw new OverviewError('overview_denied'); return { locations: this.locations, timeZone: this.timeZone, today: this.today(), sources: Object.entries(grants).map(([source, allowed]) => ({ source: source as Source, coverage: allowed ? (source === 'analytics' && !this.reads.analytics || source === 'shifts' && !this.reads.shifts ? 'not-configured' as const : 'available' as const) : 'not-authorized' as const })) }; }
    async search(actor: string, input: SearchInput) {
        const query = selection(input, this.locations);
        await this.context(actor);
        const groups: Group[] = [];
        const areaItems = this.locations.filter(l => within(l.id, query.locationId, this.locations) && (!query.query || l.label.toLowerCase().includes(query.query.toLowerCase()))).map(l => ({ source: 'area' as const, id: l.id, title: l.label, summary: l.role, locationId: l.id, locationLabel: l.label, status: 'configured', date: '', assetId: '' }));
        groups.push({ source: 'areas', view: 'search', coverage: 'available', items: areaItems.slice(0, 25), total: areaItems.length, nextCursor: '', limit: 25 });
        const values = await Promise.all([this.group(actor, 'assets', () => this.reads.assets(actor, { search: query.query, locationId: query.locationId, cursor: query.cursors.assets }), 25), this.group(actor, 'handover', () => this.reads.handover(actor, { search: query.query, locationId: query.locationId, cursor: query.cursors.handover, date: '', pending: false }), 50), this.group(actor, 'maintenance', () => this.reads.maintenance(actor, { search: query.query, locationId: query.locationId, cursor: query.cursors.maintenance, date: '', pending: false }), 50)]);
        groups.push(...values);
        return { query: query.query, locationId: query.locationId, groups };
    }
    async area(actor: string, input: AreaInput): Promise<AreaResult> {
        const query = areaSelection(input, this.locations);
        await this.context(actor);
        const location = this.locations.find(l => l.id === query.locationId)!;
        const groups = await Promise.all([this.group(actor, 'handover', () => this.reads.handover(actor, { search: '', locationId: query.locationId, cursor: '', date: query.date, pending: true }), 50, 'pending'), this.group(actor, 'handover', () => this.reads.handover(actor, { search: '', locationId: query.locationId, cursor: '', date: query.date, pending: false }), 50, 'daily'), ...(['open', 'in-progress', 'blocked'] as const).map(status => this.group(actor, 'maintenance', () => this.reads.maintenance(actor, { search: '', locationId: query.locationId, cursor: '', date: query.date, pending: true, status }), 50, status)), this.group(actor, 'assets', () => this.reads.assets(actor, { search: '', locationId: query.locationId, cursor: '' }), 25, 'registry')]);
        const analyticsValue = await this.optional(actor, 'analytics', this.reads.analytics ? () => this.reads.analytics!(actor, query) : undefined, coverage => ({ coverage, from: query.date, toExclusive: nextDate(query.date), frequency: null, seconds: null, records: null, importDates: [], note: 'No analytical data is supplied for this source coverage.' }));
        const analytics = { ...analyticsValue, ...(analyticsValue.coverage !== 'available' || !analyticsValue.importDates.length ? { frequency: null, seconds: null, records: null } : {}) };
        const shiftsValue = await this.optional(actor, 'shifts', this.reads.shifts ? () => this.reads.shifts!(actor, query) : undefined, coverage => ({ coverage, options: [], current: null, previous: null, note: 'Calendar-day journal context is separate from actual Workforce shift intervals.' }));
        if (shiftsValue.options.length > 50 || !Number.isSafeInteger(shiftsValue.total ?? shiftsValue.options.length) || (shiftsValue.total ?? shiftsValue.options.length) < shiftsValue.options.length || (shiftsValue.nextCursor ?? '').length > 4000)
            throw new OverviewError('overview_unavailable');
        const shifts = { ...shiftsValue, total: shiftsValue.total ?? shiftsValue.options.length, nextCursor: shiftsValue.nextCursor ?? '', ...(shiftsValue.coverage !== 'available' ? { options: [], current: null, previous: null, total: 0, nextCursor: '' } : {}) };
        return { selection: query, location, groups, analytics, shifts, timeZone: this.timeZone };
    }
    private async canRead(actor: string, source: keyof typeof permission) { const profile = await this.reads.profile(actor); if (!['administrator', 'team-leader', 'task-force', 'technician'].includes(profile))
        throw new OverviewError('overview_denied'); if (profile === 'technician' && source !== 'handover')
        return false; return this.reads.allowed(actor, permission[source]); }
    private async grants(actor: string) { try {
        const keys = Object.keys(permission) as (keyof typeof permission)[];
        const values = await Promise.all(keys.map(key => this.canRead(actor, key)));
        return Object.fromEntries(keys.map((key, index) => [key, values[index]])) as Record<keyof typeof permission, boolean>;
    }
    catch (error) {
        if (error instanceof OverviewError)
            throw error;
        if (this.reads.isDenied(error))
            throw new OverviewError('overview_denied');
        throw new OverviewError('overview_unavailable');
    } }
    private async group(actor: string, source: 'assets' | 'handover' | 'maintenance', read: () => Promise<SourcePage>, limit: number, view = 'search'): Promise<Group> { try {
        if (!(await this.canRead(actor, source)))
            return { source, view, coverage: 'not-authorized', items: [], total: 0, nextCursor: '', limit };
        const result = await read();
        if (result.items.length > limit || !Number.isSafeInteger(result.total) || result.total < result.items.length || result.nextCursor.length > 4000)
            throw new Error('Source read exceeded its declared budget.');
        return { source, view, coverage: 'available', ...result, limit };
    }
    catch (error) {
        return { source, view, coverage: error instanceof OverviewError && error.code === 'overview_denied' || this.reads.isDenied(error) ? 'not-authorized' : 'unavailable', items: [], total: 0, nextCursor: '', limit };
    } }
    private async optional<T>(actor: string, source: 'analytics' | 'shifts', read: (() => Promise<T>) | undefined, empty: (coverage: Coverage) => T): Promise<T> { try {
        if (!(await this.canRead(actor, source)))
            return empty('not-authorized');
        if (!read)
            return empty('not-configured');
        return await read();
    }
    catch (error) {
        return empty(error instanceof OverviewError && error.code === 'overview_denied' || this.reads.isDenied(error) ? 'not-authorized' : 'unavailable');
    } }
}
