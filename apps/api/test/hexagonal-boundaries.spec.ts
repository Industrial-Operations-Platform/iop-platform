import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";

const api = resolve(__dirname, "../src");
const web = resolve(__dirname, "../../web/src");
const roots = [join(api, "modules"), join(web, "features")].flatMap((base) =>
  readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(base, entry.name)),
);
const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
const inside = (target: string, directory: string) =>
  target.startsWith(directory + sep);

test.each(roots)(
  "domain and application dependencies point inward: %s",
  (root) => {
    for (const layer of ["domain", "application"]) {
      const directory = join(root, layer);
      if (!existsSync(directory)) continue;
      for (const file of files(directory)) {
        const source = readFileSync(file, "utf8");
        const ast = ts.createSourceFile(
          file,
          source,
          ts.ScriptTarget.Latest,
          true,
        );
        const check = (name: string) => {
          const target = resolve(dirname(file), name);
          if (
            !name.startsWith(".") ||
            !(
              inside(target, join(root, "domain")) ||
              (layer === "application" &&
                inside(target, join(root, "application")))
            )
          ) {
            throw new Error(
              `${relative(root, file)} imports an outward dependency: ${name}`,
            );
          }
        };
        const visit = (node: ts.Node) => {
          if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
          )
            check(node.moduleSpecifier.text);
          if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)
          )
            check(node.argument.literal.text);
          if (
            ts.isCallExpression(node) &&
            (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
              (ts.isIdentifier(node.expression) &&
                node.expression.text === "require"))
          ) {
            const argument = node.arguments[0];
            if (!argument || !ts.isStringLiteral(argument))
              throw new Error(`Non-static dependency in ${file}`);
            check(argument.text);
          }
          ts.forEachChild(node, visit);
        };
        visit(ast);
        expect(source).not.toMatch(
          /\b(?:fetch|window|document|localStorage|Buffer)\b|@nestjs|\bSELECT\b|\bINSERT INTO\b/,
        );
      }
    }
  },
);

test("source roots contain only executable entry points", () => {
  const rootFiles = (root: string) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  expect(rootFiles(api)).toEqual(["generate-openapi.ts", "main.ts"]);
  expect(rootFiles(web)).toEqual(["main.tsx"]);
});
