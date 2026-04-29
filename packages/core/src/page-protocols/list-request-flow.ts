import type { ListPageLoadState } from "@minix/contracts";

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

export interface SearchListRequestFlowState extends ListRequestFlowState {
  query: {
    page?: number;
    pageSize?: number;
  };
  status?: ReturnType<typeof createListStatus>;
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
  afterSuccess?: (input: {
    kind: ListRequestKind;
    state: TState;
    response: TResponse;
    page: number;
    patch: TPatch;
  }) => Promise<void> | void;
}

export interface CreateSearchListRequestStartPatchOptions<TState extends SearchListRequestFlowState> {
  appendLoadState?: ListPageLoadState;
  clearKeys?: Array<keyof TState>;
  firstLoaded?: (input: { kind: ListRequestKind; state: TState }) => boolean;
  includeStatus?: boolean;
  keepLoadingOnRefresh?: boolean;
  updateQueryPage?: boolean;
}

export interface CreateSearchListRequestFlowOptions<TState extends SearchListRequestFlowState, TResponse, TPatch extends Partial<TState>>
  extends Omit<CreateListRequestFlowOptions<TState, TResponse, TPatch>, "createStartPatch"> {
  createStartPatch?: (input: { kind: ListRequestKind; state: TState }) => TPatch;
  startPatch?: CreateSearchListRequestStartPatchOptions<TState>;
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

export function createSearchListRequestStartPatch<TState extends SearchListRequestFlowState>(
  input: { kind: ListRequestKind; state: TState },
  options: CreateSearchListRequestStartPatchOptions<TState> = {},
): Partial<TState> {
  const { kind, state } = input;
  const page = kind === "append" ? (state.query.page ?? 1) + 1 : 1;
  const keepLoadingOnRefresh = options.keepLoadingOnRefresh ?? true;
  const patch = {
    loading: kind === "refresh" ? (keepLoadingOnRefresh ? state.loading : false) : true,
    refreshing: kind === "refresh",
    errorText: undefined,
  } as Partial<TState>;

  if (options.updateQueryPage ?? true) {
    Object.assign(patch, {
      query: {
        ...state.query,
        page,
      },
    });
  }

  for (const key of options.clearKeys ?? []) {
    (patch as Record<keyof TState, unknown>)[key] = undefined;
  }

  const includeStatus = options.includeStatus ?? state.status !== undefined;
  if (includeStatus) {
    const firstLoaded =
      options.firstLoaded?.({ kind, state }) ??
      (kind === "initial" && state.status?.restoredFromRoute
        ? Boolean(state.status.firstLoaded)
        : state.items.length > 0);
    const loadState = kind === "refresh" ? "refreshing" : kind === "append" ? options.appendLoadState ?? "partial" : "loading";

    Object.assign(patch, {
      status: createListStatus(loadState, {
        firstLoaded,
        ...(kind !== "initial" && state.items.length > 0 ? { partialData: true, staleData: true } : {}),
        ...(kind === "initial" && state.status?.restoredFromRoute ? { restoredFromRoute: true } : {}),
        ...(kind === "initial" && state.status?.restoredQueryKeys ? { restoredQueryKeys: state.status.restoredQueryKeys } : {}),
        ...(kind === "initial" && state.status?.restoredSelectionId ? { restoredSelectionId: state.status.restoredSelectionId } : {}),
      }),
    });
  }

  return patch;
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
    const patch = options.applyResponse({ kind, state: responseState, response: result.value, page });
    options.store.setState(patch);
    await options.afterSuccess?.({ kind, state: options.store.getState(), response: result.value, page, patch });
    return result;
  };
}

export function createSearchListRequestFlow<
  TState extends SearchListRequestFlowState,
  TResponse,
  TPatch extends Partial<TState> = Partial<TState>,
>(options: CreateSearchListRequestFlowOptions<TState, TResponse, TPatch>) {
  const { startPatch, createStartPatch, ...flowOptions } = options;

  return createListRequestFlow<TState, TResponse, TPatch>({
    ...flowOptions,
    resolvePage:
      flowOptions.resolvePage ??
      (({ kind, state }) => (kind === "append" ? (state.query.page ?? 1) + 1 : 1)),
    createStartPatch:
      createStartPatch ??
      ((input) => createSearchListRequestStartPatch(input, startPatch) as TPatch),
  });
}
