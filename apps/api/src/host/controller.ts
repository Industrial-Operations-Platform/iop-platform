import { ImportBusyError } from "../modules/integrations/domain/imports";
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  Inject,
  Module,
  type DynamicModule,
  BadRequestException,
  ServiceUnavailableException,
  HttpException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import type { IncomingMessage, ServerResponse } from "node:http";
import { PlatformRuntime, PLATFORM_RUNTIME } from "./runtime";
import {
  SiteAccessDeniedError,
  AuthorizationUnavailableError,
} from "../persistence/site-operation";
import {
  ImportBatchError,
  ImportOutcomeUnknownError,
  CsvAdapterError,
  SourceMappingError,
} from "../modules/integrations";
import { AnalyticsError } from "../modules/oip/domain/analytics";
import { ProblemDetails, BusinessException } from "./problem-details";
import * as C from "./contracts";
async function operation<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    if (e instanceof HttpException) throw e;
    if (e instanceof ImportBusyError) throw new ServiceUnavailableException();
    if (e instanceof SiteAccessDeniedError)
      throw new BusinessException(403, "access_denied");
    if (e instanceof AuthorizationUnavailableError)
      throw new BusinessException(503, "persistence_unavailable");
    if (e instanceof ImportOutcomeUnknownError)
      throw new BusinessException(503, "import_outcome_unknown", e.importId);
    if (e instanceof AnalyticsError)
      throw new BusinessException(
        e.code === "analytics_projection_unavailable"
          ? 503
          : e.code === "analytics_revision_changed"
            ? 409
            : e.code === "analytics_total_out_of_range"
              ? 422
              : 400,
        e.code,
      );
    if (e instanceof ImportBatchError)
      throw new BusinessException(
        e.code === "capacity"
          ? 409
          : e.code === "not-found"
            ? 404
            : e.code === "incomplete"
              ? 409
              : 400,
        "import_" + e.code.replaceAll("-", "_"),
      );
    if (e instanceof CsvAdapterError)
      throw new BusinessException(400, e.code.replaceAll("-", "_"));
    if (e instanceof SourceMappingError)
      throw new BusinessException(503, "mapping_unavailable");
    throw e;
  }
}
@ApiTags("Local analytical POC")
@ApiExtraModels(ProblemDetails)
@ApiHeader({
  name: "X-IOP-Demo",
  required: false,
  description:
    "Value 1 required on POST, together with an allowed Origin and local session cookie.",
})
@ApiResponse({
  status: 400,
  description: "Invalid bounded input or unavailable reference.",
  content: {
    "application/problem+json": {
      schema: { $ref: getSchemaPath(ProblemDetails) },
    },
  },
})
@ApiResponse({
  status: 401,
  description: "Select a configured local demo user.",
})
@ApiResponse({
  status: 403,
  description: "Scope, current grants, host or browser origin denied.",
})
@ApiResponse({
  status: 409,
  description: "Revision changed or import capacity/recovery conflict.",
})
@ApiResponse({
  status: 422,
  description: "Exact analytical total exceeds the supported integer range.",
})
@ApiResponse({
  status: 503,
  description:
    "Local mode inactive, maintenance, busy upload or persistence unavailable.",
})
@Controller("api/v1")
export class PlatformController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private active(req: IncomingMessage): PlatformRuntime {
    if (
      req.url?.includes("?") ||
      (req.method === "GET" &&
        (Number(req.headers["content-length"] ?? 0) !== 0 ||
          req.headers["transfer-encoding"] !== undefined))
    )
      throw new BadRequestException();
    if (!this.runtime) throw new ServiceUnavailableException();
    return this.runtime;
  }
  @Get("demo/context")
  @ApiOkResponse({ type: C.DemoContextDto })
  async context(@Req() req: IncomingMessage): Promise<C.DemoContextDto> {
    if (
      req.url?.includes("?") ||
      (req.method === "GET" &&
        (Number(req.headers["content-length"] ?? 0) !== 0 ||
          req.headers["transfer-encoding"] !== undefined))
    )
      throw new BadRequestException();
    if (!this.runtime)
      return {
        enabled: false,
        users: [],
        user: null,
        scope: null,
        canImport: false,
      };
    const r = this.runtime;
    let actor: string | undefined;
    try {
      actor = r.principals.resolve(req);
    } catch (e) {
      if (!(e instanceof HttpException) || e.getStatus() !== 401) throw e;
    }
    if (actor) {
      try {
        await r.checkUser(actor);
      } catch (e) {
        if (e instanceof SiteAccessDeniedError) actor = undefined;
        else await operation(() => Promise.reject(e));
      }
    }
    return {
      enabled: true,
      canImport: actor ? await operation(() => r.canImport(actor!)) : false,
      users: r.config.users,
      user: r.config.users.find((u) => u.id === actor) ?? null,
      scope: {
        organizationId: r.source.organizationId,
        siteId: r.source.siteId,
        sourceId: r.source.sourceId,
        siteTimeZone: r.source.siteTimeZone,
      },
    };
  }
  @Post("demo/user")
  @ApiBody({ type: C.SwitchUserDto })
  @ApiCreatedResponse({ type: C.DemoContextDto })
  async switchUser(
    @Req() req: IncomingMessage,
    @Body() body: C.SwitchUserDto,
    @Res({ passthrough: true }) res: ServerResponse,
  ): Promise<C.DemoContextDto> {
    const r = this.active(req);
    if (
      !body ||
      Array.isArray(body) ||
      Object.keys(body).join(",") !== "userId" ||
      typeof body.userId !== "string"
    )
      throw new BadRequestException();
    await operation(() => r.checkUser(body.userId));
    const token = r.principals.switch(req, body.userId);
    res.setHeader(
      "Set-Cookie",
      `iop_demo=${token}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=28800`,
    );
    return {
      enabled: true,
      canImport: await operation(() => r.canImport(body.userId)),
      users: r.config.users,
      user: r.config.users.find((u) => u.id === body.userId)!,
      scope: {
        organizationId: r.source.organizationId,
        siteId: r.source.siteId,
        sourceId: r.source.sourceId,
        siteTimeZone: r.source.siteTimeZone,
      },
    };
  }
  @Get("imports")
  @ApiOkResponse({ type: [C.ImportSummaryDto] })
  async history(@Req() req: IncomingMessage): Promise<C.ImportSummaryDto[]> {
    const r = this.active(req);
    return operation(() => r.batches.history(r.principals.resolve(req)));
  }
  @Post("imports")
  @ApiConsumes("application/octet-stream")
  @ApiHeader({
    name: "X-CSV-Filename",
    required: true,
    description: "Supported Hitliste-YYYYMMDD.csv reporting label.",
  })
  @ApiBody({ schema: { type: "string", format: "binary" } })
  @ApiCreatedResponse({ type: C.ImportReviewDto })
  async submit(
    @Req() req: IncomingMessage,
    @Body() bytes: Buffer,
  ): Promise<C.ImportReviewDto> {
    const r = this.active(req),
      filename = req.headers["x-csv-filename"];
    if (typeof filename !== "string" || !Buffer.isBuffer(bytes))
      throw new BadRequestException();
    const result = await operation(() =>
      r.submit(r.principals.resolve(req), filename, bytes),
    );
    console.info(
      JSON.stringify({
        event: "import.completed",
        importId: result.importId,
        outcome: result.outcome,
      }),
    );
    return { ...result, diagnostics: [...result.diagnostics] };
  }
  @Get("imports/:id")
  @ApiOkResponse({ type: C.ImportReviewDto })
  async review(
    @Req() req: IncomingMessage,
    @Param("id") id: string,
  ): Promise<C.ImportReviewDto> {
    const r = this.active(req);
    const result = await operation(() =>
      r.batches.review(r.principals.resolve(req), id),
    );
    return { ...result, diagnostics: [...result.diagnostics] };
  }
  @Post("imports/:id/recover")
  @ApiCreatedResponse({ type: C.ImportReviewDto })
  async recover(
    @Req() req: IncomingMessage,
    @Param("id") id: string,
    @Body() body: unknown,
  ): Promise<C.ImportReviewDto> {
    if (
      body !== undefined &&
      body !== null &&
      !(typeof body === "object" && Object.keys(body).length === 0)
    )
      throw new BadRequestException();
    const r = this.active(req);
    const result = await operation(() =>
      r.recover(r.principals.resolve(req), id),
    );
    return { ...result, diagnostics: [...result.diagnostics] };
  }
  @Get("imports/:id/original")
  @ApiOkResponse({
    description: "Original CSV bytes; requires imports.review.",
    schema: { type: "string", format: "binary" },
  })
  async original(
    @Req() req: IncomingMessage,
    @Param("id") id: string,
    @Res() res: ServerResponse,
  ): Promise<void> {
    const r = this.active(req),
      actor = r.principals.resolve(req);
    const batch = await operation(() => r.batches.review(actor, id));
    const bytes = await operation(() => r.batches.original(actor, id));
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${batch.originalFilename}"`,
    );
    res.end(bytes);
  }
  @Get("analytics/availability")
  @ApiOkResponse({ type: C.AvailabilityDto })
  async availability(@Req() req: IncomingMessage): Promise<C.AvailabilityDto> {
    const r = this.active(req);
    return operation(() => r.queries.availability(r.principals.resolve(req)));
  }
  @Post("analytics/options")
  @ApiBody({ type: C.OptionRequestDto })
  @ApiCreatedResponse({ type: C.OptionsDto })
  async options(
    @Req() req: IncomingMessage,
    @Body() body: C.OptionRequestDto,
  ): Promise<C.OptionsDto> {
    const r = this.active(req);
    return operation(() => r.queries.options(r.principals.resolve(req), body));
  }
  @Get("analytics/profile")
  @ApiOkResponse({ type: C.ProfileResultDto })
  async profile(@Req() req: IncomingMessage) {
    const r = this.active(req);
    return operation(() => r.profiles.get(r.principals.resolve(req)));
  }
  @Post("analytics/profile")
  @ApiBody({ type: C.ProfileResultDto })
  @ApiCreatedResponse({ type: C.ProfileResultDto })
  async saveProfile(
    @Req() req: IncomingMessage,
    @Body() body: C.ProfileResultDto,
  ) {
    const r = this.active(req);
    return operation(() => r.profiles.save(r.principals.resolve(req), body));
  }
  @Post("analytics/messages")
  @ApiBody({ type: C.MessageCatalogRequestDto })
  @ApiCreatedResponse({ type: C.MessageCatalogDto })
  async messages(
    @Req() req: IncomingMessage,
    @Body() body: C.MessageCatalogRequestDto,
  ) {
    const r = this.active(req);
    return operation(() =>
      r.explorer.messages(r.principals.resolve(req), body),
    );
  }
  @Post("analytics/source-rows")
  @ApiBody({ type: C.SourceRowsRequestDto })
  @ApiCreatedResponse({ type: C.SourceRowsDto })
  async sourceRows(
    @Req() req: IncomingMessage,
    @Body() body: C.SourceRowsRequestDto,
  ) {
    const r = this.active(req);
    return operation(() =>
      r.explorer.sourceRows(r.principals.resolve(req), body),
    );
  }
  @Post("analytics/report")
  @ApiBody({ type: C.ReportRequestDto })
  @ApiCreatedResponse({ type: C.ReportDto })
  async report(@Req() req: IncomingMessage, @Body() body: C.ReportRequestDto) {
    const r = this.active(req);
    return operation(() => r.reports.query(r.principals.resolve(req), body));
  }
  @Post("analytics/query")
  @ApiBody({ type: C.AnalyticalRequestDto })
  @ApiCreatedResponse({ type: C.AnalysisDto })
  async query(
    @Req() req: IncomingMessage,
    @Body() body: C.AnalyticalRequestDto,
  ): Promise<C.AnalysisDto> {
    const r = this.active(req);
    return operation(() => r.queries.query(r.principals.resolve(req), body));
  }
}
@Module({})
export class PlatformModule {
  static register(runtime: PlatformRuntime | null): DynamicModule {
    return {
      module: PlatformModule,
      controllers: [PlatformController],
      providers: [{ provide: PLATFORM_RUNTIME, useValue: runtime }],
    };
  }
}
