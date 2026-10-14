import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { UnauthorizedException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import { FormalHandoverController } from "../src/host/formal-handover-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import { SiteAccessDeniedError } from "../src/persistence/site-operation";
import { HandoverError } from "../src/modules/shift-handover/domain/handover";
import { FormalHandover } from "../src/modules/shift-handover/application/formal-records";

describe("Formal Handover transport", () => {
  let app: INestApplication;
  let actor: string, allowed: boolean;
  const service = { context: jest.fn(), shifts: jest.fn(), query: jest.fn(), save: jest.fn(), transition: jest.fn(), history: jest.fn(), previous: jest.fn(), candidates: jest.fn() };
  beforeEach(async () => {
    actor = "verified-manager"; allowed = true;
    for (const method of Object.values(service)) method.mockReset().mockImplementation(async () => {
      if (!allowed) throw new SiteAccessDeniedError();
      return { actorId: actor, canManageRecords: true };
    });
    const module = await Test.createTestingModule({ controllers: [FormalHandoverController], providers: [{ provide: PLATFORM_RUNTIME,
      useValue: { formalHandover: service as unknown as FormalHandover,
        actor: async () => { if (!actor) throw new UnauthorizedException(); return actor; } } }] }).compile();
    app = module.createNestApplication({ logger: false }); configureApplication(app); await app.init();
  });
  afterEach(async () => { await app.close(); });
  test("all routes derive identity from the verified principal and deny revoked access", async () => {
    const api = request(app.getHttpServer());
    await api.get("/api/v1/handover/records/context").expect(200).expect(({ body }) => expect(body.actorId).toBe(actor));
    for (const [path, body] of [
      ["shifts", { from: "2026-10-14", to: "2026-10-14", departmentId: "department", areaId: "", cursor: "" }],
      ["query", { from: "2026-10-14", to: "2026-10-14", departmentId: "", areaId: "", cursor: "" }],
      ["save", { key: "key", id: "", expectedRevision: 0, content: {}, note: "" }],
      ["transition", { id: "record", expectedRevision: 1, action: "publish", note: "Ready" }],
      ["history", { id: "record", before: 0 }], ["previous", { id: "record" }],
      ["candidates", { departmentId: "department", areaId: "", through: "2026-10-14" }],
    ] as const) {
      await api.post("/api/v1/handover/records/" + path).send(body).expect(201);
      expect(service[path]).toHaveBeenCalledWith(actor, ...(path === "history" ? ["record", 0] : [body]));
    }
    allowed = false;
    await api.get("/api/v1/handover/records/context").expect(403).expect(({ body }) => expect(body.code).toBe("handover_denied"));
    actor = ""; await api.get("/api/v1/handover/records/context").expect(401);
  });
  test("domain failures retain conflict/missing/capacity semantics and query-string bypass is rejected", async () => {
    const api = request(app.getHttpServer());
    for (const [code, status] of [["handover_conflict", 409], ["handover_missing", 404], ["handover_capacity", 503], ["handover_shift_unavailable", 400]] as const) {
      service.save.mockRejectedValueOnce(new HandoverError(code));
      await api.post("/api/v1/handover/records/save").send({}).expect(status).expect(({ body }) => expect(body.code).toBe(code));
    }
    await api.post("/api/v1/handover/records/history").send({ id: "record", before: 0, authorId: "forged" }).expect(400);
    await api.get("/api/v1/handover/records/context?actorId=forged").expect(400);
  });
});
