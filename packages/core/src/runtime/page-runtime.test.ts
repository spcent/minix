import test from "node:test";
import assert from "node:assert/strict";

import { createStore } from "../store/state";
import {
  activateShowablePageEntry,
  normalizeRoutePath,
  resolvePageKeyFromRouteMap,
  subscribeStoreBackedPages,
} from "./page-runtime";

test("normalizeRoutePath removes trailing slashes while preserving root fallback", () => {
  assert.equal(normalizeRoutePath(""), "/");
  assert.equal(normalizeRoutePath("/"), "/");
  assert.equal(normalizeRoutePath("/books/"), "/books");
  assert.equal(normalizeRoutePath("/books"), "/books");
});

test("resolvePageKeyFromRouteMap matches normalized paths and falls back", () => {
  const routes = {
    home: "/",
    catalog: "/books",
  } as const;

  assert.equal(resolvePageKeyFromRouteMap("/books/", routes, "home"), "catalog");
  assert.equal(resolvePageKeyFromRouteMap("/missing", routes, "home"), "home");
});

test("activateShowablePageEntry invokes optional onShow handlers", async () => {
  let calls = 0;

  await activateShowablePageEntry({
    onShow() {
      calls += 1;
    },
  });
  await activateShowablePageEntry({});

  assert.equal(calls, 1);
});

test("subscribeStoreBackedPages subscribes only store-backed values", () => {
  let calls = 0;
  const first = { store: createStore({ ready: false }) };
  const second = { store: createStore({ ready: false }) };

  const cleanups = subscribeStoreBackedPages([first, {}, second], () => {
    calls += 1;
  });

  first.store.replaceState(first.store.getState());
  second.store.replaceState(second.store.getState());

  assert.equal(cleanups.length, 2);
  assert.equal(calls, 2);

  cleanups.forEach((cleanup) => cleanup());
});
