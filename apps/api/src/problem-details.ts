import { HttpException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const problemCatalog = {
  400: ['bad-request', 'Bad Request'],
  401: ['unauthorized', 'Unauthorized'],
  403: ['forbidden', 'Forbidden'],
  404: ['not-found', 'Not Found'],
  409: ['conflict', 'Conflict'],
  413: ['content-too-large', 'Content Too Large'],
  415: ['unsupported-media-type', 'Unsupported Media Type'],
  429: ['too-many-requests', 'Too Many Requests'],
  500: ['internal-server-error', 'Internal Server Error'],
  503: ['service-unavailable', 'Service Unavailable'],
} as const;

export const validationCodes = ['required', 'invalid', 'out-of-range', 'unsupported'] as const;

export class ValidationIssue {
  @ApiProperty({ description: 'JSON Pointer into the documented request representation; empty means the whole request.', maxLength: 256 })
  pointer!: string;

  @ApiProperty({ enum: validationCodes })
  code!: typeof validationCodes[number];
}

export class ProblemDetails {
  @ApiProperty({ example: 'urn:iop:problem:bad-request', format: 'uri' })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: 'integer', minimum: 400, maximum: 599 })
  status!: number;

  @ApiProperty({ format: 'uuid', description: 'Server-generated error occurrence identifier; not a client-supplied ID.' })
  traceId!: string;

  @ApiPropertyOptional({ type: [ValidationIssue], maxItems: 50, description: 'Only present for explicit safe input validation failures (400).' })
  errors?: ValidationIssue[];
}

// Only transport adapters supply these pointers, from fixed schema paths, never input values.
export class RequestValidationException extends HttpException {
  readonly errors: ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super('Request validation failed', 400);
    this.errors = issues.slice(0, 50).map(({ pointer, code }) => {
      if (pointer.length > 256 || !/^(?:\/(?:[^~/\u0000-\u001f]|~[01])*)*$/.test(pointer)
        || !validationCodes.includes(code)) {
        throw new Error('Invalid validation issue metadata');
      }
      return { pointer, code };
    });
  }
}
