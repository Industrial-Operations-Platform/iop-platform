import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';

// Minimal host errors only; the domain error catalog belongs to IOP-022.
@Catch()
export class BootstrapErrorFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500) console.error('API request failed with a server error.');
    const response = host.switchToHttp().getResponse();
    const adapter = this.adapterHost.httpAdapter;
    adapter.setHeader(response, 'Content-Type', 'application/problem+json');
    adapter.reply(response, {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Internal Server Error',
      status,
    }, status);
  }
}
