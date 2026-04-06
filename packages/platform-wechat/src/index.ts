import type { PlatformAdapters } from "@minix/core";

import { createWechatAuthAdapter } from "./adapters/auth.adapter";
import { createWechatCapabilityAdapter } from "./adapters/capability.adapter";
import { createWechatConfigAdapter } from "./adapters/config.adapter";
import { createWechatLifecycleAdapter } from "./adapters/lifecycle.adapter";
import { createWechatRequestAdapter } from "./adapters/request.adapter";
import { createWechatRouterAdapter } from "./adapters/router.adapter";
import { createWechatStorageAdapter } from "./adapters/storage.adapter";
import { createWechatTelemetryAdapter } from "./adapters/telemetry.adapter";
import { createWechatUiAdapter } from "./adapters/ui.adapter";

export function createWechatAdapters(): PlatformAdapters {
  return {
    request: createWechatRequestAdapter(),
    storage: createWechatStorageAdapter(),
    auth: createWechatAuthAdapter(),
    router: createWechatRouterAdapter(),
    ui: createWechatUiAdapter(),
    capability: createWechatCapabilityAdapter(),
    config: createWechatConfigAdapter(),
    lifecycle: createWechatLifecycleAdapter(),
    telemetry: createWechatTelemetryAdapter(),
  };
}

export * from "./adapters/auth.adapter";
export * from "./adapters/capability.adapter";
export * from "./adapters/config.adapter";
export * from "./adapters/lifecycle.adapter";
export * from "./adapters/request.adapter";
export * from "./adapters/router.adapter";
export * from "./adapters/storage.adapter";
export * from "./adapters/telemetry.adapter";
export * from "./adapters/ui.adapter";
export * from "./bridge/app.bridge";
export * from "./bridge/page.bridge";
