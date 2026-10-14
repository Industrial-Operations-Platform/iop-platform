const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { createGzip, createGunzip } = require('node:zlib');
const MAGIC = Buffer.from('IOPBK001');
const LIMIT = 2 * 1024 * 1024 * 1024;
const MANIFEST_LIMIT = 8 * 1024 * 1024;
class BackupError extends Error {}
const fail = (message) => { throw new BackupError(message); };
function safePath(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 1024 && !value.includes('\\') &&
    !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..' && !/[\x00-\x1f]/.test(part));
}
async function keyFile(file) {
  const stat = await fsp.lstat(file);
  if (!stat.isFile() || (stat.mode & 0o077) !== 0) fail('A private mode-0600 encryption key file is required.');
  const key = await fsp.readFile(file);
  if (key.length !== 32) fail('The encryption key must contain exactly 32 random bytes.');
  return key;
}
async function createKey(file) { await fsp.writeFile(file, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' }); }
async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function collect(root, prefix, exclude = ['backups']) {
  if (!safePath(prefix)) fail('Invalid backup namespace.');
  const entries = [];
  const visit = async (directory, relative = '') => {
    for (const name of (await fsp.readdir(directory)).sort()) {
      const relativePath = relative ? relative + '/' + name : name;
      if (exclude.some(value => relativePath === value || relativePath.startsWith(value + '/'))) continue;
      const file = path.join(directory, name), stat = await fsp.lstat(file);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) fail('Backup input must contain only regular files and directories.');
      if (stat.isDirectory()) await visit(file, relativePath);
      else {
        const nameInArchive = prefix + '/' + relativePath;
        if (!safePath(nameInArchive) || stat.size > LIMIT) fail('Backup input exceeds the supported path or size limit.');
        entries.push({ path: nameInArchive, file, bytes: stat.size, sha256: await digest(file) });
      }
    }
  };
  const stat = await fsp.lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('A real private input directory is required.');
  await visit(root);
  return entries;
}
async function seal(output, key, entries, metadata = {}) {
  if (!Buffer.isBuffer(key) || key.length !== 32 || entries.length > 20000) fail('Invalid archive inputs.');
  if (new Set(entries.map(entry => entry.path)).size !== entries.length || entries.some(entry => !safePath(entry.path))) fail('Duplicate or unsafe archive paths.');
  const manifest = { version: 1, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    metadata, files: entries.map(({ file, ...entry }) => entry) };
  const json = Buffer.from(JSON.stringify(manifest));
  if (json.length > MANIFEST_LIMIT || entries.reduce((sum, entry) => sum + entry.bytes, json.length + 4) > LIMIT) fail('Backup exceeds the supported 2 GiB uncompressed limit.');
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(MAGIC);
  const size = Buffer.alloc(4); size.writeUInt32BE(json.length);
  async function* parts() {
    yield size; yield json;
    for (const entry of entries) {
      if ((await fsp.lstat(entry.file)).size !== entry.bytes || await digest(entry.file) !== entry.sha256) fail('Backup source changed; no backup was completed.');
      yield* fs.createReadStream(entry.file);
      if (await digest(entry.file) !== entry.sha256) fail('Backup source changed; no backup was completed.');
    }
  }
  const handle = await fsp.open(output, 'wx', 0o600);
  const target = fs.createWriteStream(output, { fd: handle.fd, autoClose: false });
  target.write(Buffer.concat([MAGIC, iv]));
  try {
    await pipeline(Readable.from(parts()), createGzip(), cipher, target);
    await fsp.appendFile(output, cipher.getAuthTag());
    return manifest;
  } catch (error) { await fsp.rm(output, { force: true }); throw error; }
  finally { await handle.close().catch(error => { if (error.code !== "EBADF") throw error; }); }
}
async function open(archive, key, destination) {
  const temporary = await fsp.mkdtemp(path.join(os.tmpdir(), 'iop-backup-'));
  await fsp.chmod(temporary, 0o700);
  const plaintext = path.join(temporary, 'archive.bin');
  let created = false;
  try {
    const input = await fsp.open(archive, 'r');
    let stat;const header = Buffer.alloc(20), tag = Buffer.alloc(16);
    try{stat = await input.stat();if (stat.size < 36 || stat.size > LIMIT + MANIFEST_LIMIT) fail('Invalid backup size.');
      await input.read(header, 0, 20, 0); await input.read(tag, 0, 16, stat.size - 16);
    }finally{await input.close();}
    if (!header.subarray(0, 8).equals(MAGIC)) fail('Unsupported backup format.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, header.subarray(8));
    decipher.setAAD(MAGIC); decipher.setAuthTag(tag);
    let bytes = 0;
    const bound = new Transform({ transform(chunk, _encoding, callback) { bytes += chunk.length; callback(bytes > LIMIT ? new BackupError('Backup expansion exceeds its limit.') : null, chunk); } });
    await pipeline(fs.createReadStream(archive, { start: 20, end: stat.size - 17 }), decipher, createGunzip(), bound,
      fs.createWriteStream(plaintext, { flags: 'wx', mode: 0o600 }));
    const file = await fsp.open(plaintext, 'r'), sizeBytes = Buffer.alloc(4);let manifestBytes,manifestBuffer;
    try{await file.read(sizeBytes, 0, 4, 0);manifestBytes = sizeBytes.readUInt32BE();
      if (manifestBytes > MANIFEST_LIMIT || manifestBytes < 2) fail('Invalid backup manifest.');
      manifestBuffer = Buffer.alloc(manifestBytes); await file.read(manifestBuffer, 0, manifestBytes, 4);
    }finally{await file.close();}
    const manifest = JSON.parse(manifestBuffer.toString('utf8'));
    if (manifest.version !== 1 || !Array.isArray(manifest.files) || manifest.files.length > 20000 ||
      new Set(manifest.files.map(entry => entry.path)).size !== manifest.files.length || manifest.files.some(entry => !safePath(entry.path) ||
        !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256))) fail('Invalid backup manifest.');
    if (manifest.files.reduce((sum, entry) => sum + entry.bytes, manifestBytes + 4) !== bytes) fail('Backup file lengths do not reconcile.');
    await fsp.mkdir(destination, { mode: 0o700 }); created = true;
    let offset = manifestBytes + 4;
    for (const entry of manifest.files) {
      const target = path.resolve(destination, entry.path);
      if (!target.startsWith(path.resolve(destination) + path.sep)) fail('Unsafe restore path.');
      await fsp.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
      if (entry.bytes) await pipeline(fs.createReadStream(plaintext, { start: offset, end: offset + entry.bytes - 1 }), fs.createWriteStream(target, { flags: 'wx', mode: 0o600 }));
      else await fsp.writeFile(target, Buffer.alloc(0), { flag: 'wx', mode: 0o600 });
      if (await digest(target) !== entry.sha256) fail('Restored file integrity failed.');
      offset += entry.bytes;
    }
    await fsp.writeFile(path.join(destination, 'backup-manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx' });
    return manifest;
  } catch (error) {
    if (created) await fsp.rm(destination, { recursive: true, force: true });
    if (error instanceof BackupError) throw error;
    fail('Backup authentication or integrity validation failed; no installation was replaced.');
  } finally { await fsp.rm(temporary, { recursive: true, force: true }); }
}
module.exports = { BackupError, safePath, keyFile, createKey, digest, collect, seal, open, LIMIT };
