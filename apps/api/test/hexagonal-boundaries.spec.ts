import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const roots = [
  resolve(__dirname, "../src/modules/integrations"),
  resolve(__dirname, "../src/modules/oip"),
  resolve(__dirname, "../../web/src/features/analysis"),
];
test.each(roots)(
  "domain and application dependencies point inward: %s",
  (root) => {
    const files = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap((x) =>
        x.isDirectory()
          ? files(join(directory, x.name))
          : [join(directory, x.name)],
      );
    for (const layer of ["domain", "application"])
      for (const file of files(join(root, layer))) {
        const source = readFileSync(file, "utf8");
        const imports = [
          ...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g),
        ].map((x) => x[1]);
        for (const name of imports) {
          expect(name.startsWith(".")).toBe(true);
          const target = resolve(file, "..", name);
          expect(
            target.startsWith(join(root, "domain")) ||
              (layer === "application" &&
                target.startsWith(join(root, "application"))),
          ).toBe(true);
        }
        expect(source).not.toMatch(
          /\b(?:fetch|window|document|localStorage)\b|@nestjs|\bBuffer\b/,
        );
      }
  },
);
