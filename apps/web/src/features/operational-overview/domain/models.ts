export type Source = 'areas' | 'assets' | 'handover' | 'maintenance' | 'analytics' | 'shifts';
export type Coverage = 'available' | 'not-authorized' | 'unavailable' | 'not-configured' | 'unmapped';
export interface Location {
    id: string;
    label: string;
    parentId: string;
    role: string;
}
export interface Target {
    source: 'assets' | 'handover' | 'maintenance' | 'area' | 'analytics' | 'shift';
    id: string;
    locationId: string;
}
export interface Card extends Target {
    title: string;
    summary: string;
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
export interface Context {
    locations: Location[];
    timeZone: string;
    today: string;
    sources: {
        source: Source;
        coverage: Coverage;
    }[];
}
export interface Cursors {
    assets: string;
    handover: string;
    maintenance: string;
}
export interface SearchInput {
    query: string;
    locationId: string;
    cursors: Cursors;
}
export interface SearchResult {
    query: string;
    locationId: string;
    groups: Group[];
}
export interface AreaInput {
    locationId: string;
    date: string;
    recordId: string;
    recordCursor?: string;
}
export interface AreaResult {
    selection: AreaInput;
    location: Location;
    groups: Group[];
    analytics: {
        coverage: Coverage;
        from: string;
        toExclusive: string;
        frequency: number | null;
        seconds: number | null;
        records: number | null;
        importDates: string[];
        note: string;
    };
    shifts: {
        coverage: Coverage;
        options: Card[];
        current: Card | null;
        previous: Card | null;
        note: string;
        total?: number;
        nextCursor?: string;
    };
    timeZone: string;
}
export const emptyCursors = (): Cursors => ({ assets: '', handover: '', maintenance: '' });
export function navigation(card: Card): Target { return { source: card.source, id: card.id, locationId: card.locationId }; }
export function descendants(locationId: string, locations: Location[]): Location[] { return locations.filter(l => { const seen = new Set<string>(); let id = l.id; while (id && !seen.has(id)) {
    if (id === locationId)
        return true;
    seen.add(id);
    id = locations.find(v => v.id === id)?.parentId ?? '';
} return !locationId; }); }
