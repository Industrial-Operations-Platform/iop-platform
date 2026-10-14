import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssetDomainApplication, type Gateway } from "../src/features/assets-domain/application/domain";
import { AssetDomainWorkspace } from "../src/features/assets-domain/adapters/react/AssetDomainWorkspace";
import { AssetReferencePicker } from "../src/features/assets-domain/adapters/react/AssetReferencePicker";
import { CanonicalPareto } from "../src/features/assets-domain/adapters/react/CanonicalPareto";
import { emptyEnrichment, type AssetType, type Context, type Detail, type Enrichment, type Mapping, type ReferencePage, type ModelHistory, type CanonicalPareto as ParetoResult } from "../src/features/assets-domain/domain/models";
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
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return {
    promise,
    resolve,
    reject
  };
}
function page(code: string): ReferencePage {
  return {
    assets: [{
      id: code,
      code,
      name: code,
      status: "validated"
    }],
    enrichments: [],
    total: 1,
    nextCursor: ""
  };
}
function detail(id: string): Detail {
  return {
    asset: refs.assets.find(a => a.id === id)!,
    enrichment: null,
    related: [],
    canManage: true
  };
}
function revision(assetId: string, reason: string): ModelHistory {
  return {
    revisions: [{
      enrichment: {
        ...model,
        assetId
      },
      reason,
      actorId: "leader",
      actorName: "Jordan Leader",
      at: model.updatedAt
    }],
    nextBefore: 0
  };
}
test("the latest selected asset publishes coherent detail/history when earlier requests finish last", async () => {
  const sensor = deferred<Detail>(),
    parent = deferred<Detail>(),
    oldHistory = deferred<ModelHistory>(),
    newHistory = deferred<ModelHistory>(),
    opened = jest.fn();
  const {
    application
  } = setup({
    detail: jest.fn(id => id === "sensor" ? sensor.promise : parent.promise),
    history: jest.fn(id => id === "sensor" ? oldHistory.promise : newHistory.promise)
  });
  render(<AssetDomainWorkspace application={application} timeZone="UTC" onOpenAsset={opened} />);
  fireEvent.click(await screen.findByRole("button", {
    name: "SENSOR-001"
  }));
  fireEvent.click(screen.getByRole("button", {
    name: "CONVEYOR-001"
  }));
  await act(async () => {
    parent.resolve(detail("parent"));
    newHistory.resolve(revision("parent", "Current conveyor revision"));
  });
  expect(await screen.findByText("Current conveyor revision")).toBeVisible();
  await act(async () => {
    sensor.resolve(detail("sensor"));
    oldHistory.resolve(revision("sensor", "Outdated sensor revision"));
  });
  expect(screen.queryByText("Outdated sensor revision")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {
    name: "Open digital asset record"
  }));
  expect(opened).toHaveBeenCalledWith("parent");
});
test("late search and pagination responses cannot replace or append to a newer inventory search", async () => {
  const older = deferred<ReferencePage>(),
    latest = deferred<ReferencePage>(),
    next = deferred<ReferencePage>();
  const {
    gateway,
    application
  } = setup({
    references: jest.fn(query => query.cursor ? next.promise : query.search === "old" ? older.promise : query.search === "latest" ? latest.promise : Promise.resolve(refs))
  });
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByText("3 / 1506 registry matches");
  fireEvent.click(screen.getByRole("button", {
    name: "Load more assets"
  }));
  const input = screen.getByLabelText("Search asset inventory"),
    submit = screen.getByRole("button", {
      name: "Search"
    });
  fireEvent.change(input, {
    target: {
      value: "old"
    }
  });
  fireEvent.click(submit);
  await waitFor(() => expect(gateway.references).toHaveBeenCalledWith({
    search: "old",
    limit: 30
  }));
  fireEvent.change(input, {
    target: {
      value: "latest"
    }
  });
  fireEvent.click(submit);
  await waitFor(() => expect(gateway.references).toHaveBeenCalledWith({
    search: "latest",
    limit: 30
  }));
  await act(async () => latest.resolve(page("LATEST-RESULT")));
  expect(await screen.findByRole("button", {
    name: "LATEST-RESULT"
  })).toBeVisible();
  await act(async () => {
    older.resolve(page("OLD-RESULT"));
    next.resolve(page("OLD-PAGINATION"));
  });
  expect(screen.queryByRole("button", {
    name: "OLD-RESULT"
  })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", {
    name: "OLD-PAGINATION"
  })).not.toBeInTheDocument();
  expect(screen.getByRole("button", {
    name: "LATEST-RESULT"
  })).toBeVisible();
});
test("unmounting during initial loading cannot trigger a later initial asset request", async () => {
  const pending = deferred<ReferencePage>();
  const {
    gateway,
    application
  } = setup({
    references: jest.fn(() => pending.promise)
  });
  const view = render(<AssetDomainWorkspace application={application} timeZone="UTC" initialAssetId="sensor" />);
  await waitFor(() => expect(gateway.references).toHaveBeenCalled());
  view.unmount();
  await act(async () => pending.resolve(refs));
  expect(gateway.detail).not.toHaveBeenCalled();
  expect(gateway.history).not.toHaveBeenCalled();
});
const sourceA = {
    sourceId: "source",
    namespace: "source-equipment" as const,
    area: "Area A",
    code: "SOURCE-A",
    records: 1
  },
  sourceB = {
    ...sourceA,
    code: "SOURCE-B"
  };
test("reversed mapping-source lookups retain the user's latest source selection", async () => {
  const older = deferred<Mapping | null>(),
    latest = deferred<Mapping | null>();
  const {
    application
  } = setup({
    candidates: jest.fn(async () => ({
      candidates: [sourceA, sourceB],
      nextCursor: ""
    })),
    mappingForSource: jest.fn(source => source.code === "SOURCE-A" ? older.promise : latest.promise)
  });
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByRole("button", {
    name: "SENSOR-001"
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Source mappings"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Area A / SOURCE-A"
  }));
  fireEvent.click(screen.getByRole("button", {
    name: "Area A / SOURCE-B"
  }));
  await act(async () => latest.resolve(null));
  expect(await screen.findByRole("heading", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
  await act(async () => older.resolve(null));
  expect(screen.queryByRole("heading", {
    name: "Area A / SOURCE-A"
  })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
});
test("late source search failures cannot replace the current search results", async () => {
  const older = deferred<{
      candidates: typeof sourceA[];
      nextCursor: string;
    }>(),
    latest = deferred<{
      candidates: typeof sourceA[];
      nextCursor: string;
    }>();
  const {
    application,
    gateway
  } = setup({
    candidates: jest.fn(search => search === "old" ? older.promise : search === "latest" ? latest.promise : Promise.resolve({
      candidates: [sourceA],
      nextCursor: ""
    }))
  });
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByRole("button", {
    name: "SENSOR-001"
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Source mappings"
  }));
  await screen.findByRole("button", {
    name: "Area A / SOURCE-A"
  });
  const input = screen.getByLabelText("Find imported source identifiers");
  fireEvent.change(input, {
    target: {
      value: "old"
    }
  });
  await waitFor(() => expect(gateway.candidates).toHaveBeenCalledWith("old", undefined));
  fireEvent.change(input, {
    target: {
      value: "latest"
    }
  });
  await waitFor(() => expect(gateway.candidates).toHaveBeenCalledWith("latest", undefined));
  await act(async () => latest.resolve({
    candidates: [sourceB],
    nextCursor: ""
  }));
  expect(await screen.findByRole("button", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
  await act(async () => older.reject(new Error("Outdated source search failure")));
  expect(screen.queryByText("Outdated source search failure")).not.toBeInTheDocument();
  expect(screen.getByRole("button", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
});
test("an earlier mapping save completing after Back cannot close another source's editor", async () => {
  const saved = deferred<Mapping>();
  const {
    application,
    gateway
  } = setup({
    saveMapping: jest.fn(() => saved.promise),
    candidates: jest.fn(async () => ({
      candidates: [sourceA, sourceB],
      nextCursor: ""
    }))
  });
  render(<AssetDomainWorkspace application={application} timeZone="UTC" />);
  await screen.findByRole("button", {
    name: "SENSOR-001"
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Source mappings"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Area A / SOURCE-A"
  }));
  await screen.findByRole("heading", {
    name: "Area A / SOURCE-A"
  });
  fireEvent.change(screen.getByLabelText("Mapping review notes"), {
    target: {
      value: "Synthetic pending review."
    }
  });
  fireEvent.change(screen.getByLabelText("Change reason"), {
    target: {
      value: "Synthetic review."
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Save mapping review"
  }));
  await waitFor(() => expect(gateway.saveMapping).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", {
    name: "Back"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Area A / SOURCE-B"
  }));
  expect(await screen.findByRole("heading", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
  await act(async () => saved.resolve({
    id: "new-mapping",
    revision: 1,
    data: {
      source: sourceA,
      status: "pending",
      candidateIds: [],
      note: "Synthetic pending review."
    },
    actorId: "leader",
    actorName: "Jordan Leader",
    updatedAt: model.updatedAt
  }));
  expect(screen.getByRole("heading", {
    name: "Area A / SOURCE-B"
  })).toBeVisible();
});
test("a picker page from a previous search cannot append to newer lookup choices", async () => {
  const next = deferred<ReferencePage>(),
    latest = deferred<ReferencePage>();
  const {
    application,
    gateway
  } = setup({
    references: jest.fn(query => query.cursor ? next.promise : query.search === "latest" ? latest.promise : Promise.resolve(refs))
  });
  render(<AssetReferencePicker application={application} label="Fixture lookup" value="" onChange={jest.fn()} />);
  await screen.findByRole("option", {
    name: "SENSOR-001"
  });
  await waitFor(() => expect(screen.getByRole("button", {
    name: "Load more assets"
  })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", {
    name: "Load more assets"
  }));
  fireEvent.change(screen.getByLabelText("Search: Fixture lookup"), {
    target: {
      value: "latest"
    }
  });
  await waitFor(() => expect(gateway.references).toHaveBeenCalledWith({
    search: "latest",
    limit: 30
  }));
  await act(async () => latest.resolve(page("LATEST-LOOKUP")));
  expect(await screen.findByRole("option", {
    name: "LATEST-LOOKUP"
  })).toBeVisible();
  await act(async () => next.resolve(page("OUTDATED-PICKER-PAGE")));
  expect(screen.queryByRole("option", {
    name: "OUTDATED-PICKER-PAGE"
  })).not.toBeInTheDocument();
  expect(screen.getByRole("option", {
    name: "LATEST-LOOKUP"
  })).toBeVisible();
});
function pareto(code: string): ParetoResult {
  return {
    selection: {
      from: "2026-10-01",
      toExclusive: "2026-10-02",
      metric: "frequency"
    },
    groups: [{
      assetId: code,
      assetCode: code,
      frequency: 10,
      alarmSeconds: 60,
      records: 1,
      cumulativePercent: 25
    }],
    groupCount: 1,
    totals: {
      frequency: 40,
      alarmSeconds: 240,
      records: 2
    },
    mapped: {
      frequency: 10,
      alarmSeconds: 60,
      records: 1
    },
    unresolved: {
      frequency: 30,
      alarmSeconds: 180,
      records: 1
    },
    states: {
      mapped: 1,
      unmapped: 1
    },
    missingDates: [],
    admittedDates: ["2026-10-01"],
    projectionRevision: code,
    limitations: "Synthetic test metric."
  };
}
test("an obsolete Pareto request cannot overwrite the result after application replacement", async () => {
  const old = deferred<ParetoResult>(),
    latest = deferred<ParetoResult>();
  const first = setup({
      pareto: jest.fn(() => old.promise)
    }),
    second = setup({
      pareto: jest.fn(() => latest.promise)
    });
  const view = render(<CanonicalPareto application={first.application} />);
  fireEvent.submit(screen.getByRole("button", {
    name: "Load canonical asset Pareto"
  }).closest("form")!);
  await waitFor(() => expect(first.gateway.pareto).toHaveBeenCalled());
  view.rerender(<CanonicalPareto application={second.application} />);
  fireEvent.submit(screen.getByRole("button", {
    name: "Load canonical asset Pareto"
  }).closest("form")!);
  await waitFor(() => expect(second.gateway.pareto).toHaveBeenCalled());
  await act(async () => latest.resolve(pareto("CURRENT-PARETO")));
  expect(await screen.findByRole("cell", {
    name: "CURRENT-PARETO"
  })).toBeVisible();
  await act(async () => old.resolve(pareto("OUTDATED-PARETO")));
  expect(screen.queryByRole("cell", {
    name: "OUTDATED-PARETO"
  })).not.toBeInTheDocument();
  expect(screen.getByRole("cell", {
    name: "CURRENT-PARETO"
  })).toBeVisible();
});
