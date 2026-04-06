import type { NovelH5Runtime } from "../manifest/app.manifest";

export function createNovelH5PageEntry<TKey extends keyof NovelH5Runtime["registry"]>(
  runtime: NovelH5Runtime,
  pageKey: TKey,
): ReturnType<NovelH5Runtime["registry"][TKey]["createEntry"]> {
  return runtime.registry[pageKey].createEntry() as ReturnType<NovelH5Runtime["registry"][TKey]["createEntry"]>;
}
