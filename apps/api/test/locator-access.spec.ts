import type { Pool } from 'pg';
import { PgLocator, type LocatorLookups } from '../src/modules/asset-locator/adapters/postgres/store';
import { runSiteOperation, type SiteTransaction } from '../src/persistence/site-operation';
jest.mock('../src/persistence/site-operation', () => ({ runSiteOperation: jest.fn(), SiteAccessDeniedError: class extends Error {
  } }));
const tx = { context: { organizationId: 'org', siteId: 'site', userId: 'actor' }, query: jest.fn(async () => ({ rows: [] })) } as unknown as SiteTransaction;
const work = jest.fn(async () => true);
const lookups: LocatorLookups = { allowed: jest.fn(async () => true), profile: jest.fn(async () => 'administrator'), asset: async () => null, assets: async () => [], problems: async () => ({ items: [], coverage: [] }) };
beforeEach(() => { jest.clearAllMocks(); (runSiteOperation as jest.Mock).mockImplementation(async (_pool, _request, callback) => callback(tx)); (lookups.profile as jest.Mock).mockResolvedValue('administrator'); (lookups.allowed as jest.Mock).mockResolvedValue(true); });
test.each(['administrator', 'team-leader', 'task-force'])('current %s profile and grant permit scoped locator operations', async (profile) => { (lookups.profile as jest.Mock).mockResolvedValue(profile); const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups); await expect(store.run('actor', 'locator.read', work)).resolves.toBe(true); expect(runSiteOperation).toHaveBeenCalledWith(expect.anything(), { organizationId: 'org', siteId: 'site', userId: 'actor', permissions: ['locator.read'] }, expect.any(Function)); });
test('technician stays denied even if a stale locator grant remains', async () => { (lookups.profile as jest.Mock).mockResolvedValue('technician'); const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups); await expect(store.run('actor', 'locator.read', work)).rejects.toBeInstanceOf(Error); expect(work).not.toHaveBeenCalled(); });
test('a revoked grant cannot be overridden by a permitted profile', async () => { (lookups.allowed as jest.Mock).mockResolvedValue(false); const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups); await expect(store.run('actor', 'locator.manage', work)).rejects.toBeInstanceOf(Error); expect(work).not.toHaveBeenCalled(); });
test.each(['team-leader', 'task-force', 'technician'])('%s cannot mutate with stale Locator manager grants', async profile => {
  (lookups.profile as jest.Mock).mockResolvedValue(profile);
  const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups);
  await expect(store.run('actor', 'locator.manage', work)).rejects.toBeInstanceOf(Error);
  expect(work).not.toHaveBeenCalled();
});
test.each(['administrator', 'team-leader', 'task-force'])('%s capability reflects its current profile as well as the grant', async profile => {
  (lookups.profile as jest.Mock).mockResolvedValue(profile);
  const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups);
  await expect(store.run('actor', 'locator.read', async transaction => transaction.canManage)).resolves.toBe(profile === 'administrator');
});
test('Administrator remains read-only when only its current manager grant is revoked', async () => {
  (lookups.allowed as jest.Mock).mockImplementation(async (_tx, _actor, permission) => permission === 'locator.read');
  const store = new PgLocator({} as Pool, { organizationId: 'org', siteId: 'site' }, lookups);
  await expect(store.run('actor', 'locator.read', async transaction => transaction.canManage)).resolves.toBe(false);
  await expect(store.run('actor', 'locator.manage', work)).rejects.toBeInstanceOf(Error);
  expect(work).not.toHaveBeenCalled();
});
