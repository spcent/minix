import type { PlatformAdapters } from "@minix/core";

import { createH5AuthAdapter } from "./adapters/auth.adapter";
import { createH5RequestAdapter } from "./adapters/request.adapter";
import { createH5RouterAdapter } from "./adapters/router.adapter";
import { createH5StorageAdapter } from "./adapters/storage.adapter";
import { createH5UiAdapter } from "./adapters/ui.adapter";

export function createH5Adapters(): PlatformAdapters {
  return {
    request: createH5RequestAdapter(),
    storage: createH5StorageAdapter(),
    auth: createH5AuthAdapter(),
    router: createH5RouterAdapter(),
    ui: createH5UiAdapter(),
  };
}

export * from "./adapters/auth.adapter";
export * from "./adapters/request.adapter";
export * from "./adapters/router.adapter";
export * from "./adapters/storage.adapter";
export * from "./adapters/ui.adapter";
