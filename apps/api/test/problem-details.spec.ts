import 'reflect-metadata';
import { Controller, Get, Post, Param, HttpException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApplication } from '../src/application';
import { RequestValidationException, ValidationIssue } from '../src/problem-details';

@Controller('errors')
class ErrorTestController {
  @Get('validation')
  validation(): never {
    throw new RequestValidationException([{ pointer: '/query/reportingDate', code: 'invalid' }]);
  }

  @Get(':status')
  fail(@Param('status') status: string): never {
    throw new HttpException({ message: 'SECRET SQL credentials', errors: [{ value: 'RAW secret' }] }, Number(status));
  }

  @Post()
  post(): object { return { ok: true }; }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('POC Problem Details over HTTP', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [ErrorTestController] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.restoreAllMocks(); });

  it.each([
    [400, 'bad-request'], [401, 'unauthorized'], [403, 'forbidden'],
    [404, 'not-found'], [409, 'conflict'], [413, 'content-too-large'],
    [415, 'unsupported-media-type'], [429, 'too-many-requests'],
    [500, 'internal-server-error'], [503, 'service-unavailable'],
  ])('maps %s safely and correlates server failures', async (status, type) => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app.getHttpServer()).get(`/errors/${status}?secret=PRIVATE`)
      .set('X-Request-Id', 'attacker-controlled').expect(Number(status))
      .expect('Content-Type', /application\/problem\+json/);
    expect(response.body).toEqual({ type: `urn:iop:problem:${type}`, title: expect.any(String), status, traceId: expect.stringMatching(uuid) });
    if (Number(status) >= 500) {
      expect(log).toHaveBeenCalledWith(JSON.stringify({ event: 'api.request.failed', status, traceId: response.body.traceId }));
    } else expect(log).not.toHaveBeenCalled();
  });

  it('emits only explicit validation pointers and codes', async () => {
    const response = await request(app.getHttpServer()).get('/errors/validation').expect(400);
    expect(response.body).toEqual({
      type: 'urn:iop:problem:bad-request', title: 'Bad Request', status: 400,
      traceId: expect.stringMatching(uuid), errors: [{ pointer: '/query/reportingDate', code: 'invalid' }],
    });
  });

  it('sanitizes malformed JSON and enforces the host JSON size limit', async () => {
    const malformed = await request(app.getHttpServer()).post('/errors')
      .set('Content-Type', 'application/json').send('{"secret":').expect(400);
    expect(malformed.body.type).toBe('urn:iop:problem:bad-request');
    expect(JSON.stringify(malformed.body)).not.toContain('secret');
    const oversized = await request(app.getHttpServer()).post('/errors')
      .send({ secret: 'x'.repeat(110 * 1024) }).expect(413);
    expect(oversized.body.type).toBe('urn:iop:problem:content-too-large');
    expect(oversized.body.traceId).toMatch(uuid);
  });

  it('uses distinct server IDs and generic fallback for other HTTP errors', async () => {
    const first = await request(app.getHttpServer()).get('/errors/405').expect(405);
    const second = await request(app.getHttpServer()).get('/errors/405').expect(405);
    expect(first.body).toEqual({ type: 'about:blank', title: 'Method Not Allowed', status: 405, traceId: expect.stringMatching(uuid) });
    expect(first.body.traceId).not.toBe(second.body.traceId);
  });

  it('normalizes invalid exception statuses to a safe 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await request(app.getHttpServer()).get('/errors/200').expect(500);
  });
});

describe('validation metadata bounds', () => {
  it('caps entries and discards extra properties', () => {
    const entry = { pointer: '/body/name', code: 'required', value: 'SECRET' } as const;
    const exception = new RequestValidationException(Array(51).fill(entry));
    expect(exception.errors).toHaveLength(50);
    expect(exception.errors[0]).toEqual({ pointer: '/body/name', code: 'required' });
  });
  it.each(['invalid', '/bad~escape', '/control\n', '/' + 'x'.repeat(256)])('rejects invalid pointer %j', (pointer) => {
    expect(() => new RequestValidationException([{ pointer, code: 'invalid' }])).toThrow('Invalid validation issue metadata');
  });
  it('supports escaped JSON Pointer segments and rejects unknown codes', () => {
    expect(new RequestValidationException([{ pointer: '/body/a~1b/~0', code: 'invalid' }]).errors).toHaveLength(1);
    expect(() => new RequestValidationException([{ pointer: '', code: 'SECRET' } as unknown as ValidationIssue])).toThrow();
  });
});
