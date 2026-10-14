import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ImprovementController } from "../src/host/improvement-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import { createOpenApiDocument } from "../src/host/openapi";
import { fixture, input, selection } from "./improvement-fixture";
describe("Improvement HTTP transport", () => {
  let app: INestApplication;
  let actor = "admin";
  const f = fixture();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ImprovementController],
      providers: [{
        provide: PLATFORM_RUNTIME,
        useValue: {
          improvements: f.app,
          actor: async () => actor
        }
      }]
    }).compile();
    app = module.createNestApplication({
      logger: false
    });
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    actor = "admin";
  });
  test("publishes typed action, notes, comparison and revision contracts", async () => {
    const created = await request(app.getHttpServer()).post("/api/v1/improvements/save").send(input).expect(201);
    expect(created.body).toMatchObject({
      authorId: "admin",
      revision: 1,
      assetName: "Drive"
    });
    await request(app.getHttpServer()).post("/api/v1/improvements/add-evidence").send({
      id: "http-note",
      actionId: input.id,
      expectedRevision: 1,
      kind: "note",
      note: "Review recorded.",
      externalReference: "",
      supersedesId: ""
    }).expect(201);
    const comparison = await request(app.getHttpServer()).post("/api/v1/improvements/compare").send({
      actionId: input.id,
      expectedRevision: 2,
      selection
    }).expect(201);
    expect(comparison.body.frequencyPerObservedDate.reductionPercent).toBe(40);
    const history = await request(app.getHttpServer()).post("/api/v1/improvements/history").send({
      id: input.id
    }).expect(201);
    expect(history.body.revisions[0].change).toBe("evidence-added");
    const api = createOpenApiDocument(app);
    expect(api.paths["/api/v1/improvements/save-comparison"].post).toBeDefined();
    expect(api.components?.schemas?.ImprovementComparisonDto).toBeDefined();
  });
  test("rejects forged attribution/totals, query suffix, stale revisions and foreign references", async () => {
    for (const body of [{
      ...input,
      authorId: "forged"
    }, {
      ...input,
      data: {
        ...input.data,
        target: {
          ...input.data.target,
          reductionPercent: -1
        }
      }
    }]) await request(app.getHttpServer()).post("/api/v1/improvements/save").send(body).expect(400);
    await request(app.getHttpServer()).post("/api/v1/improvements/query?site=foreign").send({}).expect(400);
    const stale = await request(app.getHttpServer()).post("/api/v1/improvements/compare").send({
      actionId: input.id,
      expectedRevision: 1,
      selection
    }).expect(409);
    expect(stale.body.code).toBe("improvement_conflict");
    await request(app.getHttpServer()).post("/api/v1/improvements/save-comparison").send({
      id: "forged",
      actionId: input.id,
      expectedRevision: 2,
      selection,
      note: "",
      frequency: 0
    }).expect(400);
    await request(app.getHttpServer()).post("/api/v1/improvements/history").send({
      id: "foreign"
    }).expect(404);
  });
  test("current profile/access denial is enforced on every route", async () => {
    actor = "technician";
    const denied = await request(app.getHttpServer()).post("/api/v1/improvements/catalog").send({}).expect(403);
    expect(denied.body.code).toBe("improvement_denied");
    actor = "taskforce";
    await request(app.getHttpServer()).post("/api/v1/improvements/query").send({}).expect(201);
    f.setDenied(true);
    await request(app.getHttpServer()).post("/api/v1/improvements/query").send({}).expect(403);
    f.setDenied(false);
  });
});
