import { bootstrapNovelWechatRuntime, type NovelWechatRuntime } from "../../manifest/app.manifest";

let runtimePromise: Promise<NovelWechatRuntime> | null = null;

export function ensureNovelWechatRuntime(): Promise<NovelWechatRuntime> {
  if (!runtimePromise) {
    runtimePromise = bootstrapNovelWechatRuntime();
  }

  return runtimePromise;
}
