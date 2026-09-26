import { evaluateSiteAccess, validSiteAccessRequest, type SiteAccessRequest } from '../src/modules/users-rbac';
import { runSiteOperation, AuthorizationUnavailableError, SiteAccessDeniedError } from '../src/persistence/site-operation';
import type { Pool, PoolClient } from 'pg';

const input: SiteAccessRequest = { userId: 'user', organizationId: 'org-a', siteId: 'site-a', permissions: ['analytics.read'] };
const role = (role_id: unknown, user_active = true, membership_active = true) => ({ role_id, user_active, membership_active });

test.each([
  [['analytics-reader'], ['analytics.read'], true],
  [['analytics-reader'], ['imports.submit'], false],
  [['analytics-reader'], ['imports.review'], false],
  [['site-operator'], ['analytics.read'], false],
  [['site-operator'], ['imports.submit', 'imports.review', 'site-configuration.manage'], true],
  [['analytics-reader', 'site-operator'], ['analytics.read', 'imports.submit'], true],
  [['analytics-reader'], ['analytics.read', 'imports.submit'], false],
  [['unknown', 'analytics-reader'], ['analytics.read'], false],
  [['constructor'], ['analytics.read'], false],
])('fixed assignments %j requesting %j allow=%s', async (assignments, permissions, allowed) => {
  const database = { query: jest.fn().mockResolvedValue({ rows: assignments.map(value => role(value)) }) };
  expect((await evaluateSiteAccess(database, { ...input, permissions })).allowed).toBe(allowed);
  expect(database.query.mock.calls[0][1]).toEqual(['user', 'org-a', 'site-a']);
});

test.each([[], [role(null)], [role('analytics-reader', false)], [role('analytics-reader', true, false)]])(
  'absent or inactive state denies: %j', async (...rows) => {
    const database = { query: jest.fn().mockResolvedValue({ rows }) };
    expect((await evaluateSiteAccess(database, input)).allowed).toBe(false);
  },
);

test.each([
  null, {}, { ...input, userId: '' }, { ...input, organizationId: undefined },
  { ...input, siteId: 'bad/site' }, { ...input, permissions: [] },
  { ...input, permissions: ['access.manage'] }, { ...input, permissions: ['*'] },
  { ...input, permissions: ['analytics.read', 'unknown'] },
])('invalid request is rejected before acquiring any connection: %j', async value => {
  const request = value as SiteAccessRequest;
  const pool = { connect: jest.fn() };
  expect(validSiteAccessRequest(request)).toBe(false);
  await expect(runSiteOperation(pool, request, jest.fn())).rejects.toBeInstanceOf(SiteAccessDeniedError);
  expect(pool.connect).not.toHaveBeenCalled();
});

function fakePool(options: { rollbackFails?: boolean; lookupFails?: boolean; dirty?: boolean; commitRollsBack?: boolean } = {}) {
  const release = jest.fn();
  const query = jest.fn(async (sql: string) => {
    if (sql.startsWith('ROLLBACK') && options.rollbackFails) throw new Error('private connection details');
    if (sql.includes('AS clean')) return { rows: [{ clean: !options.dirty }] };
    if (sql.includes('FROM platform_core.sites')) return { rows: [{ site_id: 'site-a' }] };
    if (sql.includes('FROM users_rbac.users')) {
      if (options.lookupFails) throw new Error('private SQL and credentials');
      return { rows: [role('analytics-reader')] };
    }
    return { rows: [], command: sql === 'COMMIT' && options.commitRollsBack ? 'ROLLBACK' : sql };
  });
  const pool = { connect: jest.fn(async () => ({ query, release, on: jest.fn(), removeListener: jest.fn() } as unknown as PoolClient)) } as Pick<Pool, 'connect'>;
  return { pool, release, query };
}

test('lookup failure is sanitized, never runs work and destroys failed cleanup connection', async () => {
  const { pool, release } = fakePool({ lookupFails: true, rollbackFails: true });
  const work = jest.fn();
  await expect(runSiteOperation(pool, input, work)).rejects.toEqual(new AuthorizationUnavailableError());
  expect(work).not.toHaveBeenCalled();
  expect(release).toHaveBeenCalledWith(true);
});

test('dirty session is rejected and destroyed before beginning work', async () => {
  const { pool, release, query } = fakePool({ dirty: true });
  await expect(runSiteOperation(pool, input, jest.fn())).rejects.toEqual(new AuthorizationUnavailableError());
  expect(query).toHaveBeenCalledTimes(1);
  expect(release).toHaveBeenCalledWith(true);
});

test('rollback response cannot be mistaken for a successful commit', async () => {
  const { pool, release } = fakePool({ commitRollsBack: true });
  await expect(runSiteOperation(pool, input, async () => 'result')).rejects.toEqual(new AuthorizationUnavailableError());
  expect(release).toHaveBeenCalledWith(true);
});

test('connection failure is sanitized', async () => {
  const pool = { connect: jest.fn().mockRejectedValue(new Error('private host/password')) };
  await expect(runSiteOperation(pool, input, jest.fn())).rejects.toEqual(new AuthorizationUnavailableError());
});
