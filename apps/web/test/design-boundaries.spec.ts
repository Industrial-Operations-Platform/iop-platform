import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

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
