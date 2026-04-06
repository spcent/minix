import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

const repoRoot = process.cwd();

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }

  return value;
}

export function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

export function toAbsolutePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
}

export function toRepoRelative(filePath) {
  return normalizePath(path.relative(repoRoot, toAbsolutePath(filePath)));
}

function compileSpecPathPattern(pattern) {
  const normalized = normalizePath(pattern).replace(/\/$/, "");
  const segments = normalized.split("/").map((segment) => {
    if (segment === "**") {
      return ".*";
    }

    return escapeRegex(segment).replace(/\\\*/g, "[^/]*");
  });

  return new RegExp(`^${segments.join("/")}(?:/.*)?$`);
}

export function matchesSpecPath(filePath, pattern) {
  return compileSpecPathPattern(pattern).test(toRepoRelative(filePath));
}

async function loadYamlSpec(relativePath) {
  const raw = await readFile(path.join(repoRoot, relativePath), "utf8");
  return parse(raw);
}

export async function loadRepoSpec() {
  const spec = ensureObject(await loadYamlSpec("specs/repo.yaml"), "specs/repo.yaml");
  const packageShapes = ensureObject(spec.package_shapes, "specs/repo.yaml package_shapes");
  const featureWorkspace = ensureObject(packageShapes.feature_workspace, "specs/repo.yaml feature_workspace");
  const hostWiring = ensureObject(spec.host_wiring, "specs/repo.yaml host_wiring");

  if (!Array.isArray(packageShapes.shared_packages) || !Array.isArray(packageShapes.host_apps)) {
    throw new Error("specs/repo.yaml shared_packages and host_apps must be arrays");
  }

  if (typeof featureWorkspace.root !== "string" || featureWorkspace.root.length === 0) {
    throw new Error("specs/repo.yaml feature_workspace.root must be a non-empty string");
  }

  ensureObject(hostWiring.route_contract, "specs/repo.yaml host_wiring.route_contract");
  ensureObject(hostWiring.hosts, "specs/repo.yaml host_wiring.hosts");

  return spec;
}

export async function loadDependencyRulesSpec() {
  const spec = ensureObject(await loadYamlSpec("specs/dependency-rules.yaml"), "specs/dependency-rules.yaml");
  const layers = ensureObject(spec.layers, "specs/dependency-rules.yaml layers");

  for (const [layerName, layerSpec] of Object.entries(layers)) {
    const layer = ensureObject(layerSpec, `specs/dependency-rules.yaml layers.${layerName}`);
    if (!Array.isArray(layer.path)) {
      throw new Error(`specs/dependency-rules.yaml layers.${layerName}.path must be an array`);
    }
  }

  return spec;
}

export async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function importWorkspaceModule(modulePath) {
  const moduleUrl = pathToFileURL(modulePath);
  moduleUrl.searchParams.set("t", `${Date.now()}`);
  return import(moduleUrl.href);
}

export async function findManagedPackageDirs(repoSpec) {
  const packageDirs = new Set();

  for (const relativeDir of repoSpec.package_shapes.shared_packages) {
    packageDirs.add(path.join(repoRoot, relativeDir));
  }

  for (const relativeDir of repoSpec.package_shapes.host_apps) {
    packageDirs.add(path.join(repoRoot, relativeDir));
  }

  const featureRoot = path.join(repoRoot, repoSpec.package_shapes.feature_workspace.root);
  const featureEntries = await readdir(featureRoot, { withFileTypes: true });

  for (const entry of featureEntries) {
    if (entry.isDirectory()) {
      packageDirs.add(path.join(featureRoot, entry.name));
    }
  }

  return Array.from(packageDirs).sort((left, right) => left.localeCompare(right));
}

export async function findWorkspacePackages(packageDirs) {
  const packages = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, "package.json");
    if (!(await pathExists(packageJsonPath))) {
      continue;
    }

    const raw = await readFile(packageJsonPath, "utf8");
    const json = JSON.parse(raw);
    packages.push({
      dir: packageDir,
      packageJsonPath,
      name: json.name,
      dependencies: new Set(Object.keys(json.dependencies ?? {})),
      devDependencies: new Set(Object.keys(json.devDependencies ?? {})),
      peerDependencies: new Set(Object.keys(json.peerDependencies ?? {})),
      optionalDependencies: new Set(Object.keys(json.optionalDependencies ?? {})),
    });
  }

  return packages;
}

export function listHostSpecs(repoSpec) {
  return Object.entries(repoSpec.host_wiring.hosts).map(([name, hostSpec]) => {
    const spec = ensureObject(hostSpec, `specs/repo.yaml host_wiring.hosts.${name}`);
    if (typeof spec.dir !== "string" || spec.dir.length === 0) {
      throw new Error(`specs/repo.yaml host_wiring.hosts.${name}.dir must be a non-empty string`);
    }

    return {
      name,
      ...spec,
      dir: path.join(repoRoot, spec.dir),
    };
  });
}

export function resolveHostFile(hostSpec, relativePath) {
  return path.join(hostSpec.dir, relativePath);
}

export async function loadNamedModuleExport(modulePath, exportName) {
  const module = await importWorkspaceModule(modulePath);
  return module[exportName];
}

export async function loadRouteContractEntries(repoSpec) {
  const routeContract = ensureObject(repoSpec.host_wiring.route_contract, "specs/repo.yaml host_wiring.route_contract");
  const modulePath = path.join(repoRoot, routeContract.module);
  const routeIds = await loadNamedModuleExport(modulePath, routeContract.export);

  if (!routeIds || typeof routeIds !== "object") {
    throw new Error(`unable to load ${routeContract.export} from ${routeContract.module}`);
  }

  return Object.entries(routeIds).map(([routeKey, routeId]) => {
    if (typeof routeId !== "string") {
      throw new Error(`route contract entry "${routeKey}" must map to a string route id`);
    }

    return { routeKey, routeId };
  });
}

export async function loadHostManifestObject(hostSpec) {
  const manifestSpec = ensureObject(hostSpec.manifest, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.manifest`);
  const modulePath = resolveHostFile(hostSpec, manifestSpec.app_module);
  const manifest = await loadNamedModuleExport(modulePath, manifestSpec.app_export);

  if (!manifest || typeof manifest !== "object") {
    throw new Error(`unable to load ${manifestSpec.app_export} from ${modulePath}`);
  }

  return manifest;
}

export async function loadHostManifestPageEntries(hostSpec) {
  const manifestSpec = ensureObject(hostSpec.manifest, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.manifest`);
  const modulePath = resolveHostFile(hostSpec, manifestSpec.page_manifest_module);
  const manifest = await loadNamedModuleExport(modulePath, manifestSpec.page_manifest_export);

  if (!manifest || typeof manifest !== "object") {
    throw new Error(`unable to load ${manifestSpec.page_manifest_export} from ${modulePath}`);
  }

  return Object.entries(manifest).map(([pageKey, rawEntry]) => {
    if (!rawEntry || typeof rawEntry !== "object") {
      throw new Error(`invalid page manifest entry for "${pageKey}"`);
    }

    if (typeof rawEntry.routeId !== "string" || typeof rawEntry.routePath !== "string") {
      throw new Error(`page manifest entry "${pageKey}" must define string routeId and routePath`);
    }

    if (rawEntry.miniprogramPage !== undefined && typeof rawEntry.miniprogramPage !== "string") {
      throw new Error(`page manifest entry "${pageKey}" must define string miniprogramPage when present`);
    }

    return {
      pageKey,
      ...rawEntry,
      routeId: rawEntry.routeId,
      routePath: rawEntry.routePath,
      ...(typeof rawEntry.miniprogramPage === "string" ? { miniprogramPage: rawEntry.miniprogramPage } : {}),
    };
  });
}

export async function loadHostPageConfigKeys(hostSpec) {
  const manifestSpec = ensureObject(hostSpec.manifest, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.manifest`);
  const modulePath = resolveHostFile(hostSpec, manifestSpec.source_module);
  const config = await loadNamedModuleExport(modulePath, manifestSpec.page_definitions_export);

  if (!config || typeof config !== "object") {
    throw new Error(`unable to load ${manifestSpec.page_definitions_export} from ${modulePath}`);
  }

  return Object.keys(config);
}

export async function loadHostRouteKeyMap(hostSpec) {
  const manifestSpec = ensureObject(hostSpec.manifest, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.manifest`);
  const modulePath = resolveHostFile(hostSpec, manifestSpec.routes_module);
  const routes = await loadNamedModuleExport(modulePath, manifestSpec.routes_export);

  if (!routes || typeof routes !== "object") {
    throw new Error(`unable to load ${manifestSpec.routes_export} from ${modulePath}`);
  }

  return routes;
}

export async function loadHostPageRegistryKeys(hostSpec) {
  const registrySpec = ensureObject(hostSpec.registry, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.registry`);
  const modulePath = resolveHostFile(hostSpec, registrySpec.page_module);
  const registry = await loadNamedModuleExport(modulePath, registrySpec.page_export);

  if (!registry || typeof registry !== "object") {
    throw new Error(`unable to load ${registrySpec.page_export} from ${modulePath}`);
  }

  return Object.keys(registry);
}

export async function loadHostShellRegistryKeys(hostSpec) {
  const registrySpec = ensureObject(hostSpec.registry, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.registry`);
  if (!registrySpec.shell_module || !registrySpec.shell_export) {
    return [];
  }

  const modulePath = resolveHostFile(hostSpec, registrySpec.shell_module);
  const registry = await loadNamedModuleExport(modulePath, registrySpec.shell_export);

  if (!registry || typeof registry !== "object") {
    throw new Error(`unable to load ${registrySpec.shell_export} from ${modulePath}`);
  }

  return Object.keys(registry);
}

export async function loadHostRenderRegistryKeys(hostSpec) {
  if (!hostSpec.render?.registry_module || !hostSpec.render?.registry_export) {
    return [];
  }

  const modulePath = resolveHostFile(hostSpec, hostSpec.render.registry_module);
  const registry = await loadNamedModuleExport(modulePath, hostSpec.render.registry_export);

  if (!registry || typeof registry !== "object") {
    throw new Error(`unable to load ${hostSpec.render.registry_export} from ${modulePath}`);
  }

  return Object.keys(registry);
}

export async function loadHostMiniprogramPages(hostSpec) {
  const manifestSpec = ensureObject(hostSpec.manifest, `specs/repo.yaml host_wiring.hosts.${hostSpec.name}.manifest`);
  if (!manifestSpec.miniprogram_pages_module || !manifestSpec.miniprogram_pages_export) {
    return [];
  }

  const modulePath = resolveHostFile(hostSpec, manifestSpec.miniprogram_pages_module);
  const pages = await loadNamedModuleExport(modulePath, manifestSpec.miniprogram_pages_export);

  if (!Array.isArray(pages)) {
    throw new Error(`unable to load array ${manifestSpec.miniprogram_pages_export} from ${modulePath}`);
  }

  return pages;
}

export function classifyPathFromDependencySpec(filePath, dependencyRulesSpec) {
  let bestMatch = null;
  const relativePath = toRepoRelative(filePath);

  for (const [layerName, layerSpec] of Object.entries(dependencyRulesSpec.layers)) {
    for (const pattern of layerSpec.path ?? []) {
      if (!matchesSpecPath(relativePath, pattern)) {
        continue;
      }

      const score = normalizePath(pattern).length;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { layerName, score };
      }
    }
  }

  return bestMatch?.layerName ?? "unknown";
}

export function findContainingPackageRoot(filePath, packageDirs) {
  const absolutePath = toAbsolutePath(filePath);
  const normalizedAbsolute = normalizePath(absolutePath);
  let bestMatch = null;

  for (const packageDir of packageDirs) {
    const normalizedDir = normalizePath(packageDir);
    if (normalizedAbsolute === normalizedDir || normalizedAbsolute.startsWith(`${normalizedDir}/`)) {
      if (!bestMatch || normalizedDir.length > bestMatch.normalized.length) {
        bestMatch = {
          absolute: packageDir,
          normalized: normalizedDir,
        };
      }
    }
  }

  return bestMatch?.absolute ?? null;
}

export function workspacePackageName(specifier) {
  if (!specifier.startsWith("@minix/")) {
    return null;
  }

  const parts = specifier.split("/");
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
}

export function buildWorkspacePackageLayerMap(packages, dependencyRulesSpec) {
  const layerMap = new Map();

  for (const pkg of packages) {
    if (!pkg.name) {
      continue;
    }

    layerMap.set(pkg.name, classifyPathFromDependencySpec(pkg.dir, dependencyRulesSpec));
  }

  return layerMap;
}

export function formatLayerList(layers) {
  if (layers.length === 0) {
    return "";
  }

  if (layers.length === 1) {
    return layers[0];
  }

  if (layers.length === 2) {
    return `${layers[0]} and ${layers[1]}`;
  }

  return `${layers.slice(0, -1).join(", ")}, and ${layers.at(-1)}`;
}
