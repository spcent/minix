export function resolveWechatRuntime<T extends object>(runtime?: T): T {
  if (runtime) {
    return runtime;
  }

  const globalWithWechat = globalThis as typeof globalThis & { wx?: unknown };
  if (typeof globalWithWechat.wx === "object" && globalWithWechat.wx !== null) {
    return globalWithWechat.wx as T;
  }

  return globalThis as T;
}
