import test from "node:test";
import assert from "node:assert/strict";

import { createApiPaginationWindow } from "./pagination";

test("createApiPaginationWindow applies defaults and exposes totals", () => {
  assert.deepEqual(createApiPaginationWindow(["a", "b", "c"], { defaultPageSize: 2 }), {
    items: ["a", "b"],
    page: 1,
    pageSize: 2,
    total: 3,
    hasMore: true,
  });
});

test("createApiPaginationWindow returns the requested page window", () => {
  assert.deepEqual(createApiPaginationWindow(["a", "b", "c"], { page: 2, pageSize: 2, defaultPageSize: 10 }), {
    items: ["c"],
    page: 2,
    pageSize: 2,
    total: 3,
    hasMore: false,
  });
});

test("createApiPaginationWindow normalizes invalid input and clamps maximum page size", () => {
  assert.deepEqual(
    createApiPaginationWindow(["a", "b", "c", "d"], {
      page: 0,
      pageSize: 50,
      defaultPageSize: 10,
      maxPageSize: 2,
    }),
    {
      items: ["a", "b"],
      page: 1,
      pageSize: 2,
      total: 4,
      hasMore: true,
    },
  );
});
