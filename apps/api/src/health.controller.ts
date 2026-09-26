import { CanActivate, Controller, ExecutionContext, Get, Injectable, UseGuards } from '@nestjs/common';
import { ApiExtraModels, getSchemaPath, ApiOkResponse, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';

import { IncomingMessage } from 'node:http';
import { ProblemDetails, RequestValidationException } from './problem-details';

export class HealthResponse {
  @ApiProperty({ type: String, enum: ['ok'], example: 'ok' })
  status!: 'ok';
}

@Injectable()
export class HealthService {
  check(): HealthResponse {
    return { status: 'ok' };
  }
}

@Injectable()
class HealthInputGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const query = request.url?.split('?').slice(1).join('?');
    const issues = [];
    if (query) issues.push({ pointer: '/query', code: 'unsupported' as const });
    if (request.headers['transfer-encoding'] !== undefined
      || Number(request.headers['content-length'] ?? 0) !== 0) {
      issues.push({ pointer: '/body', code: 'unsupported' as const });
    }
    if (issues.length) throw new RequestValidationException(issues);
    return true;
  }
}

@ApiExtraModels(ProblemDetails)
@ApiTags('Host')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @UseGuards(HealthInputGuard)
  @ApiOperation({
    operationId: 'getProcessHealth',
    summary: 'Check API process liveness',
    description: 'Owned by the API host. Public; no identity, permission or organization/site scope required. No inputs: nonempty query strings and request bodies are rejected. JSON/form parsing is capped at 102400 bytes; compressed bodies are unsupported. Does not check database readiness or business access.',
  })
  @ApiResponse({ status: 400, description: 'Malformed input, query parameters or body supplied to this no-input operation.', content: { 'application/problem+json': { schema: { $ref: getSchemaPath(ProblemDetails) } } } })
  @ApiResponse({ status: 413, description: 'JSON/form parser byte or parameter limit exceeded.', content: { 'application/problem+json': { schema: { $ref: getSchemaPath(ProblemDetails) } } } })
  @ApiResponse({ status: 415, description: 'Unsupported body encoding or charset.', content: { 'application/problem+json': { schema: { $ref: getSchemaPath(ProblemDetails) } } } })
  @ApiOkResponse({ description: 'The API process responds.', type: HealthResponse })
  @ApiResponse({
    status: 500,
    description: 'Unexpected host failure; no internal details are exposed.',
    content: { 'application/problem+json': { schema: {
      $ref: getSchemaPath(ProblemDetails),
    } } },
  })
  getHealth(): HealthResponse {
    return this.health.check();
  }
}
