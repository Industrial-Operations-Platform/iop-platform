import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME, PlatformRuntime } from "./runtime";
import { BusinessException } from "./problem-details";
import {
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
} from "../persistence/site-operation";
import { WorkforceError, assert } from "../modules/workforce/domain/workforce";
import * as C from "./workforce-contracts";
@ApiTags("Workforce")
@Controller("api/v1/workforce")
export class WorkforceController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private async operation<T>(
    req: IncomingMessage,
    work: (r: PlatformRuntime, actor: string) => Promise<T>,
  ) {
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      assert(!req.url?.includes("?"));
      return await work(this.runtime, await this.runtime.actor(req));
    } catch (e) {
      if (e instanceof WorkforceError)
        throw new BusinessException(
          e.code === "workforce_denied"
            ? 403
            : e.code === "workforce_missing"
              ? 404
              : ["workforce_conflict", "workforce_overlap"].includes(e.code)
                ? 409
                : 400,
          e.code,
        );
      if (e instanceof SiteAccessDeniedError)
        throw new BusinessException(403, "workforce_denied");
      if (e instanceof AuthorizationUnavailableError)
        throw new ServiceUnavailableException();
      throw e;
    }
  }
  @Post("board")
  @ApiBody({ type: C.WorkforceRangeDto })
  @ApiCreatedResponse({ type: C.WorkforceBoardDto })
  board(@Req() req: IncomingMessage, @Body() body: C.WorkforceRangeDto) {
    return this.operation(req, (r, a) => {
      assert(body);
      return r.workforce.board(a, body.from, body.to);
    });
  }
  @Post("save")
  @ApiBody({ type: C.WorkforceSaveDto })
  @ApiCreatedResponse({ type: C.WorkforceRecordDto })
  save(@Req() req: IncomingMessage, @Body() body: C.WorkforceSaveDto) {
    return this.operation(req, (r, a) => r.workforce.save(a, body));
  }
  @Post("schedules/week")
  @ApiBody({ type: C.WorkforceWeekDto })
  @ApiCreatedResponse({ type: C.WorkforceResultDto })
  saveWeek(@Req() req: IncomingMessage, @Body() body: C.WorkforceWeekDto) {
    return this.operation(req, (runtime, actor) =>
      runtime.workforce.saveWeek(actor, body),
    );
  }
  @Post("preview")
  @ApiBody({ type: C.WorkforceImportDto })
  @ApiCreatedResponse({ type: [C.WorkforcePreviewDto] })
  preview(@Req() req: IncomingMessage, @Body() body: C.WorkforceImportDto) {
    return this.operation(req, (r, a) => r.workforce.preview(a, body));
  }
  @Post("import")
  @ApiBody({ type: C.WorkforceCommitDto })
  @ApiCreatedResponse({ type: C.WorkforceResultDto })
  commit(@Req() req: IncomingMessage, @Body() body: C.WorkforceCommitDto) {
    return this.operation(req, (r, a) => {
      assert(body);
      return r.workforce.import(a, body.input, body.revisions);
    });
  }
  @Post("history")
  @ApiBody({ type: C.WorkforceHistoryRequestDto })
  @ApiCreatedResponse({ type: [C.WorkforceRevisionDto] })
  history(
    @Req() req: IncomingMessage,
    @Body() body: C.WorkforceHistoryRequestDto,
  ) {
    return this.operation(req, (r, a) => {
      assert(body);
      return r.workforce.history(a, body.kind, body.id);
    });
  }
}
