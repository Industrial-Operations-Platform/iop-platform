import {
  AssetError,
  exact,
  text,
  identifier,
  prose,
  validContent,
  validSelection,
  validTimeline,
  timelineCursor,
  compareTimeline,
  encodeCursor,
  aliasKey,
  readableContent,
  validEquipmentSelection,
  cursorValue,
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
  type EquipmentCandidate,
  type EquipmentSelection,
  type EquipmentPage,
} from "../domain/assets";
export interface Transaction {
  canManage: boolean;
  equipment(selection?: {
    code: string;
    search: string;
  }): Promise<EquipmentCandidate[]>;
  name(actor: string): Promise<string>;
  get(id: string): Promise<Asset | null>;
  prior(key: string): Promise<{ fingerprint: string; asset: Asset } | null>;
  save(
    asset: Asset,
    revision: AssetRevision,
    request?: { key: string; fingerprint: string },
  ): Promise<void>;
  list(selection: AssetSelection, locationIds: string[]): Promise<AssetPage>;
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
    return this.store.run(actor, "assets.read", async (tx) => {
      const result = await tx.list(
        selection,
        this.locationIds(selection.locationId),
      );
      return {
        ...result,
        assets: result.assets.map((asset) => ({
          ...asset,
          content: readableContent(asset.content),
        })),
      };
    });
  }
  equipmentCatalog(
    actor: string,
    input: EquipmentSelection,
  ): Promise<EquipmentPage> {
    const selection = validEquipmentSelection(input);
    if (
      selection.locationId &&
      !this.locations.some((location) => location.id === selection.locationId)
    )
      throw new AssetError("invalid_asset");
    return this.store.run(actor, "assets.read", async (tx) => {
      const catalog = await tx.equipment({
        code: selection.code,
        search: selection.search,
      });
      const locationIds = new Set(this.locationIds(selection.locationId));
      const base = catalog.filter(
        (candidate) =>
          (!selection.locationId ||
            locationIds.has(candidate.areaId || candidate.departmentId)) &&
          (!selection.code || candidate.code === selection.code) &&
          (!selection.search ||
            candidate.code
              .toLowerCase()
              .includes(selection.search.toLowerCase())),
      );
      const unique = (values: string[]) =>
        [...new Set(values.filter(Boolean))].sort();
      const sources = unique(base.map((candidate) => candidate.sourceId));
      const source = base.filter(
        (candidate) =>
          !selection.sourceId || candidate.sourceId === selection.sourceId,
      );
      const sectors = unique(source.map((candidate) => candidate.sector));
      const sector = source.filter(
        (candidate) =>
          !selection.sector || candidate.sector === selection.sector,
      );
      const areas = unique(sector.map((candidate) => candidate.area));
      const key = (candidate: EquipmentCandidate) =>
        JSON.stringify([
          candidate.code,
          candidate.namespace,
          candidate.sourceId,
          candidate.sector,
          candidate.area,
          candidate.departmentId,
          candidate.areaId,
        ]);
      const candidates = sector
        .filter(
          (candidate) => !selection.area || candidate.area === selection.area,
        )
        .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
      const context = { ...selection, cursor: "" };
      let after = "";
      if (selection.cursor) {
        const cursor = cursorValue(selection.cursor);
        exact(cursor, ["v", "selection", "after"]);
        if (
          cursor.v !== 1 ||
          JSON.stringify(cursor.selection) !== JSON.stringify(context)
        )
          throw new AssetError("invalid_asset");
        after = text(cursor.after, 2000, true);
      }
      const page = candidates
        .filter((candidate) => !after || key(candidate) > after)
        .slice(0, 51);
      return {
        sources,
        sectors,
        areas,
        total: candidates.length,
        candidates: page.slice(0, 50),
        nextCursor:
          page.length > 50
            ? encodeCursor({ v: 1, selection: context, after: key(page[49]) })
            : "",
      };
    });
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
          const legacyContent = { ...content, name: input.content.name };
          if (input.content.locationDetails === undefined)
            delete legacyContent.locationDetails;
          const legacyFingerprint = JSON.stringify({
            content: legacyContent,
            note,
          });
          if (
            prior.fingerprint !== fingerprint &&
            prior.fingerprint !== legacyFingerprint
          )
            throw new AssetError("asset_conflict");
          return {
            ...prior.asset,
            content: readableContent(prior.asset.content),
          };
        }
      }
      const existing = id ? await this.existing(tx, id) : null;
      if (existing && existing.revision !== input.expectedRevision)
        throw new AssetError("asset_conflict");
      const changed = content.aliases.filter(
        (alias) =>
          ["analytics", "site-equipment"].includes(alias.namespace) &&
          (!existing ||
            existing.content.code !== content.code ||
            !existing.content.aliases.some(
              (previous) => aliasKey(previous) === aliasKey(alias),
            )),
      );
      if (changed.some((alias) => alias.code !== content.code))
        throw new AssetError("invalid_asset");
      const analytical = changed.filter(
        (alias) => alias.namespace === "analytics",
      );
      if (analytical.length) {
        const candidates = await tx.equipment({
          code: content.code,
          search: "",
        });
        for (const alias of analytical)
          if (
            !candidates.some(
              (candidate) =>
                candidate.namespace === "analytics" &&
                candidate.sourceId === alias.sourceId &&
                candidate.code === alias.code &&
                candidate.sector === alias.sector &&
                candidate.area === alias.area,
            )
          )
            throw new AssetError("invalid_asset");
      }
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
    return { ...asset, content: readableContent(asset.content) };
  }
  private locationIds(root: string): string[] {
    if (!root) return [];
    const ids = new Set([root]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const location of this.locations)
        if (ids.has(location.parentId) && !ids.has(location.id)) {
          ids.add(location.id);
          changed = true;
        }
    }
    return [...ids];
  }
}
