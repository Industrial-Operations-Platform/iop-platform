import { assert, exact, identifier, text, revision, validateData, transition, selection, comparisonSelection, descendants, stable, assess, type Action, type ActionData, type ActionView, type AssetReference, type IssueReference, type Person, type Location, type Revision, type Evidence, type SavedComparison, type Selection, type Page, type ComparisonSelection, type Measurement } from "../domain/improvement";
export interface Transaction {
  canContribute: boolean;
  canCoordinate: boolean;
  people(): Promise<Person[]>;
  names(ids: string[]): Promise<Map<string, string>>;
  assets(): Promise<AssetReference[]>;
  asset(id: string): Promise<AssetReference | null>;
  issues(search: string, cursor: string): Promise<{
    issues: IssueReference[];
    nextCursor: string;
  }>;
  issue(id: string): Promise<IssueReference | null>;
  get(id: string): Promise<Action | null>;
  creation(id: string): Promise<Revision | null>;
  save(action: Action, revision: Revision): Promise<void>;
  query(selection: Selection, locations: string[]): Promise<Omit<Page, "actions"> & {
    actions: Action[];
  }>;
  history(id: string, before: number, limit: number): Promise<{
    revisions: Revision[];
    nextBefore: number;
  }>;
  evidence(id: string): Promise<Evidence | null>;
  correctionExists(id: string): Promise<boolean>;
  addEvidence(evidence: Evidence): Promise<void>;
  evidencePage(id: string, cursor: string, limit: number): Promise<{
    evidence: Evidence[];
    nextCursor: string;
  }>;
  comparison(id: string): Promise<SavedComparison | null>;
  addComparison(comparison: SavedComparison): Promise<void>;
  comparisonPage(id: string, cursor: string, limit: number): Promise<{
    comparisons: SavedComparison[];
    nextCursor: string;
  }>;
  measure(selection: ComparisonSelection, asset: AssetReference | null): Promise<Measurement>;
}
export interface Store {
  run<T>(actor: string, permission: "improvement.read" | "improvement.contribute", work: (tx: Transaction) => Promise<T>): Promise<T>;
}
export interface SaveAction {
  id: string;
  expectedRevision: number;
  reason: string;
  data: ActionData;
}
export interface AddEvidence {
  id: string;
  actionId: string;
  expectedRevision: number;
  kind: "note" | "result";
  note: string;
  externalReference: string;
  supersedesId: string;
}
export interface CompareAction {
  actionId: string;
  expectedRevision: number;
  selection: ComparisonSelection;
}
export interface SaveComparison extends CompareAction {
  id: string;
  note: string;
}
export class Improvements {
  constructor(private readonly store: Store, private readonly locations: Location[], private readonly now: () => string) {}
  private view(action: Action, actor: string, tx: Transaction): ActionView {
    return {
      ...action,
      canCoordinate: tx.canCoordinate,
      canEdit: tx.canContribute && (tx.canCoordinate || action.authorId === actor || action.data.ownerId === actor)
    };
  }
  private async named(tx: Transaction, action: Action) {
    const names = await tx.names([action.authorId, action.data.ownerId].filter(Boolean));
    return {
      ...action,
      authorName: names.get(action.authorId) ?? action.authorName,
      ownerName: names.get(action.data.ownerId) ?? action.ownerName
    };
  }
  catalog(actor: string) {
    return this.store.run(actor, "improvement.read", async tx => ({
      actorId: actor,
      canContribute: tx.canContribute,
      canCoordinate: tx.canCoordinate,
      people: await tx.people(),
      locations: this.locations,
      assets: (await tx.assets()).map(({
        aliases,
        ...asset
      }) => asset)
    }));
  }
  issues(actor: string, input: {
    search?: string;
    cursor?: string;
  }) {
    assert(input && typeof input === "object" && !Array.isArray(input));
    assert(Object.keys(input).every(k => ["search", "cursor"].includes(k)));
    text(input.search ?? "", 200);
    text(input.cursor ?? "", 220);
    return this.store.run(actor, "improvement.read", tx => tx.issues(input.search ?? "", input.cursor ?? ""));
  }
  query(actor: string, input: Selection) {
    selection(input);
    const request = structuredClone(input);
    if (request.locationId) assert(this.locations.some(l => l.id === request.locationId));
    return this.store.run(actor, "improvement.read", async tx => {
      const page = await tx.query(request, request.locationId ? descendants(this.locations, request.locationId) : []);
      const names = await tx.names(page.actions.flatMap(a => [a.authorId, a.data.ownerId]).filter(Boolean));
      const actions = page.actions.map(a => this.view({
        ...a,
        authorName: names.get(a.authorId) ?? a.authorName,
        ownerName: names.get(a.data.ownerId) ?? a.ownerName
      }, actor, tx));
      return {
        ...page,
        actions
      };
    });
  }
  save(actor: string, input: SaveAction) {
    exact(input, ["id", "expectedRevision", "reason", "data"]);
    identifier(input.id);
    revision(input.expectedRevision);
    text(input.reason, 2000);
    validateData(input.data);
    const request = structuredClone(input);
    return this.store.run(actor, "improvement.contribute", async tx => {
      const before = await tx.get(request.id);
      if (before && request.expectedRevision === 0) {
        const original = await tx.creation(request.id);
        assert(original?.action.authorId === actor && stable(original.action.data) === stable(request.data) && original.reason === request.reason, "improvement_conflict");
        return this.view(await this.named(tx, before), actor, tx);
      }
      assert((before?.revision ?? 0) === request.expectedRevision, "improvement_conflict");
      if (before) {
        assert(this.view(before, actor, tx).canEdit, "improvement_denied");
        text(request.reason, 2000, true);
        transition(before.data.status, request.data.status, request.reason);
      } else assert(request.data.status === "planned");
      assert(tx.canCoordinate || request.data.ownerId === (before?.data.ownerId ?? ""), "improvement_denied");
      const people = await tx.people();
      const author = people.find(p => p.id === actor);
      assert(author, "improvement_denied");
      const owner = people.find(p => p.id === request.data.ownerId);
      assert(!request.data.ownerId || owner || before?.data.ownerId === request.data.ownerId, "improvement_denied");
      const location = this.locations.find(l => l.id === request.data.locationId);
      assert(location);
      const asset = request.data.assetId ? await tx.asset(request.data.assetId) : null;
      const issue = request.data.issueId ? await tx.issue(request.data.issueId) : null;
      if (request.data.assetId && before?.data.assetId !== request.data.assetId) assert(asset && asset.status !== "retired");
      if (request.data.issueId && before?.data.issueId !== request.data.issueId) assert(issue, "improvement_missing");
      const at = this.now();
      const action: Action = {
        id: request.id,
        revision: request.expectedRevision + 1,
        data: request.data,
        authorId: before?.authorId ?? actor,
        authorName: before?.authorName ?? author.name,
        ownerName: request.data.ownerId ? owner?.name ?? before?.ownerName ?? "" : "",
        assetName: request.data.assetId ? asset?.name ?? before?.assetName ?? "" : "",
        issueTitle: request.data.issueId ? issue?.title ?? before?.issueTitle ?? "" : "",
        locationLabel: location.label,
        createdAt: before?.createdAt ?? at,
        updatedAt: at,
        evidenceCount: before?.evidenceCount ?? 0,
        comparisonCount: before?.comparisonCount ?? 0
      };
      await tx.save(action, {
        action,
        actorId: actor,
        actorName: author.name,
        at,
        change: !before ? "created" : before.data.status === action.data.status ? "updated" : "status-changed",
        reason: request.reason,
        referenceId: ""
      });
      return this.view(await this.named(tx, action), actor, tx);
    });
  }
  history(actor: string, id: string, before = 0, limit = 30) {
    identifier(id);
    revision(before);
    assert(Number.isSafeInteger(limit) && limit >= 1 && limit <= 100);
    return this.store.run(actor, "improvement.read", async tx => {
      const action = await tx.get(id);
      assert(action, "improvement_missing");
      return {
        action: this.view(await this.named(tx, action), actor, tx),
        ...(await tx.history(id, before, limit))
      };
    });
  }
  private async editable(tx: Transaction, actor: string, id: string, expected: number) {
    const action = await tx.get(id);
    assert(action, "improvement_missing");
    assert(action.revision === expected, "improvement_conflict");
    assert(this.view(action, actor, tx).canEdit, "improvement_denied");
    return action;
  }
  private async attribution(tx: Transaction, actor: string) {
    const name = (await tx.names([actor])).get(actor);
    assert(name, "improvement_denied");
    return name;
  }
  addEvidence(actor: string, input: AddEvidence) {
    exact(input, ["id", "actionId", "expectedRevision", "kind", "note", "externalReference", "supersedesId"]);
    identifier(input.id);
    identifier(input.actionId);
    revision(input.expectedRevision, false);
    identifier(input.supersedesId, true);
    assert(input.kind === "note" || input.kind === "result");
    text(input.note, 8000, true);
    text(input.externalReference, 400);
    const request = structuredClone(input);
    return this.store.run(actor, "improvement.contribute", async tx => {
      const prior = await tx.evidence(request.id);
      if (prior) {
        assert(prior.actionId === request.actionId && prior.actorId === actor && prior.kind === request.kind && prior.note === request.note && prior.externalReference === request.externalReference && prior.supersedesId === request.supersedesId, "improvement_conflict");
        const action = await tx.get(request.actionId);
        assert(action, "improvement_missing");
        return {
          action: this.view(action, actor, tx),
          evidence: prior
        };
      }
      const action = await this.editable(tx, actor, request.actionId, request.expectedRevision);
      assert(action.evidenceCount < 10000, "improvement_capacity");
      if (request.supersedesId) {
        const previous = await tx.evidence(request.supersedesId);
        assert(previous?.actionId === action.id, "improvement_missing");
        assert(!(await tx.correctionExists(previous.id)), "improvement_conflict");
      }
      const at = this.now(),
        actorName = await this.attribution(tx, actor);
      const next = {
        ...action,
        revision: action.revision + 1,
        updatedAt: at,
        evidenceCount: action.evidenceCount + 1
      };
      const evidence: Evidence = {
        id: request.id,
        actionId: action.id,
        actionRevision: next.revision,
        kind: request.kind,
        note: request.note,
        externalReference: request.externalReference,
        supersedesId: request.supersedesId,
        actorId: actor,
        actorName,
        at
      };
      await tx.addEvidence(evidence);
      await tx.save(next, {
        action: next,
        actorId: actor,
        actorName,
        at,
        change: "evidence-added",
        reason: request.supersedesId ? "Evidence correction added." : "Evidence added.",
        referenceId: evidence.id
      });
      return {
        action: this.view(next, actor, tx),
        evidence
      };
    });
  }
  evidence(actor: string, id: string, cursor = "", limit = 30) {
    return this.collection(actor, id, cursor, limit, tx => tx.evidencePage(id, cursor, limit));
  }
  comparisons(actor: string, id: string, cursor = "", limit = 30) {
    return this.collection(actor, id, cursor, limit, tx => tx.comparisonPage(id, cursor, limit));
  }
  private collection<T>(actor: string, id: string, cursor: string, limit: number, work: (tx: Transaction) => Promise<T>) {
    identifier(id);
    text(cursor, 220);
    assert(Number.isSafeInteger(limit) && limit >= 1 && limit <= 100);
    return this.store.run(actor, "improvement.read", async tx => {
      assert(await tx.get(id), "improvement_missing");
      return work(tx);
    });
  }
  private validateCompare(input: CompareAction) {
    identifier(input.actionId);
    revision(input.expectedRevision, false);
    comparisonSelection(input.selection);
  }
  private async comparisonWithin(tx: Transaction, action: Action, selection: ComparisonSelection) {
    const asset = selection.scope === "asset" && action.data.assetId ? await tx.asset(action.data.assetId) : null;
    assert(selection.scope !== "asset" || asset, "improvement_missing");
    return assess(await tx.measure(selection, asset), action.data.target);
  }
  compare(actor: string, input: CompareAction) {
    exact(input, ["actionId", "expectedRevision", "selection"]);
    this.validateCompare(input);
    const request = structuredClone(input);
    return this.store.run(actor, "improvement.read", async tx => {
      const action = await tx.get(request.actionId);
      assert(action, "improvement_missing");
      assert(action.revision === request.expectedRevision, "improvement_conflict");
      return this.comparisonWithin(tx, action, request.selection);
    });
  }
  saveComparison(actor: string, input: SaveComparison) {
    exact(input, ["id", "actionId", "expectedRevision", "selection", "note"]);
    identifier(input.id);
    this.validateCompare(input);
    text(input.note, 2000);
    const request = structuredClone(input);
    return this.store.run(actor, "improvement.contribute", async tx => {
      const prior = await tx.comparison(request.id);
      if (prior) {
        assert(prior.actionId === request.actionId && prior.actorId === actor && prior.note === request.note && stable(prior.comparison.selection) === stable(request.selection), "improvement_conflict");
        const action = await tx.get(request.actionId);
        assert(action, "improvement_missing");
        return {
          action: this.view(action, actor, tx),
          saved: prior
        };
      }
      const action = await this.editable(tx, actor, request.actionId, request.expectedRevision);
      assert(action.comparisonCount < 1000, "improvement_capacity");
      const comparison = await this.comparisonWithin(tx, action, request.selection),
        at = this.now(),
        actorName = await this.attribution(tx, actor);
      const next = {
        ...action,
        revision: action.revision + 1,
        updatedAt: at,
        comparisonCount: action.comparisonCount + 1
      };
      const saved: SavedComparison = {
        id: request.id,
        actionId: action.id,
        actionRevision: next.revision,
        actorId: actor,
        actorName,
        at,
        note: request.note,
        comparison
      };
      await tx.addComparison(saved);
      await tx.save(next, {
        action: next,
        actorId: actor,
        actorName,
        at,
        change: "comparison-saved",
        reason: request.note || "Observed comparison saved.",
        referenceId: saved.id
      });
      return {
        action: this.view(next, actor, tx),
        saved
      };
    });
  }
}
