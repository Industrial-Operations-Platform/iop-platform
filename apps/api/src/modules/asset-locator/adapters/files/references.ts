import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { LocatorError, validComponent, type Component, type Reference } from '../../domain/locator';
import type { References } from '../../application/locator';
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
/** Only scoped content-addressed PNG files under an operator-owned private directory. */
export class PrivateReferences implements References {
  private readonly directory: string;
  constructor(root: string, private readonly scope: {
    organizationId: string;
    siteId: string;
  }) {
    if (![scope.organizationId, scope.siteId].every(v => /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(v)))
      throw new LocatorError('invalid_locator');
    this.directory = resolve(root, scope.organizationId, scope.siteId);
  }
  async list(): Promise<Reference[]> {
    let content: string;
    try {
      const path = join(this.directory, 'manifest.json');
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1048576)
        throw new Error();
      content = await readFile(path, 'utf8');
    }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT')
        return [];
      throw new LocatorError('locator_reference_unavailable');
    }
    try {
      const value = JSON.parse(content);
      if (value.version !== 1 || value.organizationId !== this.scope.organizationId || value.siteId !== this.scope.siteId || !Array.isArray(value.references) || value.references.length > 250)
        throw new Error();
      const refs = value.references as Reference[];
      for (const r of refs)
        if (!r || !/^[a-f0-9]{64}$/.test(r.id) || r.id !== r.sha256 || typeof r.name !== 'string' || r.name.length > 160 || typeof r.group !== 'string' || r.group.length > 160 || typeof r.sourcePath !== 'string' || r.sourcePath.length > 1000 || !Number.isSafeInteger(r.width) || !Number.isSafeInteger(r.height) || r.width < 1 || r.height < 1 || r.width * r.height > 16777216 || !Number.isSafeInteger(r.bytes) || r.bytes < 24 || r.bytes > 4194304 || !['schematic', 'legend'].includes(r.kind) || !Number.isFinite(Date.parse(r.importedAt)))
          throw new Error();
      if (new Set(refs.map(r => r.id)).size !== refs.length)
        throw new Error();
      return refs.map(r => ({ id: r.id, name: r.name, group: r.group, sourcePath: r.sourcePath, sha256: r.sha256, width: r.width, height: r.height, bytes: r.bytes, importedAt: r.importedAt, kind: r.kind }));
    }
    catch {
      throw new LocatorError('locator_reference_unavailable');
    }
  }
  async components(id: string): Promise<Component[]> {
    try {
      const path = join(this.directory, 'traces.json'), info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 4194304)
        throw new Error();
      const value = JSON.parse(await readFile(path, 'utf8'));
      if (value.version !== 1 || value.organizationId !== this.scope.organizationId || value.siteId !== this.scope.siteId || !Array.isArray(value.scenes) || value.scenes.length > 250)
        throw new Error();
      const entries = value.scenes.filter((s: {
        referenceId: string;
      }) => s.referenceId === id);
      if (entries.length > 1)
        throw new Error();
      if (!entries.length)
        return [];
      const raw = entries[0].components;
      if (!Array.isArray(raw) || raw.length > 1000)
        throw new Error();
      const components = raw.map(validComponent);
      if (new Set(components.map(c => c.id)).size !== components.length || components.some(c => c.assetId || c.verification !== 'provisional' || c.elevation !== null))
        throw new Error();
      return components;
    }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT')
        return [];
      throw new LocatorError('locator_reference_unavailable');
    }
  }
  async bytes(id: string): Promise<Uint8Array> {
    if (!/^[a-f0-9]{64}$/.test(id))
      throw new LocatorError('locator_missing');
    const ref = (await this.list()).find(r => r.id === id);
    if (!ref)
      throw new LocatorError('locator_missing');
    try {
      const path = join(this.directory, id + '.png'), info = await lstat(path), actual = await realpath(path), directory = await realpath(this.directory);
      if (!info.isFile() || info.isSymbolicLink() || info.size !== ref.bytes || !actual.startsWith(directory + sep))
        throw new Error();
      const bytes = await readFile(path);
      if (!bytes.subarray(0, 8).equals(signature) || bytes.readUInt32BE(16) !== ref.width || bytes.readUInt32BE(20) !== ref.height || createHash('sha256').update(bytes).digest('hex') !== ref.sha256)
        throw new Error();
      return bytes;
    }
    catch {
      throw new LocatorError('locator_reference_unavailable');
    }
  }
}
