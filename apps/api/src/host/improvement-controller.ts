import { Body, Controller, Inject, Post, Req, ServiceUnavailableException } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME } from "./runtime";
import { BusinessException } from "./problem-details";
import { SiteAccessDeniedError, AuthorizationUnavailableError } from "../persistence/site-operation";
import { AnalyticsError } from "../modules/oip/domain/values";
import { ImprovementError, assert } from "../modules/improvement-tracking/domain/improvement";
import type { Improvements } from "../modules/improvement-tracking/application/improvement";
import * as C from "./improvement-contracts";
interface ImprovementRuntime {
  actor(req: IncomingMessage): Promise<string>;
  improvements: Improvements;
}
const status: Record<ImprovementError["code"], number> = {
  invalid_improvement: 400,
  improvement_denied: 403,
  improvement_missing: 404,
  improvement_conflict: 409,
  improvement_capacity: 503,
  improvement_analytics_unavailable: 503
};
@ApiTags("Improvement Tracking")
@Controller("api/v1/improvements")
export class ImprovementController {
  constructor(@Inject(PLATFORM_RUNTIME)
  private readonly runtime: ImprovementRuntime | null) {}
  private async operation<T>(req: IncomingMessage, work: (app: Improvements, actor: string) => Promise<T>) {
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      assert(!req.url?.includes("?"));
      return await work(this.runtime.improvements, await this.runtime.actor(req));
    } catch (error) {
      if (error instanceof ImprovementError) throw new BusinessException(status[error.code], error.code);
      if (error instanceof SiteAccessDeniedError) throw new BusinessException(403, "improvement_denied");
      if (error instanceof AuthorizationUnavailableError) throw new ServiceUnavailableException();
      if (error instanceof AnalyticsError) throw new BusinessException(error.code === "analytics_total_out_of_range" ? 422 : 503, "improvement_analytics_unavailable");
      throw error;
    }
  }
  @Post("catalog")
  @ApiCreatedResponse({
    type: C.ImprovementCatalogDto
  })
  catalog(@Req()
  req: IncomingMessage, @Body()
  body: object) {
    return this.operation(req, (app, actor) => {
      assert(body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 0);
      return app.catalog(actor);
    });
  }
  @Post("issues")
  @ApiBody({
    type: C.ImprovementIssueQueryDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementIssuePageDto
  })
  issues(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementIssueQueryDto) {
    return this.operation(req, (app, actor) => app.issues(actor, body));
  }
  @Post("query")
  @ApiBody({
    type: C.ImprovementSelectionDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementPageDto
  })
  query(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementSelectionDto) {
    return this.operation(req, (app, actor) => app.query(actor, body));
  }
  @Post("save")
  @ApiBody({
    type: C.ImprovementSaveDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementViewDto
  })
  save(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementSaveDto) {
    return this.operation(req, (app, actor) => app.save(actor, body));
  }
  @Post("history")
  @ApiBody({
    type: C.ImprovementHistoryRequestDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementHistoryDto
  })
  history(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementHistoryRequestDto) {
    return this.operation(req, (app, actor) => {
      allowedKeys(body, ["id", "before", "limit"]);
      return app.history(actor, body.id, body.before ?? 0, body.limit ?? 30);
    });
  }
  @Post("add-evidence")
  @ApiBody({
    type: C.ImprovementEvidenceRequestDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementEvidenceSavedDto
  })
  addEvidence(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementEvidenceRequestDto) {
    return this.operation(req, (app, actor) => app.addEvidence(actor, body));
  }
  @Post("evidence")
  @ApiBody({
    type: C.ImprovementCollectionRequestDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementEvidencePageDto
  })
  evidence(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementCollectionRequestDto) {
    return this.operation(req, (app, actor) => {
      allowedKeys(body, ["id", "cursor", "limit"]);
      return app.evidence(actor, body.id, body.cursor ?? "", body.limit ?? 30);
    });
  }
  @Post("compare")
  @ApiBody({
    type: C.ImprovementCompareDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementComparisonDto
  })
  compare(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementCompareDto) {
    return this.operation(req, (app, actor) => app.compare(actor, body));
  }
  @Post("save-comparison")
  @ApiBody({
    type: C.ImprovementSaveComparisonDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementComparisonSavedDto
  })
  saveComparison(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementSaveComparisonDto) {
    return this.operation(req, (app, actor) => app.saveComparison(actor, body));
  }
  @Post("comparisons")
  @ApiBody({
    type: C.ImprovementCollectionRequestDto
  })
  @ApiCreatedResponse({
    type: C.ImprovementComparisonPageDto
  })
  comparisons(@Req()
  req: IncomingMessage, @Body()
  body: C.ImprovementCollectionRequestDto) {
    return this.operation(req, (app, actor) => {
      allowedKeys(body, ["id", "cursor", "limit"]);
      return app.comparisons(actor, body.id, body.cursor ?? "", body.limit ?? 30);
    });
  }
}
function allowedKeys(body: object, keys: string[]) {
  assert(body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).every(k => keys.includes(k)));
}
