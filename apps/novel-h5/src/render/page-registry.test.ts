import assert from "node:assert/strict";
import test from "node:test";

import { createStore } from "@minix/core";

import type { NovelH5Runtime } from "../manifest/app.manifest";
import { activateNovelH5Page, resolveNovelH5PageKey, subscribeNovelH5Pages } from "./page-registry";

test("resolveNovelH5PageKey resolves known routes and falls back to home", () => {
  assert.equal(resolveNovelH5PageKey("/"), "home");
  assert.equal(resolveNovelH5PageKey("/login"), "login");
  assert.equal(resolveNovelH5PageKey("/books"), "catalog");
  assert.equal(resolveNovelH5PageKey("/discover"), "feed");
  assert.equal(resolveNovelH5PageKey("/account"), "account");
  assert.equal(resolveNovelH5PageKey("/feedback"), "feedback");
  assert.equal(resolveNovelH5PageKey("/media-tools"), "mediaTools");
  assert.equal(resolveNovelH5PageKey("/novel/detail"), "novelDetail");
  assert.equal(resolveNovelH5PageKey("/novel/toc"), "toc");
  assert.equal(resolveNovelH5PageKey("/reader"), "reader");
  assert.equal(resolveNovelH5PageKey("/bookshelf"), "bookshelf");
  assert.equal(resolveNovelH5PageKey("/membership"), "membership");
  assert.equal(resolveNovelH5PageKey("/preferences"), "settings");
  assert.equal(resolveNovelH5PageKey("/unknown"), "home");
});

test("activateNovelH5Page calls onShow when the entry exposes it", async () => {
  let called = 0;

  await activateNovelH5Page({
    controller: {},
    async onShow() {
      called += 1;
    },
  } as unknown as ReturnType<NovelH5Runtime["registry"]["login"]["createEntry"]>);

  assert.equal(called, 1);
});

test("subscribeNovelH5Pages subscribes every store-backed page", () => {
  let calls = 0;

  const runtime = {
    pages: {
      home: { store: createStore({ ready: false }) },
      login: { store: createStore({ ready: false }) },
      catalog: { store: createStore({ ready: false }) },
      feed: { store: createStore({ ready: false }) },
      account: { store: createStore({ ready: false }) },
      feedback: { store: createStore({ ready: false }) },
      mediaTools: { store: createStore({ ready: false }) },
      novelDetail: { store: createStore({ ready: false }) },
      toc: { store: createStore({ ready: false }) },
      reader: { store: createStore({ ready: false }) },
      bookshelf: { store: createStore({ ready: false }) },
      membership: { store: createStore({ ready: false }) },
      settings: { store: createStore({ ready: false }) },
    },
  } as unknown as NovelH5Runtime;

  const cleanups = subscribeNovelH5Pages(runtime, () => {
    calls += 1;
  });

  runtime.pages.home.store.replaceState(runtime.pages.home.store.getState());
  runtime.pages.login.store.replaceState(runtime.pages.login.store.getState());
  runtime.pages.catalog.store.replaceState(runtime.pages.catalog.store.getState());
  runtime.pages.feed.store.replaceState(runtime.pages.feed.store.getState());
  runtime.pages.account.store.replaceState(runtime.pages.account.store.getState());
  runtime.pages.feedback.store.replaceState(runtime.pages.feedback.store.getState());
  runtime.pages.mediaTools.store.replaceState(runtime.pages.mediaTools.store.getState());
  runtime.pages.novelDetail.store.replaceState(runtime.pages.novelDetail.store.getState());
  runtime.pages.toc.store.replaceState(runtime.pages.toc.store.getState());
  runtime.pages.reader.store.replaceState(runtime.pages.reader.store.getState());
  runtime.pages.bookshelf.store.replaceState(runtime.pages.bookshelf.store.getState());
  runtime.pages.membership.store.replaceState(runtime.pages.membership.store.getState());
  runtime.pages.settings.store.replaceState(runtime.pages.settings.store.getState());

  assert.equal(cleanups.length, 13);
  assert.equal(calls, 13);

  cleanups.forEach((cleanup) => cleanup());
});
