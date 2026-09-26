import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './problem-details.filter';

export function configureApplication(app: INestApplication): void {
  const adapter = app.getHttpAdapter() as ExpressAdapter;
  adapter.useBodyParser('json', false, { limit: 102400, inflate: false });
  adapter.useBodyParser('urlencoded', false, { limit: 102400, inflate: false, extended: true, parameterLimit: 10, depth: 1 });
  app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  configureApplication(app);
  return app;
}

export function readPort(value: string | undefined): number {
  if (value === undefined) return 3000;
  if (!/^[0-9]+$/.test(value)) throw new Error('Invalid PORT');
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT');
  }
  return port;
}

export function readHost(value: string | undefined): string {
  if (value === undefined) return '127.0.0.1';
  if (value !== '127.0.0.1' && value !== '0.0.0.0') throw new Error('Invalid HOST');
  return value;
}
