export interface AccountState {
  ready: boolean;
}

export function createInitialAccountState(): AccountState {
  return {
    ready: false,
  };
}
