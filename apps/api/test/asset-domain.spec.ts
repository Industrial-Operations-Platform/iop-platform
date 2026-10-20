import { domainFixture, enrichment, mappingInput, types } from "./asset-domain-fixture";
describe("Configurable asset model", () => {
  test("configures typed metadata and retains attributed survey evidence separately from registry lifecycle", async () => {
    const f = domainFixture(),
      schema = types();
    schema.find(t => t.id === "sensor")!.fields = [{
      key: "voltage",
      label: "Voltage",
      kind: "number",
      required: false,
      unit: "V"
    }];
    await f.app.configure("admin", {
      expectedRevision: 0,
      types: schema
    });
    const record = await f.app.save("admin", {
      ...enrichment("sensor", "sensor"),
      data: {
        ...enrichment("sensor", "sensor").data,
        manufacturer: "Fictional Maker",
        model: "Model A",
        serial: "000123",
        metadata: {
          voltage: 24
        },
        survey: {
          status: "validated",
          note: "Synthetic checklist reviewed.",
          evidenceReference: "Synthetic checklist 1"
        }
      }
    });
    expect(record).toMatchObject({
      surveyReviewerId: "admin",
      revision: 1,
      data: {
        serial: "000123",
        metadata: {
          voltage: 24
        }
      }
    });
    expect((await f.app.detail("leader", "sensor")).asset.status).toBe("validated");
    expect(f.revisions).toHaveLength(1);
    await expect(f.app.configure("admin", {
      expectedRevision: 1,
      types: types()
    })).rejects.toThrow("invalid_asset_domain");
    expect(() => f.app.save("admin", {
      ...enrichment("sensor", "sensor"),
      data: {
        ...enrichment("sensor", "sensor").data,
        survey: {
          status: "rejected",
          note: "Missing evidence",
          evidenceReference: ""
        }
      }
    })).toThrow();
  });
  test("composition cycles, self references and non-controller targets are rejected; controller links remain separate", async () => {
    const f = domainFixture();
    await f.app.save("admin", enrichment("conveyor", "conveyor"));
    await f.app.save("admin", enrichment("second", "conveyor"));
    await f.app.save("admin", enrichment("controller", "controller"));
    await f.app.save("admin", {
      ...enrichment("sensor", "sensor"),
      data: {
        ...enrichment("sensor", "sensor").data,
        parentId: "conveyor",
        controllers: [{
          kind: "controlled-by",
          targetId: "controller",
          channel: "DI-1"
        }]
      }
    });
    await f.app.save("admin", {
      ...enrichment("conveyor", "conveyor"),
      expectedRevision: 1,
      data: {
        ...enrichment("conveyor", "conveyor").data,
        parentId: "second"
      }
    });
    await expect(f.app.save("admin", {
      ...enrichment("second", "conveyor"),
      expectedRevision: 1,
      data: {
        ...enrichment("second", "conveyor").data,
        parentId: "conveyor"
      }
    })).rejects.toThrow("asset_domain_cycle");
    await expect(f.app.save("admin", {
      ...enrichment("controller", "sensor"),
      expectedRevision: 1
    })).rejects.toThrow("asset_domain_conflict");
    await expect(f.app.save("admin", {
      ...enrichment("sensor", "sensor"),
      expectedRevision: 1,
      data: {
        ...enrichment("sensor", "sensor").data,
        controllers: [{
          kind: "controlled-by",
          targetId: "second",
          channel: ""
        }]
      }
    })).rejects.toThrow();
  });
  test("stale writes, foreign references, forged attribution and Technician access fail", async () => {
    const f = domainFixture();
    await f.app.save("admin", enrichment("sensor"));
    await expect(f.app.save("admin", enrichment("sensor"))).rejects.toThrow("asset_domain_conflict");
    await expect(f.app.detail("leader", "foreign")).rejects.toThrow("asset_domain_missing");
    await expect(f.app.catalog("tech")).rejects.toThrow("asset_domain_denied");
    expect(() => f.app.save("admin", {
      ...enrichment("sensor"),
      actorId: "forged"
    } as never)).toThrow();
  });
});
describe("Reviewed source mappings", () => {
  test("ambiguity is explicit; approval requires one validated identity and source tuples cannot move", async () => {
    const f = domainFixture();
    await f.app.saveMapping("admin", mappingInput);
    expect(f.applied[0][0].state).toBe("ambiguous");
    await f.app.saveMapping("admin", {
      ...mappingInput,
      expectedRevision: 1,
      data: {
        ...mappingInput.data,
        status: "approved",
        candidateIds: ["sensor"]
      }
    });
    expect(f.applied[1][0]).toMatchObject({
      state: "mapped",
      assetId: "sensor",
      revision: 2
    });
    await expect(f.app.saveMapping("admin", {
      ...mappingInput,
      expectedRevision: 2,
      data: {
        ...mappingInput.data,
        source: {
          ...mappingInput.data.source,
          area: "different"
        }
      }
    })).rejects.toThrow();
    await expect(f.app.saveMapping("admin", {
      ...mappingInput,
      id: "another",
      data: {
        ...mappingInput.data,
        status: "approved",
        candidateIds: ["unverified"]
      }
    })).rejects.toThrow();
    expect(f.mappingRevisions).toHaveLength(2);
  });
  test("a failed source projection rolls back the reviewed decision/history", async () => {
    const f = domainFixture();
    f.setFailure(true);
    await expect(f.app.saveMapping("admin", mappingInput)).rejects.toThrow("Synthetic projection failure");
    expect(f.mappings.size).toBe(0);
    expect(f.mappingRevisions).toHaveLength(0);
  });
  test("bounded directory queries reject implicit scope/unsupported controls", async () => {
    const f = domainFixture();
    expect((await f.app.references("leader", {
      limit: 2
    })).assets).toHaveLength(2);
    expect(() => f.app.references("leader", {
      siteId: "foreign"
    } as never)).toThrow();
    expect(() => f.app.mappingQuery("leader", {
      limit: 1001
    })).toThrow();
    expect(() => f.app.pareto("leader", {
      from: "2026-10-14",
      toExclusive: "2026-10-14",
      metric: "frequency"
    })).toThrow();
  });
});
