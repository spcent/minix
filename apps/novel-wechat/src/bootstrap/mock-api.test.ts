import test from "node:test";
import assert from "node:assert/strict";

import { createNovelWechatMockApiAdapter } from "../bootstrap/mock-api";

interface MockLoginResponse {
  userId: string;
  accessToken: string;
}

interface MockNovelListResponse {
  items: Array<{ id: string; title: string; categoryLabel: string }>;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

test("novel wechat mock api exchanges login code for a host session", async () => {
  const adapter = createNovelWechatMockApiAdapter();
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
    assert.equal(result.value.data.userId, "novel-wechat-user");
    assert.equal(result.value.data.accessToken, "mock-novel-wechat-access-token");
  }
});

test("novel wechat mock api protects catalog data behind Authorization header", async () => {
  const adapter = createNovelWechatMockApiAdapter();
  const unauthorized = await adapter.request<{ code: string; message: string }>({
    url: "https://mock.minix.local/novels",
    method: "GET",
  });

  assert.equal(unauthorized.ok, true);
  if (unauthorized.ok) {
    assert.equal(unauthorized.value.status, 401);
  }

  const authorized = await adapter.request<MockNovelListResponse>({
    url: "https://mock.minix.local/novels",
    method: "GET",
    headers: {
      Authorization: "Bearer mock-novel-wechat-access-token",
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
    assert.equal(authorized.value.data.hasMore, false);
    assert.equal(authorized.value.data.items[0]?.title, "Sword Before Dawn");
  }
});

test("novel wechat mock api saves reading progress for the reader flow", async () => {
  const adapter = createNovelWechatMockApiAdapter();
  const result = await adapter.request<{ saved: true; progress: { chapterId: string; progressPercent: number } }>({
    url: "https://mock.minix.local/reading-progress",
    method: "POST",
    headers: {
      Authorization: "Bearer mock-novel-wechat-access-token",
    },
    body: {
      novelId: "novel_lantern",
      chapterId: "lantern_ch_03",
      progressPercent: 0.64,
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.status, 200);
    assert.equal(result.value.data.saved, true);
    assert.equal(result.value.data.progress.chapterId, "lantern_ch_03");
    assert.equal(result.value.data.progress.progressPercent, 0.64);
  }
});

test("novel wechat mock api exposes membership overview for locked flows", async () => {
  const adapter = createNovelWechatMockApiAdapter();
  const result = await adapter.request<{ headline: string; tier: string }>({
    url: "https://mock.minix.local/membership",
    method: "GET",
    headers: {
      Authorization: "Bearer mock-novel-wechat-access-token",
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.status, 200);
    assert.equal(result.value.data.headline, "Membership Center");
    assert.equal(result.value.data.tier, "signed-in");
  }
});
