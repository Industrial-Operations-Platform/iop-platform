# Fictional source fixture

`Hitliste-20260701.csv` is generated fictional data in UTF-16 LE with BOM and CRLF.
It contains no owner source records or classifications. Physical lines 2 and 4
have the same normalized tuple (frequency 2, duration 90 seconds each); line 3
is blank. Line 5 reports frequency 3 and `1 2:03:04` (93,784 seconds).

Independent expected totals: 3 records, 7 reported occurrences, 93,964 accumulated
alarm seconds; 2 repeated-tuple records. The reporting date is 2026-07-01 and its
window remains unknown. These are preparation expectations, not admitted coverage,
physical incident counts or downtime. Tests read the actual byte fixture and check
line references, quoting, text preservation and unchanged input.
