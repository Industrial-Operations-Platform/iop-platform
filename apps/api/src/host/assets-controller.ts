import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  BadRequestException,
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
import { AssetError, exact } from "../modules/assets/domain/assets";
import * as C from "./assets-contracts";
@ApiTags("Asset Management")
@Controller("api/v1/assets")
export class AssetsController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private async operation<T>(
    req: IncomingMessage,
    work: (runtime: PlatformRuntime, actor: string) => Promise<T>,
  ): Promise<T> {
    if (req.url?.includes("?")) throw new BadRequestException();
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      return await work(this.runtime, await this.runtime.actor(req));
    } catch (error) {
      if (error instanceof AssetError)
        throw new BusinessException(
          error.code === "asset_denied"
            ? 403
            : error.code === "asset_missing"
              ? 404
              : [
                    "asset_conflict",
                    "asset_alias_conflict",
                    "asset_capacity",
                  ].includes(error.code)
                ? 409
                : 400,
          error.code,
        );
      if (error instanceof SiteAccessDeniedError)
        throw new BusinessException(403, "asset_denied");
      if (error instanceof AuthorizationUnavailableError)
        throw new ServiceUnavailableException();
      throw error;
    }
  }
  @Post("context")
  @ApiBody({ type: C.AssetsContextRequestDto })
  @ApiCreatedResponse({ type: C.AssetsContextDto })
  context(
    @Req() req: IncomingMessage,
    @Body() body: C.AssetsContextRequestDto,
  ) {
    return this.operation(req, (runtime, actor) => {
      exact(body, []);
      return runtime.assets.context(actor);
    });
  }
  @Post("query")
  @ApiBody({ type: C.AssetSelectionDto })
  @ApiCreatedResponse({ type: C.AssetPageDto })
  query(@Req() req: IncomingMessage, @Body() body: C.AssetSelectionDto) {
    return this.operation(req, (runtime, actor) =>
      runtime.assets.query(actor, body),
    );
  }
  @Post("save")
  @ApiBody({ type: C.AssetSaveDto })
  @ApiCreatedResponse({ type: C.AssetDto })
  save(@Req() req: IncomingMessage, @Body() body: C.AssetSaveDto) {
    return this.operation(req, (runtime, actor) =>
      runtime.assets.save(actor, body),
    );
  }
  @Post("equipment-catalog")
  @ApiBody({ type: C.AssetEquipmentSelectionDto })
  @ApiCreatedResponse({ type: C.AssetEquipmentPageDto })
  equipmentCatalog(
    @Req() req: IncomingMessage,
    @Body() body: C.AssetEquipmentSelectionDto,
  ) {
    return this.operation(req, (runtime, actor) =>
      runtime.assets.equipmentCatalog(actor, body),
    );
  }
  @Post("detail")
  @ApiBody({ type: C.AssetDetailRequestDto })
  @ApiCreatedResponse({ type: C.AssetDto })
  detail(@Req() req: IncomingMessage, @Body() body: C.AssetDetailRequestDto) {
    return this.operation(req, (runtime, actor) => {
      exact(body, ["id"]);
      return runtime.assets.detail(actor, body.id);
    });
  }
  @Post("history")
  @ApiBody({ type: C.AssetHistoryRequestDto })
  @ApiCreatedResponse({ type: C.AssetHistoryDto })
  history(@Req() req: IncomingMessage, @Body() body: C.AssetHistoryRequestDto) {
    return this.operation(req, (runtime, actor) => {
      exact(body, ["id", "before"]);
      return runtime.assets.history(actor, body.id, body.before);
    });
  }
  @Post("timeline")
  @ApiBody({ type: C.AssetTimelineRequestDto })
  @ApiCreatedResponse({ type: C.AssetTimelinePageDto })
  timeline(
    @Req() req: IncomingMessage,
    @Body() body: C.AssetTimelineRequestDto,
  ) {
    return this.operation(req, (runtime, actor) =>
      runtime.assets.timeline(actor, body),
    );
  }
}
