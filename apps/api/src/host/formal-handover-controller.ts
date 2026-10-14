import { Body, Controller, Get, Inject, Post, Req, ServiceUnavailableException } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME, type PlatformRuntime } from "./runtime";
import { BusinessException } from "./problem-details";
import { SiteAccessDeniedError, AuthorizationUnavailableError } from "../persistence/site-operation";
import { HandoverError, exact } from "../modules/shift-handover/domain/handover";
import type { FormalHandover } from "../modules/shift-handover/application/formal-records";
import * as C from "./formal-handover-contracts";

@ApiTags("Formal Shift Handover")
@Controller("api/v1/handover/records")
export class FormalHandoverController {
  constructor(@Inject(PLATFORM_RUNTIME) private readonly runtime: (PlatformRuntime & { formalHandover: FormalHandover }) | null) {}
  private async operation<T>(req: IncomingMessage, work: (app: FormalHandover, actor: string) => Promise<T>): Promise<T> {
    if (!this.runtime?.formalHandover) throw new ServiceUnavailableException();
    try {
      if (req.url?.includes("?")) throw new HandoverError("invalid_handover");
      return await work(this.runtime.formalHandover, await this.runtime.actor(req));
    } catch (error) {
      if (error instanceof SiteAccessDeniedError) throw new BusinessException(403, "handover_denied");
      if (error instanceof AuthorizationUnavailableError) throw new ServiceUnavailableException();
      if (error instanceof HandoverError) throw new BusinessException(
        error.code === "handover_denied" ? 403 : error.code === "handover_missing" ? 404 :
          error.code === "handover_conflict" ? 409 : error.code === "handover_capacity" ? 503 : 400, error.code);
      throw error;
    }
  }
  @Get("context") @ApiOkResponse({ type: C.FormalHandoverContextDto })
  context(@Req() req: IncomingMessage) { return this.operation(req, (app, actor) => app.context(actor)); }
  @Post("shifts") @ApiBody({ type: C.FormalHandoverSelectionDto }) @ApiCreatedResponse({ type: C.FormalHandoverShiftsDto })
  shifts(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverSelectionDto) { return this.operation(req, (app, actor) => app.shifts(actor, body)); }
  @Post("query") @ApiBody({ type: C.FormalHandoverSelectionDto }) @ApiCreatedResponse({ type: C.FormalHandoverPageDto })
  query(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverSelectionDto) { return this.operation(req, (app, actor) => app.query(actor, body)); }
  @Post("save") @ApiBody({ type: C.FormalHandoverSaveDto }) @ApiCreatedResponse({ type: C.FormalHandoverRecordDto })
  save(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverSaveDto) { return this.operation(req, (app, actor) => app.save(actor, body)); }
  @Post("transition") @ApiBody({ type: C.FormalHandoverTransitionDto }) @ApiCreatedResponse({ type: C.FormalHandoverRecordDto })
  transition(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverTransitionDto) { return this.operation(req, (app, actor) => app.transition(actor, body)); }
  @Post("history") @ApiBody({ type: C.FormalHandoverHistoryRequestDto }) @ApiCreatedResponse({ type: C.FormalHandoverHistoryDto })
  history(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverHistoryRequestDto) { return this.operation(req, (app, actor) => { exact(body, ["id", "before"]); return app.history(actor, body.id, body.before); }); }
  @Post("previous") @ApiBody({ type: C.FormalHandoverPreviousRequestDto }) @ApiCreatedResponse({ type: C.FormalHandoverPreviousDto })
  previous(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverPreviousRequestDto) { return this.operation(req, (app, actor) => app.previous(actor, body)); }
  @Post("candidates") @ApiBody({ type: C.FormalHandoverCandidatesRequestDto }) @ApiCreatedResponse({ type: C.FormalHandoverCandidatesDto })
  candidates(@Req() req: IncomingMessage, @Body() body: C.FormalHandoverCandidatesRequestDto) { return this.operation(req, (app, actor) => app.candidates(actor, body)); }
}
