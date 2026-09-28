import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME, PlatformRuntime } from "./runtime";
import { BusinessException } from "./problem-details";
import {
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
} from "../persistence/site-operation";
import {
  HandoverError,
  exact,
} from "../modules/shift-handover/domain/handover";
import * as C from "./handover-contracts";
@ApiTags("Shift Handover")
@Controller("api/v1/handover")
export class HandoverController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private async operation<T>(
    req: IncomingMessage,
    work: (r: PlatformRuntime, actor: string) => Promise<T>,
  ): Promise<T> {
    if (req.url?.includes("?")) throw new BadRequestException();
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      return await work(this.runtime, await this.runtime.actor(req));
    } catch (error) {
      if (error instanceof HandoverError)
        throw new BusinessException(
          error.code === "handover_denied"
            ? 403
            : error.code === "handover_missing"
              ? 404
              : error.code === "handover_conflict"
                ? 409
                : 400,
          error.code,
        );
      if (error instanceof SiteAccessDeniedError)
        throw new BusinessException(403, "handover_denied");
      if (error instanceof AuthorizationUnavailableError)
        throw new ServiceUnavailableException();
      throw error;
    }
  }
  @Get("context")
  @ApiOkResponse({ type: C.HandoverContextDto })
  context(@Req() req: IncomingMessage) {
    return this.operation(req, (r, a) => r.handover.context(a));
  }
  @Post("query")
  @ApiBody({ type: C.HandoverSelectionDto })
  @ApiCreatedResponse({ type: C.HandoverPageDto })
  query(@Req() req: IncomingMessage, @Body() body: C.HandoverSelectionDto) {
    return this.operation(req, (r, a) => r.handover.list(a, body));
  }
  @Post("entries")
  @ApiBody({ type: C.HandoverCreateDto })
  @ApiCreatedResponse({ type: C.HandoverEntryDto })
  create(@Req() req: IncomingMessage, @Body() body: C.HandoverCreateDto) {
    return this.operation(req, (r, a) => r.handover.create(a, body));
  }
  @Post("change")
  @ApiBody({ type: C.HandoverChangeDto })
  @ApiCreatedResponse({ type: C.HandoverEntryDto })
  change(@Req() req: IncomingMessage, @Body() body: C.HandoverChangeDto) {
    return this.operation(req, (r, a) => r.handover.change(a, body));
  }
  @Post("history")
  @ApiBody({ type: C.HandoverHistoryRequestDto })
  @ApiCreatedResponse({ type: C.HandoverHistoryDto })
  history(
    @Req() req: IncomingMessage,
    @Body() body: C.HandoverHistoryRequestDto,
  ) {
    return this.operation(req, (r, a) => {
      exact(body, ["id", "before"]);
      return r.handover.history(a, body.id, body.before);
    });
  }
}
