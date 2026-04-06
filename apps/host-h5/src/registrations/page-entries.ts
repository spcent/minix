import type { HostH5Runtime } from "../manifest/app.manifest";

export function createHostH5PageEntry<TKey extends keyof HostH5Runtime["registry"]>(
  runtime: HostH5Runtime,
  pageKey: TKey,
): ReturnType<HostH5Runtime["registry"][TKey]["createEntry"]> {
  return runtime.registry[pageKey].createEntry() as ReturnType<HostH5Runtime["registry"][TKey]["createEntry"]>;
}
