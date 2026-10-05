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
  type Gateway,
} from "../src/features/assets/application/assets";
import {
  emptyAsset,
  type Asset,
  type Context,
  type Timeline,
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
    save: jest.fn(async (input) => ({ ...asset, content: input.content })),
    ...overrides,
  };
  return {
    gateway,
    application: new AssetsApplication(gateway, () => "stable-key"),
  };
}
test.each(["technician", "team-leader", "task-force", "executive"])(
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
    fireEvent.click(screen.getByRole("button", { name: "Assembly conveyor" }));
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
      profile="administrator"
      timeZone="UTC"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Register asset" }),
  );
  fireEvent.change(screen.getByLabelText("Asset code"), {
    target: { value: "AS-001" },
  });
  fireEvent.change(screen.getByLabelText("Asset name"), {
    target: { value: "Assembly conveyor" },
  });
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
  expect(screen.getByLabelText("Asset name")).toHaveValue("Assembly conveyor");
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
            code: "DRIVE-01",
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
