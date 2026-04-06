import path from "node:path";

import { getHostAppSpec, importWorkspaceModule } from "./specs";

export async function loadHostH5RendererKeys(repoRoot: string): Promise<string[]> {
  const hostSpec = await getHostAppSpec(repoRoot, "host-h5");
  if (!hostSpec.render?.registry_module || !hostSpec.render?.registry_export) {
    throw new Error(`host-h5 render registry is not configured in specs/repo.yaml`);
  }

  const modulePath = path.join(hostSpec.dir, hostSpec.render.registry_module);
  const module = await importWorkspaceModule<Record<string, Record<string, unknown>>>(modulePath);
  const renderers = module[hostSpec.render.registry_export];

  if (!renderers || typeof renderers !== "object") {
    throw new Error(`unable to load ${hostSpec.render.registry_export} from ${modulePath}`);
  }

  return Object.keys(renderers);
}
