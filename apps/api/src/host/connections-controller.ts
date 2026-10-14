import { Body, Controller, Inject, Post, Req, ServiceUnavailableException } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";
import { PLATFORM_RUNTIME } from "./runtime";
import type { Connections } from "../modules/integrations/application/connections";
import { ConnectionError } from "../modules/integrations/domain/connections";
import { SiteAccessDeniedError, AuthorizationUnavailableError } from "../persistence/site-operation";
import { BusinessException } from "./problem-details";
import * as C from "./connections-contracts";
interface ConnectionsRuntime {
    actor(req: IncomingMessage): Promise<string>;
    connections: Connections;
}
@ApiTags('Integration readiness')
@Controller('api/v1/integrations')
export class ConnectionsController {
    constructor(
    @Inject(PLATFORM_RUNTIME)
    private readonly runtime: ConnectionsRuntime | null) { }
    private async operation<T>(req: IncomingMessage, work: (runtime: ConnectionsRuntime, actor: string) => Promise<T>) {
        if (!this.runtime)
            throw new ServiceUnavailableException();
        try {
            if (req.url?.includes('?'))
                throw new ConnectionError('invalid_integration');
            return await work(this.runtime, await this.runtime.actor(req));
        }
        catch (error) {
            if (error instanceof ConnectionError)
                throw new BusinessException(error.code === 'integration_denied' ? 403 : error.code === 'integration_conflict' ? 409 : error.code === 'integration_unconfigured' ? 503 : 400, error.code);
            if (error instanceof SiteAccessDeniedError)
                throw new BusinessException(403, 'integration_denied');
            if (error instanceof AuthorizationUnavailableError)
                throw new ServiceUnavailableException();
            throw error;
        }
    }
    @Post('query')
    @ApiCreatedResponse({ type: C.ConnectionsDto })
    query(
    @Req()
    req: IncomingMessage,
    @Body()
    body: object) {
        return this.operation(req, (runtime, actor) => {
            if (!body || Array.isArray(body) || Object.keys(body).length)
                throw new ConnectionError('invalid_integration');
            return runtime.connections.query(actor);
        });
    }
    @Post('save')
    @ApiBody({ type: C.ConnectionSaveDto })
    @ApiCreatedResponse({ type: C.ConnectionReadinessDto })
    save(
    @Req()
    req: IncomingMessage,
    @Body()
    body: C.ConnectionSaveDto) { return this.operation(req, (r, a) => r.connections.save(a, body)); }
    @Post('history')
    @ApiBody({ type: C.ConnectionHistoryRequestDto })
    @ApiCreatedResponse({ type: C.ConnectionHistoryDto })
    history(
    @Req()
    req: IncomingMessage,
    @Body()
    body: C.ConnectionHistoryRequestDto) {
        return this.operation(req, (r, a) => {
            if (!body || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'kind'))
                throw new ConnectionError('invalid_integration');
            return r.connections.history(a, body.kind);
        });
    }
}
