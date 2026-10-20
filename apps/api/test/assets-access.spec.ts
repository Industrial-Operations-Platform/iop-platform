import type { Pool } from 'pg';
import { PgAssets } from '../src/modules/assets/adapters/postgres/store';
import { PgAssetDomain } from '../src/modules/assets/adapters/postgres/enrichment';
import { runSiteOperation, type SiteTransaction } from '../src/persistence/site-operation';
import { sitePersonProfile } from '../src/modules/users-rbac/adapters/postgres/site-people';
import { evaluateSiteAccess } from '../src/modules/users-rbac';

jest.mock('../src/persistence/site-operation', () => ({ runSiteOperation: jest.fn(), SiteAccessDeniedError: class extends Error {} }));
jest.mock('../src/modules/users-rbac/adapters/postgres/site-people', () => ({ sitePersonProfile: jest.fn() }));
jest.mock('../src/modules/users-rbac', () => ({ evaluateSiteAccess: jest.fn() }));
const scope = { organizationId: 'org', siteId: 'site' };
const tx = { context: { ...scope, userId: 'actor' }, query: jest.fn(async () => ({ rows: [] })) } as unknown as SiteTransaction;
const work = jest.fn(async () => true), granted = jest.fn(async () => true);
const stores = () => [
  new PgAssets({} as Pool, scope, { allowed: granted, names: async () => new Map(), sources: [] }),
  new PgAssetDomain({} as Pool, scope, { materialize: jest.fn(), candidates: jest.fn(), pareto: jest.fn() }),
];
beforeEach(() => {
  jest.clearAllMocks();
  (runSiteOperation as jest.Mock).mockImplementation(async (_pool, _request, callback) => callback(tx));
  jest.mocked(sitePersonProfile).mockResolvedValue('administrator');
  jest.mocked(evaluateSiteAccess).mockResolvedValue({ allowed: true });
  granted.mockResolvedValue(true);
});
test.each(['team-leader', 'task-force', 'technician', ''])('standalone Assets/model reads and writes deny current %s even with stale grants', async profile => {
  jest.mocked(sitePersonProfile).mockResolvedValue(profile);
  for (const store of stores()) for (const permission of ['assets.read', 'assets.manage'] as const)
    await expect(store.run('actor', permission, work)).rejects.toBeInstanceOf(Error);
  expect(work).not.toHaveBeenCalled();
});
test.each(['assets.read', 'assets.manage'] as const)('Administrator still needs current %s', async permission => {
  granted.mockResolvedValue(false);
  jest.mocked(evaluateSiteAccess).mockResolvedValue({ allowed: false, reason: 'access-denied' });
  for (const store of stores()) await expect(store.run('actor', permission, work)).rejects.toBeInstanceOf(Error);
  expect(work).not.toHaveBeenCalled();
});
test('current Administrator and grants permit both standalone owners', async () => {
  for (const store of stores()) for (const permission of ['assets.read', 'assets.manage'] as const)
    await expect(store.run('actor', permission, work)).resolves.toBe(true);
});
