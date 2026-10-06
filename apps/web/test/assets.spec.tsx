import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AssetsWorkspace } from "../src/features/assets/adapters/react/AssetsWorkspace";
import { AssetForm } from "../src/features/assets/adapters/react/AssetForm";
import { AssetTimeline } from "../src/features/assets/adapters/react/AssetTimeline";
import {
  AssetsApplication,
  contentFromEquipment,
  type Gateway,
} from "../src/features/assets/application/assets";
import {
  emptyAsset,
  type Asset,
  type Context,
  type Timeline,
  type EquipmentCandidate,
} from "../src/features/assets/domain/models";
const asset: Asset = {
  id: "asset",
  revision: 1,
  authorId: "admin",
  authorName: "Administrator",
  createdAt: "2026-10-01T08:00:00Z",
  updatedAt: "2026-10-01T08:00:00Z",
  content: { ...emptyAsset(), name: "Assembly conveyor", code: "AS-001" },
};
const context: Context = {
  actorId: "admin",
  canManage: true,
  timeZone: "UTC",
  locations: [{ id: "hall", parentId: "", label: "Assembly" }],
};
const timeline: Timeline = {
  asset,
  total: 1,
  nextCursor: "",
  sources: [
    { kind: "maintenance", status: "available", total: 0 },
    { kind: "handover", status: "unmapped", total: 0 },
    { kind: "analytics", status: "available", total: 1 },
  ],
  records: [
    {
      id: "aggregate",
      kind: "analytics",
      date: "2026-10-01",
      recordedAt: "",
      title: "Daily alarm evidence",
      summary: "Source daily aggregate",
      sourceRecordId: "row",
      periodKind: "daily-aggregate",
      frequency: 12,
      seconds: 300,
    },
  ],
};
function fixture(overrides: Partial<Gateway> = {}) {
  const gateway: Gateway = {
    context: jest.fn(async () => context),
    query: jest.fn(async () => ({ assets: [asset], total: 1, nextCursor: "" })),
    detail: jest.fn(async () => asset),
    history: jest.fn(async () => ({ asset, revisions: [], nextBefore: 0 })),
    timeline: jest.fn(async () => timeline),
    equipmentCatalog: jest.fn(async () => ({
      candidates: [],
      total: 0,
      nextCursor: "",
      sources: [],
      sectors: [],
      areas: [],
    })),
    save: jest.fn(async (input) => ({ ...asset, content: input.content })),
    ...overrides,
  };
  return {
    gateway,
    application: new AssetsApplication(gateway, () => "stable-key"),
  };
}
test.each(["technician", "executive"])(
  "%s preview cannot manage assets even with administrator capabilities",
  async (profile) => {
    const { application } = fixture();
    render(
      <AssetsWorkspace
        application={application}
        profile={profile}
        timeZone="UTC"
      />,
    );
    await screen.findByRole("table", { name: "Asset directory" });
    expect(screen.queryByRole("button", { name: "Register asset" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "AS-001" }));
    await screen.findByLabelText("Asset timeline");
    expect(screen.queryByRole("button", { name: "Edit asset" })).toBeNull();
  },
);
test("registration retains its key after rejection and alias fields reflect their source identity", async () => {
  const save = jest
    .fn()
    .mockRejectedValueOnce(
      new Error("This exact source alias is already linked to another asset."),
    )
    .mockResolvedValue(asset);
  const { application } = fixture({ save });
  render(
    <AssetsWorkspace
      application={application}
      profile="team-leader"
      timeZone="UTC"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Register asset" }),
  );
  fireEvent.change(
    screen.getByLabelText("Equipment identifier (Betriebsmittelkennzeichen)"),
    {
      target: { value: "AS-001" },
    },
  );
  expect(screen.queryByLabelText("Asset name")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add source alias" }));
  expect(screen.getByLabelText("Department")).toBeRequired();
  expect(screen.queryByLabelText("Source ID")).toBeNull();
  fireEvent.change(screen.getByLabelText("Source namespace"), {
    target: { value: "analytics" },
  });
  expect(screen.getByLabelText("Source ID")).toBeRequired();
  expect(screen.getByLabelText("Source sector")).toBeRequired();
  fireEvent.click(
    screen.getByRole("button", { name: "Remove source alias 1" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
  await screen.findByRole("alert");
  expect(
    screen.getByLabelText("Equipment identifier (Betriebsmittelkennzeichen)"),
  ).toHaveValue("AS-001");
  fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
  await screen.findByText("Asset saved.");
  expect(save.mock.calls.map(([input]) => input.key)).toEqual([
    "stable-key",
    "stable-key",
  ]);
});
test("daily evidence preserves date-only semantics, source coverage and server source filtering", async () => {
  const openSource = jest.fn();
  const { application, gateway } = fixture();
  render(
    <AssetsWorkspace
      application={application}
      timeZone="UTC"
      initialAssetId="asset"
      onOpenSource={openSource}
    />,
  );
  expect(await screen.findByText("Daily alarm evidence")).toBeVisible();
  expect(screen.getByText("Daily aggregate")).toBeVisible();
  expect(screen.getByText("2026-10-01")).toBeVisible();
  expect(screen.getByText("No source alias")).toBeVisible();
  expect(screen.queryByText(/^Recorded:/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open source record" }));
  expect(openSource).toHaveBeenCalledWith("analytics", "row");
  fireEvent.click(screen.getByRole("button", { name: "Event evidence 1" }));
  await waitFor(() =>
    expect(gateway.timeline).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "analytics", cursor: "" }),
    ),
  );
});
test("late asset detail does not reopen a returned directory", async () => {
  let resolveDetail: (value: Asset) => void = () => undefined;
  const { application } = fixture({
    detail: jest.fn(
      () =>
        new Promise<Asset>((resolve) => {
          resolveDetail = resolve;
        }),
    ),
  });
  render(
    <AssetsWorkspace
      application={application}
      timeZone="UTC"
      initialAssetId="asset"
    />,
  );
  await screen.findByRole("button", { name: "Directory" });
  fireEvent.click(screen.getByRole("button", { name: "Directory" }));
  expect(
    await screen.findByRole("table", { name: "Asset directory" }),
  ).toBeVisible();
  await act(async () => resolveDetail(asset));
  expect(screen.getByRole("table", { name: "Asset directory" })).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Assembly conveyor" }),
  ).toBeNull();
});

test("source alias uses named locations, retains exact IDs and clears an area when its department changes", () => {
  const { application } = fixture();
  const save = jest.fn();
  const aliasContext: Context = {
    ...context,
    locations: [
      {
        id: "assembly-id",
        label: "Assembly",
        parentId: "",
        role: "department",
      },
      { id: "packing-id", label: "Packing", parentId: "", role: "department" },
      {
        id: "line-id",
        label: "Assembly line",
        parentId: "assembly-id",
        role: "area",
      },
      {
        id: "drive-id",
        label: "Drive end",
        parentId: "line-id",
        role: "location",
      },
      {
        id: "sorter-id",
        label: "Packing sorter",
        parentId: "packing-id",
        role: "area",
      },
    ],
  };
  render(
    <AssetForm
      application={application}
      context={aliasContext}
      asset={{
        ...asset,
        content: {
          ...asset.content,
          aliases: [
            {
              namespace: "site-equipment",
              code: "DRIVE-01",
              departmentId: "assembly-id",
              areaId: "drive-id",
              sourceId: "",
              sector: "",
              area: "",
            },
          ],
        },
      }}
      pending={false}
      save={save}
      cancel={jest.fn()}
    />,
  );
  expect(screen.getByRole("combobox", { name: "Department" })).toHaveValue(
    "assembly-id",
  );
  const area = screen.getByRole("combobox", { name: "Area" });
  expect(area).toHaveValue("drive-id");
  expect(area).toHaveTextContent("Assembly line");
  expect(area).toHaveTextContent("Drive end");
  expect(area).not.toHaveTextContent("Packing sorter");
  fireEvent.change(screen.getByRole("combobox", { name: "Department" }), {
    target: { value: "packing-id" },
  });
  expect(area).toHaveValue("");
  expect(area).toHaveTextContent("None");
  expect(area).not.toHaveTextContent("Drive end");
  expect(area).toHaveTextContent("Packing sorter");
  fireEvent.change(area, { target: { value: "sorter-id" } });
  fireEvent.change(screen.getByLabelText("Change reason"), {
    target: { value: "Corrected verified equipment location." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        aliases: [
          expect.objectContaining({
            departmentId: "packing-id",
            areaId: "sorter-id",
            code: "AS-001",
          }),
        ],
      }),
    }),
  );
});

test.each(["not-authorized", "unavailable", "unmapped"] as const)(
  "%s source coverage never presents its unknown count as zero records",
  (status) => {
    render(
      <AssetTimeline
        timeline={{
          ...timeline,
          records: [],
          total: 0,
          sources: [
            { kind: "maintenance", status: "available", total: 2 },
            { kind: "analytics", status, total: 0 },
          ],
        }}
        from="2026-10-01"
        to="2026-10-05"
        source="analytics"
        pending={false}
        timeZone="UTC"
        onDates={jest.fn()}
        onSource={jest.fn()}
        loadMore={jest.fn()}
      />,
    );
    const coverage = screen.getByLabelText("Source coverage");
    expect(within(coverage).queryByText("0 records in this window")).toBeNull();
    expect(within(coverage).getByText("No count available")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Event evidence" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Event evidence 0" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "All sources 2" })).toBeVisible();
    expect(screen.queryByText("Showing 0 of 0 records.")).toBeNull();
  },
);
test.each(["administrator", "team-leader", "task-force"])(
  "%s can manage provisionally identified components when authorized",
  async (profile) => {
    const { application } = fixture();
    render(
      <AssetsWorkspace
        application={application}
        profile={profile}
        timeZone="UTC"
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Register asset" }),
    ).toBeVisible();
  },
);

const reported: EquipmentCandidate = {
  namespace: "analytics",
  code: "=11+11.11.02-B102.1",
  sourceId: "hitliste",
  sector: "Halle 11",
  area: "LB-Puffer",
  departmentId: "hall",
  areaId: "line",
};
const equipmentContext: Context = {
  ...context,
  locations: [
    { id: "hall", parentId: "", label: "Halle 11", role: "department" },
    { id: "line", parentId: "hall", label: "LB-Puffer", role: "area" },
  ],
};
test("a single reported identifier is selected before metadata and saves exact source links with code as name", async () => {
  const equipmentCatalog = jest.fn(async () => ({
    candidates: [reported],
    total: 1,
    nextCursor: "",
    sources: ["hitliste"],
    sectors: ["Halle 11"],
    areas: ["LB-Puffer"],
  }));
  const { application } = fixture({ equipmentCatalog });
  const save = jest.fn();
  render(
    <AssetForm
      application={application}
      context={equipmentContext}
      pending={false}
      save={save}
      cancel={jest.fn()}
    />,
  );
  expect(screen.queryByLabelText("Asset name")).toBeNull();
  expect(screen.getByLabelText("Reported equipment identifier")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Asset Halle"), {
    target: { value: "hall" },
  });
  fireEvent.change(screen.getByLabelText("Asset Bereich"), {
    target: { value: "line" },
  });
  await waitFor(() =>
    expect(equipmentCatalog).toHaveBeenCalledWith({
      locationId: "line",
      search: "",
      cursor: "",
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByLabelText("Reported equipment identifier"),
    ).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Reported equipment identifier"), {
    target: { value: "0" },
  });
  expect(
    screen.getByLabelText("Equipment identifier (Betriebsmittelkennzeichen)"),
  ).toHaveValue(reported.code);
  expect(screen.getByLabelText("Asset identity status")).toHaveValue(
    "unverified",
  );
  fireEvent.change(screen.getByLabelText("Component type"), {
    target: { value: "Cassette" },
  });
  fireEvent.change(
    screen.getByLabelText("Manual group / location within Bereich"),
    { target: { value: "Puffer 1" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        code: reported.code,
        name: reported.code,
        type: "Cassette",
        locationDetails: "Puffer 1",
        status: "unverified",
        locationId: "line",
        aliases: [
          {
            namespace: "analytics",
            code: reported.code,
            sourceId: "hitliste",
            sector: "Halle 11",
            area: "LB-Puffer",
            departmentId: "",
            areaId: "",
          },
          {
            namespace: "site-equipment",
            code: reported.code,
            departmentId: "hall",
            areaId: "line",
            sourceId: "",
            sector: "",
            area: "",
          },
        ],
      }),
    }),
  );
});
test("source choices are native dropdowns conditioned by location, code, source and sector", async () => {
  const equipmentCatalog = jest.fn(async (selection) => ({
    candidates: selection.area === "LB-Puffer" ? [reported] : [],
    total: 1,
    nextCursor: "",
    sources: ["hitliste", "qualified-second-source"],
    sectors: selection.sourceId ? ["Halle 11"] : [],
    areas: selection.sector ? ["LB-Puffer"] : [],
  }));
  const { application } = fixture({ equipmentCatalog });
  const save = jest.fn();
  render(
    <AssetForm
      application={application}
      context={equipmentContext}
      pending={false}
      save={save}
      cancel={jest.fn()}
    />,
  );
  fireEvent.change(
    screen.getByLabelText("Equipment identifier (Betriebsmittelkennzeichen)"),
    { target: { value: reported.code } },
  );
  fireEvent.change(screen.getByLabelText("Location"), {
    target: { value: "line" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add source alias" }));
  fireEvent.change(screen.getByLabelText("Source namespace"), {
    target: { value: "analytics" },
  });
  await waitFor(() => expect(screen.getByLabelText("Source ID")).toBeEnabled());
  expect(screen.getByLabelText("Source ID").tagName).toBe("SELECT");
  expect(screen.getByLabelText("Source ID")).toHaveTextContent(
    "qualified-second-source",
  );
  expect(screen.getByLabelText("Source sector")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Source ID"), {
    target: { value: "hitliste" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Source sector")).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Source sector"), {
    target: { value: "Halle 11" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Source area")).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Source area"), {
    target: { value: "LB-Puffer" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Source equipment code")).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Source equipment code"), {
    target: { value: reported.code },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({
        aliases: [
          {
            namespace: "analytics",
            sourceId: "hitliste",
            code: reported.code,
            sector: "Halle 11",
            area: "LB-Puffer",
            departmentId: "",
            areaId: "",
          },
        ],
      }),
    }),
  );
  expect(equipmentCatalog).toHaveBeenLastCalledWith(
    expect.objectContaining({
      locationId: "line",
      code: reported.code,
      sourceId: "hitliste",
      sector: "Halle 11",
      area: "LB-Puffer",
    }),
  );
  fireEvent.change(screen.getByLabelText("Source ID"), {
    target: { value: "qualified-second-source" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Source sector")).toBeEnabled(),
  );
  expect(screen.getByLabelText("Source area")).toHaveValue("");
  expect(screen.getByLabelText("Source equipment code")).toHaveValue("");
  expect(screen.getByLabelText("Source equipment code")).toBeDisabled();
});
test("reported-code search and pagination keep the selected Bereich and reject stale pages", async () => {
  let finishPage: (
    value: Awaited<ReturnType<Gateway["equipmentCatalog"]>>,
  ) => void = () => undefined;
  const second = { ...reported, code: "=11+11.11.02-B102.2" };
  const equipmentCatalog = jest.fn(async (selection) => ({
    candidates: [reported],
    total: 2,
    nextCursor: "next",
    sources: ["hitliste"],
    sectors: ["Halle 11"],
    areas: ["LB-Puffer"],
  }));
  equipmentCatalog.mockImplementationOnce(async () => ({
    candidates: [reported],
    total: 2,
    nextCursor: "next",
    sources: ["hitliste"],
    sectors: ["Halle 11"],
    areas: ["LB-Puffer"],
  }));
  equipmentCatalog.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishPage = resolve;
      }),
  );
  equipmentCatalog.mockImplementationOnce(async () => ({
    candidates: [second],
    total: 1,
    nextCursor: "",
    sources: ["hitliste"],
    sectors: ["Halle 11"],
    areas: ["LB-Puffer"],
  }));
  const { application } = fixture({ equipmentCatalog });
  render(
    <AssetForm
      application={application}
      context={equipmentContext}
      pending={false}
      save={jest.fn()}
      cancel={jest.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Asset Halle"), {
    target: { value: "hall" },
  });
  fireEvent.change(screen.getByLabelText("Asset Bereich"), {
    target: { value: "line" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "More equipment codes" }),
  );
  fireEvent.change(screen.getByLabelText("Search reported equipment"), {
    target: { value: "B102.2" },
  });
  await waitFor(() =>
    expect(
      screen.getByLabelText("Reported equipment identifier"),
    ).toHaveTextContent(second.code),
  );
  await act(async () =>
    finishPage({
      candidates: [reported],
      total: 2,
      nextCursor: "",
      sources: ["hitliste"],
      sectors: ["Halle 11"],
      areas: ["LB-Puffer"],
    }),
  );
  expect(
    screen.getByLabelText("Reported equipment identifier"),
  ).not.toHaveTextContent(reported.code);
  expect(equipmentCatalog).toHaveBeenLastCalledWith({
    locationId: "line",
    search: "B102.2",
    cursor: "",
  });
});
test("current directory excludes retired by default and explicitly requests retained history", async () => {
  const { application, gateway } = fixture();
  render(
    <AssetsWorkspace
      application={application}
      profile="administrator"
      timeZone="UTC"
    />,
  );
  await screen.findByRole("table", { name: "Asset directory" });
  expect(gateway.query).toHaveBeenCalledWith(
    expect.objectContaining({ status: "current" }),
  );
  fireEvent.change(screen.getByLabelText("Asset identity status"), {
    target: { value: "" },
  });
  await waitFor(() =>
    expect(gateway.query).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "" }),
    ),
  );
});
test("changing the canonical code retains custom aliases and replaces mismatched source aliases", () => {
  const content = {
    ...emptyAsset(),
    code: "OLD",
    name: "Legacy name",
    aliases: [
      {
        namespace: "site-equipment",
        code: "OLD",
        departmentId: "hall",
        areaId: "line",
        sourceId: "",
        sector: "",
        area: "",
      },
      {
        namespace: "manual-register",
        code: "OWNER-REFERENCE",
        departmentId: "",
        areaId: "",
        sourceId: "",
        sector: "",
        area: "",
      },
    ],
  };
  const changed = contentFromEquipment(content, reported);
  expect(changed.code).toBe(reported.code);
  expect(changed.name).toBe(reported.code);
  expect(changed.aliases.some((alias) => alias.code === "OLD")).toBe(false);
  expect(changed.aliases[0]).toEqual(content.aliases[1]);
  expect(content.aliases).toHaveLength(2);
});
test("selecting another source context never discards current aliases when capacity is full", () => {
  const content = {
    ...emptyAsset(),
    code: reported.code,
    name: reported.code,
    aliases: Array.from({ length: 30 }, (_, index) => ({
      namespace: "manual-register",
      code: `KEPT-${index}`,
      departmentId: "",
      areaId: "",
      sourceId: "",
      sector: "",
      area: "",
    })),
  };
  expect(() => contentFromEquipment(content, reported)).toThrow(
    "source alias limit",
  );
  expect(content.aliases).toHaveLength(30);
  expect(content.aliases[29].code).toBe("KEPT-29");
});
