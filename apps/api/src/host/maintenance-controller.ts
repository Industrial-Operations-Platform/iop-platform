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
import {
  MaintenanceError,
  assert,
} from "../modules/maintenance/domain/maintenance";
import * as C from "./maintenance-contracts";
const statuses: Record<MaintenanceError["code"], number> = {
  invalid_maintenance: 400,
  maintenance_denied: 403,
  maintenance_missing: 404,
  maintenance_conflict: 409,
  maintenance_capacity: 503,
};
@ApiTags("Maintenance")
@Controller("api/v1/maintenance")
export class MaintenanceController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private async operation<T>(
    req: IncomingMessage,
    work: (runtime: PlatformRuntime, actor: string) => Promise<T>,
  ) {
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      assert(!req.url?.includes("?"));
      return await work(this.runtime, await this.runtime.actor(req));
    } catch (error) {
      if (error instanceof MaintenanceError)
        throw new BusinessException(statuses[error.code], error.code);
      if (error instanceof SiteAccessDeniedError)
        throw new BusinessException(403, "maintenance_denied");
      if (error instanceof AuthorizationUnavailableError)
        throw new ServiceUnavailableException();
      throw error;
    }
  }
  @Post("catalog")
  @ApiCreatedResponse({ type: C.MaintenanceCatalogDto })
  catalog(@Req() req: IncomingMessage, @Body() body: object) {
    return this.operation(req, (runtime, actor) => {
      assert(
        body &&
          typeof body === "object" &&
          !Array.isArray(body) &&
          Object.keys(body).length === 0,
      );
      return runtime.maintenance.catalog(actor);
    });
  }
  @Post("query")
  @ApiBody({ type: C.MaintenanceSelectionDto })
  @ApiCreatedResponse({ type: C.MaintenancePageDto })
  query(@Req() req: IncomingMessage, @Body() body: C.MaintenanceSelectionDto) {
    return this.operation(req, (runtime, actor) =>
      runtime.maintenance.query(actor, body),
    );
  }
  @Post("save")
  @ApiBody({ type: C.MaintenanceSaveDto })
  @ApiCreatedResponse({ type: C.MaintenanceViewDto })
  save(@Req() req: IncomingMessage, @Body() body: C.MaintenanceSaveDto) {
    return this.operation(req, (runtime, actor) =>
      runtime.maintenance.save(actor, body),
    );
  }
  @Post("settings")
  @ApiBody({ type: C.MaintenanceConfigureDto })
  @ApiCreatedResponse({ type: C.MaintenanceSettingsDto })
  settings(
    @Req() req: IncomingMessage,
    @Body() body: C.MaintenanceConfigureDto,
  ) {
    return this.operation(req, (runtime, actor) =>
      runtime.maintenance.configure(actor, body),
    );
  }
  @Post("history")
  @ApiBody({ type: C.MaintenanceHistoryRequestDto })
  @ApiCreatedResponse({ type: C.MaintenanceHistoryDto })
  history(
    @Req() req: IncomingMessage,
    @Body() body: C.MaintenanceHistoryRequestDto,
  ) {
    return this.operation(req, (runtime, actor) => {
      assert(
        body &&
          typeof body === "object" &&
          !Array.isArray(body) &&
          Object.keys(body).every((key) =>
            ["id", "before", "limit"].includes(key),
          ),
      );
      return runtime.maintenance.history(
        actor,
        body.id,
        body.before ?? 0,
        body.limit ?? 50,
      );
    });
  }
}
