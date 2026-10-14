export class OverviewError extends Error {
    constructor(readonly code: 'invalid_overview' | 'overview_denied' | 'overview_unavailable') { super(code); }
}
export const sources = ['areas', 'assets', 'handover', 'maintenance', 'analytics', 'shifts'] as const;
export type Source = typeof sources[number];
export type Coverage = 'available' | 'not-authorized' | 'unavailable' | 'not-configured' | 'unmapped';
export interface Location {
    id: string;
    label: string;
    parentId: string;
    role: string;
}
export interface Card {
    source: 'assets' | 'handover' | 'maintenance' | 'area' | 'analytics' | 'shift';
    id: string;
    title: string;
    summary: string;
    locationId: string;
    locationLabel: string;
    status: string;
    date: string;
    assetId: string;
}
export interface Group {
    source: Source;
    view: string;
    coverage: Coverage;
    items: Card[];
    total: number;
    nextCursor: string;
    limit: number;
}
export interface SearchInput {
    query: string;
    locationId: string;
    cursors: {
        assets: string;
        handover: string;
        maintenance: string;
    };
}
export interface AreaInput {
    locationId: string;
    date: string;
    recordId: string;
    recordCursor?: string;
}
export interface Analytics {
    coverage: Coverage;
    from: string;
    toExclusive: string;
    frequency: number | null;
    seconds: number | null;
    records: number | null;
    importDates: string[];
    note: string;
}
export interface ShiftContext {
    coverage: Coverage;
    options: Card[];
    current: Card | null;
    previous: Card | null;
    note: string;
    total?: number;
    nextCursor?: string;
}
export interface AreaResult {
    selection: AreaInput;
    location: Location;
    groups: Group[];
    analytics: Analytics;
    shifts: ShiftContext;
    timeZone: string;
}
export function exact(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || Object.keys(value).some(k => !keys.includes(k)))
    throw new OverviewError('invalid_overview'); }
export function text(value: unknown, max: number, required = false): string { if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value) || (required && !value.trim()))
    throw new OverviewError('invalid_overview'); return value.trim(); }
export function identifier(value: unknown): string { const id = text(value, 100); if (id && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id))
    throw new OverviewError('invalid_overview'); return id; }
export function date(value: unknown): string { const result = text(value, 10, true); if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(Date.parse(result)).toISOString().slice(0, 10) !== result)
    throw new OverviewError('invalid_overview'); return result; }
export function nextDate(value: string): string { return new Date(Date.parse(value) + 86400000).toISOString().slice(0, 10); }
export function selection(input: SearchInput, locations: readonly Location[]): SearchInput { exact(input, ['query', 'locationId', 'cursors']); exact(input.cursors, ['assets', 'handover', 'maintenance']); const locationId = identifier(input.locationId); if (locationId && !locations.some(l => l.id === locationId))
    throw new OverviewError('invalid_overview'); return { query: text(input.query, 160), locationId, cursors: { assets: text(input.cursors.assets, 4000), handover: text(input.cursors.handover, 4000), maintenance: text(input.cursors.maintenance, 4000) } }; }
export function areaSelection(input: AreaInput, locations: readonly Location[]): AreaInput { exact(input, !(input && typeof input === 'object' && 'recordCursor' in input) ? ['locationId', 'date', 'recordId'] : ['locationId', 'date', 'recordId', 'recordCursor']); const locationId = identifier(input.locationId); if (!locationId || !locations.some(l => l.id === locationId))
    throw new OverviewError('invalid_overview'); return { locationId, date: date(input.date), recordId: identifier(input.recordId), ...(input.recordCursor === undefined ? {} : { recordCursor: text(input.recordCursor, 4000) }) }; }
export function ancestors(locationId: string, locations: readonly Location[]): Location[] { const result: Location[] = [], seen = new Set<string>(); let current = locations.find(l => l.id === locationId); while (current && !seen.has(current.id)) {
    result.push(current);
    seen.add(current.id);
    current = locations.find(l => l.id === current?.parentId);
} return result; }
export function within(locationId: string, parentId: string, locations: readonly Location[]): boolean { return !parentId || ancestors(locationId, locations).some(l => l.id === parentId); }
