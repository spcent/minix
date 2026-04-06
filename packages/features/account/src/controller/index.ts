import { createStore } from "@minix/core";
import { createInitialAccountState, type AccountState } from "../model";

export interface CreateAccountControllerOptions {
  initialState?: Partial<AccountState>;
}

export function createAccountController(options: CreateAccountControllerOptions = {}) {
  const store = createStore<AccountState>({
    ...createInitialAccountState(),
    ...options.initialState,
  });

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },
  };
}
