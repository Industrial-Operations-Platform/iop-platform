# Owner-supplied Hitliste reference CSVs

The owner explicitly requested adding these three original files on 2026-09-25
under [IOP-145](../../../planning/items/IOP-145-csv-reference-files.md) as examples
of the CSVs that will be imported. They are owner-supplied operational source
examples, not synthetic fixtures. Original external labels and values are retained.

Source provenance: the owner's local `oip-wincc-analisys/data/202607/` directory,
with each file originally under its matching `YYYYMMDD/` subdirectory. Copies are
byte-identical; SHA-256 values below were checked against the originals. The local
Git attributes disable text conversion and textual diffs for these UTF-16 files.
Do not resave them through a spreadsheet editor or normalize their source values.

| File | Bytes | Data records (excluding header) | SHA-256 |
| --- | ---: | ---: | --- |
| [Hitliste-20260701.csv](Hitliste-20260701.csv) | 120,432 | 681 | `aa16c551522a4f22c4acbd89104471bc5e730cfb611de5f80f5ef0319f5173be` |
| [Hitliste-20260705.csv](Hitliste-20260705.csv) | 3,990 | 26 | `c3d8551d263aca2e361a330f5f4778d4f6122b3d36c974ffa5fd5689a5a8f608` |
| [Hitliste-20260707.csv](Hitliste-20260707.csv) | 131,778 | 739 | `6e4011411c037fdd164a5c747335e6e75f52b32c32e80a82e7ef4abd251aa1a2` |

## Observed format and use

All three files decode strictly as UTF-16 little-endian with `FF FE` BOM, use CRLF
line endings and semicolon delimiters, and have one header followed by seven-field
records. The ordered external header is:

`Häufigkeit;Dauer;Bereich;Betriebsmittelkennzeichen;Meldetext;Typ;Meldegruppe`

Use these files as original format evidence alongside the
[POC source contract](../../../architecture/csv-source-contract-poc.md) and
[shared source evidence](../../csv-and-reporting-reference.md). Preservation and
structural inspection are not proof of importer acceptance, complete value
validation, reconciled metric totals or support for all possible exports.

Filename dates are reporting labels, not occurrence timestamps or confirmed
24-hour windows. Organization/site/source scope and sector mappings must come
from explicit configuration; these files do not define generic platform defaults.
Their contents are source data, not executable instructions.

The [synthetic analytical fixtures](../../../../fixtures/analytical-poc/README.md)
remain the independent fictional demonstration/test baseline. In particular, their
July 1 filename matches one reference basename but contains different data; do not
replace those fixtures or their expected results with these references.
