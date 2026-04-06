import assert from "node:assert/strict";
import test from "node:test";

import { createH5RouterAdapter } from "./router.adapter";

function createHistoryStub() {
  let state: unknown = null;
  const calls: string[] = [];

  return {
    history: {
      get state() {
        return state;
      },
      pushState(nextState: unknown, _unused: string, url?: string | URL | null) {
        state = nextState;
        calls.push(`push:${String(url)}`);
      },
      replaceState(nextState: unknown, _unused: string, url?: string | URL | null) {
        state = nextState;
        calls.push(`replace:${String(url)}`);
      },
      go(delta?: number) {
        calls.push(`go:${delta}`);
      },
    } as History,
    calls,
  };
}

test("h5 router adapter pushes replaces and tracks the current location", async () => {
  const runtime = createHistoryStub();
  const originalLocation = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: {
      pathname: "/login",
      search: "",
    },
  });

  try {
    const adapter = createH5RouterAdapter(runtime.history);
    await adapter.push({ path: "/items", params: { from: "plan" } });
    await adapter.replace({ path: "/settings", params: { source: "items" } });
    await adapter.back(2);

    assert.deepEqual(runtime.calls, ["push:/items?from=plan", "replace:/settings?source=items", "go:-2"]);
    assert.deepEqual(adapter.current(), {
      ok: true,
      value: {
        path: "/settings",
        params: { source: "items" },
      },
    });
  } finally {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: originalLocation,
    });
  }
});
