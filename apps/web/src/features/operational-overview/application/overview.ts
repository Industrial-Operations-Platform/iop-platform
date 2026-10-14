import type { Context, SearchInput, SearchResult, AreaInput, AreaResult } from '../domain/models';
export interface Gateway {
    context(): Promise<Context>;
    search(input: SearchInput): Promise<SearchResult>;
    area(input: AreaInput): Promise<AreaResult>;
}
export class OperationalOverviewApplication {
    constructor(private readonly gateway: Gateway) { }
    context() { return this.gateway.context(); }
    search(input: SearchInput) { return this.gateway.search(input); }
    area(input: AreaInput) { return this.gateway.area(input); }
}
