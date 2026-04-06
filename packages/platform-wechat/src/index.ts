import type { PlatformAdapters } from "@minix/core";

import { createWechatAuthAdapter } from "./adapters/auth.adapter";
import { createWechatRequestAdapter } from "./adapters/request.adapter";
import { createWechatRouterAdapter } from "./adapters/router.adapter";
import { createWechatStorageAdapter } from "./adapters/storage.adapter";
import { createWechatUiAdapter } from "./adapters/ui.adapter";

export function createWechatAdapters(): PlatformAdapters {
  return {
    request: createWechatRequestAdapter(),
    storage: createWechatStorageAdapter(),
    auth: createWechatAuthAdapter(),
    router: createWechatRouterAdapter(),
    ui: createWechatUiAdapter(),
  };
}

export * from "./adapters/auth.adapter";
export * from "./adapters/request.adapter";
export * from "./adapters/router.adapter";
export * from "./adapters/storage.adapter";
export * from "./adapters/ui.adapter";
export * from "./bridge/app.bridge";
export * from "./bridge/page.bridge";
