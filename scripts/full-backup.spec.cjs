const fs = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const crypto = require('node:crypto');
const archive = require('./local/operations/archive.cjs');
let directory;
beforeEach(async () => { directory = await fs.mkdtemp(join(tmpdir(),'iop-backup-test-')); });
afterEach(async () => { await fs.rm(directory,{recursive:true,force:true}); });
test('encrypted full bundle preserves private configuration, reference PNG bytes and independent file hashes', async () => {
  const input=join(directory,'private');await fs.mkdir(join(input,'locator','references'),{recursive:true});
  const secret='synthetic credential stored only in encrypted test archive';
  await fs.writeFile(join(input,'runtime.env'),secret);await fs.writeFile(join(input,'locator','references','area.png'),Buffer.from([137,80,78,71,13,10,26,10,0]));
  await fs.mkdir(join(input,'backups'));await fs.writeFile(join(input,'backups','old.iopbk'),'excluded previous backup');
  const key=crypto.randomBytes(32),file=join(directory,'full.iopbk'),entries=await archive.collect(input,'private');
  const manifest=await archive.seal(file,key,entries,{scope:'synthetic'});expect(entries).toHaveLength(2);
  expect((await fs.readFile(file)).includes(Buffer.from(secret))).toBe(false);
  const target=join(directory,'isolated'),restored=await archive.open(file,key,target);
  expect(restored.files).toEqual(manifest.files);expect(await fs.readFile(join(target,'private','runtime.env'),'utf8')).toBe(secret);
  expect(await archive.digest(join(target,'private','locator','references','area.png'))).toBe(entries.find(e=>e.path.endsWith('.png')).sha256);
  await expect(archive.seal(file,key,entries)).rejects.toThrow();expect(await fs.readFile(join(target,'private','runtime.env'),'utf8')).toBe(secret);
  await expect(archive.open(file,key,target)).rejects.toThrow();expect(await fs.readFile(join(target,'private','runtime.env'),'utf8')).toBe(secret);
});
test('wrong keys and authenticated tampering reject before creating a restore directory',async()=>{
  const input=join(directory,'input');await fs.mkdir(input);await fs.writeFile(join(input,'config.json'),'{}');const key=crypto.randomBytes(32),file=join(directory,'full.iopbk');
  await archive.seal(file,key,await archive.collect(input,'private'));const target=join(directory,'target');
  await expect(archive.open(file,crypto.randomBytes(32),target)).rejects.toThrow('authentication');await expect(fs.stat(target)).rejects.toThrow();
  const bytes=await fs.readFile(file);bytes[30]^=1;await fs.writeFile(file,bytes);await expect(archive.open(file,key,target)).rejects.toThrow('authentication');
});
test('unsafe paths, symlink inputs, changed files and public key permissions fail safely',async()=>{
  expect(archive.safePath('../escape')).toBe(false);expect(archive.safePath('/absolute')).toBe(false);expect(archive.safePath('private/../escape')).toBe(false);
  const input=join(directory,'input');await fs.mkdir(input);await fs.writeFile(join(input,'a'),'before');const entries=await archive.collect(input,'private');await fs.writeFile(join(input,'a'),'after');
  await expect(archive.seal(join(directory,'changed.iopbk'),crypto.randomBytes(32),entries)).rejects.toThrow('source changed');
  await fs.symlink(join(input,'a'),join(input,'link'));await expect(archive.collect(input,'private')).rejects.toThrow('regular files');
  const key=join(directory,'backup.key');await archive.createKey(key);expect((await archive.keyFile(key)).length).toBe(32);await fs.chmod(key,0o644);await expect(archive.keyFile(key)).rejects.toThrow('0600');
});
test('explicit bounded retention removes only authenticated expired archives and preserves live/source files',async()=>{
  const input=join(directory,'input'),backups=join(directory,'backups'),keyPath=join(directory,'key');await fs.mkdir(input);await fs.mkdir(backups);await fs.writeFile(join(input,'config'),'private source');await archive.createKey(keyPath);
  const key=await archive.keyFile(keyPath),entries=await archive.collect(input,'private');const file=join(backups,'backup.iopbk');const manifest=await archive.seal(file,key,entries);
  const {prune}=require('./local/full-backup.cjs');expect((await prune({keyPath,archiveDirectory:backups},new Date(manifest.createdAt))).removed).toBe(0);
  expect((await prune({keyPath,archiveDirectory:backups,limit:1},new Date(manifest.expiresAt))).removed).toBe(1);expect(await fs.readFile(join(input,'config'),'utf8')).toBe('private source');
  await fs.writeFile(join(backups,'tampered.iopbk'),'unauthenticated');await expect(prune({keyPath,archiveDirectory:backups},new Date('2030-01-01T00:00:00.000Z'))).rejects.toThrow();expect(await fs.readFile(join(backups,'tampered.iopbk'),'utf8')).toBe('unauthenticated');
});
