import ts from "typescript";

export function collectImports(source, filePath = "file.ts") {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const imports = [];

  function lineOf(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({
        specifier: node.moduleSpecifier.text,
        line: lineOf(node),
      });
    }

    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      imports.push({
        specifier: node.argument.literal.text,
        line: lineOf(node),
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}
