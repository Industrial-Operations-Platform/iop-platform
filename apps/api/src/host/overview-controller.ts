import { Body, Controller, Inject, Post, Req, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import type { IncomingMessage } from 'node:http';
import { PLATFORM_RUNTIME, type PlatformRuntime } from './runtime';
import type { OperationalOverview } from '../modules/operational-overview/application/overview';
import { OverviewError, exact } from '../modules/operational-overview/domain/overview';
import { BusinessException } from './problem-details';
import * as C from './overview-contracts';
@ApiTags('Operational Overview')
@Controller('api/v1/overview')
export class OverviewController {
    constructor(
    @Inject(PLATFORM_RUNTIME)
    private readonly runtime: (PlatformRuntime & {
        overview: OperationalOverview;
    }) | null) { }
    private async operation<T>(req: IncomingMessage, work: (overview: OperationalOverview, actor: string) => Promise<T>): Promise<T> { if (req.url?.includes('?'))
        throw new BadRequestException(); if (!this.runtime)
        throw new ServiceUnavailableException(); try {
        return await work(this.runtime.overview, await this.runtime.actor(req));
    }
    catch (error) {
        if (error instanceof OverviewError)
            throw new BusinessException(error.code === 'overview_denied' ? 403 : error.code === 'overview_unavailable' ? 503 : 400, error.code);
        throw error;
    } }
    @Post('context')
    @ApiBody({ type: C.OverviewEmptyDto })
    @ApiCreatedResponse({ type: C.OverviewContextDto })
    context(
    @Req()
    req: IncomingMessage,
    @Body()
    body: C.OverviewEmptyDto) { return this.operation(req, (overview, actor) => { exact(body, []); return overview.context(actor); }); }
    @Post('search')
    @ApiBody({ type: C.OverviewSearchDto })
    @ApiCreatedResponse({ type: C.OverviewSearchResultDto })
    search(
    @Req()
    req: IncomingMessage,
    @Body()
    body: C.OverviewSearchDto) { return this.operation(req, (overview, actor) => overview.search(actor, body)); }
    @Post('area')
    @ApiBody({ type: C.OverviewAreaRequestDto })
    @ApiCreatedResponse({ type: C.OverviewAreaDto })
    area(
    @Req()
    req: IncomingMessage,
    @Body()
    body: C.OverviewAreaRequestDto) { return this.operation(req, (overview, actor) => overview.area(actor, body)); }
}
