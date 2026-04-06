import { createWechatAppBridge } from "@minix/platform-wechat";

import { ensureHostWechatRuntime } from "./runtime";

export const hostWechatApp = createWechatAppBridge({
  loadRuntime: ensureHostWechatRuntime,
  globalData: {
    appName: "MiniX Host Wechat",
  },
});
