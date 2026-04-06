import type { LifecycleEventEnvelope } from "@minix/contracts";
import { createError, fail, ok, type LifecycleAdapter, type LifecycleListener } from "@minix/core";

import { resolveWechatRuntime } from "../runtime";

interface WechatLifecycleRuntime {
  onAppHide?: (listener: () => void) => void;
  onAppShow?: (listener: () => void) => void;
}

export function createWechatLifecycleAdapter(runtime?: WechatLifecycleRuntime): LifecycleAdapter {
  const host = resolveWechatRuntime<WechatLifecycleRuntime>(runtime);
  const listeners = new Set<LifecycleListener>();

  async function notify(event: LifecycleEventEnvelope) {
    try {
      for (const listener of listeners) {
        await listener(event);
      }

      return ok(undefined);
    } catch (error) {
      return fail(createError("INTERNAL_ERROR", "lifecycle listener failed", {
        cause: error,
        recoverable: false,
      }));
    }
  }

  host.onAppShow?.(() => {
    void notify({
      scope: "app",
      event: "foreground",
      occurredAt: Date.now(),
    });
  });

  host.onAppHide?.(() => {
    void notify({
      scope: "app",
      event: "background",
      occurredAt: Date.now(),
    });
  });

  return {
    dispatch(event) {
      return notify(event);
    },

    subscribe(listener) {
      listeners.add(listener);
      return ok({
        unsubscribe() {
          listeners.delete(listener);
        },
      });
    },
  };
}
