import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { request as httpRequest } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/application';
import { HealthService } from '../src/health.controller';

describe('POC health input boundary', () => {
  let app: INestApplication;
  let check: jest.SpyInstance;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
  });
  beforeEach(() => { check = jest.spyOn(app.get(HealthService), 'check'); });
  afterEach(() => { jest.restoreAllMocks(); });
  afterAll(async () => { await app.close(); });

  function rejected(body: unknown, status: number): void {
    expect(body).toMatchObject({ status, traceId: expect.any(String) });
    expect(JSON.stringify(body)).not.toMatch(/SECRET|script|SELECT|__proto__/);
    expect(check).not.toHaveBeenCalled();
  }

  it('preserves ordinary health and empty query/body behavior', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/health?').set('Content-Length', '0').expect(200);
    await request(app.getHttpServer()).head('/health').expect(200);
  });

  it.each(['secret=SECRET', 'x=1&x=2', 'x[y]=1', '__proto__[x]=SECRET', 'x=%3Cscript%3E', 'x=SELECT', 'x=%ZZ'])
  ('rejects unsupported query %s without invoking health', async (query) => {
    const response = await request(app.getHttpServer()).get(`/health?${query}`)
      .expect(400).expect('Content-Type', /application\/problem\+json/);
    rejected(response.body, 400);
    expect(response.body.errors).toEqual([{ pointer: '/query', code: 'unsupported' }]);
  });

  it.each(['application/json', 'text/plain', 'text/csv', 'application/octet-stream', 'application/x-www-form-urlencoded'])
  ('rejects bodies of media type %s', async (type) => {
    const response = await request(app.getHttpServer()).get('/health').set('Content-Type', type)
      .send(type === 'application/json' ? '{"secret":"SECRET"}' : 'secret=SECRET').expect(400);
    rejected(response.body, 400);
  });

  it.each([[102400, 400], [102401, 413]])('bounds actual JSON bytes at %i', async (bytes, status) => {
    const payload = JSON.stringify({ x: 'x'.repeat(bytes - 8) });
    expect(Buffer.byteLength(payload)).toBe(bytes);
    const response = await request(app.getHttpServer()).get('/health')
      .set('Content-Type', 'application/json').send(payload).expect(status);
    rejected(response.body, status);
  });

  it.each([[102400, 400], [102401, 413]])('bounds actual form bytes at %i', async (bytes, status) => {
    const response = await request(app.getHttpServer()).get('/health')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('x=' + 'x'.repeat(bytes - 2)).expect(status);
    rejected(response.body, status);
  });

  it('counts UTF-8 bytes rather than JavaScript characters', async () => {
    const payload = JSON.stringify({ x: 'é'.repeat(51200) });
    expect(payload.length).toBeLessThan(102400);
    const response = await request(app.getHttpServer()).get('/health')
      .set('Content-Type', 'application/json').send(payload).expect(413);
    rejected(response.body, 413);
  });

  it('applies the same rejection to HEAD without a response body', async () => {
    const response = await request(app.getHttpServer()).head('/health?secret=SECRET').expect(400);
    expect(response.text).toBeUndefined();
    expect(check).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON and compressed/unsupported charset bodies safely', async () => {
    for (const [contentType, encoding, payload, status] of [
      ['application/json', 'identity', '{"SECRET":', 400],
      ['application/json', 'gzip', 'SECRET', 415],
      ['application/json; charset=iso-8859-1', 'identity', '{"x":"SECRET"}', 415],
    ] as const) {
      const response = await request(app.getHttpServer()).get('/health')
        .set('Content-Type', contentType).set('Content-Encoding', encoding).send(payload).expect(status);
      rejected(response.body, status);
    }
  });

  it.each([[10, 400], [11, 413]])('bounds form parameter count at %i', async (count, status) => {
    const response = await request(app.getHttpServer()).get('/health')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(Array.from({ length: count }, (_, i) => `x${i}=SECRET`).join('&')).expect(status);
    rejected(response.body, status);
  });

  it.each([['x[y]=SECRET', 400], ['x[y][z]=SECRET', 400]])('rejects form nesting %s', async (payload, status) => {
    const response = await request(app.getHttpServer()).get('/health')
      .set('Content-Type', 'application/x-www-form-urlencoded').send(payload).expect(status);
    rejected(response.body, status);
    if (payload.includes('[z]')) expect(response.body.errors).toBeUndefined();
    else expect(response.body.errors).toEqual([{ pointer: '/body', code: 'unsupported' }]);
  });

  it.each([[102400, 400], [102401, 413]])('bounds chunked JSON without Content-Length at %i bytes', async (bytes, status) => {
    const url = new URL('/health', await app.getUrl());
    const result = await new Promise<{ status: number | undefined; body: unknown }>((resolve, reject) => {
      const req = httpRequest(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.write('{"x":"');
      req.write('x'.repeat(bytes - 8));
      req.end('"}');
    });
    expect(result.status).toBe(status);
    rejected(result.body, status);
  });
});
