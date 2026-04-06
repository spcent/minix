import { createStore } from "@minix/core";
import { createInitialFeedState, type FeedState } from "../model";

export interface CreateFeedControllerOptions {
  initialState?: Partial<FeedState>;
}

export function createFeedController(options: CreateFeedControllerOptions = {}) {
  const store = createStore<FeedState>({
    ...createInitialFeedState(),
    ...options.initialState,
  });

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },
  };
}
