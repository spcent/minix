import type { LifecycleEventEnvelope } from "@minix/contracts";
import { createError, fail, ok, type LifecycleAdapter, type LifecycleListener } from "@minix/core";

interface H5LifecycleDocument {
  visibilityState?: string;
  addEventListener?: (event: string, listener: () => void) => void;
}

export interface H5LifecycleAdapterOptions {
  document?: H5LifecycleDocument;
}

export function createH5LifecycleAdapter(options: H5LifecycleAdapterOptions = {}): LifecycleAdapter {
  const document = options.document ?? globalThis.document;
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

  document?.addEventListener?.("visibilitychange", () => {
    const event: LifecycleEventEnvelope = {
      scope: "app",
      event: document.visibilityState === "hidden" ? "background" : "foreground",
      occurredAt: Date.now(),
    };
    void notify(event);
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
