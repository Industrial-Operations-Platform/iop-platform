import type { Assets } from "../../modules/assets/application/assets";
import type { AssetDomain } from "../../modules/assets/application/enrichment";
import { emptyEnrichment, stable, type AssetType, type EnrichmentData } from "../../modules/assets/domain/enrichment";
/** Explicit opt-in fiction; creates fresh identities only and preserves user edits. */
export async function seedSyntheticAssetDomain(registry: Assets, domain: AssetDomain, actor: string, options: {
  token: string;
  sourceId: string;
  locationId: string;
}) {
  if (!/^[0-9a-f-]{36}$/.test(options.token)) throw new Error("A frozen synthetic fixture token is required.");
  const prefix = "synthetic-209-" + options.token.slice(0, 8),
    nodes = [{
      key: "conveyor",
      contain: true,
      controller: false,
      survey: "validated" as const
    }, {
      key: "controller",
      contain: false,
      controller: true,
      survey: "validated" as const
    }, {
      key: "sensor",
      contain: false,
      controller: false,
      survey: "rejected" as const
    }, {
      key: "motor",
      contain: false,
      controller: false,
      survey: "pending" as const
    }];
  const types: AssetType[] = nodes.map(n => ({
    id: prefix + "-" + n.key,
    label: "Synthetic fixture " + n.key,
    active: true,
    canContain: n.contain,
    isController: n.controller,
    fields: n.key === "sensor" ? [{
      key: "voltage",
      label: "Fixture voltage",
      kind: "number",
      required: false,
      unit: "V"
    }] : []
  }));
  const context = await domain.catalog(actor);
  for (const type of types) {
    const previous = context.catalog.types.find(t => t.id === type.id);
    if (previous && stable(previous) !== stable(type)) throw new Error("Synthetic type changed; no existing type is overwritten.");
  }
  const missing = types.filter(t => !context.catalog.types.some(existing => existing.id === t.id));
  if (missing.length) await domain.configure(actor, {
    expectedRevision: context.catalog.revision,
    types: [...context.catalog.types, ...missing]
  });
  const assets = new Map<string, Awaited<ReturnType<Assets["save"]>>>();
  for (const n of nodes) {
    const code = "SYNTHETIC-209-" + options.token.slice(0, 8) + "-" + n.key.toUpperCase();
    const asset = await registry.save(actor, {
      key: prefix + "-" + n.key,
      id: "",
      expectedRevision: 0,
      note: "",
      content: {
        code,
        name: code,
        type: "Synthetic fixture " + n.key,
        locationId: options.locationId,
        status: "validated",
        validationNote: "Synthetic identity for demonstration only; no physical plant validation.",
        description: "IOP-209 opt-in synthetic fixture " + options.token,
        aliases: []
      }
    });
    if (asset.content.description !== "IOP-209 opt-in synthetic fixture " + options.token) throw new Error("Fixture identity differs; existing asset is not overwritten.");
    assets.set(n.key, asset);
  }
  for (const n of nodes) {
    const asset = assets.get(n.key)!;
    const data: EnrichmentData = {
      ...emptyEnrichment(),
      typeId: prefix + "-" + n.key,
      manufacturer: "Fictional Demo Manufacturer",
      model: "Synthetic " + n.key,
      serial: "FIXTURE-" + n.key,
      parentId: ["sensor", "motor"].includes(n.key) ? assets.get("conveyor")!.id : "",
      controllers: ["sensor", "motor"].includes(n.key) ? [{
        kind: "controlled-by",
        targetId: assets.get("controller")!.id,
        channel: n.key === "sensor" ? "DI-fixture" : "DO-fixture"
      }] : [],
      metadata: n.key === "sensor" ? {
        voltage: 24
      } : {},
      survey: {
        status: n.survey,
        note: n.survey === "pending" ? "Synthetic review remains pending." : n.survey === "validated" ? "Synthetic review accepted for demonstration; no real plant survey." : "Synthetic rejection demonstrates an evidence review failure.",
        evidenceReference: n.survey === "pending" ? "" : "IOP-209 synthetic fixture checklist"
      }
    };
    const existing = (await domain.detail(actor, asset.id)).enrichment;
    if (existing) {
      if (stable(existing.data) !== stable(data)) throw new Error("Synthetic model changed; user edits are preserved.");
      continue;
    }
    await domain.save(actor, {
      assetId: asset.id,
      expectedRevision: 0,
      reason: "Explicit opt-in synthetic demonstration model.",
      data
    });
  }
  const source = {
      sourceId: options.sourceId,
      namespace: "source-equipment" as const,
      area: "Synthetic asset model demonstration",
      code: "SYNTHETIC-209-" + options.token.slice(0, 8)
    },
    mapping = {
      source,
      status: "pending" as const,
      candidateIds: [assets.get("sensor")!.id, assets.get("motor")!.id],
      note: "Synthetic ambiguity example only; not a real imported sensor or approved plant association."
    };
  const prior = await domain.mappingForSource(actor, source);
  if (prior) {
    if (stable(prior.data) !== stable(mapping)) throw new Error("Synthetic mapping changed; user review is preserved.");
  } else await domain.saveMapping(actor, {
    id: prefix + "-mapping",
    expectedRevision: 0,
    reason: "Explicit synthetic mapping review exercise.",
    data: mapping
  });
  return {
    label: "Synthetic demonstration; no plant survey or production event claim.",
    assets: [...assets.values()].map(a => ({
      id: a.id,
      code: a.content.code
    })),
    mappingState: "ambiguous",
    types: types.map(t => t.id),
    writes: "Fresh synthetic identities and explicit fixture sidecars only."
  };
}
