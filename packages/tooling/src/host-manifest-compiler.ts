import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getHostAppSpec, listHostApps, resolveHostFile, toImportSpecifier, toPascalCase } from "./specs";

function buildHostAppManifestContents(hostSpec: Awaited<ReturnType<typeof getHostAppSpec>>): string {
  const hostPascal = toPascalCase(hostSpec.name);
  const pageRegistryImportPath = toImportSpecifier(
    resolveHostFile(hostSpec, hostSpec.manifest.app_module),
    resolveHostFile(hostSpec, hostSpec.registry.page_module),
  );
  const sourceImportPath = toImportSpecifier(
    resolveHostFile(hostSpec, hostSpec.manifest.app_module),
    resolveHostFile(hostSpec, hostSpec.manifest.source_module),
  );
  const envImportPath = toImportSpecifier(
    resolveHostFile(hostSpec, hostSpec.manifest.app_module),
    resolveHostFile(hostSpec, hostSpec.runtime.env_module),
  );
  const mockApiImportPath = toImportSpecifier(
    resolveHostFile(hostSpec, hostSpec.manifest.app_module),
    resolveHostFile(hostSpec, hostSpec.runtime.mock_api_module),
  );
  const createKernelName = `create${hostPascal}Kernel`;
  const bootstrapAppName = `bootstrap${hostPascal}App`;
  const runtimeTypeName = `${hostPascal}Runtime`;
  const createRuntimeName = `create${hostPascal}Runtime`;
  const bootstrapRuntimeName = `bootstrap${hostPascal}Runtime`;
  const pageRegistryTypeName = `${hostPascal}PageRegistry`;
  const pagesTypeName = `${hostPascal}Pages`;
  const pageRegistryFactoryName = `create${hostPascal}PageRegistry`;
  const routeMapperExport = hostSpec.manifest.route_map_export;
  const hostMapLines = [
    `export const ${hostSpec.manifest.page_config_export} = createHostPageDataMap(${hostSpec.manifest.page_definitions_export});`,
    `export const ${hostSpec.manifest.page_manifest_export} = createHostPageManifest(${hostSpec.manifest.page_definitions_export});`,
    `export const ${routeMapperExport} = createHostRouteMap(${hostSpec.manifest.page_definitions_export});`,
    `export const ${hostSpec.manifest.routes_export} = createHostRouteKeyMap(${hostSpec.manifest.page_definitions_export});`,
  ];

  if (hostSpec.manifest.miniprogram_pages_export) {
    hostMapLines.push(
      `export const ${hostSpec.manifest.miniprogram_pages_export} = createHostWechatMiniprogramPages(${hostSpec.manifest.page_definitions_export});`,
    );
  }

  return `// GENERATED FILE. DO NOT EDIT.

import {
  bootstrapApp,
  createAppKernel,
  createHostPageDataMap,
  createHostPageManifest,
  createHostRouteKeyMap,
  createHostRouteMap,
${hostSpec.manifest.miniprogram_pages_export ? `  createHostWechatMiniprogramPages,\n` : ""}  createRouteMapper,
  type AppKernel,
  type CreateAppKernelOptions,
} from "@minix/core";

import type {
  ${pageRegistryTypeName},
  ${pagesTypeName},
} from "${pageRegistryImportPath}";

import {
  ${hostSpec.manifest.feature_flags_export},
  ${hostSpec.manifest.page_definitions_export},
} from "${sourceImportPath}";

${hostMapLines.join("\n")}

function load${hostPascal}PageRegistryModule() {
  return require("${pageRegistryImportPath}") as typeof import("${pageRegistryImportPath}");
}

function create${hostPascal}KernelOptions(): CreateAppKernelOptions {
  const { ${hostSpec.runtime.create_adapters_export} } = require("${hostSpec.runtime.platform_package}") as typeof import("${hostSpec.runtime.platform_package}");
  const { ${hostSpec.runtime.load_env_export} } = require("${envImportPath}") as typeof import("${envImportPath}");
  const { ${hostSpec.runtime.create_mock_api_export} } = require("${mockApiImportPath}") as typeof import("${mockApiImportPath}");
  const env = ${hostSpec.runtime.load_env_export}();
  const baseAdapters = ${hostSpec.runtime.create_adapters_export}();

  return {
    env,
    features: ${hostSpec.manifest.feature_flags_export},
    routeMapper: createRouteMapper(${routeMapperExport}),
    adapters: env.debug
      ? {
          ...baseAdapters,
          request: ${hostSpec.runtime.create_mock_api_export}(),
        }
      : baseAdapters,
  };
}

export function ${createKernelName}() {
  return createAppKernel(create${hostPascal}KernelOptions());
}

export async function ${bootstrapAppName}() {
  return bootstrapApp(create${hostPascal}KernelOptions());
}

export interface ${runtimeTypeName} {
  kernel: AppKernel;
  registry: ${pageRegistryTypeName};
  pages: ${pagesTypeName};
}

function to${hostPascal}Pages(registry: ${pageRegistryTypeName}): ${pagesTypeName} {
  return Object.fromEntries(
    Object.entries(registry).map(([key, entry]) => [key, entry.controller]),
  ) as ${pagesTypeName};
}

export function ${createRuntimeName}(kernel: AppKernel = ${createKernelName}()): ${runtimeTypeName} {
  const { ${pageRegistryFactoryName} } = load${hostPascal}PageRegistryModule();
  const registry = ${pageRegistryFactoryName}(kernel);

  return {
    kernel,
    registry,
    pages: to${hostPascal}Pages(registry),
  };
}

export async function ${bootstrapRuntimeName}(): Promise<${runtimeTypeName}> {
  const kernel = await ${bootstrapAppName}();
  return ${createRuntimeName}(kernel);
}

export const ${hostSpec.manifest.app_export} = {
  pageDefinitions: ${hostSpec.manifest.page_definitions_export},
  pageManifest: ${hostSpec.manifest.page_manifest_export},
  routes: ${routeMapperExport},
  pages: ${hostSpec.manifest.page_config_export},
  features: ${hostSpec.manifest.feature_flags_export},
  createKernelOptions: create${hostPascal}KernelOptions,
  createKernel: ${createKernelName},
  createPageRegistry(kernel: AppKernel) {
    const { ${pageRegistryFactoryName} } = load${hostPascal}PageRegistryModule();
    return ${pageRegistryFactoryName}(kernel);
  },
  createRuntime: ${createRuntimeName},
  bootstrapRuntime: ${bootstrapRuntimeName},
} as const;
`;
}

function buildHostPageRegistryContents(hostSpec: Awaited<ReturnType<typeof getHostAppSpec>>): string {
  const hostPascal = toPascalCase(hostSpec.name);
  const registryFunctionName = `create${hostPascal}PageRegistry`;
  const registryTypeName = `${hostPascal}PageRegistry`;
  const pagesTypeName = `${hostPascal}Pages`;
  const manifestImportPath = toImportSpecifier(
    resolveHostFile(hostSpec, hostSpec.registry.page_module),
    resolveHostFile(hostSpec, hostSpec.manifest.app_module),
  );

  return `// GENERATED FILE. DO NOT EDIT.

import { createManifestPageRegistry, type AppKernel } from "@minix/core";

import { ${hostSpec.manifest.app_export} } from "${manifestImportPath}";

export const ${hostSpec.registry.page_export} = Object.fromEntries(
  Object.keys(${hostSpec.manifest.app_export}.pageDefinitions).map((pageKey) => [pageKey, pageKey]),
) as Record<keyof typeof ${hostSpec.manifest.app_export}.pageDefinitions, string>;

export function ${registryFunctionName}(kernel: AppKernel) {
  return createManifestPageRegistry("${hostSpec.platform}", kernel, ${hostSpec.manifest.app_export}.pageDefinitions);
}

export type ${registryTypeName} = ReturnType<typeof ${registryFunctionName}>;

export type ${pagesTypeName} = {
  [TKey in keyof ${registryTypeName}]: ${registryTypeName}[TKey]["controller"];
};
`;
}

function buildHostWechatShellRegistryContents(hostSpec: Awaited<ReturnType<typeof getHostAppSpec>>): string {
  if (!hostSpec.registry.shell_module || !hostSpec.registry.shell_export) {
    throw new Error(`host "${hostSpec.name}" does not define a shell registry`);
  }

  const hostPascal = toPascalCase(hostSpec.name);
  const shellModulePath = resolveHostFile(hostSpec, hostSpec.registry.shell_module);
  const manifestImportPath = toImportSpecifier(shellModulePath, resolveHostFile(hostSpec, hostSpec.manifest.app_module));
  const pageEntriesPath = toImportSpecifier(shellModulePath, path.join(hostSpec.dir, "src", "registrations", "page-entries.ts"));
  const runtimePath = toImportSpecifier(shellModulePath, path.join(path.dirname(shellModulePath), "runtime.ts"));
  const pageEntryFactory = `create${hostPascal}PageEntry`;
  const runtimeType = `${hostPascal}Runtime`;
  const shellPageKeyType = `${hostPascal}ShellPageKey`;
  const registerFunction = `register${hostPascal}Page`;

  return `// GENERATED FILE. DO NOT EDIT.

import { createWechatPageBridge } from "@minix/platform-wechat";

import type { HostPageDefinition } from "@minix/core";

import type { ${runtimeType} } from "${manifestImportPath}";
import { ${pageEntryFactory} } from "${pageEntriesPath}";
import { ${hostSpec.manifest.app_export} } from "${manifestImportPath}";

import { ensure${hostPascal}Runtime } from "${runtimePath}";

type HostWechatPageDefinition = HostPageDefinition;
export type ${shellPageKeyType} = keyof ${runtimeType}["registry"];

const lifecycleActions = new Set(["onShow", "onPullDownRefresh", "onReachBottom"]);

async function loadHostWechatPageEntry<TKey extends ${shellPageKeyType}>(
  pageKey: TKey,
): Promise<ReturnType<${runtimeType}["registry"][TKey]["createEntry"]>> {
  const runtime = await ensure${hostPascal}Runtime();
  return ${pageEntryFactory}(runtime, pageKey);
}

function createHostWechatShellPage(pageKey: ${shellPageKeyType}, definition: HostWechatPageDefinition) {
  const entryActions = definition.feature.hosts.wechat.entryActions;
  const methods: Record<
    string,
    (
      entry: Record<string, (...args: unknown[]) => Promise<unknown>>,
      page: unknown,
      ...args: unknown[]
    ) => Promise<unknown>
  > = {};
  const bridgeConfig: Record<string, unknown> = {
    initialData: definition.pageData,
    async loadEntry() {
      return loadHostWechatPageEntry(pageKey);
    },
    methods,
  };

  for (const [entryAction, controllerAction] of Object.entries(entryActions)) {
    if (lifecycleActions.has(entryAction)) {
      bridgeConfig[entryAction] = async (entry: Record<string, (...args: unknown[]) => Promise<unknown>>) => {
        const handler = entry[entryAction];
        if (typeof handler !== "function") {
          throw new Error(\`entry action "\${entryAction}" is not available for "\${pageKey}"\`);
        }

        return handler.call(entry);
      };
      continue;
    }

    methods[entryAction] = async (
      entry: Record<string, (...args: unknown[]) => Promise<unknown>>,
      _page: unknown,
      ...args: unknown[]
    ) => {
      const handler = entry[entryAction];
      if (typeof handler !== "function") {
        throw new Error(\`entry action "\${entryAction}" is not available for "\${pageKey}"\`);
      }

      const eventArg = args[0] as { currentTarget?: { dataset?: { value?: unknown } } } | undefined;
      const datasetValue = eventArg?.currentTarget?.dataset?.value;

      if (typeof datasetValue === "string" || typeof datasetValue === "number") {
        return handler.call(entry, datasetValue);
      }

      return handler.call(entry);
    };
  }

  return createWechatPageBridge(
    bridgeConfig as unknown as Parameters<typeof createWechatPageBridge>[0],
  );
}

export const ${hostSpec.registry.shell_export} = Object.fromEntries(
  Object.entries(${hostSpec.manifest.app_export}.pageDefinitions).map(([pageKey, definition]) => [
    pageKey,
    () => createHostWechatShellPage(pageKey as ${shellPageKeyType}, definition),
  ]),
) as Record<${shellPageKeyType}, () => ReturnType<typeof createWechatPageBridge>>;

export function ${registerFunction}<TKey extends keyof typeof ${hostSpec.registry.shell_export}>(
  pageKey: TKey,
): ReturnType<(typeof ${hostSpec.registry.shell_export})[TKey]> {
  return ${hostSpec.registry.shell_export}[pageKey]() as ReturnType<(typeof ${hostSpec.registry.shell_export})[TKey]>;
}
`;
}

async function loadGeneratedFiles(repoRoot: string) {
  const hostApps = await listHostApps(repoRoot);
  const generatedFiles: Array<{ relativePath: string; contents: string }> = [];

  for (const hostApp of hostApps) {
    const hostSpec = await getHostAppSpec(repoRoot, hostApp.name);
    generatedFiles.push({
      relativePath: path.relative(repoRoot, resolveHostFile(hostSpec, hostSpec.manifest.app_module)),
      contents: buildHostAppManifestContents(hostSpec),
    });
    generatedFiles.push({
      relativePath: path.relative(repoRoot, resolveHostFile(hostSpec, hostSpec.registry.page_module)),
      contents: buildHostPageRegistryContents(hostSpec),
    });

    if (hostSpec.platform === "wechat" && hostSpec.registry.shell_module) {
      generatedFiles.push({
        relativePath: path.relative(repoRoot, resolveHostFile(hostSpec, hostSpec.registry.shell_module)),
        contents: buildHostWechatShellRegistryContents(hostSpec),
      });
    }
  }

  return generatedFiles;
}

export async function checkHostManifestGeneratedFiles(repoRoot: string): Promise<string[]> {
  const violations: string[] = [];
  const generatedFiles = await loadGeneratedFiles(repoRoot);

  for (const { relativePath, contents } of generatedFiles) {
    const filePath = path.join(repoRoot, relativePath);
    let current = "";

    try {
      current = await readFile(filePath, "utf8");
    } catch {
      violations.push(relativePath);
      continue;
    }

    if (current !== contents) {
      violations.push(relativePath);
    }
  }

  return violations;
}

export async function syncHostManifestGeneratedFiles(repoRoot: string): Promise<void> {
  const generatedFiles = await loadGeneratedFiles(repoRoot);

  for (const { relativePath, contents } of generatedFiles) {
    const filePath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents, "utf8");
  }
}
