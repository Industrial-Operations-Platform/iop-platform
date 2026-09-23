import { configuration, DatabaseError, provisioningConfiguration } from './configuration';
import { migrate } from './migrate';
import { provision } from './provision';

async function main(): Promise<void> {
  const [command, ...extra] = process.argv.slice(2);
  if (extra.length) throw new DatabaseError('Expected exactly one database command.');
  if (command === 'provision') {
    await provision(provisioningConfiguration(process.env));
    console.log('Local database roles provisioned.');
  } else if (command === 'migrate') {
    const count = await migrate(configuration(process.env, 'migrator'));
    console.log(`Local database migrations complete: ${count} applied.`);
  } else {
    throw new DatabaseError('Expected database command: provision or migrate.');
  }
}

void main().catch((error: unknown) => {
  // Raw driver/runner errors can contain credentials, SQL and database diagnostics.
  console.error(error instanceof DatabaseError ? error.message : 'Local database command failed; check configuration, database availability and provisioning.');
  process.exitCode = 1;
});
