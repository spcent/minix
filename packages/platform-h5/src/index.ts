import type { PlatformAdapters } from "@minix/core";

import { createH5AuthAdapter } from "./adapters/auth.adapter";
import { createH5CapabilityAdapter } from "./adapters/capability.adapter";
import { createH5ConfigAdapter } from "./adapters/config.adapter";
import { createH5LifecycleAdapter } from "./adapters/lifecycle.adapter";
import { createH5RequestAdapter } from "./adapters/request.adapter";
import { createH5RouterAdapter } from "./adapters/router.adapter";
import { createH5StorageAdapter } from "./adapters/storage.adapter";
import { createH5TelemetryAdapter } from "./adapters/telemetry.adapter";
import { createH5UiAdapter } from "./adapters/ui.adapter";

export function createH5Adapters(): PlatformAdapters {
  return {
    request: createH5RequestAdapter(),
    storage: createH5StorageAdapter(),
    auth: createH5AuthAdapter(),
    router: createH5RouterAdapter(),
    ui: createH5UiAdapter(),
    capability: createH5CapabilityAdapter(),
    config: createH5ConfigAdapter(),
    lifecycle: createH5LifecycleAdapter(),
    telemetry: createH5TelemetryAdapter(),
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
