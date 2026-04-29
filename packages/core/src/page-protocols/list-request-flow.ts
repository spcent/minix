import type { Result } from "../error/index";
import type { Store } from "../store/state";
import { createListStatus } from "./list";

export type ListRequestKind = "initial" | "refresh" | "append";

export interface ListRequestFlowState {
  ready: boolean;
  loading: boolean;
  refreshing: boolean;
  errorText: string | undefined;
  items: unknown[];
}

export interface CreateListRequestFlowOptions<TState extends ListRequestFlowState, TResponse, TPatch extends Partial<TState>> {
  store: Store<TState>;
  request: (input: { kind: ListRequestKind; state: TState; page: number }) => Promise<Result<TResponse>>;
  applyResponse: (input: {
    kind: ListRequestKind;
    state: TState;
    response: TResponse;
    page: number;
  }) => TPatch;
  onUnauthorized?: (result: Extract<Result<TResponse>, { ok: false }>) => Promise<Result<void>>;
  resolvePage?: (input: { kind: ListRequestKind; state: TState }) => number;
  createStartPatch?: (input: { kind: ListRequestKind; state: TState }) => TPatch;
  createFailurePatch?: (input: {
    kind: ListRequestKind;
    state: TState;
    result: Extract<Result<TResponse>, { ok: false }>;
  }) => TPatch;
}

export function createListRequestStartPatch(
  kind: ListRequestKind,
  itemCount: number,
): Partial<ListRequestFlowState> & { status: ReturnType<typeof createListStatus> } {
  if (kind === "refresh") {
    return {
      refreshing: true,
      errorText: undefined,
      status: createListStatus("refreshing", {
        firstLoaded: itemCount > 0,
        staleData: itemCount > 0,
      }),
    };
  }

  if (kind === "append") {
    return {
      loading: true,
      errorText: undefined,
      status: createListStatus("partial", {
        firstLoaded: itemCount > 0,
        partialData: itemCount > 0,
        staleData: itemCount > 0,
      }),
    };
  }

  return {
    loading: true,
    refreshing: false,
    errorText: undefined,
    status: createListStatus("loading", {
      firstLoaded: itemCount > 0,
    }),
  };
}

export function createListRequestFailurePatch(
  itemCount: number,
  message: string,
): Partial<ListRequestFlowState> & { status: ReturnType<typeof createListStatus> } {
  return {
    ready: true,
    loading: false,
    refreshing: false,
    errorText: message,
    status: createListStatus("error", {
      firstLoaded: itemCount > 0,
      staleData: itemCount > 0,
    }),
  };
}

export function createListRequestSuccessStatus(itemCount: number, selectedItemId?: string) {
  return createListStatus(itemCount > 0 ? "ready" : "empty", {
    firstLoaded: true,
    ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
  });
}

export function createListRequestFlow<TState extends ListRequestFlowState, TResponse, TPatch extends Partial<TState> = Partial<TState>>(
  options: CreateListRequestFlowOptions<TState, TResponse, TPatch>,
) {
  const resolvePage = options.resolvePage ?? (({ kind, state }) => (kind === "append" ? (((state as { query?: { page?: number } }).query?.page ?? 1) + 1) : 1));

  return async function runListRequest(kind: ListRequestKind): Promise<Result<TResponse | void>> {
    const state = options.store.getState();
    const page = resolvePage({ kind, state });
    const startPatch =
      options.createStartPatch?.({ kind, state }) ??
      (createListRequestStartPatch(kind, state.items.length) as unknown as TPatch);
    options.store.setState(startPatch);

    const result = await options.request({ kind, state: options.store.getState(), page });
    if (!result.ok) {
      const failureState = options.store.getState();
      const failurePatch =
        options.createFailurePatch?.({ kind, state: failureState, result }) ??
        (createListRequestFailurePatch(failureState.items.length, result.error.message) as unknown as TPatch);
      options.store.setState(failurePatch);

      if (result.error.code === "UNAUTHORIZED" && options.onUnauthorized) {
        return options.onUnauthorized(result);
      }

      return result;
    }

    const responseState = options.store.getState();
    options.store.setState(options.applyResponse({ kind, state: responseState, response: result.value, page }));
    return result;
  };
}
