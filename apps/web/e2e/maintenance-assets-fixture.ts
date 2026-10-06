import type { Page as BrowserPage } from "@playwright/test";
import { emptyWorkforce } from "./workforce-fixture";
import {
  emptyRecord,
  type Catalog,
  type MaintenanceRecord,
  type Status,
} from "../src/features/maintenance/domain/models";
import {
  emptyAsset,
  type Asset,
  type TimelineRecord,
} from "../src/features/assets/domain/models";

const assetId = "11111111-1111-4111-8111-111111111111";
const handoverId = "22222222-2222-4222-8222-222222222222";
const importId = "33333333-3333-4333-8333-333333333333";
const locations = [
  {
    id: "assembly",
    label: "Assembly",
    parentId: "",
    role: "department",
    sectorKey: "Assembly",
  },
  {
    id: "packing",
    label: "Packing",
    parentId: "",
    role: "department",
    sectorKey: "Packing",
  },
  {
    id: "assembly-line1",
    label: "Line 1",
    parentId: "assembly",
    role: "area",
    sectorKey: "",
  },
];
export async function installMaintenanceAssetsFixture(
  page: BrowserPage,
  profile = "team-leader",
) {
  const requests: { path: string; data: any }[] = [];
  const statuses: Status[] = ["open", "in-progress", "blocked", "done"];
  let records: MaintenanceRecord[] = statuses.map((status, index) => ({
    id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`,
    revision: 1,
    data: {
      ...emptyRecord("normal"),
      title: [
        "Bearing inspection",
        "Replace drive belt",
        "Inspect motor coupling",
        "Grease guide rollers",
      ][index],
      details:
        "Inspect the equipment during the planned stop and retain the findings for the next shift.",
      status,
      assetId,
      locationId: "assembly",
      assigneeId: "admin",
      teamId: "maintenance",
      dueDate: "2026-10-06",
      blockedReason:
        status === "blocked" ? "Awaiting replacement coupling." : "",
      outcome:
        status === "done" ? "Rollers lubricated and movement checked." : "",
    },
    authorId: "admin",
    authorName: "Morgan Administrator",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-02T10:00:00Z",
    locationLabel: "Assembly",
    assetName: "DRIVE-01",
    priorityLabel: "Normal",
    assigneeName: "Morgan Administrator",
    teamLabel: "Maintenance team",
    canEdit: profile !== "executive",
    canReassign: ["administrator", "team-leader"].includes(profile),
  }));
  let assets: Asset[] = [
    {
      id: assetId,
      revision: 1,
      authorId: "admin",
      authorName: "Morgan Administrator",
      createdAt: "2026-10-01T08:00:00Z",
      updatedAt: "2026-10-02T10:00:00Z",
      content: {
        ...emptyAsset(),
        name: "DRIVE-01",
        code: "DRIVE-01",
        type: "Conveyor",
        locationId: "assembly",
        status: "validated",
        description:
          "Main assembly conveyor. Maintenance evidence and confirmed source references are retained together.",
        validationNote:
          "Verified against the equipment label during inspection.",
        aliases: [
          {
            namespace: "analytics",
            sourceId: "daily-alarms",
            sector: "Assembly",
            area: "Line 1",
            code: "DRIVE-01",
            departmentId: "",
            areaId: "",
          },
          {
            namespace: "site-equipment",
            code: "DRIVE-01",
            departmentId: "assembly",
            areaId: "",
            sourceId: "",
            sector: "",
            area: "",
          },
        ],
      },
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      revision: 1,
      authorId: "admin",
      authorName: "Morgan Administrator",
      createdAt: "2026-10-01T08:00:00Z",
      updatedAt: "2026-10-02T10:00:00Z",
      content: {
        ...emptyAsset(),
        name: "DRIVE-02",
        code: "DRIVE-02",
        locationId: "packing",
      },
    },
  ];
  let settings = {
    revision: 1,
    priorities: [
      { id: "urgent", label: "Urgent", rank: 0 },
      { id: "normal", label: "Normal", rank: 1 },
    ],
  };
  const handover = {
    id: handoverId,
    authorId: "admin",
    authorName: "Morgan Administrator",
    responsibleId: "admin",
    responsibleName: "Morgan Administrator",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-02T10:00:00Z",
    revision: 1,
    departmentLabel: "Assembly",
    areaLabel: "",
    categoryLabel: "Problems",
    equipmentReferenceId: "reference",
    issueState: "open",
    highlighted: false,
    highlightedAt: "",
    content: {
      date: "2026-10-01",
      categoryId: "problems",
      summary: "Vibration reported",
      details:
        "The drive vibrated briefly during startup. Inspect at the next stop.",
      departmentId: "assembly",
      areaId: "",
      equipmentCode: "DRIVE-01",
      equipmentNamespace: "site-equipment",
      condition: "inspection-needed",
      externalReference: "",
      challenge: "",
      cause: "",
      measure: "",
      dueDate: "",
      feedbackDueDate: "",
      discuss: false,
    },
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data =
      route.request().method() === "POST" ? route.request().postDataJSON() : {};
    requests.push({ path, data });
    const json = (value: unknown) => route.fulfill({ json: value });
    if (path.endsWith("/users"))
      return json([
        {
          id: "admin",
          name: "Morgan Administrator",
          username: "morgan",
          profile,
          active: true,
        },
      ]);
    if (path.endsWith("/users/activity") || path.endsWith("/imports"))
      return json([]);
    if (path.endsWith("/session/context"))
      return json({
        enabled: true,
        authentication: "password",
        canImport: profile === "administrator",
        canAdminister: profile === "administrator",
        canReadAnalytics: profile !== "technician",
        user: { id: "admin", name: "Morgan Administrator", profile },
        users: [],
        scope: { organizationId: "org", siteId: "site", siteTimeZone: "UTC" },
      });
    if (path.endsWith("/workforce/board")) return json(emptyWorkforce);
    if (path.endsWith("/handover/context"))
      return json({
        actorId: "admin",
        canCoordinate: profile === "administrator",
        canDelete: false,
        timeZone: "UTC",
        people: [{ id: "admin", name: "Morgan Administrator" }],
        locations: locations.map((location) => ({
          ...location,
          role: location.role,
          sectorKey: location.sectorKey,
        })),
        categories: [{ id: "problems", label: "Problems", carryForward: true }],
        externalSystemLabel: "Work reference",
      });
    if (path.endsWith("/handover/query"))
      return json({ entries: [], total: 0, nextCursor: "" });
    if (path.endsWith("/handover/equipment"))
      return json({
        codes: ["DRIVE-01", "=11+11.11.02-B102.1"],
        nextCursor: "",
      });
    if (path.endsWith("/handover/history"))
      return json({
        entry:
          data.id === handoverId
            ? handover
            : {
                ...handover,
                id: "secondary-issue",
                content: {
                  ...handover.content,
                  summary: "Cassette direction error",
                  equipmentCode: "=11+11.11.02-B102.1",
                },
              },
        revisions: [],
        nextBefore: 0,
      });
    if (path.endsWith("/maintenance/related"))
      return json({
        entries: [
          handover,
          {
            ...handover,
            id: "secondary-issue",
            content: {
              ...handover.content,
              summary: "Cassette direction error",
              equipmentCode: "=11+11.11.02-B102.1",
            },
          },
        ],
        total: 2,
        nextCursor: "",
      });
    if (path.endsWith("/maintenance/assignments"))
      return json({
        records: records.filter(
          (record) =>
            record.data.status !== "done" && record.data.assigneeId === "admin",
        ),
        events: [
          {
            id: "assignment-1",
            recordId: records[0].id,
            revision: 1,
            title: records[0].data.title,
            at: "2026-10-05T10:00:00Z",
          },
        ],
      });
    if (path.endsWith("/analytics/availability")) return json({ dates: [] });
    if (path.endsWith("/analytics/source-rows"))
      return json({
        records: [
          {
            line: 42,
            sector: "Assembly",
            area: "Line 1",
            equipment: "DRIVE-01",
            message: "Drive alarm",
            type: "Fault",
            messageGroup: "Drive",
            frequency: 12,
            seconds: 300,
            minutes: 5,
          },
        ],
        page: 1,
        pageCount: 1,
        recordCount: 1,
        options: {},
        optionCounts: {},
      });
    if (path.endsWith("/maintenance/catalog")) {
      const catalog: Catalog = {
        actorId: "admin",
        canContribute: profile !== "executive",
        canCoordinate: ["administrator", "team-leader"].includes(profile),
        canAdminister: profile === "administrator",
        settings,
        people: [{ id: "admin", name: "Morgan Administrator" }],
        teams: [{ id: "maintenance", label: "Maintenance team" }],
        locations,
        assets: assets.map((asset) => ({
          id: asset.id,
          name: asset.content.name,
          locationId: asset.content.locationId,
          status: asset.content.status,
        })),
      };
      return json(catalog);
    }
    if (path.endsWith("/maintenance/query")) {
      const matching = records.filter(
        (record) =>
          (!data.status || record.data.status === data.status) &&
          (!data.locationId || record.data.locationId === data.locationId) &&
          (!data.assigneeId || record.data.assigneeId === data.assigneeId) &&
          (!data.search ||
            record.data.title
              .toLowerCase()
              .includes(data.search.toLowerCase())),
      );
      const offset = data.cursor ? 2 : 0;
      const counts = Object.fromEntries(
        statuses.map((status) => [
          status,
          matching.filter((record) => record.data.status === status).length,
        ]),
      );
      return json({
        records: matching.slice(offset, offset + 2),
        total: matching.length,
        nextCursor: matching.length > offset + 2 ? "page-2" : "",
        statusCounts: counts,
      });
    }
    if (path.endsWith("/maintenance/history")) {
      const record = records.find((record) => record.id === data.id)!;
      return json({
        record,
        revisions: [
          {
            record,
            actorId: "admin",
            actorName: "Morgan Administrator",
            action: "created",
            reason: "",
            at: record.createdAt,
          },
        ],
        nextBefore: 0,
      });
    }
    if (path.endsWith("/maintenance/save")) {
      if (data.reason === "Reject stale update")
        return route.fulfill({
          status: 409,
          json: { code: "maintenance_conflict" },
        });
      const existing = records.find((record) => record.id === data.id);
      const record = {
        ...(existing ?? records[0]),
        id: data.id,
        revision: (existing?.revision ?? 0) + 1,
        data: data.data,
        updatedAt: "2026-10-05T10:00:00Z",
      };
      records = [...records.filter((record) => record.id !== data.id), record];
      return json(record);
    }
    if (path.endsWith("/maintenance/settings")) {
      settings = {
        revision: settings.revision + 1,
        priorities: data.priorities,
      };
      return json(settings);
    }
    if (path.endsWith("/assets/equipment-catalog")) {
      const all = ["DRIVE-01", "=11+11.11.02-B102.1"].flatMap((code) => [
        {
          namespace: "analytics",
          sourceId: "daily-alarms",
          code,
          sector: "Assembly",
          area: "Line 1",
          departmentId: "assembly",
          areaId: "assembly-line1",
        },
        {
          namespace: "site-equipment",
          sourceId: "",
          code,
          sector: "",
          area: "",
          departmentId: "assembly",
          areaId: "assembly-line1",
        },
      ]);
      const base = all.filter(
        (candidate) =>
          (!data.locationId ||
            [candidate.departmentId, candidate.areaId].includes(
              data.locationId,
            )) &&
          (!data.code || candidate.code === data.code) &&
          (!data.search ||
            candidate.code.toLowerCase().includes(data.search.toLowerCase())),
      );
      const sources = [
        ...new Set(base.map((candidate) => candidate.sourceId).filter(Boolean)),
      ];
      const sourced = base.filter(
        (candidate) => !data.sourceId || candidate.sourceId === data.sourceId,
      );
      const sectors = [
        ...new Set(
          sourced.map((candidate) => candidate.sector).filter(Boolean),
        ),
      ];
      const sector = sourced.filter(
        (candidate) => !data.sector || candidate.sector === data.sector,
      );
      const areas = [
        ...new Set(sector.map((candidate) => candidate.area).filter(Boolean)),
      ];
      const candidates = all.filter(
        (candidate) =>
          (!data.locationId ||
            [candidate.departmentId, candidate.areaId].includes(
              data.locationId,
            )) &&
          (!data.code || candidate.code === data.code) &&
          (!data.search ||
            candidate.code.toLowerCase().includes(data.search.toLowerCase())) &&
          (!data.sourceId || candidate.sourceId === data.sourceId) &&
          (!data.sector || candidate.sector === data.sector) &&
          (!data.area || candidate.area === data.area),
      );
      const unique = (key: "sourceId" | "sector" | "area") => [
        ...new Set(
          candidates.map((candidate) => candidate[key]).filter(Boolean),
        ),
      ];
      return json({
        candidates,
        total: candidates.length,
        nextCursor: "",
        sources,
        sectors,
        areas,
      });
    }
    if (path.endsWith("/assets/context"))
      return json({
        actorId: "admin",
        timeZone: "UTC",
        canManage: ["administrator", "team-leader", "task-force"].includes(
          profile,
        ),
        locations,
      });
    if (path.endsWith("/assets/query")) {
      const matching = assets.filter(
        (asset) =>
          (!data.status ||
            (data.status === "current"
              ? asset.content.status !== "retired"
              : asset.content.status === data.status)) &&
          (!data.locationId || asset.content.locationId === data.locationId) &&
          (!data.search ||
            asset.content.name
              .toLowerCase()
              .includes(data.search.toLowerCase())),
      );
      const offset = data.cursor ? 1 : 0;
      return json({
        assets: matching.slice(offset, offset + 1),
        total: matching.length,
        nextCursor: matching.length > offset + 1 ? "asset-page-2" : "",
      });
    }
    if (path.endsWith("/assets/detail"))
      return json(assets.find((asset) => asset.id === data.id));
    if (path.endsWith("/assets/history")) {
      if (data.before !== 0)
        throw new Error(
          "Assets history requires an explicit zero before cursor.",
        );
      const asset = assets.find((asset) => asset.id === data.id)!;
      return json({
        asset,
        revisions: [
          {
            asset,
            actorId: "admin",
            actorName: "Morgan Administrator",
            action: "created",
            note: "",
            at: asset.createdAt,
          },
        ],
        nextBefore: 0,
      });
    }
    if (path.endsWith("/assets/save")) {
      const existing = assets.find((asset) => asset.id === data.id);
      const asset = {
        ...(existing ?? assets[0]),
        id: existing?.id ?? "66666666-6666-4666-8666-666666666666",
        content: data.content,
        revision: (existing?.revision ?? 0) + 1,
      };
      assets = [...assets.filter((value) => value.id !== asset.id), asset];
      return json(asset);
    }
    if (path.endsWith("/assets/timeline")) {
      const all: TimelineRecord[] = [
        {
          id: "maintenance-evidence",
          kind: "maintenance",
          date: "2026-10-02",
          recordedAt: records[0].updatedAt,
          title: records[0].data.title,
          summary: records[0].data.details,
          sourceRecordId: records[0].id,
          periodKind: "calendar-date",
        },
        {
          id: "handover-evidence",
          kind: "handover",
          date: "2026-10-01",
          recordedAt: handover.updatedAt,
          title: "Vibration reported",
          summary: handover.content.details,
          sourceRecordId: handoverId,
          periodKind: "calendar-date",
        },
        {
          id: "analytics-evidence",
          kind: "analytics",
          date: "2026-10-01",
          recordedAt: "",
          title: "Daily drive alarms",
          summary:
            "Retained aggregate alarm evidence; reporting window is unknown.",
          sourceRecordId: `${importId}:42`,
          periodKind: "daily-aggregate",
          frequency: 12,
          seconds: 300,
        },
      ];
      const authorized =
        profile === "technician"
          ? all.filter((record) => record.kind !== "analytics")
          : all;
      const matching = authorized.filter(
        (record) => !data.kind || record.kind === data.kind,
      );
      const offset = data.cursor ? 2 : 0;
      return json({
        asset: assets.find((asset) => asset.id === data.id),
        records: matching.slice(offset, offset + 2),
        total: matching.length,
        nextCursor: matching.length > offset + 2 ? "timeline-page-2" : "",
        sources: [
          { kind: "maintenance", status: "available", total: 1 },
          { kind: "handover", status: "available", total: 1 },
          {
            kind: "analytics",
            status: profile === "technician" ? "not-authorized" : "available",
            total: profile === "technician" ? 0 : 1,
          },
        ],
      });
    }
    throw new Error(`Unexpected Maintenance/Assets request: ${path}`);
  });
  return {
    requests,
    assetId,
    recordId: records[0].id,
    sourceReport: handover,
    completedRecord: records.at(-1)!,
  };
}
