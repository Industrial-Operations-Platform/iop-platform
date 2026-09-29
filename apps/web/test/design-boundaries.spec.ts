import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { identityVariables } from "../src/design/identity";

test("the shared presentation library has no feature, transport or business dependencies", () => {
  const root = resolve(__dirname, "../src/design/components");
  for (const file of readdirSync(root).filter((name) => /\.tsx?$/.test(name))) {
    const text = readFileSync(resolve(root, file), "utf8");
    for (const [, dependency] of text.matchAll(/from\s+["']([^"']+)["']/g))
      expect(
        dependency === "react" ||
          dependency === "../identity" ||
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
