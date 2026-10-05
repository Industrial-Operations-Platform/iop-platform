import {
  AssetError,
  exact,
  identifier,
  prose,
  validContent,
  validSelection,
  validTimeline,
  timelineCursor,
  compareTimeline,
  encodeCursor,
  type Asset,
  type AssetContent,
  type AssetRevision,
  type AssetSelection,
  type AssetPage,
  type AssetHistory,
  type Location,
  type TimelinePage,
  type TimelineSelection,
  type SourceQuery,
  type SourceResult,
  type TimelineKind,
  type TimelineCoverage,
} from "../domain/assets";
export interface Transaction {
  canManage: boolean;
  name(actor: string): Promise<string>;
  get(id: string): Promise<Asset | null>;
  prior(key: string): Promise<{ fingerprint: string; asset: Asset } | null>;
  save(
    asset: Asset,
    revision: AssetRevision,
    request?: { key: string; fingerprint: string },
  ): Promise<void>;
  list(selection: AssetSelection): Promise<AssetPage>;
  history(asset: Asset, before: number): Promise<AssetHistory>;
  sources(
    asset: Asset,
    query: SourceQuery,
  ): Promise<
    {
      kind: TimelineKind;
      result?: SourceResult;
      status: TimelineCoverage["status"];
    }[]
  >;
}
export interface Store {
  run<T>(
    actor: string,
    permission: "assets.read" | "assets.manage",
    work: (tx: Transaction) => Promise<T>,
  ): Promise<T>;
}
export interface SaveAsset {
  key: string;
  id: string;
  expectedRevision: number;
  note: string;
  content: AssetContent;
}
export class Assets {
  constructor(
    private readonly store: Store,
    private readonly locations: Location[],
    private readonly timeZone: string,
    private readonly ids: () => string,
    private readonly now: () => string,
  ) {}
  context(actor: string) {
    return this.store.run(actor, "assets.read", async (tx) => ({
      actorId: actor,
      canManage: tx.canManage,
      locations: this.locations,
      timeZone: this.timeZone,
    }));
  }
  query(actor: string, input: AssetSelection): Promise<AssetPage> {
    const selection = validSelection(input);
    return this.store.run(actor, "assets.read", (tx) => tx.list(selection));
  }
  detail(actor: string, id: string) {
    identifier(id, true);
    return this.store.run(actor, "assets.read", (tx) => this.existing(tx, id));
  }
  async save(actor: string, input: SaveAsset): Promise<Asset> {
    exact(input, ["key", "id", "expectedRevision", "note", "content"]);
    const id = identifier(input.id),
      key = identifier(input.key, !id),
      note = prose(input.note, 2000, !!id),
      content = validContent(input.content, this.locations);
    if (
      !Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 0 ||
      (!id && input.expectedRevision !== 0) ||
      (id && key)
    )
      throw new AssetError("invalid_asset");
    const fingerprint = JSON.stringify({ content, note });
    return this.store.run(actor, "assets.manage", async (tx) => {
      if (!tx.canManage) throw new AssetError("asset_denied");
      if (!id) {
        const prior = await tx.prior(key);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new AssetError("asset_conflict");
          return prior.asset;
        }
      }
      const existing = id ? await this.existing(tx, id) : null;
      if (existing && existing.revision !== input.expectedRevision)
        throw new AssetError("asset_conflict");
      const at = this.now(),
        actorName = await tx.name(actor);
      const asset: Asset = {
        id: existing?.id ?? this.ids(),
        revision: (existing?.revision ?? 0) + 1,
        authorId: existing?.authorId ?? actor,
        authorName: existing?.authorName ?? actorName,
        createdAt: existing?.createdAt ?? at,
        updatedAt: at,
        content,
      };
      await tx.save(
        asset,
        {
          asset,
          actorId: actor,
          actorName,
          action: existing ? "updated" : "created",
          note,
          at,
        },
        existing ? undefined : { key, fingerprint },
      );
      return asset;
    });
  }
  history(actor: string, id: string, before: number): Promise<AssetHistory> {
    identifier(id, true);
    if (!Number.isSafeInteger(before) || before < 0)
      throw new AssetError("invalid_asset");
    return this.store.run(actor, "assets.read", async (tx) =>
      tx.history(await this.existing(tx, id), before),
    );
  }
  async timeline(
    actor: string,
    input: TimelineSelection,
  ): Promise<TimelinePage> {
    const selection = validTimeline(input);
    return this.store.run(actor, "assets.read", async (tx) => {
      const asset = await this.existing(tx, selection.id),
        cursor = timelineCursor(selection.cursor, asset, selection);
      const sources = await tx.sources(asset, {
        from: selection.from,
        to: selection.to,
        cursor,
        limit: 26,
        timeZone: this.timeZone,
      });
      const coverage = sources.map((source) => ({
        kind: source.kind,
        status: source.status,
        total: source.result?.total ?? 0,
      }));
      const matches = sources
        .filter((source) => !selection.kind || selection.kind === source.kind)
        .flatMap((source) => source.result?.records ?? [])
        .sort(compareTimeline);
      const records = matches.slice(0, 25),
        last = records.at(-1);
      return {
        asset,
        records,
        sources: coverage,
        total: coverage
          .filter((source) => !selection.kind || selection.kind === source.kind)
          .reduce((sum, source) => sum + source.total, 0),
        nextCursor:
          matches.length > 25 && last
            ? encodeCursor({
                v: 1,
                assetId: asset.id,
                revision: asset.revision,
                from: selection.from,
                to: selection.to,
                sourceKind: selection.kind ?? "",
                date: last.date,
                recordedAt: last.recordedAt,
                kind: last.kind,
                id: last.id,
              })
            : "",
      };
    });
  }
  private async existing(tx: Transaction, id: string): Promise<Asset> {
    const asset = await tx.get(id);
    if (!asset) throw new AssetError("asset_missing");
    return asset;
  }
}
