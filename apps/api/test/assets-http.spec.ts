import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { UnauthorizedException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import { AssetsController } from "../src/host/assets-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import {
  Assets,
  type Transaction,
} from "../src/modules/assets/application/assets";
import type { Asset, AssetRevision } from "../src/modules/assets/domain/assets";
import { SiteAccessDeniedError } from "../src/persistence/site-operation";
describe("Asset transport contract", () => {
  let app: INestApplication,
    tx: Transaction,
    authenticated: boolean,
    allowed: boolean;
  let saved: Asset | null, evidence: AssetRevision[];
  const content = {
    code: "0001",
    name: "Drive",
    type: "Motor",
    locationId: "",
    status: "unverified",
    validationNote: "",
    description: "",
    aliases: [],
  };
  const input = {
    key: "request",
    id: "",
    expectedRevision: 0,
    note: "",
    content,
  };
  beforeEach(async () => {
    saved = null;
    evidence = [];
    authenticated = true;
    allowed = true;
    tx = {
      canManage: true,
      name: async () => "Verified administrator",
      get: async () => saved,
      prior: async () => null,
      save: async (asset, revision) => {
        saved = structuredClone(asset);
        evidence.push(structuredClone(revision));
      },
      list: async () => ({
        assets: saved ? [saved] : [],
        total: saved ? 1 : 0,
        nextCursor: "",
      }),
      history: async (asset) => ({ asset, revisions: evidence, nextBefore: 0 }),
      sources: async () => [{ kind: "analytics", status: "not-authorized" }],
    };
    const application = new Assets(
      {
        run: async (_actor, _permission, work) => {
          if (!allowed) throw new SiteAccessDeniedError();
          return work(tx);
        },
      },
      [],
      "UTC",
      () => "asset-id",
      () => "2026-10-05T12:00:00.000Z",
    );
    const module = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: PLATFORM_RUNTIME,
          useValue: {
            assets: application,
            actor: async () => {
              if (!authenticated) throw new UnauthorizedException();
              return "verified-admin";
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });
  test("all registered routes use verified authorship and expose source coverage through the reviewed DTO boundary", async () => {
    const api = request(app.getHttpServer());
    await api
      .post("/api/v1/assets/context")
      .send({})
      .expect(201)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          actorId: "verified-admin",
          canManage: true,
          timeZone: "UTC",
        }),
      );
    const created = (
      await api.post("/api/v1/assets/save").send(input).expect(201)
    ).body;
    expect(created).toMatchObject({
      authorId: "verified-admin",
      authorName: "Verified administrator",
      revision: 1,
    });
    await api
      .post("/api/v1/assets/detail")
      .send({ id: created.id })
      .expect(201, created);
    await api
      .post("/api/v1/assets/query")
      .send({ search: "", status: "", locationId: "", cursor: "" })
      .expect(201)
      .expect(({ body }) => expect(body.total).toBe(1));
    await api
      .post("/api/v1/assets/history")
      .send({ id: created.id, before: 0 })
      .expect(201)
      .expect(({ body }) => expect(body.revisions).toHaveLength(1));
    await api
      .post("/api/v1/assets/timeline")
      .send({
        id: created.id,
        from: "2026-10-05",
        to: "2026-10-05",
        cursor: "",
        kind: "analytics",
      })
      .expect(201)
      .expect(({ body }) =>
        expect(body.sources).toEqual([
          { kind: "analytics", status: "not-authorized", total: 0 },
        ]),
      );
  });
  test("authenticating and authorizing each operation prevents direct protected access", async () => {
    authenticated = false;
    await request(app.getHttpServer())
      .post("/api/v1/assets/context")
      .send({})
      .expect(401);
    authenticated = true;
    allowed = false;
    const denied = await request(app.getHttpServer())
      .post("/api/v1/assets/save")
      .send(input)
      .expect(403);
    expect(denied.body.code).toBe("asset_denied");
    expect(saved).toBeNull();
  });
  test("missing, stale and malformed requests return safe business errors without reflecting payloads", async () => {
    const api = request(app.getHttpServer());
    await api
      .post("/api/v1/assets/detail")
      .send({ id: "missing" })
      .expect(404)
      .expect(({ body }) => expect(body.code).toBe("asset_missing"));
    await api
      .post("/api/v1/assets/save")
      .send({ ...input, authorId: "ATTACKER_SECRET" })
      .expect(400)
      .expect(({ body }) =>
        expect(JSON.stringify(body)).not.toContain("ATTACKER_SECRET"),
      );
    const created = (
      await api.post("/api/v1/assets/save").send(input).expect(201)
    ).body;
    await api
      .post("/api/v1/assets/save")
      .send({
        key: "",
        id: created.id,
        expectedRevision: 2,
        note: "Stale edit",
        content,
      })
      .expect(409)
      .expect(({ body }) => expect(body.code).toBe("asset_conflict"));
    await api
      .post("/api/v1/assets/context?permission=assets.manage")
      .send({})
      .expect(400);
    await api
      .post("/api/v1/assets/timeline")
      .send({
        id: created.id,
        from: "2026-02-30",
        to: "2026-03-01",
        cursor: "",
      })
      .expect(400);
  });
  test("unexpected storage failures are sanitized and correlated", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    tx.get = async () => {
      throw new Error("PRIVATE SQL user password");
    };
    const result = await request(app.getHttpServer())
      .post("/api/v1/assets/detail")
      .send({ id: "asset" })
      .expect(500);
    expect(result.body).toEqual({
      type: "urn:iop:problem:internal-server-error",
      title: "Internal Server Error",
      status: 500,
      traceId: expect.any(String),
    });
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({
        event: "api.request.failed",
        status: 500,
        traceId: result.body.traceId,
      }),
    );
  });
});
