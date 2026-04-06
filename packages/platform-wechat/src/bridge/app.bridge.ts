export interface WechatAppBridgeConfig<TRuntime> {
  loadRuntime: () => Promise<TRuntime>;
  globalData?: Record<string, unknown>;
  onLaunch?: (runtime: TRuntime, options?: unknown) => unknown | Promise<unknown>;
  onShow?: (runtime: TRuntime, options?: unknown) => unknown | Promise<unknown>;
  onHide?: (runtime: TRuntime) => unknown | Promise<unknown>;
}

export interface WechatAppConfig {
  globalData?: Record<string, unknown>;
  onLaunch?: (options?: unknown) => void | Promise<void>;
  onShow?: (options?: unknown) => void | Promise<void>;
  onHide?: () => void | Promise<void>;
}

function registerWechatApp(config: WechatAppConfig): void {
  const maybeApp = (globalThis as typeof globalThis & {
    App?: (options: WechatAppConfig) => void;
  }).App;

  maybeApp?.(config);
}

export function createWechatAppBridge<TRuntime>(
  options: WechatAppBridgeConfig<TRuntime>,
): WechatAppConfig {
  const config: WechatAppConfig = {
    ...(options.globalData ? { globalData: options.globalData } : {}),

    async onLaunch(payload) {
      const runtime = await options.loadRuntime();
      await options.onLaunch?.(runtime, payload);
    },

    async onShow(payload) {
      const runtime = await options.loadRuntime();
      await options.onShow?.(runtime, payload);
    },

    async onHide() {
      const runtime = await options.loadRuntime();
      await options.onHide?.(runtime);
    },
  };

  registerWechatApp(config);
  return config;
}
