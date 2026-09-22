import openapiTS, { astToString } from 'openapi-typescript';
import { readFile } from 'node:fs/promises';
const generated = astToString(await openapiTS(new URL('../../api/contracts/openapi.json', import.meta.url)));
const committed = await readFile(new URL('../src/api/schema.d.ts', import.meta.url), 'utf8');
// CLI adds a generated-file header; compare declarations with the Node API output.
if (committed.slice(committed.indexOf('export interface paths')) !== generated.slice(generated.indexOf('export interface paths'))) {
  throw new Error('Browser contract drift: run npm run contract --workspace @iop/web');
}
console.log('Browser contract matches the API artifact.');
