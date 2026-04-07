import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import { syncHostManifestGeneratedFiles } from "./host-manifest-compiler";
import { syncHostWechatShellFiles } from "./host-wechat-shells";
import { normalizeFeatureName, type FeatureTemplate } from "./scaffold-feature";
import {
  type RepoSpecHostApp,
  loadRepoSpec,
  resolveHostFile,
  toImportSpecifier,
  toPascalCase,
} from "./specs";

export interface ScaffoldHostPageOptions {
  featureName: string;
  pageKey: string;
  routeId?: string;
  repoRoot?: string;
  skipSync?: boolean;
}

interface PageNames {
  key: string;
  pascal: string;
  title: string;
}

interface FeaturePageScaffoldMetadata {
  pageDataFactoryName: string;
  pageDataFactoryKind: "initial" | "default";
  template: FeatureTemplate;
  controllerOptionKeys: Set<string>;
}

function toPascalFromKey(value: string): string {
  return value[0]?.toUpperCase() + value.slice(1);
}

function normalizePageKey(pageKey: string): PageNames {
  const key = pageKey.trim();
  if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
    throw new Error(`Invalid page key "${pageKey}". Use lowerCamelCase such as "profile" or "userProfile".`);
  }

  const title = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

  return {
    key,
    pascal: toPascalFromKey(key),
    title,
  };
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readFileIfExists(targetPath: string): Promise<string | null> {
  if (!(await exists(targetPath))) {
    return null;
  }

  return readFile(targetPath, "utf8");
}

function parseTypeScriptModule(filePath: string, source: string): ts.SourceFile {
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function getPropertyNameText(name: ts.PropertyName | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isTypeAssertionExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function findConstObjectLiteral(sourceFile: ts.SourceFile, exportName: string): ts.ObjectLiteralExpression {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
        continue;
      }

      if (declaration.initializer) {
        const initializer = unwrapExpression(declaration.initializer);
        if (ts.isObjectLiteralExpression(initializer)) {
          return initializer;
        }
      }
    }
  }

  throw new Error(`Unable to find object literal export "${exportName}"`);
}

function findHostPageDefinitionsObjectLiteral(sourceFile: ts.SourceFile, exportName: string): ts.ObjectLiteralExpression {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
        continue;
      }

      if (!declaration.initializer) {
        continue;
      }

      const initializer = unwrapExpression(declaration.initializer);
      if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === "defineHostPageDefinitions"
      ) {
        const [argument] = initializer.arguments;
        if (argument && ts.isObjectLiteralExpression(argument)) {
          return argument;
        }
      }
    }
  }

  throw new Error(`Unable to find host page definitions export "${exportName}"`);
}

function findInterfaceDeclaration(sourceFile: ts.SourceFile, interfaceName: string): ts.InterfaceDeclaration | null {
  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === interfaceName) {
      return statement;
    }
  }

  return null;
}

function getInterfacePropertyNames(interfaceDeclaration: ts.InterfaceDeclaration | null): Set<string> {
  if (!interfaceDeclaration) {
    return new Set<string>();
  }

  const propertyNames = new Set<string>();
  for (const member of interfaceDeclaration.members) {
    if (!ts.isPropertySignature(member)) {
      continue;
    }

    const propertyName = getPropertyNameText(member.name);
    if (propertyName) {
      propertyNames.add(propertyName);
    }
  }

  return propertyNames;
}

function getObjectLiteralPropertyNames(objectLiteral: ts.ObjectLiteralExpression): Set<string> {
  const names = new Set<string>();

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      continue;
    }

    const propertyName = getPropertyNameText(property.name);
    if (propertyName) {
      names.add(propertyName);
    }
  }

  return names;
}

function insertObjectProperty(source: string, objectLiteral: ts.ObjectLiteralExpression, snippet: string): string {
  const insertionIndex = objectLiteral.getEnd() - 1;
  const prefix = objectLiteral.properties.length === 0 ? "\n" : "";
  return `${source.slice(0, insertionIndex)}${prefix}${snippet}${source.slice(insertionIndex)}`;
}

function updateRouteContract(sourcePath: string, source: string, pageKey: string, routeId: string): string {
  const sourceFile = parseTypeScriptModule(sourcePath, source);
  const routesObject = findConstObjectLiteral(sourceFile, "APP_ROUTE_IDS");
  const propertyNames = getObjectLiteralPropertyNames(routesObject);

  if (propertyNames.has(pageKey)) {
    throw new Error(`route contract already contains "${pageKey}"`);
  }

  return insertObjectProperty(source, routesObject, `  ${pageKey}: "${routeId}",\n`);
}

function updateHostManifestImport(sourcePath: string, source: string, feature: { kebab: string; camel: string; pascal: string }): string {
  const sourceFile = parseTypeScriptModule(sourcePath, source);
  const moduleSpecifier = `@minix/feature-${feature.kebab}`;
  const requiredSpecifiers = [`createInitial${feature.pascal}State`, `${feature.camel}FeatureManifest`];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    if (statement.moduleSpecifier.text !== moduleSpecifier) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      throw new Error(`Feature import "${moduleSpecifier}" must use named imports`);
    }

    const existingSpecifiers = new Set(namedBindings.elements.map((element) => element.name.text));
    const missingSpecifiers = requiredSpecifiers.filter((specifier) => !existingSpecifiers.has(specifier));
    if (missingSpecifiers.length === 0) {
      return source;
    }

    const insertionIndex = namedBindings.getEnd() - 1;
    const separator = namedBindings.elements.length === 0 ? "" : ", ";
    return `${source.slice(0, insertionIndex)}${separator}${missingSpecifiers.join(", ")}${source.slice(insertionIndex)}`;
  }

  const lastImport = [...sourceFile.statements].reverse().find((statement) => ts.isImportDeclaration(statement));
  const insertionIndex = lastImport ? lastImport.getEnd() : 0;
  const importLine = `\nimport { ${requiredSpecifiers.join(", ")} } from "${moduleSpecifier}";`;
  return `${source.slice(0, insertionIndex)}${importLine}${source.slice(insertionIndex)}`;
}

function updateHostManifestImportSpecifiers(
  sourcePath: string,
  source: string,
  feature: { kebab: string; camel: string; pascal: string },
  pageDataFactoryName: string,
): string {
  const sourceFile = parseTypeScriptModule(sourcePath, source);
  const moduleSpecifier = `@minix/feature-${feature.kebab}`;
  const requiredSpecifiers = [pageDataFactoryName, `${feature.camel}FeatureManifest`];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    if (statement.moduleSpecifier.text !== moduleSpecifier) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      throw new Error(`Feature import "${moduleSpecifier}" must use named imports`);
    }

    const existingSpecifiers = new Set(namedBindings.elements.map((element) => element.name.text));
    const missingSpecifiers = requiredSpecifiers.filter((specifier) => !existingSpecifiers.has(specifier));
    if (missingSpecifiers.length === 0) {
      return source;
    }

    const insertionIndex = namedBindings.getEnd() - 1;
    const separator = namedBindings.elements.length === 0 ? "" : ", ";
    return `${source.slice(0, insertionIndex)}${separator}${missingSpecifiers.join(", ")}${source.slice(insertionIndex)}`;
  }

  const lastImport = [...sourceFile.statements].reverse().find((statement) => ts.isImportDeclaration(statement));
  const insertionIndex = lastImport ? lastImport.getEnd() : 0;
  const importLine = `\nimport { ${requiredSpecifiers.join(", ")} } from "${moduleSpecifier}";`;
  return `${source.slice(0, insertionIndex)}${importLine}${source.slice(insertionIndex)}`;
}

function createDefaultPageDataExpression(
  page: PageNames,
  metadata: FeaturePageScaffoldMetadata,
): string {
  if (metadata.pageDataFactoryKind === "initial") {
    return `${metadata.pageDataFactoryName}()`;
  }

  switch (metadata.template) {
    case "auth":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} sign-in workspace",\n      authMode: "wechat",\n    })`;
    case "list":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} workspace",\n      pageSize: 20,\n      emptyText: "No ${page.key} items are available yet.",\n    })`;
    case "detail":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} detail workspace",\n    })`;
    case "form":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} form workspace",\n    })`;
    case "profile":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} profile workspace",\n    })`;
    case "workspace":
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} upload/share workspace",\n      primaryActionLabel: "Start ${page.title.toLowerCase()} action",\n      usageExamples: ["upload", "share"],\n    })`;
    default:
      return `${metadata.pageDataFactoryName}({\n      title: "${page.title}",\n      subtitle: "${page.title} workspace",\n    })`;
  }
}

function createControllerSnippet(
  page: PageNames,
  metadata: FeaturePageScaffoldMetadata,
  routeKeys: Set<string>,
): string {
  const lines = ["{"];

  function addRouteOption(optionKey: string, routeKey: string | undefined, fallbackRouteKey: string) {
    if (!metadata.controllerOptionKeys.has(optionKey)) {
      return;
    }

    if (routeKey) {
      lines.push(`      ${optionKey}: APP_ROUTE_IDS.${routeKey},`);
      return;
    }

    lines.push(`      // ${optionKey}: APP_ROUTE_IDS.${fallbackRouteKey},`);
  }

  addRouteOption(
    "detailRouteId",
    routeKeys.has(`${page.key}Detail`) ? `${page.key}Detail` : routeKeys.has("detail") ? "detail" : undefined,
    `${page.key}Detail`,
  );
  addRouteOption("loginRouteId", routeKeys.has("login") ? "login" : undefined, "login");
  addRouteOption("settingsRouteId", routeKeys.has("settings") ? "settings" : undefined, "settings");
  addRouteOption(
    "redirectRouteId",
    routeKeys.has("overview") ? "overview" : routeKeys.has("items") ? "items" : undefined,
    "overview",
  );
  addRouteOption(
    "editRouteId",
    routeKeys.has(`${page.key}Edit`) ? `${page.key}Edit` : routeKeys.has("edit") ? "edit" : undefined,
    `${page.key}Edit`,
  );
  addRouteOption(
    "shareRouteId",
    routeKeys.has(`${page.key}Share`) ? `${page.key}Share` : routeKeys.has("share") ? "share" : undefined,
    `${page.key}Share`,
  );
  addRouteOption("overviewRouteId", routeKeys.has("overview") ? "overview" : undefined, "overview");
  addRouteOption(
    "successRouteId",
    routeKeys.has("success")
      ? "success"
      : routeKeys.has("overview")
        ? "overview"
        : routeKeys.has("items")
          ? "items"
          : routeKeys.has("home")
            ? "home"
            : undefined,
    "success",
  );
  addRouteOption("cancelRouteId", routeKeys.has("cancel") ? "cancel" : undefined, "cancel");

  if (metadata.controllerOptionKeys.has("initialState")) {
    lines.push("      initialState: {},");
  }

  lines.push("    }");
  return lines.join("\n");
}

async function detectFeaturePageScaffoldMetadata(
  featureDir: string,
  feature: { pascal: string },
): Promise<FeaturePageScaffoldMetadata> {
  const featureManifestSource = await readFileIfExists(path.join(featureDir, "src", "feature.manifest.ts"));
  const modelSource = await readFileIfExists(path.join(featureDir, "src", "model", "index.ts"));
  const featureManifestModule = featureManifestSource
    ? parseTypeScriptModule(path.join(featureDir, "src", "feature.manifest.ts"), featureManifestSource)
    : null;
  const controllerOptionsInterface = featureManifestModule
    ? findInterfaceDeclaration(featureManifestModule, `${feature.pascal}FeatureControllerOptions`)
    : null;

  const templateMatch =
    featureManifestSource?.match(/template:\s*"(?<template>generic|auth|profile|list|detail|form|workspace)"/);
  const pageDataExportMatch =
    featureManifestSource?.match(/export\s*\{\s*(?<factory>create(?:Default|Initial)[A-Za-z0-9]+(?:State|PageModel))\s*\}/) ??
    modelSource?.match(/export function (?<factory>create(?:Default|Initial)[A-Za-z0-9]+(?:State|PageModel))/);

  const pageDataFactoryName = pageDataExportMatch?.groups?.factory ?? `createInitial${feature.pascal}State`;

  return {
    pageDataFactoryName,
    pageDataFactoryKind: pageDataFactoryName.startsWith("createDefault") ? "default" : "initial",
    template: (templateMatch?.groups?.template as FeatureTemplate | undefined) ?? "generic",
    controllerOptionKeys: getInterfacePropertyNames(controllerOptionsInterface),
  };
}

function updateHostPageDefinitions(
  sourcePath: string,
  source: string,
  pageDefinitionsExport: string,
  pageKey: string,
  nextEntry: string,
): string {
  const sourceFile = parseTypeScriptModule(sourcePath, source);
  const pageDefinitionsObject = findHostPageDefinitionsObjectLiteral(sourceFile, pageDefinitionsExport);
  const propertyNames = getObjectLiteralPropertyNames(pageDefinitionsObject);

  if (propertyNames.has(pageKey)) {
    throw new Error(`host page definitions already contains "${pageKey}"`);
  }

  return insertObjectProperty(source, pageDefinitionsObject, nextEntry);
}

function createWechatPageDefinitionSnippet(
  page: PageNames,
  feature: { camel: string; pascal: string },
  registrationModule: string,
  metadata: FeaturePageScaffoldMetadata,
  routeKeys: Set<string>,
): string {
  const enablePullDownRefresh = metadata.template === "list" ? `\n    enablePullDownRefresh: true,` : "";
  return `  ${page.key}: {\n    feature: ${feature.camel}FeatureManifest,\n    routeId: APP_ROUTE_IDS.${page.key},\n    routePath: "/pages/${page.key}/index",\n    pageData: ${createDefaultPageDataExpression(page, metadata)},\n    controller: ${createControllerSnippet(page, metadata, routeKeys)},\n    miniprogramPage: "pages/${page.key}/index",\n    registrationModule: "${registrationModule}",\n    navigationBarTitleText: "${page.title}",${enablePullDownRefresh}\n    shellTemplate: "generic",\n    shellStyle: "generic",\n  },\n`;
}

function createH5PageDefinitionSnippet(
  page: PageNames,
  feature: { camel: string; pascal: string },
  metadata: FeaturePageScaffoldMetadata,
  routeKeys: Set<string>,
): string {
  const routePath = metadata.template === "detail" ? `/${page.key}/:id` : `/${page.key}`;
  return `  ${page.key}: {\n    feature: ${feature.camel}FeatureManifest,\n    routeId: APP_ROUTE_IDS.${page.key},\n    routePath: "${routePath}",\n    pageData: ${createDefaultPageDataExpression(page, metadata)},\n    controller: ${createControllerSnippet(page, metadata, routeKeys)},\n    renderMode: "generic",\n  },\n`;
}

function createHostShellRegistrationSource(hostName: string, page: PageNames): string {
  const hostPascal = toPascalCase(hostName);
  return `import { register${hostPascal}Page } from "../page-registry";

export const ${page.key}Page = register${hostPascal}Page("${page.key}");
`;
}

async function writeHostPageFiles(page: PageNames, hostSpecs: RepoSpecHostApp[]) {
  for (const hostSpec of hostSpecs) {
    if (hostSpec.registry.shell_pages_dir && hostSpec.registry.shell_module) {
      const shellPagesDir = resolveHostFile(hostSpec, hostSpec.registry.shell_pages_dir);
      await mkdir(shellPagesDir, { recursive: true });
      await writeFile(
        path.join(shellPagesDir, `${page.key}.ts`),
        createHostShellRegistrationSource(hostSpec.name, page),
        "utf8",
      );
    }

    if (hostSpec.miniprogram.pages_dir) {
      const miniprogramPageDir = path.join(resolveHostFile(hostSpec, hostSpec.miniprogram.pages_dir), page.key);
      await mkdir(miniprogramPageDir, { recursive: true });
    }
  }
}

function createRegistrationModuleSpecifier(
  hostSpec: RepoSpecHostApp,
  pageKey: string,
): string {
  if (!hostSpec.registry.shell_pages_dir || !hostSpec.miniprogram.pages_dir) {
    throw new Error(`host "${hostSpec.name}" does not support shell registration`);
  }

  const shellEntryPath = path.join(resolveHostFile(hostSpec, hostSpec.miniprogram.pages_dir), pageKey, "index.ts");
  const registrationModulePath = path.join(resolveHostFile(hostSpec, hostSpec.registry.shell_pages_dir), `${pageKey}.ts`);
  return toImportSpecifier(shellEntryPath, registrationModulePath);
}

export async function scaffoldHostPage(options: ScaffoldHostPageOptions) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const repoSpec = await loadRepoSpec(repoRoot);
  const feature = normalizeFeatureName(options.featureName);
  const page = normalizePageKey(options.pageKey);
  const featureDir = path.join(repoRoot, "packages", "features", feature.kebab);
  const hostSpecs = Object.entries(repoSpec.host_wiring.hosts).map(([name, hostSpec]) => ({
    name,
    ...hostSpec,
    dir: path.join(repoRoot, hostSpec.dir),
  }));

  if (!(await exists(featureDir))) {
    throw new Error(`Feature package does not exist: packages/features/${feature.kebab}`);
  }

  const featureMetadata = await detectFeaturePageScaffoldMetadata(featureDir, feature);
  const routeId = options.routeId ?? `${feature.kebab}.${featureMetadata.template === "detail" ? "detail" : "index"}`;

  const routeContractPath = path.join(repoRoot, repoSpec.host_wiring.route_contract.module);

  const routeContractSource = await readFile(routeContractPath, "utf8");
  const nextRouteContractSource = updateRouteContract(routeContractPath, routeContractSource, page.key, routeId);
  const routeKeys = getObjectLiteralPropertyNames(
    findConstObjectLiteral(parseTypeScriptModule(routeContractPath, nextRouteContractSource), "APP_ROUTE_IDS"),
  );
  await writeFile(routeContractPath, nextRouteContractSource, "utf8");

  for (const hostSpec of hostSpecs) {
    const sourcePath = resolveHostFile(hostSpec, hostSpec.manifest.source_module);
    const sourceText = await readFile(sourcePath, "utf8");
    const withImport = updateHostManifestImportSpecifiers(
      sourcePath,
      sourceText,
      feature,
      featureMetadata.pageDataFactoryName,
    );
    const nextEntry =
      hostSpec.miniprogram.page_mode === "required_aligned"
        ? createWechatPageDefinitionSnippet(
            page,
            feature,
            createRegistrationModuleSpecifier(hostSpec, page.key),
            featureMetadata,
            routeKeys,
          )
        : createH5PageDefinitionSnippet(page, feature, featureMetadata, routeKeys);
    const nextSource = updateHostPageDefinitions(
      sourcePath,
      withImport,
      hostSpec.manifest.page_definitions_export,
      page.key,
      nextEntry,
    );
    await writeFile(sourcePath, nextSource, "utf8");
  }

  await writeHostPageFiles(page, hostSpecs);

  if (!options.skipSync) {
    await syncHostManifestGeneratedFiles(repoRoot);
    await syncHostWechatShellFiles(repoRoot);
  }

  return {
    pageKey: page.key,
    routeId,
  };
}

function usage() {
  return "Usage: pnpm scaffold:page <feature-name> <page-key> [route-id]";
}

async function main() {
  const featureName = process.argv[2];
  const pageKey = process.argv[3];
  const routeId = process.argv[4];

  if (!featureName || featureName === "--help" || featureName === "-h") {
    console.log(usage());
    return;
  }

  if (!pageKey) {
    throw new Error(usage());
  }

  const result = await scaffoldHostPage({
    featureName,
    pageKey,
    ...(routeId ? { routeId } : {}),
  });

  console.log(`scaffolded host page "${result.pageKey}" with route "${result.routeId}"`);
}

const isEntrypoint = process.argv[1] ? /scaffold-host-page\.(ts|js)$/.test(path.basename(process.argv[1])) : false;
if (isEntrypoint) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
