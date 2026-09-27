const { makeSeed, readTables, sha256 } = require("./local/backup-seed.cjs");
const archiveHash = "a".repeat(64);
function dump({
  area = "Zuführung L,M,S",
  equipmentArea = "1",
  duration = "1 2:03:04",
} = {}) {
  return [
    "CREATE FUNCTION must_not_execute() RETURNS void AS $$ SELECT dangerous(); $$ LANGUAGE sql;",
    "COPY public.hitliste (id, text) FROM stdin;",
    "999\tignored",
    "\\.",
    "COPY analytics.fact_hitliste (id, source_hitliste_id, datum, haufigkeit, dauer_original, dauer_minuten, bereich_id, betriebsmittel_id, meldetext_id, typ_id, meldegruppe_id, created_at) FROM stdin;",
    `1\t10\t2026-07-01\t12\t${duration}\t0\t1\t2\t3\t4\t5\t2026-07-01`,
    `2\t11\t2026-07-01\t12\t${duration}\t0\t1\t2\t3\t4\t5\t2026-07-01`,
    "\\.",
    "COPY core.bereich (id, name, created_at) FROM stdin;",
    `1\t${area}\tnow`,
    "\\.",
    "COPY core.betriebsmittel (id, kennzeichen, bereich_id, created_at) FROM stdin;",
    `2\t=A+1\t${equipmentArea}\tnow`,
    "\\.",
    "COPY core.meldetext (id, name) FROM stdin;",
    '3\tError "one"\\ttext',
    "\\.",
    "COPY core.meldung_typ (id, name) FROM stdin;",
    "4\tStörung",
    "\\.",
    "COPY core.meldegruppe (id, name) FROM stdin;",
    "5\tB1",
    "\\.",
  ].join("\n");
}
test("analytics joins, COPY escapes, German text, commas, quotes and repeated tuples remain faithful", () => {
  const seed = makeSeed(dump(), archiveHash),
    file = seed.files[0];
  expect(file).toMatchObject({
    date: "2026-07-01",
    records: 2,
    frequency: 24,
    seconds: 187568,
  });
  expect(file.bytes.toString("utf16le")).toContain('"Zuführung L,M,S"');
  expect(file.bytes.toString("utf16le")).toContain('"Error ""one""\ttext"');
  expect(file.lineage).toEqual([
    { factId: "1", sourceHitlisteId: "10" },
    { factId: "2", sourceHitlisteId: "11" },
  ]);
  expect(file.sha256).toBe(sha256(file.bytes));
  expect(file.sha256).toBe(makeSeed(dump(), archiveHash).files[0].sha256);
});
test.each([
  () => dump({ equipmentArea: "999" }),
  () => dump({ duration: "0 25:00:00" }),
  () => dump().replace("COPY core.meldetext", "COPY other.meldetext"),
  () => dump().replace("2\t11\t2026", "2\t10\t2026"),
  () => dump().replace("1\t10\t2026-07-01", "1\t10\t2026-02-30"),
  () => dump({ area: "\\N" }),
  () =>
    dump() + "\nCOPY core.meldegruppe (id, name) FROM stdin;\n6\tincomplete",
])("inconsistent reference data fails before any seed is produced", (source) =>
  expect(() => makeSeed(source(), archiveHash)).toThrow(),
);
test("unknown tables and SQL statements are never part of the extracted model", () => {
  expect([...readTables(dump()).keys()]).toHaveLength(6);
  expect(readTables(dump()).has("public.hitliste")).toBe(false);
});
