import type { AddEvidence, ActionView, Catalog, Comparison, ComparisonPage, CompareAction, EvidencePage, History, IssueReference, Page, SaveAction, SaveComparison, Selection } from "../domain/models";
export interface Gateway {
  catalog(): Promise<Catalog>;
  query(input: Selection): Promise<Page>;
  save(input: SaveAction): Promise<ActionView>;
  issues(search: string, cursor?: string): Promise<{
    issues: IssueReference[];
    nextCursor: string;
  }>;
  history(id: string, before?: number): Promise<History>;
  evidence(id: string, cursor?: string): Promise<EvidencePage>;
  comparisons(id: string, cursor?: string): Promise<ComparisonPage>;
  addEvidence(input: AddEvidence): Promise<{
    action: ActionView;
    evidence: EvidencePage["evidence"][number];
  }>;
  compare(input: CompareAction): Promise<Comparison>;
  saveComparison(input: SaveComparison): Promise<{
    action: ActionView;
    saved: ComparisonPage["comparisons"][number];
  }>;
}
/** Browser use cases own request orchestration; React and HTTP remain replaceable adapters. */
export class ImprovementApplication {
  constructor(private readonly gateway: Gateway, private readonly ids: () => string) {}
  newId() {
    return this.ids();
  }
  catalog() {
    return this.gateway.catalog();
  }
  query(input: Selection) {
    return this.gateway.query(input);
  }
  save(input: SaveAction) {
    return this.gateway.save(input);
  }
  issues(search: string, cursor?: string) {
    return this.gateway.issues(search, cursor);
  }
  history(id: string, before?: number) {
    return this.gateway.history(id, before);
  }
  evidence(id: string, cursor?: string) {
    return this.gateway.evidence(id, cursor);
  }
  comparisons(id: string, cursor?: string) {
    return this.gateway.comparisons(id, cursor);
  }
  addEvidence(input: AddEvidence) {
    return this.gateway.addEvidence(input);
  }
  compare(input: CompareAction) {
    return this.gateway.compare(input);
  }
  saveComparison(input: SaveComparison) {
    return this.gateway.saveComparison(input);
  }
  async details(id: string) {
    const [history, evidence, comparisons] = await Promise.all([this.gateway.history(id), this.gateway.evidence(id), this.gateway.comparisons(id)]);
    return {
      history,
      evidence,
      comparisons
    };
  }
}
