import type { ScheduleDecoder } from "../../../workforce/application/workforce";
import {
  assert,
  WorkforceError,
  type ImportInput,
  type ImportRow,
  type ScheduleStatus,
} from "../../../workforce/domain/workforce";
const absenceLabels: Record<string, ScheduleStatus> = {
  X: "off",
  Ferien: "vacation",
  Unfall: "accident",
  Krankheit: "sick",
  Kompensation: "compensation",
  Kompensationstag: "compensation",
  Weiterbildung: "training",
  Wartung: "maintenance",
};
/** Bounded source adapter; email HTML is parsed as text and is never rendered or fetched. */
export class ManualScheduleDecoder implements ScheduleDecoder {
  decode(input: ImportInput): ImportRow[] {
    assert(
      input &&
        typeof input.text === "string" &&
        input.text.length <= 80000 &&
        ["csv", "email"].includes(input.format),
      "workforce_import_invalid",
    );
    return input.format === "csv"
      ? this.csv(input.text)
      : this.email(input.text, input.userId);
  }
  private csv(text: string): ImportRow[] {
    // A deliberately narrow interchange format: no multiline cells or guessed delimiters.
    const lines = text
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/);
    assert(
      lines.shift() === "userId,date,status,start,end",
      "workforce_import_invalid",
    );
    return lines.map((line, index) => {
      const fields = line.split(",").map((s) => s.trim());
      if (fields.length !== 5 || fields.some((s) => /["\x00-\x1f]/.test(s)))
        throw new WorkforceError("workforce_import_invalid", index + 2);
      const [userId, date, status, start, end] = fields;
      return { userId, date, status: status as ScheduleStatus, start, end };
    });
  }
  private email(text: string, userId: string): ImportRow[] {
    assert(typeof userId === "string" && !!userId, "workforce_import_invalid");
    const decoded = this.mime(text);
    const plain = decoded
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&ndash;|&#8211;/g, "–")
      .replace(/&amp;/g, "&");
    const lines = plain
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const rows: ImportRow[] = [];
    for (let i = 0; i < lines.length; i++) {
      const day =
        /^(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*(\d{2})\.(\d{2})\.(\d{4})$/.exec(
          lines[i],
        );
      if (!day) continue;
      const value = lines[++i] ?? "";
      const interval = /^(\d{2}:\d{2})\s*[–−-]\s*(\d{2}:\d{2})$/.exec(value);
      assert(
        interval || Object.hasOwn(absenceLabels, value),
        "workforce_import_invalid",
      );
      // Training and maintenance require actual hours; absent hours cannot be invented.
      const status = interval ? "work" : absenceLabels[value];
      assert(
        !["training", "maintenance"].includes(status),
        "workforce_import_invalid",
      );
      rows.push({
        userId,
        date: `${day[3]}-${day[2]}-${day[1]}`,
        status,
        start: interval?.[1] ?? "",
        end: interval?.[2] ?? "",
      });
    }
    assert(rows.length > 0, "workforce_import_invalid");
    return rows;
  }
  private mime(text: string): string {
    if (!/^[-\w]+:/m.test(text) || !/content-type:/i.test(text)) return text;
    const boundary = /boundary="?([^";\r\n]+)"?/i.exec(text)?.[1];
    const parts = boundary ? text.split("--" + boundary) : [text];
    const candidates = parts.filter((p) =>
      /content-type:\s*text\/(?:html|plain)/i.test(p),
    );
    const part =
      candidates.find((p) => /content-type:\s*text\/html/i.test(p)) ??
      candidates[0];
    assert(part, "workforce_import_invalid");
    const split = /\r?\n\r?\n/.exec(part);
    assert(split, "workforce_import_invalid");
    const headers = part.slice(0, split.index),
      body = part.slice(split.index + split[0].length).trim();
    if (/content-transfer-encoding:\s*base64/i.test(headers))
      return Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
    if (/content-transfer-encoding:\s*quoted-printable/i.test(headers)) {
      const bytes = body
        .replace(/=\r?\n/g, "")
        .replace(/=([A-F0-9]{2})/gi, (_, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        );
      return Buffer.from(bytes, "latin1").toString("utf8");
    }
    return body;
  }
}
