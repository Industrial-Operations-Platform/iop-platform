const { readdirSync, readFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const directory = resolve(__dirname, '../migrations');

/** Test expectations read the committed SQL inventory, independently of the runner. */
function committedSqlMigrations(root = directory) {
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile() && /^\d{14}-[a-z0-9-]+\.sql$/.test(entry.name))
    .map(entry => entry.name).sort();
}
function migrationCount(root = directory) { return committedSqlMigrations(root).length; }
function migrationHistory(root = directory) {
  return committedSqlMigrations(root).map(file => ({ name: file.slice(0, -4) }));
}
/** Current static schema-qualified DDL plus the runner-owned history table. */
function migrationTables(root = directory) {
  const names = new Set(['iop_migrations.history']);
  for (const file of committedSqlMigrations(root)) {
    const sql = readFileSync(join(root, file), 'utf8').replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*\(/gi)) names.add(`${match[1]}.${match[2]}`);
  }
  return [...names].sort().map(name => { const [schemaname, tablename] = name.split('.'); return { schemaname, tablename }; });
}
module.exports = { committedSqlMigrations, migrationCount, migrationHistory, migrationTables };
