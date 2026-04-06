import type { HostWechatRuntime } from "../manifest/app.manifest";

export function createHostWechatPageEntry<TKey extends keyof HostWechatRuntime["registry"]>(
  runtime: HostWechatRuntime,
  pageKey: TKey,
): ReturnType<HostWechatRuntime["registry"][TKey]["createEntry"]> {
  return runtime.registry[pageKey].createEntry() as ReturnType<HostWechatRuntime["registry"][TKey]["createEntry"]>;
}
