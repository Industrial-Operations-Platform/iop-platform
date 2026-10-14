#!/usr/bin/env python3
"""Import scoped reference PNGs privately; never infer physical positions or health."""
import argparse, hashlib, json, os, re, struct, tempfile, zipfile
from pathlib import Path
from datetime import datetime, timezone

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--organization', required=True)
    parser.add_argument('--site', required=True)
    parser.add_argument('--root', type=Path, default=Path('.local-platform/locator'))
    args = parser.parse_args()
    if not all(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,99}', v) for v in (args.organization, args.site)):
        parser.error('Organization and site must be bounded platform identifiers.')
    references, payloads = [], {}
    at = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
    with zipfile.ZipFile(args.archive) as archive:
        entries = [i for i in archive.infolist() if not i.is_dir()]
        if len(entries) > 250 or sum(i.file_size for i in entries) > 64 * 1024 * 1024:
            raise ValueError('Reference archive exceeds the finite import budget.')
        for entry in entries:
            if not entry.filename.lower().endswith('.png'):
                raise ValueError('Only PNG reference files are supported.')
            if not 24 <= entry.file_size <= 4 * 1024 * 1024:
                raise ValueError('PNG exceeds its finite byte budget.')
            data = archive.read(entry)
            if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
                raise ValueError('Reference is not a PNG image.')
            width, height = struct.unpack('>II',data[16:24])
            if min(width,height) < 1 or width*height > 16777216:
                raise ValueError('PNG exceeds its finite pixel budget.')
            original = entry.filename.replace('\\','/')
            parts = original.split('/')
            if any(p in ('','..','.') for p in parts) or original.startswith('/') or len(original)>1000:
                raise ValueError('Unsafe reference source path.')
            digest = hashlib.sha256(data).hexdigest()
            if digest in payloads:
                raise ValueError('Duplicate reference bytes require explicit catalog reconciliation.')
            name = Path(parts[-1]).stem
            group = parts[-2] if len(parts)>2 else 'Reference'
            if len(name)>160 or len(group)>160:
                raise ValueError('Reference labels exceed the catalog budget.')
            references.append(dict(id=digest,name=name,group=group,sourcePath=original,sha256=digest,width=width,height=height,bytes=len(data),importedAt=at,kind='legend' if name.lower() in ('legende','legend') else 'schematic'))
            payloads[digest]=data
    directory = args.root / args.organization / args.site
    directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    os.chmod(directory,0o700)
    for digest,data in payloads.items():
        target = directory / (digest+'.png')
        if target.is_symlink():
            raise ValueError('Reference target cannot be a symbolic link.')
        if target.exists() and target.read_bytes()!=data:
            raise ValueError('Reference hash collision or modified private file.')
        if not target.exists():
            with target.open('xb') as stream:
                stream.write(data)
            os.chmod(target,0o600)
    manifest=dict(version=1,organizationId=args.organization,siteId=args.site,archiveName=args.archive.name,archiveSha256=hashlib.sha256(args.archive.read_bytes()).hexdigest(),references=references)
    descriptor, temporary = tempfile.mkstemp(prefix='.manifest-',dir=directory)
    with os.fdopen(descriptor,'w',encoding='utf-8') as stream:
        json.dump(manifest,stream,ensure_ascii=False,indent=2)
        stream.write('\n')
    os.replace(temporary,directory/'manifest.json')
    print(f'Imported {len(references)} private PNG references ({sum(r["kind"]=="schematic" for r in references)} equipment views).')
    print('Run authorized Locator initialization in the workspace to create durable provisional scene metadata.')

if __name__=='__main__':
    main()
