import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiExtraModels, getSchemaPath, ApiOkResponse, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ProblemDetails } from './problem-details';

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

@ApiExtraModels(ProblemDetails)
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
      $ref: getSchemaPath(ProblemDetails),
    } } },
  })
  getHealth(): HealthResponse {
    return this.health.check();
  }
}
