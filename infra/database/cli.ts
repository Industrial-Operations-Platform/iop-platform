import { configuration, DatabaseError, provisioningConfiguration } from './configuration';
import { migrate } from './migrate';
import { provision } from './provision';
import { seedSite } from './seed-site';
import { seedOrganization } from './seed-organization';

async function main(): Promise<void> {
  const [command, ...extra] = process.argv.slice(2);
  if (extra.length) throw new DatabaseError('Expected exactly one database command.');
  if (command === 'provision') {
    await provision(provisioningConfiguration(process.env));
    console.log('Local database roles provisioned.');
  } else if (command === 'migrate') {
    const count = await migrate(configuration(process.env, 'migrator'));
    console.log(`Local database migrations complete: ${count} applied.`);
  } else if (command === 'seed-organization') {
    const result = await seedOrganization(process.env);
    console.log(`Local organization seed complete: ${result}.`);
  } else if (command === 'seed-site') {
    const result = await seedSite(process.env);
    console.log(`Local site seed complete: ${result}.`);
  } else {
    throw new DatabaseError('Expected database command: provision, migrate, seed-organization or seed-site.');
  }
}

void main().catch((error: unknown) => {
  // Raw driver/runner errors can contain credentials, SQL and database diagnostics.
  console.error(error instanceof DatabaseError ? error.message : 'Local database command failed; check configuration, database availability and provisioning.');
  process.exitCode = 1;
});
