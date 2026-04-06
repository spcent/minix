import type { Store } from "@minix/core";

export interface WechatPageInstance<TData extends object> {
  setData: (data: Partial<TData>) => void;
  __minixUnsubscribe__?: () => void;
}

export interface WechatPageBridgeEntry<TData extends object> {
  controller: {
    store: Store<TData>;
  };
}

export interface WechatPageBridgeConfig<TData extends object, TEntry extends WechatPageBridgeEntry<TData>> {
  initialData: TData;
  loadEntry: () => Promise<TEntry>;
  onLoad?: (entry: TEntry, page: WechatPageInstance<TData>, query?: Record<string, unknown>) => unknown | Promise<unknown>;
  onShow?: (entry: TEntry, page: WechatPageInstance<TData>) => unknown | Promise<unknown>;
  onHide?: (entry: TEntry, page: WechatPageInstance<TData>) => unknown | Promise<unknown>;
  onUnload?: (entry: TEntry, page: WechatPageInstance<TData>) => unknown | Promise<unknown>;
  onPullDownRefresh?: (entry: TEntry, page: WechatPageInstance<TData>) => unknown | Promise<unknown>;
  onReachBottom?: (entry: TEntry, page: WechatPageInstance<TData>) => unknown | Promise<unknown>;
  methods?: Record<string, (entry: TEntry, page: WechatPageInstance<TData>, ...args: unknown[]) => unknown | Promise<unknown>>;
}

export interface WechatPageConfig<TData extends object> {
  data: TData;
  onLoad?: (query?: Record<string, unknown>) => void | Promise<void>;
  onShow?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onPullDownRefresh?: () => void | Promise<void>;
  onReachBottom?: () => void | Promise<void>;
  [key: string]: unknown;
}

function registerWechatPage<TData extends object>(config: WechatPageConfig<TData>): void {
  const maybePage = (globalThis as typeof globalThis & {
    Page?: (options: WechatPageConfig<TData>) => void;
  }).Page;

  maybePage?.(config);
}

async function bindStore<TData extends object, TEntry extends WechatPageBridgeEntry<TData>>(
  page: WechatPageInstance<TData>,
  entry: TEntry,
): Promise<void> {
  page.__minixUnsubscribe__?.();
  page.setData(entry.controller.store.getState());
  page.__minixUnsubscribe__ = entry.controller.store.subscribe((state) => {
    page.setData(state);
  });
}

export function createWechatPageBridge<TData extends object, TEntry extends WechatPageBridgeEntry<TData>>(
  options: WechatPageBridgeConfig<TData, TEntry>,
): WechatPageConfig<TData> {
  let entryPromise: Promise<TEntry> | null = null;

  async function getEntry(): Promise<TEntry> {
    if (!entryPromise) {
      entryPromise = options.loadEntry();
    }

    return entryPromise;
  }

  const config: WechatPageConfig<TData> = {
    data: options.initialData,

    async onLoad(this: WechatPageInstance<TData>, query?: Record<string, unknown>) {
      const entry = await getEntry();
      await bindStore(this, entry);
      await options.onLoad?.(entry, this, query);
    },

    async onShow(this: WechatPageInstance<TData>) {
      const entry = await getEntry();
      await bindStore(this, entry);
      await options.onShow?.(entry, this);
    },

    async onHide(this: WechatPageInstance<TData>) {
      const entry = await getEntry();
      await options.onHide?.(entry, this);
    },

    async onUnload(this: WechatPageInstance<TData>) {
      const entry = await getEntry();
      pageCleanup(this);
      await options.onUnload?.(entry, this);
    },

    async onPullDownRefresh(this: WechatPageInstance<TData>) {
      const entry = await getEntry();
      await options.onPullDownRefresh?.(entry, this);
    },

    async onReachBottom(this: WechatPageInstance<TData>) {
      const entry = await getEntry();
      await options.onReachBottom?.(entry, this);
    },
  };

  for (const [name, handler] of Object.entries(options.methods ?? {})) {
    config[name] = async function bridgeMethod(this: WechatPageInstance<TData>, ...args: unknown[]) {
      const entry = await getEntry();
      await bindStore(this, entry);
      return handler(entry, this, ...args);
    };
  }

  registerWechatPage(config);
  return config;
}

function pageCleanup<TData extends object>(page: WechatPageInstance<TData>): void {
  page.__minixUnsubscribe__?.();
  delete page.__minixUnsubscribe__;
}
