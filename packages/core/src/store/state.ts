export interface Store<T> {
  getState(): T;
  setState(patch: Partial<T>): void;
  replaceState(next: T): void;
  subscribe(listener: (state: T) => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<(state: T) => void>();

  return {
    getState() {
      return state;
    },
    setState(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    replaceState(next) {
      state = next;
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
