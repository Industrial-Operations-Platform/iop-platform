import type { Page } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";
import { emptyAction, statuses, type ActionView, type Catalog } from "../src/features/improvement-tracking/domain/models";
import { emptyEnrichment, type Context, type Enrichment, type ReferencePage } from "../src/features/assets-domain/domain/models";
import type { ConnectionReadiness } from "../src/features/integrations/domain/models";

const recordedAt = "2026-10-14T12:00:00.000Z";
const owner = { id: "admin", name: "Morgan Administrator" };
const references: ReferencePage = {
  assets: [
    { id: "sensor", code: "SENSOR-001", name: "Assembly guard sensor", status: "validated" },
    { id: "conveyor", code: "CONVEYOR-001", name: "Assembly conveyor", status: "validated" },
    { id: "controller", code: "PLC-001", name: "Conveyor controller", status: "unverified" },
  ],
  enrichments: [
    { assetId: "sensor", revision: 2, typeId: "sensor", parentId: "conveyor", surveyStatus: "pending" },
    { assetId: "conveyor", revision: 1, typeId: "generic", parentId: "", surveyStatus: "validated" },
    { assetId: "controller", revision: 1, typeId: "controller", parentId: "", surveyStatus: "rejected" },
  ],
  total: 3,
  nextCursor: "",
};
const model: Enrichment = {
  assetId: "sensor",
  revision: 2,
  data: {
    ...emptyEnrichment(),
    typeId: "sensor",
    parentId: "conveyor",
    controllers: [{ kind: "controlled-by", targetId: "controller", channel: "DI-1" }],
    manufacturer: "Example Instruments",
    model: "Guard sensor 24V",
    serial: "EX-240015",
    metadata: { voltage: 24 },
    survey: { status: "pending", note: "Confirm the physical identifier during the next planned inspection.", evidenceReference: "Inspection register 42" },
  },
  actorId: owner.id,
  actorName: owner.name,
  updatedAt: recordedAt,
  surveyReviewerId: "",
  surveyReviewerName: "",
  surveyReviewedAt: "",
};
const assetContext: Context = {
  canManage: true,
  sourceId: "fixture-source",
  catalog: { revision: 1, types: [
    { id: "generic", label: "Generic asset", active: true, canContain: true, isController: false, fields: [] },
    { id: "sensor", label: "Sensor", active: true, canContain: false, isController: false,
      fields: [{ key: "voltage", label: "Voltage", kind: "number", required: false, unit: "V" }] },
    { id: "controller", label: "Controller", active: true, canContain: false, isController: true, fields: [] },
  ] },
};
const improvementCatalog: Catalog = {
  actorId: owner.id,
  canContribute: true,
  canCoordinate: true,
  people: [owner, { id: "leader", name: "Jordan Team Leader" }],
  locations: [{ id: "assembly", label: "Assembly", parentId: "" }],
  assets: references.assets,
};
const actions: ActionView[] = [
  { title: "Reduce repeated guard alarms", status: "in-progress", evidence: 3 },
  { title: "Inspect intermittent controller communication before the next planned stop", status: "blocked", evidence: 1 },
  { title: "Review conveyor sensor alignment", status: "planned", evidence: 0 },
].map((row, index) => ({
  id: `action-${index + 1}`,
  revision: 2,
  data: {
    ...emptyAction("assembly"),
    title: row.title,
    status: row.status as ActionView["data"]["status"],
    assetId: "sensor",
    ownerId: owner.id,
    dueDate: "2026-10-29",
    hypothesis: "Retain inspection evidence and compare observed reporting dates before drawing conclusions.",
    blockedReason: row.status === "blocked" ? "Awaiting the planned inspection window." : "",
    target: { objective: "Reduce reported frequency by 20%", metric: "frequency", reductionPercent: 20 },
  },
  authorId: owner.id,
  authorName: owner.name,
  ownerName: owner.name,
  assetName: "Assembly guard sensor",
  issueTitle: "",
  locationLabel: "Assembly",
  createdAt: recordedAt,
  updatedAt: recordedAt,
  evidenceCount: row.evidence,
  comparisonCount: 0,
  canEdit: true,
  canCoordinate: true,
}));
const connections: ConnectionReadiness[] = [
  { kind: "wincc", label: "WinCC", enabled: false, status: "disabled" },
  { kind: "ultimo", label: "Ultimo", enabled: true, status: "configuration-pending" },
  { kind: "entra", label: "Microsoft Entra", enabled: true, status: "transport-pending" },
].map(row => ({
  configuration: {
    kind: row.kind as ConnectionReadiness["configuration"]["kind"],
    label: row.label,
    enabled: row.enabled,
    endpoint: "",
    contractVersion: "",
    credentialReference: "",
    tenantId: "",
    clientId: "",
  },
  revision: 1,
  updatedAt: recordedAt,
  updatedBy: owner.id,
  status: row.status as ConnectionReadiness["status"],
  adapter: "contract-ready",
  lastSuccessfulConnection: null,
  missingInputs: ["Authorized provider endpoint", "Provider transport implementation"],
}));

/** Browser-only presentation fixtures. No real provider or persisted plant data is used. */
export async function installDesktopConsistencyFixture(page: Page) {
  const base = await installMaintenanceAssetsFixture(page, "administrator");
  const unexpectedRequests: string[] = [];
  await page.route(/\/api\/v1\/(improvements|asset-domain|integrations)\//, async route => {
    const path = new URL(route.request().url()).pathname;
    const input = route.request().postDataJSON() ?? {};
    const json = (value: unknown) => route.fulfill({ json: value });
    if (path === "/api/v1/improvements/catalog") return json(improvementCatalog);
    if (path === "/api/v1/improvements/query") {
      const matching = actions.filter(action =>
        (!input.search || action.data.title.toLowerCase().includes(input.search.toLowerCase())) &&
        (!input.status || action.data.status === input.status) &&
        (!input.ownerId || action.data.ownerId === input.ownerId) &&
        (!input.locationId || action.data.locationId === input.locationId));
      return json({ actions: matching, total: matching.length, nextCursor: "", statusCounts: Object.fromEntries(statuses.map(status => [status, matching.filter(action => action.data.status === status).length])) });
    }
    if (path === "/api/v1/improvements/issues") return json({ issues: [], nextCursor: "" });
    if (path === "/api/v1/improvements/history") {
      const action = actions.find(action => action.id === input.id)!;
      return json({ action, revisions: [{ action, actorId: owner.id, actorName: owner.name, at: recordedAt, change: "updated", reason: "Inspection scope reviewed with the incoming team.", referenceId: "" }], nextBefore: 0 });
    }
    if (path === "/api/v1/improvements/evidence") {
      const action = actions.find(action => action.id === input.id)!;
      return json({ evidence: [
        "Reviewed the retained reporting dates with the incoming team.",
        "Prepared the inspection scope for the next planned stop.",
        "Confirmed that source measures describe aggregate alarms.",
      ].slice(0, action.evidenceCount).map((note, index) => ({
        id: `${action.id}-evidence-${index + 1}`, actionId: action.id, actionRevision: action.revision,
        kind: "note", note, externalReference: "Inspection register 42", supersedesId: "",
        actorId: owner.id, actorName: owner.name, at: recordedAt,
      })), nextCursor: "" });
    }
    if (path === "/api/v1/improvements/comparisons") return json({ comparisons: [], nextCursor: "" });
    if (path === "/api/v1/asset-domain/catalog") return json(assetContext);
    if (path === "/api/v1/asset-domain/references") {
      const matching = references.assets.filter(asset => !input.search || `${asset.code} ${asset.name}`.toLowerCase().includes(input.search.toLowerCase()));
      return json({ assets: matching, enrichments: references.enrichments.filter(model => matching.some(asset => asset.id === model.assetId)), total: matching.length, nextCursor: "" });
    }
    if (path === "/api/v1/asset-domain/detail") return json({ asset: references.assets.find(asset => asset.id === input.assetId), enrichment: input.assetId === model.assetId ? model : null, related: references.assets, canManage: true });
    if (path === "/api/v1/asset-domain/history") return json({ revisions: input.assetId === model.assetId ? [{ enrichment: model, reason: "Retained sensor and controller references after review.", actorId: owner.id, actorName: owner.name, at: recordedAt }] : [], nextBefore: 0 });
    if (path === "/api/v1/asset-domain/mapping-query") return json({ mappings: [], total: 0, nextCursor: "" });
    if (path === "/api/v1/asset-domain/candidates") return json({ candidates: [], total: 0, nextCursor: "" });
    if (path === "/api/v1/integrations/query") return json({ connections });
    if (path === "/api/v1/integrations/history") return json({ revisions: [] });
    unexpectedRequests.push(path);
    return route.fulfill({ status: 405, json: { code: "fixture_read_only" } });
  });
  return { ...base, unexpectedRequests };
}
