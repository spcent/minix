import { createWechatAppBridge } from "@minix/platform-wechat";

import { ensureNovelWechatRuntime } from "./runtime";

export const novelWechatApp = createWechatAppBridge({
  loadRuntime: ensureNovelWechatRuntime,
  globalData: {
    appName: "MiniX Novel Wechat",
  },
});
