import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { german } from "../src/localization/de";
import { setLanguage, t } from "../src/localization/i18n";
test("language switches retain English fallback and preserve interpolated spacing", () => {
  setLanguage("de");
  expect(t("Shift Handover")).toBe("Schichtübergabe");
  expect(t("Save ")).toBe("Speichern ");
  expect(t("Customer-provided text")).toBe("Customer-provided text");
  setLanguage("en");
  expect(t("Shift Handover")).toBe("Shift Handover");
});
test("every literal translation call has a German dictionary entry", () => {
  const root = resolve(__dirname, "../src"),
    missing = new Set<string>();
  for (const file of readdirSync(root, { recursive: true })
    .map(String)
    .filter((f) => /\.tsx?$/.test(f) && !f.startsWith("localization/"))) {
    const source = readFileSync(resolve(root, file), "utf8"),
      ast = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
    const visit = (n: ts.Node) => {
      if (
        ts.isCallExpression(n) &&
        n.expression.getText(ast) === "t" &&
        n.arguments[0] &&
        ts.isStringLiteral(n.arguments[0])
      ) {
        const key = n.arguments[0].text.trim();
        if (/[A-Za-z]/.test(key) && !Object.hasOwn(german, key))
          missing.add(key);
      }
      ts.forEachChild(n, visit);
    };
    visit(ast);
  }
  expect([...missing]).toEqual([]);
});
