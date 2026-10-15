import { readFile, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { LocatorError } from '../../domain/locator';
import { validModelCandidate, type ModelCandidate } from '../../domain/model-preparation';
import type { ModelSource } from '../../application/locator';

/** Trusted local schematic analysis output; never a public upload or an asset registry. */
export class PrivateModelCandidates implements ModelSource {
  private readonly path: string;
  private cache?: { signature: string; models: ModelCandidate[] };
  constructor(root: string, private readonly scope: { organizationId: string; siteId: string }) {
    if (![scope.organizationId, scope.siteId].every(v => /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(v)))
      throw new LocatorError('invalid_locator');
    this.path = join(resolve(root, scope.organizationId, scope.siteId), 'model-candidates.json');
  }
  async list(): Promise<ModelCandidate[]> {
    try {
      const info = await lstat(this.path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new Error();
      const signature = `${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`;
      if (this.cache?.signature === signature) return structuredClone(this.cache.models);
      const content = await readFile(this.path);
      if (content.length > 32 * 1024 * 1024) throw new Error();
      const value = JSON.parse(content.toString('utf8'));
      if (value.version !== 1 || value.organizationId !== this.scope.organizationId || value.siteId !== this.scope.siteId ||
        !Array.isArray(value.scenes) || value.scenes.length > 250) throw new Error();
      const models = value.scenes.map(validModelCandidate) as ModelCandidate[];
      if (new Set(models.map(m => m.referenceId)).size !== models.length) throw new Error();
      this.cache = { signature, models };
      return structuredClone(models);
    } catch (error) {
      this.cache = undefined;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw new LocatorError('locator_reference_unavailable');
    }
  }
}
