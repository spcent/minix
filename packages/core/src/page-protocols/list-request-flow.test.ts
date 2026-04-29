import assert from "node:assert/strict";
import test from "node:test";

import { createError, fail, ok } from "../error/index";
import { createStore } from "../store/state";
import {
  createListStatus,
  createSearchListRequestFlow,
  type SearchListRequestFlowState,
} from "./index";

interface TestListState extends SearchListRequestFlowState {
  errorCode: string | undefined;
  query: {
    page: number;
    pageSize: number;
  };
  status: ReturnType<typeof createListStatus>;
}

function createState(): TestListState {
  return {
    ready: false,
    loading: false,
    refreshing: false,
    errorCode: undefined,
    errorText: undefined,
    items: [],
    query: {
      page: 1,
      pageSize: 2,
    },
    status: createListStatus("idle", {
      firstLoaded: false,
    }),
  };
}

test("createSearchListRequestFlow centralizes paging, start patch, and success hooks", async () => {
  const store = createStore(createState());
  let afterSuccessPage = 0;

  const runListRequest = createSearchListRequestFlow<TestListState, { items: string[] }>({
    store,
    startPatch: {
      appendLoadState: "appending",
      clearKeys: ["errorCode"],
    },
    request: async ({ page }) => ok({ items: [`item-${page}`] }),
    applyResponse: ({ state, response }) => ({
      ready: true,
      loading: false,
      refreshing: false,
      items: [...state.items, ...response.items],
      status: createListStatus("ready", {
        firstLoaded: true,
      }),
    }),
    afterSuccess: ({ page }) => {
      afterSuccessPage = page;
    },
  });

  const initialResult = await runListRequest("initial");
  assert.equal(initialResult.ok, true);
  assert.equal(afterSuccessPage, 1);
  assert.deepEqual(store.getState().items, ["item-1"]);

  store.setState({
    errorCode: "STALE",
  });
  const appendResult = await runListRequest("append");
  assert.equal(appendResult.ok, true);
  assert.equal(afterSuccessPage, 2);
  assert.equal(store.getState().errorCode, undefined);
  assert.equal(store.getState().status.loadState, "ready");
  assert.deepEqual(store.getState().items, ["item-1", "item-2"]);
});

test("createSearchListRequestFlow keeps the standard failure patch overridable", async () => {
  const store = createStore({
    ...createState(),
    items: ["cached"],
  });

  const runListRequest = createSearchListRequestFlow<TestListState, { items: string[] }>({
    store,
    request: async () => fail(createError("UNKNOWN", "Network unavailable")),
    applyResponse: ({ response }) => ({
      items: response.items,
    }),
  });

  const result = await runListRequest("refresh");
  assert.equal(result.ok, false);
  assert.equal(store.getState().loading, false);
  assert.equal(store.getState().refreshing, false);
  assert.equal(store.getState().errorText, "Network unavailable");
  assert.equal(store.getState().status.loadState, "error");
  assert.equal(store.getState().status.staleData, true);
});
