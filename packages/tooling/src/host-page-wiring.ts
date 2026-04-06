import path from "node:path";

import { getHostAppSpec, importWorkspaceModule } from "./specs";

export async function loadHostManifestPageKeys(
  repoRoot: string,
  hostAppName: string,
): Promise<string[]> {
  const hostSpec = await getHostAppSpec(repoRoot, hostAppName);
  const modulePath = path.join(hostSpec.dir, hostSpec.manifest.source_module);
  const module = await importWorkspaceModule<Record<string, Record<string, unknown>>>(modulePath);
  const definitions = module[hostSpec.manifest.page_definitions_export];
  if (!definitions || typeof definitions !== "object") {
    throw new Error(`unable to load ${hostSpec.manifest.page_definitions_export} from ${modulePath}`);
  }

  return Object.keys(definitions);
}

export async function loadHostPageRegistryKeys(
  repoRoot: string,
  hostAppName: string,
): Promise<string[]> {
  const hostSpec = await getHostAppSpec(repoRoot, hostAppName);
  const modulePath = path.join(hostSpec.dir, hostSpec.registry.page_module);
  const module = await importWorkspaceModule<Record<string, Record<string, unknown>>>(modulePath);
  const registry = module[hostSpec.registry.page_export];
  if (!registry || typeof registry !== "object") {
    throw new Error(`unable to load ${hostSpec.registry.page_export} from ${modulePath}`);
  }

  return Object.keys(registry);
}

export async function loadHostWechatShellRegistryKeys(repoRoot: string): Promise<string[]> {
  const hostSpec = await getHostAppSpec(repoRoot, "host-wechat");
  if (!hostSpec.registry.shell_module || !hostSpec.registry.shell_export) {
    throw new Error(`host-wechat shell registry is not configured in specs/repo.yaml`);
  }

  const modulePath = path.join(hostSpec.dir, hostSpec.registry.shell_module);
  const module = await importWorkspaceModule<Record<string, Record<string, unknown>>>(modulePath);
  const registry = module[hostSpec.registry.shell_export];
  if (!registry || typeof registry !== "object") {
    throw new Error(`unable to load ${hostSpec.registry.shell_export} from ${modulePath}`);
  }

  return Object.keys(registry);
}
