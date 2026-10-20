import { Body, Controller, Inject, Post, Get, Param, Req, Res, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiProduces } from '@nestjs/swagger';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { PLATFORM_RUNTIME, type PlatformRuntime } from './runtime';
import type { Locator } from '../modules/asset-locator/application/locator';
import { LocatorError, exact } from '../modules/asset-locator/domain/locator';
import { SiteAccessDeniedError, AuthorizationUnavailableError } from '../persistence/site-operation';
import { BusinessException } from './problem-details';
import * as C from './locator-contracts';
import { localAlarmClassification } from './local-alarm-classification';
@ApiTags('Asset Locator')
@Controller('api/v1/locator')
export class LocatorController {
  constructor(
  @Inject(PLATFORM_RUNTIME)
  private readonly runtime: (PlatformRuntime & {
    locator: Locator;
  }) | null) { }
  private async operation<T>(req: IncomingMessage, work: (locator: Locator, actor: string) => Promise<T>): Promise<T> {
    if (req.url?.includes('?'))
      throw new BadRequestException();
    if (!this.runtime)
      throw new ServiceUnavailableException();
    try {
      return await work(this.runtime.locator, await this.runtime.actor(req));
    }
    catch (error) {
      if (error instanceof LocatorError)
        throw new BusinessException(error.code === 'locator_denied' ? 403 : error.code === 'locator_missing' ? 404 : error.code === 'locator_conflict' || error.code === 'locator_capacity' ? 409 : error.code === 'locator_reference_unavailable' ? 503 : 400, error.code);
      if (error instanceof SiteAccessDeniedError)
        throw new BusinessException(403, 'locator_denied');
      if (error instanceof AuthorizationUnavailableError)
        throw new ServiceUnavailableException();
      throw error;
    }
  }
  @Post('context')
  @ApiBody({ type: C.LocatorEmptyDto })
  @ApiCreatedResponse({ type: C.LocatorContextDto })
  context(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorEmptyDto) { return this.operation(req, (locator, actor) => { exact(body, []); return locator.context(actor); }); }
  @Post('query')
  @ApiBody({ type: C.LocatorQueryDto })
  @ApiCreatedResponse({ type: C.LocatorPageDto })
  query(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorQueryDto) { return this.operation(req, (locator, actor) => locator.query(actor, body)); }
  @Post('detail')
  @ApiBody({ type: C.LocatorIdDto })
  @ApiCreatedResponse({ type: C.LocatorDetailDto })
  detail(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorIdDto) { return this.operation(req, (locator, actor) => { exact(body, ['id']); return locator.detail(actor, body.id); }); }
  @Post('save')
  @ApiBody({ type: C.LocatorSaveDto })
  @ApiCreatedResponse({ type: C.LocatorSceneDto })
  save(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorSaveDto) { return this.operation(req, (locator, actor) => locator.save(actor, body)); }
  @Post('history')
  @ApiBody({ type: C.LocatorHistoryRequestDto })
  @ApiCreatedResponse({ type: C.LocatorHistoryDto })
  history(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorHistoryRequestDto) { return this.operation(req, (locator, actor) => { exact(body, ['id', 'before']); return locator.history(actor, body.id, body.before); }); }
  @Post('search')
  @ApiBody({ type: C.LocatorSearchDto })
  @ApiCreatedResponse({ type: C.LocatorSearchResultsDto })
  search(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorSearchDto) { return this.operation(req, (locator, actor) => locator.search(actor, body)); }
  @Post('bootstrap')
  @ApiBody({ type: C.LocatorEmptyDto })
  @ApiCreatedResponse({ type: C.LocatorBootstrapDto })
  bootstrap(
  @Req()
  req: IncomingMessage,
  @Body()
  body: C.LocatorEmptyDto) { return this.operation(req, (locator, actor) => { exact(body, []); return locator.bootstrap(actor); }); }
  @Post('locate')
  @ApiBody({ type: C.LocatorLocateDto })
  @ApiCreatedResponse({ type: C.LocatorSearchResultsDto })
  locate(@Req() req: IncomingMessage, @Body() body: C.LocatorLocateDto) {
    return this.operation(req, (locator, actor) => { exact(body, ['assetId']); return locator.locate(actor, body.assetId); });
  }
  @Post('model-preview')
  @ApiBody({ type: C.LocatorEmptyDto })
  @ApiCreatedResponse({ type: C.LocatorModelsDto })
  modelPreview(@Req() req: IncomingMessage, @Body() body: C.LocatorEmptyDto) {
    return this.operation(req, (locator, actor) => { exact(body, []); return locator.modelPreview(actor); });
  }
  @Post('classification')
  @ApiBody({ type: C.LocatorLocateDto })
  @ApiCreatedResponse({ type: C.LocatorClassificationDto })
  classification(@Req() req: IncomingMessage, @Body() body: C.LocatorLocateDto) {
    return this.operation(req, async (locator, actor) => localAlarmClassification(await locator.classification(actor, body)));
  }
  @Post('apply-model')
  @ApiBody({ type: C.LocatorModelApplyDto })
  @ApiCreatedResponse({ type: C.LocatorModelResultDto })
  applyModel(@Req() req: IncomingMessage, @Body() body: C.LocatorModelApplyDto) {
    return this.operation(req, (locator, actor) => locator.applyModel(actor, body));
  }
  @Get('references/:id')
  @ApiProduces('image/png')
  @ApiOkResponse({ description: 'Authorized original private PNG; never included in the public bundle.', schema: { type: 'string', format: 'binary' } })
  async reference(
  @Req()
  req: IncomingMessage,
  @Param('id')
  id: string,
  @Res()
  res: ServerResponse) { const bytes = await this.operation(req, (locator, actor) => locator.reference(actor, id)); res.setHeader('Content-Type', 'image/png'); res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Content-Disposition', 'inline; filename="locator-reference.png"'); res.end(Buffer.from(bytes)); }
}
