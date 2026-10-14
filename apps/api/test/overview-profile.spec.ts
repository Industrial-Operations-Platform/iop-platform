import type { Pool } from 'pg';
import { overviewProfileReader } from '../src/host/overview-composition';
import { runSiteOperation, SiteAccessDeniedError, AuthorizationUnavailableError } from '../src/persistence/site-operation';
jest.mock('../src/persistence/site-operation', () => ({ ...jest.requireActual('../src/persistence/site-operation'), runSiteOperation: jest.fn() }));
const scope = { organizationId: 'fixture-org', siteId: 'fixture-site', siteTimeZone: 'UTC' };
const read = () => overviewProfileReader({} as Pool, scope);
test('profile bootstrap uses the first currently authorized scoped source after Workforce revocation', async () => {
  (runSiteOperation as jest.Mock).mockImplementation(async (_pool, request, operation) => {
    if (request.permissions[0] === 'workforce.read') throw new SiteAccessDeniedError();
    return operation({ query: async () => ({ rows: [{ profile: 'team-leader' }] }) });
  });
  expect(await read()('fixture-actor')).toBe('team-leader');
  expect((runSiteOperation as jest.Mock).mock.calls.map(call => call[1])).toEqual([
    { ...scope, userId: 'fixture-actor', permissions: ['workforce.read'] },
    { ...scope, userId: 'fixture-actor', permissions: ['handover.read'] },
  ]);
});
test('profile bootstrap does not retry infrastructure failures through another source', async () => {
  (runSiteOperation as jest.Mock).mockRejectedValue(new AuthorizationUnavailableError());
  await expect(read()('fixture-actor')).rejects.toBeInstanceOf(AuthorizationUnavailableError);
  expect(runSiteOperation).toHaveBeenCalledTimes(1);
});
test('complete denial exhausts only the finite existing source permission list and never establishes a profile', async () => {
  (runSiteOperation as jest.Mock).mockRejectedValue(new SiteAccessDeniedError());
  await expect(read()('fixture-actor')).rejects.toBeInstanceOf(SiteAccessDeniedError);
  expect((runSiteOperation as jest.Mock).mock.calls.map(call => call[1].permissions[0])).toEqual([
    'workforce.read', 'handover.read', 'assets.read', 'maintenance.read', 'analytics.read', 'handover.records.manage',
  ]);
});
