import path from "node:path";

import {
  getHostAppSpec,
  importWorkspaceModule,
  listHostApps,
  loadRouteContractEntries,
  normalizeWorkspacePath,
} from "./specs";

export interface LoadedHostPageManifestEntry extends Record<string, unknown> {
  pageKey: string;
  routeId: string;
  routePath: string;
  miniprogramPage?: string;
}
export { listHostApps, loadRouteContractEntries as loadAppRouteEntries, normalizeWorkspacePath };

export async function loadHostPageManifestEntries(
  repoRoot: string,
  hostAppName: string,
): Promise<LoadedHostPageManifestEntry[]> {
  const hostSpec = await getHostAppSpec(repoRoot, hostAppName);
  const manifestPath = path.join(hostSpec.dir, hostSpec.manifest.page_manifest_module);
  const appManifestPath = path.join(hostSpec.dir, hostSpec.manifest.app_module);
  let manifestModule: Record<string, Record<string, unknown>>;

  try {
    manifestModule = await importWorkspaceModule<Record<string, Record<string, unknown>>>(manifestPath);
  } catch {
    manifestModule = await importWorkspaceModule<Record<string, Record<string, unknown>>>(appManifestPath);
  }

  const manifest = manifestModule[hostSpec.manifest.page_manifest_export];

  if (!manifest || typeof manifest !== "object") {
    throw new Error(`unable to load ${hostSpec.manifest.page_manifest_export} from ${manifestPath}`);
  }

  return Object.entries(manifest).map(([pageKey, rawEntry]) => {
    if (!rawEntry || typeof rawEntry !== "object") {
      throw new Error(`invalid page manifest entry for "${pageKey}"`);
    }

    const entry = rawEntry as Record<string, unknown>;
    if (typeof entry.routeId !== "string" || typeof entry.routePath !== "string") {
      throw new Error(`page manifest entry "${pageKey}" must define string routeId and routePath`);
    }

    if (entry.miniprogramPage !== undefined && typeof entry.miniprogramPage !== "string") {
      throw new Error(`page manifest entry "${pageKey}" must define string miniprogramPage when present`);
    }

    return {
      pageKey,
      ...entry,
      routeId: entry.routeId,
      routePath: entry.routePath,
      ...(typeof entry.miniprogramPage === "string" ? { miniprogramPage: entry.miniprogramPage } : {}),
    };
  });
}
