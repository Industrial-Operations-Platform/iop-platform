import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';

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

@ApiTags('Host')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    operationId: 'getProcessHealth',
    summary: 'Check API process liveness',
    description: 'Owned by the API host. Public; no identity, permission or organization/site scope required. No inputs. Does not check database readiness or business access.',
  })
  @ApiOkResponse({ description: 'The API process responds.', type: HealthResponse })
  @ApiResponse({
    status: 500,
    description: 'Unexpected host failure; no internal details are exposed.',
    content: { 'application/problem+json': { schema: {
      type: 'object', required: ['type', 'title', 'status'],
      properties: {
        type: { type: 'string', enum: ['about:blank'] },
        title: { type: 'string', enum: ['Internal Server Error'] },
        status: { type: 'integer', enum: [500] },
      },
    } } },
  })
  getHealth(): HealthResponse {
    return this.health.check();
  }
}
