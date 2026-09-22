import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApplication } from './application';
import { createOpenApiDocument } from './openapi';

async function generate(): Promise<void> {
  const app = await createApplication();
  try {
    writeFileSync(join(__dirname, '../contracts/openapi.json'),
      JSON.stringify(createOpenApiDocument(app), null, 2) + '\n');
  } finally {
    await app.close();
  }
}

void generate().catch(() => {
  console.error('OpenAPI generation failed.');
  process.exitCode = 1;
});
