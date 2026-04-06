import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface RegisteredAppConfig {
  onLaunch?: () => void | Promise<void>;
  onShow?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
  globalData?: Record<string, unknown>;
}

interface RegisteredPageConfig {
  data: Record<string, unknown>;
  onLoad?: () => void | Promise<void>;
  onShow?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onPullDownRefresh?: () => void | Promise<void>;
  onReachBottom?: () => void | Promise<void>;
  [key: string]: unknown;
}

async function importFresh(relativePath: string): Promise<void> {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const moduleUrl = `${pathToFileURL(absolutePath).href}?t=${Date.now()}_${Math.random()}`;
  await import(moduleUrl);
}

test("miniprogram app shell registers a WeChat app config", async () => {
  const appConfigs: RegisteredAppConfig[] = [];
  const globals = globalThis as typeof globalThis & {
    App?: (config: RegisteredAppConfig) => void;
  };

  globals.App = (config) => {
    appConfigs.push(config);
  };

  try {
    await importFresh("apps/host-wechat/miniprogram/app.ts");
  } finally {
    Reflect.deleteProperty(globals, "App");
  }

  assert.equal(appConfigs.length, 1);
  assert.equal(typeof appConfigs[0]?.onLaunch, "function");
  assert.equal(appConfigs[0]?.globalData?.appName, "MiniX Host Wechat");
});

test("miniprogram page shells register home, overview, plan, and preferences pages", async () => {
  const pageConfigs: RegisteredPageConfig[] = [];
  const globals = globalThis as typeof globalThis & {
    Page?: unknown;
  };

  (globals as { Page: (config: RegisteredPageConfig) => void }).Page = (config: RegisteredPageConfig) => {
    pageConfigs.push(config);
  };

  try {
    await importFresh("apps/host-wechat/miniprogram/pages/login/index.ts");
    await importFresh("apps/host-wechat/miniprogram/pages/overview/index.ts");
    await importFresh("apps/host-wechat/miniprogram/pages/items/index.ts");
    await importFresh("apps/host-wechat/miniprogram/pages/settings/index.ts");
  } finally {
    Reflect.deleteProperty(globals, "Page");
  }

  assert.equal(pageConfigs.length, 4);
  assert.equal(typeof pageConfigs[0]?.onShow, "function");
  assert.equal(typeof pageConfigs[0]?.onTapLogin, "function");
  assert.equal(typeof pageConfigs[1]?.onTapPlan, "function");
  assert.equal(typeof pageConfigs[1]?.onTapSettings, "function");
  assert.equal(typeof pageConfigs[2]?.onPullDownRefresh, "function");
  assert.equal(typeof pageConfigs[2]?.onTapSettings, "function");
  assert.equal(typeof pageConfigs[3]?.onTapLogout, "function");
});
