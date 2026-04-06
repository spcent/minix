import type { NovelWechatRuntime } from "../manifest/app.manifest";

export function createNovelWechatPageEntry<TKey extends keyof NovelWechatRuntime["registry"]>(
  runtime: NovelWechatRuntime,
  pageKey: TKey,
): ReturnType<NovelWechatRuntime["registry"][TKey]["createEntry"]> {
  return runtime.registry[pageKey].createEntry() as ReturnType<NovelWechatRuntime["registry"][TKey]["createEntry"]>;
}
