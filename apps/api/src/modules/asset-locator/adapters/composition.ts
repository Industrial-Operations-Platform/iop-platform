import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { Locator } from '../application/locator';
import { PgLocator, type LocatorLookups } from './postgres/store';
import { PrivateReferences } from './files/references';
export function composeLocator(options: {
  pool: Pool;
  scope: {
    organizationId: string;
    siteId: string;
  };
  referenceRoot: string;
  lookups: LocatorLookups;
  locations: readonly {
    id: string;
    label: string;
    parentId: string;
  }[];
  ids?: () => string;
  now?: () => string;
}): Locator {
  return new Locator(new PgLocator(options.pool, options.scope, options.lookups), new PrivateReferences(options.referenceRoot, options.scope), options.locations, options.ids ?? randomUUID, options.now ?? (() => new Date().toISOString()));
}
