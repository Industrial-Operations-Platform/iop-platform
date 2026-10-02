import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { identityVariables } from "../src/design/identity";

test("the shared presentation library has no feature, transport or business dependencies", () => {
  const root = resolve(__dirname, "../src/design/components");
  for (const file of readdirSync(root).filter((name) => /\.tsx?$/.test(name))) {
    const text = readFileSync(resolve(root, file), "utf8");
    for (const [, dependency] of text.matchAll(/from\s+["']([^"']+)["']/g))
      expect(
        dependency === "react" ||
          dependency === "../identity" ||
          dependency === "../../localization/i18n" ||
          dependency.startsWith("./"),
      ).toBe(true);
    expect(text).not.toMatch(/\b(?:fetch|localStorage)\b|features\/|\/api\//);
  }
  const styles = readFileSync(resolve(root, "components.css"), "utf8");
  expect(styles).not.toMatch(/\.analysis-|#[a-fA-F0-9]{3,8}\b|rgba?\(/);
});

test("platform styles use canonical typography and palette tokens", () => {
  const root = resolve(__dirname, "../src");
  const stylesheets = readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".css"));
  for (const file of stylesheets) {
    const styles = readFileSync(resolve(root, file), "utf8");
    expect({
      file,
      literalColors: styles.match(/#[a-fA-F0-9]{3,8}\b|(?:rgb|hsl)a?\(/g) ?? [],
    }).toEqual({ file, literalColors: [] });
    for (const [, property, value] of styles.matchAll(
      /\b(font(?:-family|-size|-weight)?|line-height)\s*:\s*([^;]+);/g,
    )) {
      expect({ file, property, value: value.trim() }).toEqual({
        file,
        property,
        value: expect.stringMatching(/^(?:inherit|var\(--iop-[\w]+\))$/),
      });
    }
    for (const [, token] of styles.matchAll(/var\((--iop-[\w]+)\)/g)) {
      expect({
        file,
        token,
        defined: Object.hasOwn(identityVariables, token),
      }).toEqual({ file, token, defined: true });
    }
  }
});

test("calendar-day fields and compact control styles use the mandatory shared components", () => {
  const root = resolve(__dirname, "../src");
  const violations: string[] = [];
  for (const file of readdirSync(root, { recursive: true }).map(String)) {
    if (file.startsWith("design/")) continue;
    if (file.endsWith(".css")) {
      if (
        /\.iop-(?:context-field|date-field|department-scope|toolbar-icon|toolbar-glyph)\b/.test(
          readFileSync(resolve(root, file), "utf8"),
        )
      )
        violations.push(
          `${file}: shared compact controls must not be restyled by a feature`,
        );
    }
    if (!file.endsWith(".tsx")) continue;
    const ast = ts.createSourceFile(
      file,
      readFileSync(resolve(root, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(ast) === "Button" &&
        /t\(["'](?:New entry|Search history)\s*["']\)/.test(node.getText(ast))
      )
        violations.push(
          `${file}: use shared icon launchers for New entry and Search history`,
        );
      if (ts.isJsxAttribute(node) && node.name.getText(ast) === "type") {
        const initializer = node.initializer;
        const value =
          initializer && ts.isJsxExpression(initializer)
            ? initializer.expression
            : initializer;
        if (value && ts.isStringLiteral(value) && value.text === "date")
          violations.push(`${file}: use DateField for calendar-day selection`);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  expect(violations).toEqual([]);
});
