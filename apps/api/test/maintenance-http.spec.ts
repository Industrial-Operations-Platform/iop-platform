import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { MaintenanceController } from "../src/host/maintenance-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import {
  Maintenance,
  type Transaction,
} from "../src/modules/maintenance/application/maintenance";
import type {
  MaintenanceRecord,
  Revision,
  Settings,
} from "../src/modules/maintenance/domain/maintenance";
import {
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
} from "../src/persistence/site-operation";
describe("Maintenance HTTP transport", () => {
  let app: INestApplication;
  let actor = "worker";
  let unavailable = false;
  const records = new Map<string, MaintenanceRecord>();
  const revisions: Revision[] = [];
  let settings: Settings | null = null;
  const priorities = [{ id: "normal", label: "Normal", rank: 1 }];
  const input = {
    id: "http-work",
    expectedRevision: 0,
    reason: "",
    data: {
      title: "Inspect pump",
      details: "",
      locationId: "location",
      assetId: "",
      priorityId: "normal",
      assigneeId: "worker",
      teamId: "",
      status: "open" as const,
      dueDate: "",
      outcome: "",
      blockedReason: "",
      externalReference: "",
    },
  };
  beforeAll(async () => {
    const maintenance = new Maintenance(
      {
        run: async (currentActor, permission, work) => {
          if (unavailable) throw new AuthorizationUnavailableError();
          if (
            currentActor === "revoked" ||
            (permission === "maintenance.administer" &&
              currentActor !== "admin")
          )
            throw new SiteAccessDeniedError();
          const tx: Transaction = {
            canContribute: true,
            canCoordinate: currentActor === "admin",
            canAdminister: currentActor === "admin",
            people: async () => [
              { id: "worker", name: "Worker" },
              { id: "admin", name: "Administrator" },
              { id: "other", name: "Other" },
            ],
            names: async () => new Map(),
            teams: async () => [],
            assets: async () => [],
            asset: async () => null,
            settings: async () => settings,
            saveSettings: async (next) => {
              settings = next;
            },
            priorityUsed: async () => false,
            get: async (id) => records.get(id) ?? null,
            creation: async (id) =>
              revisions.find((revision) => revision.record.id === id) ?? null,
            save: async (record, revision) => {
              records.set(record.id, structuredClone(record));
              revisions.push(structuredClone(revision));
            },
            query: async () => ({
              records: [...records.values()],
              total: records.size,
              nextCursor: "",
              statusCounts: {
                open: records.size,
                "in-progress": 0,
                blocked: 0,
                done: 0,
              },
            }),
            history: async (id) => ({
              revisions: revisions.filter(
                (revision) => revision.record.id === id,
              ),
              nextBefore: 0,
            }),
          };
          return work(tx);
        },
      },
      [{ id: "location", parentId: "", label: "Workshop" }],
      priorities,
      () => "2026-10-05T12:00:00.000Z",
    );
    const module = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: PLATFORM_RUNTIME,
          useValue: { maintenance, actor: async () => actor },
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    actor = "worker";
    unavailable = false;
  });
  test("routes publish server attribution and typed query/history response", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/maintenance/save")
      .send(input)
      .expect(201);
    expect(response.body).toMatchObject({
      id: input.id,
      authorId: "worker",
      authorName: "Worker",
      revision: 1,
      canEdit: true,
      canReassign: false,
    });
    const query = await request(app.getHttpServer())
      .post("/api/v1/maintenance/query")
      .send({})
      .expect(201);
    expect(query.body.total).toBe(1);
    const history = await request(app.getHttpServer())
      .post("/api/v1/maintenance/history")
      .send({ id: input.id })
      .expect(201);
    expect(history.body.revisions[0]).toMatchObject({
      actorId: "worker",
      action: "created",
    });
    expect(history.body.nextBefore).toBe(0);
  });
  test("rejects undocumented privilege fields, invalid statuses/dates, query suffix and malformed history", async () => {
    for (const body of [
      { ...input, authorId: "admin" },
      { ...input, data: { ...input.data, status: "done" } },
      { ...input, data: { ...input.data, dueDate: "2026-02-30" } },
      { ...input, data: { ...input.data, dueDate: "0000-01-01" } },
    ]) {
      const result = await request(app.getHttpServer())
        .post("/api/v1/maintenance/save")
        .send(body)
        .expect(400);
      expect(result.body.code).toBe("invalid_maintenance");
      expect(result.body.traceId).toEqual(expect.any(String));
    }
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/query?site=foreign")
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/query")
      .send({ dueFrom: "0000-01-01" })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/history")
      .send({ id: input.id, before: -1 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/history")
      .send({ id: input.id, before: 2147483648 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/catalog")
      .send({ permissions: ["maintenance.coordinate"] })
      .expect(400);
  });
  test("maps ownership, conflict, missing and configuration permission to safe Problem Details", async () => {
    actor = "other";
    const denied = await request(app.getHttpServer())
      .post("/api/v1/maintenance/save")
      .send({ ...input, expectedRevision: 1, reason: "Unrelated edit" })
      .expect(403);
    expect(denied.body.code).toBe("maintenance_denied");
    actor = "worker";
    const conflict = await request(app.getHttpServer())
      .post("/api/v1/maintenance/save")
      .send({ ...input, expectedRevision: 7, reason: "Stale edit" })
      .expect(409);
    expect(conflict.body.code).toBe("maintenance_conflict");
    const missing = await request(app.getHttpServer())
      .post("/api/v1/maintenance/history")
      .send({ id: "missing" })
      .expect(404);
    expect(missing.body.code).toBe("maintenance_missing");
    await request(app.getHttpServer())
      .post("/api/v1/maintenance/settings")
      .send({ expectedRevision: 0, priorities })
      .expect(403);
    actor = "admin";
    const saved = await request(app.getHttpServer())
      .post("/api/v1/maintenance/settings")
      .send({ expectedRevision: 0, priorities })
      .expect(201);
    expect(saved.body.revision).toBe(1);
  });
  test("checks the current actor per request and sanitizes database unavailability", async () => {
    actor = "revoked";
    const denied = await request(app.getHttpServer())
      .post("/api/v1/maintenance/catalog")
      .send({})
      .expect(403);
    expect(denied.body.code).toBe("maintenance_denied");
    actor = "worker";
    unavailable = true;
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await request(app.getHttpServer())
        .post("/api/v1/maintenance/query")
        .send({})
        .expect(503);
      expect(result.body).toMatchObject({
        type: "urn:iop:problem:service-unavailable",
        status: 503,
      });
      expect(JSON.stringify(result.body)).not.toMatch(/database|SQL|password/i);
    } finally {
      log.mockRestore();
    }
  });
});
