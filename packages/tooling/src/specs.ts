import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { parse } from "yaml";

export interface RepoSpecHostManifestSpec {
  source_module: string;
  feature_flags_export: string;
  page_definitions_export: string;
  app_module: string;
  app_export: string;
  page_manifest_module: string;
  page_manifest_export: string;
  page_config_module: string;
  page_config_export: string;
  route_map_export: string;
  routes_module: string;
  routes_export: string;
  miniprogram_pages_module?: string;
  miniprogram_pages_export?: string;
}

export interface RepoSpecHostRegistrySpec {
  page_module: string;
  page_export: string;
  shell_module?: string;
  shell_export?: string;
  shell_pages_dir?: string;
}

export interface RepoSpecHostRenderSpec {
  custom_mode?: string;
  registry_module?: string;
  registry_export?: string;
}

export interface RepoSpecHostMiniprogramSpec {
  page_mode: string;
  pages_dir?: string;
}

export interface RepoSpecHostRuntimeSpec {
  platform_package: string;
  create_adapters_export: string;
  env_module: string;
  load_env_export: string;
  mock_api_module: string;
  create_mock_api_export: string;
}

export interface RepoSpecHostApp {
  name: string;
  dir: string;
  platform: string;
  manifest: RepoSpecHostManifestSpec;
  runtime: RepoSpecHostRuntimeSpec;
  registry: RepoSpecHostRegistrySpec;
  render?: RepoSpecHostRenderSpec;
  miniprogram: RepoSpecHostMiniprogramSpec;
}

export interface RepoSpec {
  package_shapes: {
    feature_workspace: {
      root: string;
    };
    host_apps: string[];
  };
  host_wiring: {
    route_contract: {
      module: string;
      export: string;
    };
    hosts: Record<string, Omit<RepoSpecHostApp, "name" | "dir"> & { dir: string }>;
  };
}

function ensureObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function normalizeWorkspacePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export async function importWorkspaceModule<TModule>(modulePath: string): Promise<TModule> {
  const moduleUrl = pathToFileURL(modulePath);
  moduleUrl.searchParams.set("t", `${Date.now()}`);
  return import(moduleUrl.href) as Promise<TModule>;
}

export async function loadRepoSpec(repoRoot: string): Promise<RepoSpec> {
  const raw = await readFile(path.join(repoRoot, "specs", "repo.yaml"), "utf8");
  const parsed = ensureObject(parse(raw), "specs/repo.yaml") as unknown as RepoSpec;
  ensureObject(parsed.package_shapes, "specs/repo.yaml package_shapes");
  ensureObject(parsed.host_wiring, "specs/repo.yaml host_wiring");
  ensureObject(parsed.host_wiring.route_contract, "specs/repo.yaml host_wiring.route_contract");
  ensureObject(parsed.host_wiring.hosts, "specs/repo.yaml host_wiring.hosts");
  return parsed;
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listHostApps(repoRoot: string): Promise<Array<{ name: string; dir: string }>> {
  const repoSpec = await loadRepoSpec(repoRoot);
  return Object.entries(repoSpec.host_wiring.hosts).map(([name, hostSpec]) => ({
    name,
    dir: path.join(repoRoot, hostSpec.dir),
  }));
}

export async function getHostAppSpec(repoRoot: string, hostAppName: string): Promise<RepoSpecHostApp> {
  const repoSpec = await loadRepoSpec(repoRoot);
  const hostSpec = repoSpec.host_wiring.hosts[hostAppName];
  if (!hostSpec) {
    throw new Error(`unsupported host app "${hostAppName}"`);
  }

  return {
    name: hostAppName,
    ...hostSpec,
    dir: path.join(repoRoot, hostSpec.dir),
  };
}

export async function loadRouteContractEntries(repoRoot: string): Promise<Array<{ routeKey: string; routeId: string }>> {
  const repoSpec = await loadRepoSpec(repoRoot);
  const contractPath = path.join(repoRoot, repoSpec.host_wiring.route_contract.module);
  const contractModule = await importWorkspaceModule<Record<string, Record<string, string>>>(contractPath);
  const routeIds = contractModule[repoSpec.host_wiring.route_contract.export];

  if (!routeIds || typeof routeIds !== "object") {
    throw new Error(
      `unable to load ${repoSpec.host_wiring.route_contract.export} from ${repoSpec.host_wiring.route_contract.module}`,
    );
  }

  return Object.entries(routeIds).map(([routeKey, routeId]) => ({
    routeKey,
    routeId,
  }));
}

export function resolveHostFile(hostApp: RepoSpecHostApp, relativePath: string): string {
  return path.join(hostApp.dir, relativePath);
}

export async function loadHostNamedExport<TValue>(
  repoRoot: string,
  hostAppName: string,
  modulePath: string,
  exportName: string,
): Promise<TValue> {
  const hostSpec = await getHostAppSpec(repoRoot, hostAppName);
  const absoluteModulePath = resolveHostFile(hostSpec, modulePath);
  const module = await importWorkspaceModule<Record<string, TValue>>(absoluteModulePath);
  const value = module[exportName];

  if (value == null) {
    throw new Error(`unable to load ${exportName} from ${absoluteModulePath}`);
  }

  return value;
}

export function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join("");
}

export function toImportSpecifier(fromFilePath: string, targetFilePath: string): string {
  const relativePath = normalizeWorkspacePath(path.relative(path.dirname(fromFilePath), targetFilePath));
  const withoutExtension = relativePath.replace(/\.[^.]+$/, "");
  return withoutExtension.startsWith(".") ? withoutExtension : `./${withoutExtension}`;
}
