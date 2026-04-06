import test from "node:test";
import assert from "node:assert/strict";

import { createHostWechatMockApiAdapter } from "../bootstrap/mock-api";

interface MockLoginResponse {
  userId: string;
  accessToken: string;
}

interface MockItemsResponse {
  items: Array<{ id: string; title: string; subtitle: string }>;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

test("mock api exchanges login code for a host session", async () => {
  const adapter = createHostWechatMockApiAdapter();
  const result = await adapter.request<MockLoginResponse>({
    url: "https://mock.minix.local/auth/login",
    method: "POST",
    body: {
      platform: "wechat",
      credential: {
        code: "wx-code",
      },
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.status, 200);
    assert.equal(result.value.data.userId, "host-user");
    assert.equal(result.value.data.accessToken, "mock-access-token");
  }
});

test("mock api protects items behind Authorization header", async () => {
  const adapter = createHostWechatMockApiAdapter();
  const unauthorized = await adapter.request<{ code: string; message: string }>({
    url: "https://mock.minix.local/items",
    method: "GET",
  });

  assert.equal(unauthorized.ok, true);
  if (unauthorized.ok) {
    assert.equal(unauthorized.value.status, 401);
  }

  const authorized = await adapter.request<MockItemsResponse>({
    url: "https://mock.minix.local/items",
    method: "GET",
    headers: {
      Authorization: "Bearer mock-access-token",
    },
    query: {
      page: 2,
      pageSize: 2,
    },
  });

  assert.equal(authorized.ok, true);
  if (authorized.ok) {
    assert.equal(authorized.value.status, 200);
    assert.equal(Array.isArray(authorized.value.data.items), true);
    assert.equal(authorized.value.data.page, 2);
    assert.equal(authorized.value.data.hasMore, true);
  }
});
