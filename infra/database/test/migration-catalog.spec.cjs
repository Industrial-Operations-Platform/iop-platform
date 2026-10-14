const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { committedSqlMigrations, migrationCount, migrationHistory, migrationTables } = require('./migration-catalog.cjs');
test('SQL inventory excludes non-SQL files and directories and preserves sorted names independently', () => {
  const directory = mkdtempSync(join(tmpdir(), 'iop-migration-catalog-'));
  try {
    writeFileSync(join(directory, '20261014010000-second.sql'), '-- CREATE TABLE fixture.ignored(id int);\nCREATE TABLE fixture.second(id int);');
    writeFileSync(join(directory, '20261014000000-first.sql'), 'CREATE TABLE fixture.first(id int);');
    writeFileSync(join(directory, 'README.md'), 'Reference text');
    mkdirSync(join(directory, '20261014020000-directory.sql'));
    expect(committedSqlMigrations(directory)).toEqual(['20261014000000-first.sql', '20261014010000-second.sql']);
    expect(migrationCount(directory)).toBe(2);
    expect(migrationHistory(directory)).toEqual([{ name: '20261014000000-first' }, { name: '20261014010000-second' }]);
    expect(migrationTables(directory)).toEqual([{ schemaname: 'fixture', tablename: 'first' }, { schemaname: 'fixture', tablename: 'second' }, { schemaname: 'iop_migrations', tablename: 'history' }]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
