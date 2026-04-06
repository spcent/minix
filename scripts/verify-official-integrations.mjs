import assert from "node:assert/strict";
import { spawn } from "node:child_process";

import * as core from "../packages/core/src/index.ts";
import * as platformH5 from "../packages/platform-h5/src/index.ts";
import * as platformWechat from "../packages/platform-wechat/src/index.ts";

import * as hostH5App from "../apps/host-h5/src/manifest/app.manifest";
import * as hostWechatApp from "../apps/host-wechat/src/manifest/app.manifest";
import * as novelH5App from "../apps/novel-h5/src/manifest/app.manifest";
import * as novelWechatApp from "../apps/novel-wechat/src/manifest/app.manifest";

function resolveModule(namespace) {
  return namespace.default ?? namespace["module.exports"] ?? namespace;
}

const { createAppKernel, createRouteMapper } = resolveModule(core);
const {
  createH5AuthAdapter,
  createH5RequestAdapter,
  createH5RouterAdapter,
  createH5StorageAdapter,
  createH5UiAdapter,
} = resolveModule(platformH5);
const {
  createWechatAuthAdapter,
  createWechatRequestAdapter,
  createWechatRouterAdapter,
  createWechatStorageAdapter,
  createWechatUiAdapter,
} = resolveModule(platformWechat);
const { createHostH5Runtime, hostH5Manifest } = resolveModule(hostH5App);
const { createHostWechatRuntime, hostWechatManifest } = resolveModule(hostWechatApp);
const { createNovelH5Runtime, novelH5Manifest } = resolveModule(novelH5App);
const { createNovelWechatRuntime, novelWechatManifest } = resolveModule(novelWechatApp);

const repoRoot = process.cwd();
const apiBaseUrl = process.env.MINIX_API_BASE_URL ?? "http://127.0.0.1:3000";

function createMemoryWebStorage() {
  const values = new Map();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function createH5HistoryHarness() {
  const location = {
    pathname: "/",
    search: "",
  };

  const history = {
    state: null,
    pushState(state, _title, url) {
      const next = new URL(url, "http://localhost");
      history.state = state ?? null;
      location.pathname = next.pathname;
      location.search = next.search;
    },
    replaceState(state, _title, url) {
      const next = new URL(url, "http://localhost");
      history.state = state ?? null;
      location.pathname = next.pathname;
      location.search = next.search;
    },
    go() {},
  };

  return { history, location };
}

function installGlobalLocation(location) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: location,
  });

  return () => {
    if (original) {
      Object.defineProperty(globalThis, "location", original);
      return;
    }

    delete globalThis.location;
  };
}

function createWechatRuntimeHarness() {
  const storage = new Map();
  let currentUrl = "";

  function withQuery(url) {
    return new URL(url, apiBaseUrl).toString();
  }

  return {
    runtime: {
      login(options) {
        options?.success?.({ code: "wechat-code" });
      },
      request(options) {
        const controller = new AbortController();
        let timeoutId;
        if (options.timeout !== undefined) {
          timeoutId = setTimeout(() => controller.abort(), options.timeout);
        }

        fetch(withQuery(options.url), {
          method: options.method ?? "GET",
          headers: {
            Accept: "application/json",
            ...(options.data === undefined ? {} : { "Content-Type": "application/json" }),
            ...(options.header ?? {}),
          },
          body: options.data === undefined ? undefined : JSON.stringify(options.data),
          signal: controller.signal,
        })
          .then(async (response) => {
            const data = await response.json().catch(() => undefined);
            options.success?.({
              statusCode: response.status,
              header: Object.fromEntries(response.headers.entries()),
              data,
            });
          })
          .catch((error) => {
            options.fail?.(error);
          })
          .finally(() => {
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId);
            }
          });

        return {
          abort() {
            controller.abort();
          },
        };
      },
      getStorage(options) {
        options.success?.({
          data: storage.get(options.key),
        });
      },
      setStorage(options) {
        storage.set(options.key, options.data);
        options.success?.();
      },
      removeStorage(options) {
        storage.delete(options.key);
        options.success?.();
      },
      clearStorage(options) {
        storage.clear();
        options.success?.();
      },
      navigateTo(options) {
        currentUrl = options.url;
        options.success?.();
      },
      redirectTo(options) {
        currentUrl = options.url;
        options.success?.();
      },
      navigateBack(options) {
        options.success?.();
      },
      showToast() {},
      showLoading() {},
      hideLoading() {},
      showModal(options) {
        options.success?.({ confirm: true });
      },
    },
    getCurrentUrl() {
      return currentUrl;
    },
  };
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function waitForApi(url, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`timed out waiting for api at ${url}`);
}

async function expectOk(resultPromise, label) {
  const result = await resultPromise;
  assert.equal(result?.ok, true, label);
  return result;
}

async function createH5Runtime(manifest, createRuntime, appId, appName) {
  const webStorage = createMemoryWebStorage();
  const { history, location } = createH5HistoryHarness();
  const restoreLocation = installGlobalLocation(location);

  const kernel = createAppKernel({
    env: {
      appId,
      appName,
      platform: "h5",
      apiBaseUrl,
      debug: false,
      version: "0.1.0",
    },
    features: manifest.features,
    routeMapper: createRouteMapper(manifest.routes),
    adapters: {
      request: createH5RequestAdapter({ fetcher: globalThis.fetch }),
      storage: createH5StorageAdapter(webStorage),
      auth: createH5AuthAdapter(),
      router: createH5RouterAdapter(history),
      ui: createH5UiAdapter({ confirm: () => true }),
    },
  });

  return {
    runtime: createRuntime(kernel),
    restore() {
      restoreLocation();
    },
  };
}

function createWechatRuntime(manifest, createRuntime, appId, appName) {
  const harness = createWechatRuntimeHarness();
  const kernel = createAppKernel({
    env: {
      appId,
      appName,
      platform: "wechat",
      apiBaseUrl,
      debug: false,
      version: "0.1.0",
    },
    features: manifest.features,
    routeMapper: createRouteMapper(manifest.routes),
    adapters: {
      request: createWechatRequestAdapter(harness.runtime),
      storage: createWechatStorageAdapter(harness.runtime),
      auth: createWechatAuthAdapter(harness.runtime),
      router: createWechatRouterAdapter(harness.runtime),
      ui: createWechatUiAdapter(harness.runtime),
    },
  });

  return {
    runtime: createRuntime(kernel),
    getCurrentUrl: harness.getCurrentUrl,
  };
}

async function runHostH5Integration() {
  const { runtime, restore } = await createH5Runtime(
    hostH5Manifest,
    createHostH5Runtime,
    "host-h5",
    "MiniX Host H5",
  );

  try {
    console.log("host-h5: login");
    await expectOk(runtime.pages.login.submitLogin(), "host-h5 login should succeed");
    console.log("host-h5: items.loadInitial");
    await expectOk(runtime.pages.items.loadInitial(), "host-h5 items should load");
    const itemsState = runtime.pages.items.store.getState();
    assert.ok(itemsState.items.length > 0, "host-h5 should render protected items");

    const firstItemId = itemsState.items[0]?.id;
    assert.ok(firstItemId, "host-h5 should have a selectable item");
    console.log("host-h5: items.toggleItemCompletion");
    await expectOk(runtime.pages.items.toggleItemCompletion(firstItemId), "host-h5 should persist item progress");
    assert.ok(
      runtime.pages.items.store.getState().completedItemIds.includes(firstItemId),
      "host-h5 progress should update after completion",
    );

    console.log("host-h5: settings.ensureAuthenticated");
    await expectOk(runtime.pages.settings.ensureAuthenticated(), "host-h5 settings should keep the authenticated session");
    console.log("host-h5: settings.logout");
    await expectOk(runtime.pages.settings.logout(), "host-h5 logout should clear the session");
    const session = await runtime.kernel.session.get();
    assert.equal(session.ok, true);
    assert.equal(session.value, null, "host-h5 session should be empty after logout");
  } finally {
    restore();
  }
}

async function runHostWechatIntegration() {
  const { runtime, getCurrentUrl } = createWechatRuntime(
    hostWechatManifest,
    createHostWechatRuntime,
    "host-wechat",
    "MiniX Host Wechat",
  );

  console.log("host-wechat: login");
  await expectOk(runtime.pages.login.submitLogin(), "host-wechat login should succeed");
  console.log("host-wechat: items.loadInitial");
  await expectOk(runtime.pages.items.loadInitial(), "host-wechat items should load");
  assert.ok(runtime.pages.items.store.getState().items.length > 0, "host-wechat should load protected items");
  console.log("host-wechat: settings.ensureAuthenticated");
  await expectOk(runtime.pages.settings.ensureAuthenticated(), "host-wechat settings should keep the authenticated session");
  console.log("host-wechat: settings.logout");
  await expectOk(runtime.pages.settings.logout(), "host-wechat logout should clear the session");
  assert.match(getCurrentUrl(), /pages\/login\/index/, "host-wechat should route back to login after logout");
}

async function runNovelH5Integration() {
  const { runtime, restore } = await createH5Runtime(
    novelH5Manifest,
    createNovelH5Runtime,
    "novel-h5",
    "MiniX Novel H5",
  );

  try {
    const catalogRouteId = novelH5Manifest.pageDefinitions.catalog.routeId;
    const readerRouteId = novelH5Manifest.pageDefinitions.reader.routeId;
    const detailRouteId = novelH5Manifest.pageDefinitions.novelDetail.routeId;
    const membershipRouteId = novelH5Manifest.pageDefinitions.membership.routeId;

    console.log("novel-h5: login");
    await expectOk(runtime.pages.login.submitLogin(), "novel-h5 login should succeed");

    console.log("novel-h5: catalog.loadInitial");
    await expectOk(runtime.kernel.router.toRoute(catalogRouteId), "novel-h5 should route to catalog");
    await expectOk(runtime.pages.catalog.loadInitial(), "novel-h5 catalog should load");
    assert.ok(runtime.pages.catalog.store.getState().items.length > 0, "novel-h5 catalog should contain titles");

    console.log("novel-h5: reader.load");
    await expectOk(
      runtime.kernel.router.toRoute(readerRouteId, {
        novelId: "novel_lantern",
        chapterId: "lantern_ch_03",
      }),
      "novel-h5 should route to reader",
    );
    await expectOk(runtime.pages.reader.load(), "novel-h5 reader should load");
    console.log("novel-h5: reader.saveProgress");
    await expectOk(runtime.pages.reader.saveProgress(0.66), "novel-h5 reader progress should save");

    console.log("novel-h5: novelDetail.load");
    await expectOk(
      runtime.kernel.router.toRoute(detailRouteId, {
        novelId: "novel_lantern",
      }),
      "novel-h5 should route to detail",
    );
    await expectOk(runtime.pages.novelDetail.load(), "novel-h5 detail should load");
    assert.equal(
      runtime.pages.novelDetail.store.getState().detail?.continueChapterId,
      "lantern_ch_03",
      "novel-h5 detail should reflect saved reader progress",
    );

    console.log("novel-h5: membership.load");
    await expectOk(
      runtime.kernel.router.toRoute(membershipRouteId, {
        source: "detail",
        novelId: "novel_brocade",
        chapterId: "brocade_ch_03",
      }),
      "novel-h5 should route to membership",
    );
    await expectOk(runtime.pages.membership.load(), "novel-h5 membership should load");
    assert.equal(runtime.pages.membership.store.getState().overview?.active, false, "novel-h5 should start locked");
    console.log("novel-h5: membership.purchaseMembership");
    await expectOk(
      runtime.pages.membership.purchaseMembership("quarterly"),
      "novel-h5 membership purchase should unlock access",
    );
    assert.equal(runtime.pages.membership.store.getState().overview?.active, true, "novel-h5 should unlock after purchase");
  } finally {
    restore();
  }
}

async function runNovelWechatIntegration() {
  const { runtime, getCurrentUrl } = createWechatRuntime(
    novelWechatManifest,
    createNovelWechatRuntime,
    "novel-wechat",
    "MiniX Novel Wechat",
  );

  const catalogRouteId = novelWechatManifest.pageDefinitions.catalog.routeId;
  const bookshelfRouteId = novelWechatManifest.pageDefinitions.bookshelf.routeId;
  const membershipRouteId = novelWechatManifest.pageDefinitions.membership.routeId;

  console.log("novel-wechat: login");
  await expectOk(runtime.pages.login.submitLogin(), "novel-wechat login should succeed");
  console.log("novel-wechat: catalog.loadInitial");
  await expectOk(runtime.kernel.router.toRoute(catalogRouteId), "novel-wechat should route to catalog");
  await expectOk(runtime.pages.catalog.loadInitial(), "novel-wechat catalog should load");
  assert.ok(runtime.pages.catalog.store.getState().items.length > 0, "novel-wechat catalog should contain titles");

  console.log("novel-wechat: bookshelf.load");
  await expectOk(runtime.kernel.router.toRoute(bookshelfRouteId), "novel-wechat should route to bookshelf");
  await expectOk(runtime.pages.bookshelf.load(), "novel-wechat bookshelf should load");
  assert.ok(runtime.pages.bookshelf.store.getState().items.length > 0, "novel-wechat bookshelf should load persisted titles");
  runtime.pages.bookshelf.pinNovel("novel_lantern");
  assert.equal(
    runtime.pages.bookshelf.store.getState().pinnedNovelId,
    "novel_lantern",
    "novel-wechat shelf interactions should update local state",
  );

  console.log("novel-wechat: membership.load");
  await expectOk(
    runtime.kernel.router.toRoute(membershipRouteId, {
      source: "toc",
      novelId: "novel_brocade",
      chapterId: "brocade_ch_03",
    }),
    "novel-wechat should route to membership",
  );
  await expectOk(runtime.pages.membership.load(), "novel-wechat membership should load");
  console.log("novel-wechat: membership.purchaseMembership");
  await expectOk(
    runtime.pages.membership.purchaseMembership("monthly"),
    "novel-wechat membership purchase should unlock access",
  );
  assert.equal(runtime.pages.membership.store.getState().overview?.active, true, "novel-wechat should unlock after purchase");
  console.log("novel-wechat: membership.continueAfterPurchase");
  await expectOk(runtime.pages.membership.continueAfterPurchase(), "novel-wechat should resolve the return route");
  assert.match(getCurrentUrl(), /pages\/toc\/index/, "novel-wechat should route back to the directory after purchase");
}

async function main() {
  const apiProcess = spawn("node", ["--import", "tsx", "apps/api/src/server.ts"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });

  try {
    await waitForApi(`${apiBaseUrl}/`);
    await runHostH5Integration();
    console.log("integration passed: host-h5");
    await runHostWechatIntegration();
    console.log("integration passed: host-wechat");
    await runNovelH5Integration();
    console.log("integration passed: novel-h5");
    await runNovelWechatIntegration();
    console.log("integration passed: novel-wechat");
    await run("node", ["scripts/smoke-official-samples.mjs"]);
    console.log(`official host integrations passed against ${apiBaseUrl}`);
  } finally {
    if (!apiProcess.killed) {
      apiProcess.kill("SIGINT");
    }
    await new Promise((resolve) => {
      if (apiProcess.exitCode !== null) {
        resolve();
        return;
      }

      apiProcess.once("exit", resolve);
    });
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
