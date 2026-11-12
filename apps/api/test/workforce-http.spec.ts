import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { UnauthorizedException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import { WorkforceController } from "../src/host/workforce-controller";
import { PLATFORM_RUNTIME } from "../src/host/runtime";
import { configureApplication } from "../src/host/application";
import { WorkforceError } from "../src/modules/workforce/domain/workforce";

describe("schedule proposal transport", () => {
  let app: INestApplication;
  let actor: string;
  const service = { previewProposal: jest.fn(), saveProposal: jest.fn() };
  beforeEach(async () => {
    actor = "verified-leader";
    service.previewProposal.mockReset().mockResolvedValue({ from: "2026-11-01", to: "2026-11-15", people: [] });
    service.saveProposal.mockReset().mockResolvedValue({ changed: 1, unchanged: 0 });
    const module = await Test.createTestingModule({ controllers: [WorkforceController], providers: [{ provide: PLATFORM_RUNTIME,
      useValue: { workforce: service, actor: async () => { if (!actor) throw new UnauthorizedException(); return actor; } },
    }] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
  });
  afterEach(async () => { await app.close(); });
  test("preview and save derive the actor from the session and preserve conflict and denial responses", async () => {
    const api = request(app.getHttpServer());
    const proposal = { weeks: [{ userId: "tech", weekStart: "2026-11-09", days: [{ date: "2026-11-09", status: "work", start: "05:00", end: "14:15", expectedRevision: 0 }] }] };
    const preview = { ...proposal, from: "2026-11-01", to: "2026-11-15" };
    await api.post("/api/v1/workforce/schedules/preview").send(preview).expect(201);
    expect(service.previewProposal).toHaveBeenCalledWith(actor, preview);
    expect(service.saveProposal).not.toHaveBeenCalled();
    await api.post("/api/v1/workforce/schedules/proposal").send(proposal).expect(201);
    expect(service.saveProposal).toHaveBeenCalledWith(actor, proposal);
    service.saveProposal.mockRejectedValueOnce(new WorkforceError("workforce_conflict"));
    await api.post("/api/v1/workforce/schedules/proposal").send(proposal).expect(409);
    service.previewProposal.mockRejectedValueOnce(new WorkforceError("workforce_denied"));
    await api.post("/api/v1/workforce/schedules/preview").send(preview).expect(403);
    await api.post("/api/v1/workforce/schedules/preview?actor=admin").send(preview).expect(400);
    actor = "";
    await api.post("/api/v1/workforce/schedules/proposal").send(proposal).expect(401);
  });
});
