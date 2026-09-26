import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import { ProblemDetails, problemCatalog, RequestValidationException } from './problem-details';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Only recognized parser type/status pairs are safe transport failures.
    const parserStatuses: Record<string, number> = {
      'entity.too.large': 413, 'parameters.too.many': 413,
      'entity.parse.failed': 400, 'querystring.parse.rangeError': 400,
      'encoding.unsupported': 415, 'charset.unsupported': 415,
    };
    const parserStatus = exception instanceof Error && 'type' in exception
      && typeof exception.type === 'string' && Object.hasOwn(parserStatuses, exception.type)
      && 'status' in exception && exception.status === parserStatuses[exception.type]
      ? parserStatuses[exception.type] : 500;
    const candidate = exception instanceof HttpException ? exception.getStatus() : parserStatus;
    const status = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;
    const category = problemCatalog[status as keyof typeof problemCatalog];
    const problem: ProblemDetails = {
      type: category ? `urn:iop:problem:${category[0]}` : 'about:blank',
      title: category?.[1] ?? STATUS_CODES[status] ?? 'HTTP Error',
      status,
      traceId: randomUUID(),
    };
    if (exception instanceof RequestValidationException) problem.errors = exception.errors;
    if (status >= 500) {
      console.error(JSON.stringify({ event: 'api.request.failed', status, traceId: problem.traceId }));
    }
    const response = host.switchToHttp().getResponse();
    const adapter = this.adapterHost.httpAdapter;
    adapter.setHeader(response, 'Content-Type', 'application/problem+json');
    adapter.reply(response, problem, status);
  }
}
