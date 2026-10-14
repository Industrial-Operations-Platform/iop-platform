import { Body, Controller, Inject, Post, Req, ServiceUnavailableException } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME } from "./runtime";
import { BusinessException } from "./problem-details";
import { SiteAccessDeniedError, AuthorizationUnavailableError } from "../persistence/site-operation";
import { AnalyticsError } from "../modules/oip/domain/values";
import { AssetDomainError, assert } from "../modules/assets/domain/enrichment";
import type { AssetDomain } from "../modules/assets/application/enrichment";
import * as C from "./asset-domain-contracts";
interface Runtime {
  actor(req: IncomingMessage): Promise<string>;
  assetDomain: AssetDomain;
}
const codes: Record<AssetDomainError["code"], number> = {
  invalid_asset_domain: 400,
  asset_domain_denied: 403,
  asset_domain_missing: 404,
  asset_domain_conflict: 409,
  asset_domain_cycle: 400,
  asset_domain_capacity: 503,
  asset_domain_projection_unavailable: 503
};
@ApiTags("Asset domain")
@Controller("api/v1/asset-domain")
export class AssetDomainController {
  constructor(@Inject(PLATFORM_RUNTIME)
  private readonly runtime: Runtime | null) {}
  private async run<T>(req: IncomingMessage, work: (domain: AssetDomain, actor: string) => Promise<T>) {
    if (!this.runtime) throw new ServiceUnavailableException();
    try {
      assert(!req.url?.includes("?"));
      return await work(this.runtime.assetDomain, await this.runtime.actor(req));
    } catch (e) {
      if (e instanceof AssetDomainError) throw new BusinessException(codes[e.code], e.code);
      if (e instanceof SiteAccessDeniedError) throw new BusinessException(403, "asset_domain_denied");
      if (e instanceof AuthorizationUnavailableError) throw new ServiceUnavailableException();
      if (e instanceof AnalyticsError) throw new BusinessException(e.code === "analytics_total_out_of_range" ? 422 : 503, "asset_domain_projection_unavailable");
      throw e;
    }
  }
  @Post("catalog")
  @ApiCreatedResponse({
    type: C.AssetDomainCatalogDto
  })
  catalog(@Req()
  req: IncomingMessage, @Body()
  body: object) {
    return this.run(req, (d, a) => {
      keys(body, []);
      return d.catalog(a);
    });
  }
  @Post("configure")
  @ApiBody({
    type: C.AssetDomainConfigureDto
  })
  @ApiCreatedResponse({
    type: C.AssetTypeCatalogDto
  })
  configure(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainConfigureDto) {
    return this.run(req, (d, a) => d.configure(a, body));
  }
  @Post("detail")
  @ApiBody({
    type: C.AssetDomainIdDto
  })
  @ApiCreatedResponse({
    type: C.AssetDomainDetailDto
  })
  detail(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainIdDto) {
    return this.run(req, (d, a) => {
      keys(body, ["assetId"]);
      return d.detail(a, body.assetId);
    });
  }
  @Post("save")
  @ApiBody({
    type: C.AssetDomainSaveDto
  })
  @ApiCreatedResponse({
    type: C.AssetEnrichmentDto
  })
  save(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainSaveDto) {
    return this.run(req, (d, a) => d.save(a, body));
  }
  @Post("history")
  @ApiBody({
    type: C.AssetDomainHistoryRequestDto
  })
  @ApiCreatedResponse({
    type: C.AssetDomainHistoryDto
  })
  history(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainHistoryRequestDto) {
    return this.run(req, (d, a) => {
      keys(body, ["assetId", "before"]);
      return d.history(a, body.assetId, body.before ?? 0);
    });
  }
  @Post("references")
  @ApiBody({
    type: C.AssetDomainQueryDto
  })
  @ApiCreatedResponse({
    type: C.AssetDomainReferencePageDto
  })
  references(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainQueryDto) {
    return this.run(req, (d, a) => d.references(a, body));
  }
  @Post("mapping-query")
  @ApiBody({
    type: C.AssetDomainQueryDto
  })
  @ApiCreatedResponse({
    type: C.AssetMappingPageDto
  })
  mappingQuery(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetDomainQueryDto) {
    return this.run(req, (d, a) => d.mappingQuery(a, body));
  }
  @Post("mapping-source")
  @ApiBody({
    type: C.AssetSourceTupleDto
  })
  @ApiCreatedResponse({
    type: C.AssetMappingLookupDto
  })
  mappingSource(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetSourceTupleDto) {
    return this.run(req, async (d, a) => ({
      mapping: await d.mappingForSource(a, body)
    }));
  }
  @Post("save-mapping")
  @ApiBody({
    type: C.AssetMappingSaveDto
  })
  @ApiCreatedResponse({
    type: C.AssetSourceMappingDto
  })
  saveMapping(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetMappingSaveDto) {
    return this.run(req, (d, a) => d.saveMapping(a, body));
  }
  @Post("mapping-history")
  @ApiBody({
    type: C.AssetMappingHistoryRequestDto
  })
  @ApiCreatedResponse({
    type: C.AssetMappingHistoryDto
  })
  mappingHistory(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetMappingHistoryRequestDto) {
    return this.run(req, (d, a) => {
      keys(body, ["id", "before"]);
      return d.mappingHistory(a, body.id, body.before ?? 0);
    });
  }
  @Post("candidates")
  @ApiBody({
    type: C.AssetSourceQueryDto
  })
  @ApiCreatedResponse({
    type: C.AssetSourceCandidatePageDto
  })
  candidates(@Req()
  req: IncomingMessage, @Body()
  body: C.AssetSourceQueryDto) {
    return this.run(req, (d, a) => d.candidates(a, body));
  }
  @Post("pareto")
  @ApiBody({
    type: C.CanonicalParetoSelectionDto
  })
  @ApiCreatedResponse({
    type: C.CanonicalAssetParetoDto
  })
  pareto(@Req()
  req: IncomingMessage, @Body()
  body: C.CanonicalParetoSelectionDto) {
    return this.run(req, (d, a) => d.pareto(a, body));
  }
}
function keys(v: object, allowed: string[]) {
  assert(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every(k => allowed.includes(k)));
}
