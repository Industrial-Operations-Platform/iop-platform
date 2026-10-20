import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AssetDomainController } from "../src/host/asset-domain-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import { createOpenApiDocument } from "../src/host/openapi";
import { domainFixture, enrichment, mappingInput, types } from "./asset-domain-fixture";
describe("Asset domain transport", () => {
  let app: INestApplication,
    actor = "admin";
  const f = domainFixture(["admin"]);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AssetDomainController],
      providers: [{
        provide: PLATFORM_RUNTIME,
        useValue: {
          assetDomain: f.app,
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
  test("publishes scoped type/reference/model/mapping and full-total Pareto contracts", async () => {
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save").send(enrichment("sensor", "sensor")).expect(201);
    const refs = await request(app.getHttpServer()).post("/api/v1/asset-domain/references").send({
      limit: 2
    }).expect(201);
    expect(refs.body.assets).toHaveLength(2);
    expect(refs.body.total).toBe(5);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save-mapping").send(mappingInput).expect(201);
    const source = await request(app.getHttpServer()).post("/api/v1/asset-domain/mapping-source").send(mappingInput.data.source).expect(201);
    expect(source.body.mapping.revision).toBe(1);
    expect(createOpenApiDocument(app).components?.schemas?.CanonicalAssetParetoDto).toBeDefined();
  });
  test("denies non-administrator access and rejects forged attribution/query scope/stale writes", async () => {
    for (const reader of ["leader", "task", "tech"]) {
      actor = reader;
      const denied = await request(app.getHttpServer()).post("/api/v1/asset-domain/catalog").send({}).expect(403);
      expect(denied.body.code).toBe("asset_domain_denied");
    }
    actor = "admin";
    await request(app.getHttpServer()).post("/api/v1/asset-domain/references?site=foreign").send({}).expect(400);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save").send({
      ...enrichment("sensor"),
      actorId: "forged"
    }).expect(400);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save").send(enrichment("sensor")).expect(409);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/detail").send({
      assetId: "foreign"
    }).expect(404);
  });
  test.each(["leader", "task"])("%s cannot enter standalone model, identity or source mapping endpoints", async (profile) => {
    actor = profile;
    await request(app.getHttpServer()).post("/api/v1/asset-domain/catalog").send({}).expect(403);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/references").send({}).expect(403);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/detail").send({ assetId: "sensor" }).expect(403);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save").send(enrichment("sensor")).expect(403);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/save-mapping").send(mappingInput).expect(403);
    await request(app.getHttpServer()).post("/api/v1/asset-domain/configure").send({ expectedRevision: 0, types: types() }).expect(403);
  });
});
