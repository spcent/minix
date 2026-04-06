import type { LifecycleEventEnvelope } from "@minix/contracts";

import type { Result } from "../error/index";

export type LifecycleListener = (event: LifecycleEventEnvelope) => void | Promise<void>;

export interface LifecycleSubscription {
  unsubscribe(): void;
}

export interface LifecycleAdapter {
  dispatch(event: LifecycleEventEnvelope): Promise<Result<void>>;
  subscribe(listener: LifecycleListener): Result<LifecycleSubscription>;
}
