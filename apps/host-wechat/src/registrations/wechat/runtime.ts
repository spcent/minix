import { bootstrapHostWechatRuntime, type HostWechatRuntime } from "../../manifest/app.manifest";

let runtimePromise: Promise<HostWechatRuntime> | null = null;

export function ensureHostWechatRuntime(): Promise<HostWechatRuntime> {
  if (!runtimePromise) {
    runtimePromise = bootstrapHostWechatRuntime();
  }

  return runtimePromise;
}
