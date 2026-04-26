import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeApiActorContext,
  normalizeApiAuthRedirectTarget,
  normalizeApiContextSnapshots,
  normalizeApiSourceContext,
  pickDefinedApiFields,
} from "./schema-helpers";

test("api schema normalizers omit undefined optional fields", () => {
  assert.deepEqual(
    normalizeApiSourceContext({
      pagePath: "/feedback",
      routeId: undefined,
      label: "Feedback",
      params: undefined,
    }),
    {
      pagePath: "/feedback",
      label: "Feedback",
    },
  );

  assert.deepEqual(
    normalizeApiActorContext({
      userId: "user_1",
      platform: undefined,
      appVersion: "1.0.0",
      deviceSummary: undefined,
    }),
    {
      userId: "user_1",
      appVersion: "1.0.0",
    },
  );
});

test("api redirect normalizer preserves explicit false flags", () => {
  assert.deepEqual(
    normalizeApiAuthRedirectTarget({
      routeId: "auth.login",
      path: undefined,
      params: { next: "/account" },
      source: undefined,
      label: "Sign in",
      reason: "auth-required",
      forceReauth: false,
    }),
    {
      routeId: "auth.login",
      params: { next: "/account" },
      label: "Sign in",
      reason: "auth-required",
      forceReauth: false,
    },
  );
});

test("api schema normalizers preserve undefined objects", () => {
  assert.equal(normalizeApiSourceContext(undefined), undefined);
  assert.equal(normalizeApiActorContext(undefined), undefined);
  assert.equal(normalizeApiAuthRedirectTarget(undefined), undefined);
  assert.deepEqual(normalizeApiContextSnapshots(undefined), {});
  assert.deepEqual(normalizeApiContextSnapshots({}), {});
});

test("api context snapshot normalizer returns only defined normalized fields", () => {
  assert.deepEqual(
    normalizeApiContextSnapshots({
      sourceContext: {
        pagePath: "/messages",
        routeId: undefined,
        label: "Messages",
        params: { threadId: "thread_1" },
      },
      actorContext: {
        userId: "user_1",
        platform: "h5",
        appVersion: undefined,
        deviceSummary: undefined,
      },
    }),
    {
      sourceContext: {
        pagePath: "/messages",
        label: "Messages",
        params: { threadId: "thread_1" },
      },
      actorContext: {
        userId: "user_1",
        platform: "h5",
      },
    },
  );
});

test("pickDefinedApiFields preserves falsy defined request values", () => {
  const picked = pickDefinedApiFields(
    {
      page: 0,
      keyword: "",
      onlyUnread: false,
      missing: undefined as string | undefined,
    },
    ["page", "keyword", "onlyUnread", "missing"] as const,
  );

  assert.deepEqual(picked, {
    page: 0,
    keyword: "",
    onlyUnread: false,
  });
});
