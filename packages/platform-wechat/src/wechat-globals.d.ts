declare global {
  interface WechatAppOptions {
    path?: string;
    query?: Record<string, unknown>;
    scene?: number;
    shareTicket?: string;
    referrerInfo?: Record<string, unknown>;
  }

  interface WechatPageOptions {
    [key: string]: unknown;
  }

  interface WechatAppRegistration {
    globalData?: Record<string, unknown>;
    onLaunch?: (options?: WechatAppOptions) => void | Promise<void>;
    onShow?: (options?: WechatAppOptions) => void | Promise<void>;
    onHide?: () => void | Promise<void>;
  }

  interface WechatPageRegistration<TData extends object = Record<string, unknown>> {
    data: TData;
    onLoad?: (query?: WechatPageOptions) => void | Promise<void>;
    onShow?: () => void | Promise<void>;
    onHide?: () => void | Promise<void>;
    onUnload?: () => void | Promise<void>;
    onPullDownRefresh?: () => void | Promise<void>;
    onReachBottom?: () => void | Promise<void>;
    [key: string]: unknown;
  }

  interface WechatRuntime {
    login?: (options: {
      success?: (response: { code?: string }) => void;
      fail?: (error: unknown) => void;
    }) => void;
    request?: (options: {
      url: string;
      method?: string;
      header?: Record<string, string>;
      data?: unknown;
      timeout?: number;
      success?: (response: {
        statusCode: number;
        header?: Record<string, string>;
        data: unknown;
      }) => void;
      fail?: (error: unknown) => void;
    }) => void;
    getStorage?: (options: {
      key: string;
      success?: (response: { data: unknown }) => void;
      fail?: (error: unknown) => void;
    }) => void;
    setStorage?: (options: {
      key: string;
      data: unknown;
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    removeStorage?: (options: {
      key: string;
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    clearStorage?: (options: {
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    navigateTo?: (options: {
      url: string;
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    redirectTo?: (options: {
      url: string;
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    navigateBack?: (options: {
      delta?: number;
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
    showToast?: (options: {
      title: string;
      icon?: string;
      duration?: number;
    }) => void;
    showLoading?: (options: {
      title?: string;
    }) => void;
    hideLoading?: () => void;
    showModal?: (options: {
      title?: string;
      content: string;
      confirmText?: string;
      cancelText?: string;
      success?: (response: { confirm: boolean }) => void;
      fail?: (error: unknown) => void;
    }) => void;
  }

  var wx: WechatRuntime | undefined;
  var App: ((options: WechatAppRegistration) => void) | undefined;
  var Page: (<TData extends object = Record<string, unknown>>(options: WechatPageRegistration<TData>) => void) | undefined;
}

export {};
