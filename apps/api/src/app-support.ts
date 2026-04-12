import { createD1ApiStore } from "./store.d1";
import { getGlobalMemoryApiStore } from "./store";
import type { ApiBindings, ApiStore } from "./types";
import type { AuthRateLimitConfig, RateLimitCounterStore } from "./rate-limit";

export interface CreateApiAppOptions {
  store?: ApiStore;
  allowedOrigins?: string[];
  authRateLimitConfig?: Partial<AuthRateLimitConfig>;
  authRateLimitStore?: RateLimitCounterStore;
}

export function getStore(
  env: ApiBindings | undefined,
  overrideStore?: ApiStore,
): ApiStore {
  if (overrideStore) {
    return overrideStore;
  }

  if (env?.MINIX_STORE) {
    return env.MINIX_STORE;
  }

  if (env?.DB) {
    return createD1ApiStore(env.DB);
  }

  return getGlobalMemoryApiStore();
}
