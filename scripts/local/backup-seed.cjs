const { createHash } = require("node:crypto");
const schemas = {
  "analytics.fact_hitliste":
    "id, source_hitliste_id, datum, haufigkeit, dauer_original, dauer_minuten, bereich_id, betriebsmittel_id, meldetext_id, typ_id, meldegruppe_id, created_at",
  "core.bereich": "id, name, created_at",
  "core.betriebsmittel": "id, kennzeichen, bereich_id, created_at",
  "core.meldetext": "id, name",
  "core.meldung_typ": "id, name",
  "core.meldegruppe": "id, name",
};
const fail = () => {
  throw new Error(
    "Backup analytics data is incomplete or incompatible; no seed was generated.",
  );
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function copyValue(raw) {
  if (raw === "\\N") return null;
  return raw.replace(/\\([0-7]{1,3}|x[0-9a-fA-F]{1,2}|.)/g, (_, value) => {
    if (/^[0-7]/.test(value)) return String.fromCharCode(parseInt(value, 8));
    if (/^x[0-9a-fA-F]/.test(value))
      return String.fromCharCode(parseInt(value.slice(1), 16));
    return (
      { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", "\\": "\\" }[
        value
      ] ?? value
    );
  });
}
/** Read known COPY payloads only. No archive statement is ever executed. */
function readTables(sql) {
  const tables = new Map();
  let active = null;
  for (const line of sql.split("\n")) {
    if (active) {
      if (line === "\\.") {
        active = null;
        continue;
      }
      if (active.skip) continue;
      const values = line.split("\t").map(copyValue);
      if (values.length !== active.columns.length) fail();
      const row = Object.fromEntries(
        active.columns.map((name, i) => [name, values[i]]),
      );
      if (!/^\d+$/.test(row.id) || active.rows.has(row.id)) fail();
      active.rows.set(row.id, row);
      continue;
    }
    const match = /^COPY ([a-z_.]+) \(([^)]+)\) FROM stdin;$/.exec(line);
    if (!match) continue;
    const [, name, columns] = match;
    if (!schemas[name]) {
      active = { skip: true };
      continue;
    }
    if (schemas[name] !== columns || tables.has(name)) fail();
    const rows = new Map();
    tables.set(name, rows);
    active = { columns: columns.split(", "), rows };
  }
  if (active || Object.keys(schemas).some((name) => !tables.has(name))) fail();
  return tables;
}
function makeSeed(sql, archiveSha256) {
  if (!/^[a-f0-9]{64}$/.test(archiveSha256)) fail();
  const tables = readTables(sql),
    days = new Map(),
    sourceIds = new Set();
  const reference = (table, id) => {
    const row = tables.get(table).get(id);
    if (!row) fail();
    return row;
  };
  const facts = [...tables.get("analytics.fact_hitliste").values()].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );
  if (!facts.length) fail();
  for (const row of facts) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(row.datum) ||
      new Date(row.datum).toISOString().slice(0, 10) !== row.datum ||
      !/^\d+$/.test(row.haufigkeit) ||
      !Number.isSafeInteger(Number(row.haufigkeit)) ||
      !/^\d+$/.test(row.source_hitliste_id) ||
      sourceIds.has(row.source_hitliste_id)
    )
      fail();
    sourceIds.add(row.source_hitliste_id);
    const duration = /^(\d+) (\d{1,2}):(\d{2}):(\d{2})$/.exec(
      row.dauer_original ?? "",
    );
    if (
      !duration ||
      Number(duration[2]) > 23 ||
      Number(duration[3]) > 59 ||
      Number(duration[4]) > 59
    )
      fail();
    const seconds =
      Number(duration[1]) * 86400 +
      Number(duration[2]) * 3600 +
      Number(duration[3]) * 60 +
      Number(duration[4]);
    if (!Number.isSafeInteger(seconds)) fail();
    const area = reference("core.bereich", row.bereich_id),
      equipment = reference("core.betriebsmittel", row.betriebsmittel_id);
    if (equipment.bereich_id !== row.bereich_id) fail();
    const fields = [
      row.haufigkeit,
      row.dauer_original,
      area.name,
      equipment.kennzeichen,
      reference("core.meldetext", row.meldetext_id).name,
      reference("core.meldung_typ", row.typ_id).name,
      reference("core.meldegruppe", row.meldegruppe_id).name,
    ];
    if (fields.some((value) => typeof value !== "string" || !value.trim()))
      fail();
    if (!days.has(row.datum))
      days.set(row.datum, {
        date: row.datum,
        rows: [],
        lineage: [],
        frequency: 0,
        seconds: 0,
      });
    const day = days.get(row.datum);
    day.rows.push(fields);
    day.lineage.push({
      factId: row.id,
      sourceHitlisteId: row.source_hitliste_id,
    });
    day.frequency += Number(row.haufigkeit);
    day.seconds += seconds;
    if (
      !Number.isSafeInteger(day.frequency) ||
      !Number.isSafeInteger(day.seconds)
    )
      fail();
  }
  const quote = (value) => '"' + value.replaceAll('"', '""') + '"';
  const header = [
    "Häufigkeit",
    "Dauer",
    "Bereich",
    "Betriebsmittelkennzeichen",
    "Meldetext",
    "Typ",
    "Meldegruppe",
  ];
  const files = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const bytes = Buffer.from(
        "\ufeff" +
          [header, ...day.rows]
            .map((row) => row.map(quote).join(";"))
            .join("\r\n") +
          "\r\n",
        "utf16le",
      );
      return {
        filename: `Hitliste-${day.date.replaceAll("-", "")}.csv`,
        date: day.date,
        records: day.rows.length,
        frequency: day.frequency,
        seconds: day.seconds,
        sha256: sha256(bytes),
        lineage: day.lineage,
        bytes,
      };
    });
  return { format: 1, source: "analytics.fact_hitliste", archiveSha256, files };
}
module.exports = { makeSeed, readTables, sha256 };
