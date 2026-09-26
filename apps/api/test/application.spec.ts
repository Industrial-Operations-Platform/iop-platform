import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { createApplication } from '../src/application';
import { HealthService } from '../src/health.controller';
import { createOpenApiDocument } from '../src/openapi';

describe('API host', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.restoreAllMocks(); });

  it('serves public process liveness through real dependency injection', async () => {
    const check = jest.spyOn(app.get(HealthService), 'check');
    await request(app.getHttpServer()).get('/health')
      .expect('Content-Type', /application\/json/).expect(200, { status: 'ok' });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it.each(['/api/v1/health', '/api/v2/health', '/private-secret?token=secret'])
  ('does not expose unimplemented route %s or reflect request data', async (path) => {
    await request(app.getHttpServer()).get(path)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(404).expect(({ body }) => {
        expect(body).toEqual({ type: 'urn:iop:problem:not-found', title: 'Not Found', status: 404, traceId: expect.any(String) });
      });
  });

  it('does not expose health mutations', async () => {
    await request(app.getHttpServer()).post('/health').send({ secret: 'private' })
      .expect(404).expect(({ body }) => {
        expect(body).toEqual({ type: 'urn:iop:problem:not-found', title: 'Not Found', status: 404, traceId: expect.any(String) });
      });
  });

  it('requires explicit demo activation before business access', async () => {
    await request(app.getHttpServer()).get('/api/v1/demo/context').expect(200, { enabled: false, users: [], user: null, scope: null });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await request(app.getHttpServer()).get('/api/v1/imports').expect(503);
    log.mockRestore();
  });

  it('sanitizes unexpected failures', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(app.get(HealthService), 'check').mockImplementation(() => {
      throw new Error('private database credentials and RAW content');
    });
    await request(app.getHttpServer()).get('/health')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(500).expect(({ body }) => {
        expect(body).toEqual({ type: 'urn:iop:problem:internal-server-error', title: 'Internal Server Error', status: 500, traceId: expect.any(String) });
        expect(log).toHaveBeenCalledWith(JSON.stringify({ event: 'api.request.failed', status: 500, traceId: body.traceId }));
      });
  });

  it('keeps the reviewed OpenAPI artifact and real response consistent', async () => {
    const document = createOpenApiDocument(app);
    const artifact = JSON.parse(readFileSync(join(__dirname, '../contracts/openapi.json'), 'utf8'));
    expect(document).toEqual(artifact);
    expect(document.openapi).toBe('3.0.0');
    expect(Object.keys(document.paths)).toEqual(expect.arrayContaining(['/health', '/api/v1/imports', '/api/v1/analytics/query', '/api/v1/demo/user']));
    expect(document.paths['/health'].get?.operationId).toBe('getProcessHealth');
    expect(document.components?.schemas?.HealthResponse).toEqual({
      type: 'object', properties: { status: { type: 'string', enum: ['ok'], example: 'ok' } },
      required: ['status'],
    });
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(Object.keys(response.body)).toEqual(['status']);
    expect(response.body.status).toBe('ok');
  });
});
