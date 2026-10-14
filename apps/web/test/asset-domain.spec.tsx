import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssetDomainApplication, type Gateway } from "../src/features/assets-domain/application/domain";
import { AssetDomainWorkspace } from "../src/features/assets-domain/adapters/react/AssetDomainWorkspace";
import { emptyEnrichment, type AssetType, type Context, type Detail, type Enrichment, type Mapping, type ReferencePage } from "../src/features/assets-domain/domain/models";
const types: AssetType[] = [{
  id: "generic",
  label: "Generic asset",
  active: true,
  canContain: true,
  isController: false,
  fields: []
}, {
  id: "sensor",
  label: "Sensor",
  active: true,
  canContain: false,
  isController: false,
  fields: [{
    key: "voltage",
    label: "Voltage",
    kind: "number",
    required: false,
    unit: "V"
  }]
}, {
  id: "controller",
  label: "Controller",
  active: true,
  canContain: false,
  isController: true,
  fields: []
}];
const context: Context = {
  canManage: true,
  sourceId: "source",
  catalog: {
    revision: 1,
    types
  }
};
const refs: ReferencePage = {
  assets: [{
    id: "sensor",
    code: "SENSOR-001",
    name: "SENSOR-001",
    status: "validated"
  }, {
    id: "parent",
    code: "CONVEYOR-001",
    name: "CONVEYOR-001",
    status: "validated"
  }, {
    id: "controller",
    code: "PLC-001",
    name: "PLC-001",
    status: "validated"
  }],
  enrichments: [{
    assetId: "sensor",
    revision: 1,
    typeId: "sensor",
    parentId: "parent",
    surveyStatus: "pending"
  }, {
    assetId: "parent",
    revision: 1,
    typeId: "generic",
    parentId: "",
    surveyStatus: "validated"
  }, {
    assetId: "controller",
    revision: 1,
    typeId: "controller",
    parentId: "",
    surveyStatus: "validated"
  }],
  total: 1506,
  nextCursor: "next"
};
const model: Enrichment = {
  assetId: "sensor",
  revision: 1,
  data: {
    ...emptyEnrichment(),
    typeId: "sensor",
    parentId: "parent",
    controllers: [{
      kind: "controlled-by",
      targetId: "controller",
      channel: "DI-1"
    }],
    manufacturer: "Fictional maker",
    metadata: {
      voltage: 24
    }
  },
  actorId: "leader",
  actorName: "Jordan Leader",
  updatedAt: "2026-10-14T12:00:00.000Z",
  surveyReviewerId: "",
  surveyReviewerName: "",
  surveyReviewedAt: ""
};
function setup(overrides: Partial<Gateway> = {}) {
  let current = model;
  const mappings: Mapping[] = [];
  const gateway: Gateway = {
    catalog: jest.fn(async () => context),
    references: jest.fn(async query => query.cursor ? {
      assets: [],
      enrichments: [],
      total: 1506,
      nextCursor: ""
    } : refs),
    configure: jest.fn(async (expectedRevision, types) => ({
      revision: expectedRevision + 1,
      types
    })),
    detail: jest.fn(async assetId => ({
      asset: refs.assets.find(a => a.id === assetId)!,
      enrichment: assetId === "sensor" ? current : null,
      related: refs.assets.filter(a => a.id !== assetId),
      canManage: true
    })),
    save: jest.fn(async input => {
      current = {
        ...current,
        revision: input.expectedRevision + 1,
        data: input.data
      };
      return current;
    }),
    history: jest.fn(async () => ({
      revisions: [],
      nextBefore: 0
    })),
    mappingQuery: jest.fn(async () => ({
      mappings: [...mappings],
      total: mappings.length,
      nextCursor: ""
    })),
    mappingForSource: jest.fn(async () => null),
    saveMapping: jest.fn(async input => {
      const m = {
        id: input.id,
        revision: 1,
        data: input.data,
        actorId: "leader",
        actorName: "Jordan Leader",
        updatedAt: model.updatedAt
      };
      mappings.push(m);
      return m;
    }),
    mappingHistory: jest.fn(async () => ({
      revisions: [],
      nextBefore: 0
    })),
    candidates: jest.fn(async () => ({
      candidates: [{
        sourceId: "source",
        namespace: "source-equipment" as const,
        area: "Area A",
        code: "SOURCE-S1",
        records: 2
      }],
      nextCursor: ""
    })),
    pareto: jest.fn(),
    ...overrides
  };
  return {
    gateway,
    application: new AssetDomainApplication(gateway, () => "new-mapping")
  };
}
test("large inventories show full totals and request bounded pages/refinement", async () => {
  const {
    gateway,
    application
  } = setup();
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  expect(await screen.findByText("3 / 1506 registry matches")).toBeVisible();
  expect(gateway.references).toHaveBeenCalledWith({
    search: "",
    limit: 30
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Load more assets"
  }));
  await waitFor(() => expect(gateway.references).toHaveBeenCalledWith({
    search: "",
    cursor: "next",
    limit: 30
  }));
  fireEvent.change(screen.getByLabelText("Search asset inventory"), {
    target: {
      value: "SENSOR-001"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Search"
  }));
  await waitFor(() => expect(gateway.references).toHaveBeenCalledWith({
    search: "SENSOR-001",
    limit: 30
  }));
});
test("edits structured metadata and attributed survey requirements without changing registry identity", async () => {
  const {
    gateway,
    application
  } = setup();
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", {
    name: "SENSOR-001"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Edit asset model"
  }));
  fireEvent.change(screen.getByLabelText("Manufacturer"), {
    target: {
      value: "Reviewed fictional maker"
    }
  });
  fireEvent.change(screen.getByLabelText("Voltage (V)"), {
    target: {
      value: "48"
    }
  });
  fireEvent.change(screen.getByLabelText("Survey decision"), {
    target: {
      value: "rejected"
    }
  });
  fireEvent.change(screen.getByLabelText("Survey notes"), {
    target: {
      value: "Synthetic evidence rejected."
    }
  });
  fireEvent.change(screen.getByLabelText("Survey evidence reference"), {
    target: {
      value: "Synthetic checklist"
    }
  });
  fireEvent.change(screen.getByLabelText("Change reason"), {
    target: {
      value: "Operator review"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Save asset model"
  }));
  await waitFor(() => expect(gateway.save).toHaveBeenCalledWith(expect.objectContaining({
    assetId: "sensor",
    expectedRevision: 1,
    data: expect.objectContaining({
      manufacturer: "Reviewed fictional maker",
      metadata: {
        voltage: 48
      },
      parentId: "parent",
      controllers: [{
        kind: "controlled-by",
        targetId: "controller",
        channel: "DI-1"
      }],
      survey: {
        status: "rejected",
        note: "Synthetic evidence rejected.",
        evidenceReference: "Synthetic checklist"
      }
    })
  })));
});
test("configures optional reusable metadata fields through the versioned type catalog", async () => {
  const {
    gateway,
    application
  } = setup();
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByRole("button", {
    name: "SENSOR-001"
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Type catalog"
  }));
  fireEvent.click(screen.getByRole("button", {
    name: "Add metadata field"
  }));
  fireEvent.change(screen.getByLabelText("Field identifier"), {
    target: {
      value: "fixture_tag"
    }
  });
  fireEvent.change(screen.getByLabelText("Field label"), {
    target: {
      value: "Fixture tag"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Save type catalog"
  }));
  await waitFor(() => expect(gateway.configure).toHaveBeenCalledWith(1, expect.arrayContaining([expect.objectContaining({
    id: "generic",
    fields: [{
      key: "fixture_tag",
      label: "Fixture tag",
      kind: "text",
      required: false,
      unit: ""
    }]
  })])));
});
test("reviews explicit source candidates without leaking source-record counters into mapping tuples", async () => {
  const {
    gateway,
    application
  } = setup();
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByRole("button", {
    name: "SENSOR-001"
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Source mappings"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Area A / SOURCE-S1"
  }));
  await screen.findByLabelText("Canonical asset candidate");
  await waitFor(() => expect(screen.getByRole("option", {
    name: "SENSOR-001"
  })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("Canonical asset candidate"), {
    target: {
      value: "sensor"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Add canonical candidate"
  }));
  fireEvent.change(screen.getByLabelText("Mapping review notes"), {
    target: {
      value: "Explicit synthetic candidate; physical review remains pending."
    }
  });
  fireEvent.change(screen.getByLabelText("Change reason"), {
    target: {
      value: "Source tuple reviewed"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Save mapping review"
  }));
  await waitFor(() => expect(gateway.saveMapping).toHaveBeenCalledWith(expect.objectContaining({
    data: {
      source: {
        sourceId: "source",
        namespace: "source-equipment",
        area: "Area A",
        code: "SOURCE-S1"
      },
      status: "pending",
      candidateIds: ["sensor"],
      note: "Explicit synthetic candidate; physical review remains pending."
    }
  })));
});
