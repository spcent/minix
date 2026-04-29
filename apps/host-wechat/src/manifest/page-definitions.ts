import { APP_ROUTE_IDS } from "@minix/contracts";
import {
  createAuthenticatedGuardPolicy,
  createWechatShellConfig,
  defineHostFeatureFlags,
  defineHostPageDefinitions,
  loadFeatureFlags,
  type AppKernel,
} from "@minix/core";
import { createDefaultAccountState, accountFeatureManifest } from "@minix/feature-account";
import { authFeatureManifest, createAuthIdentityPageState, createInitialAuthPageState } from "@minix/feature-auth";
import { createDefaultFeedbackState, feedbackFeatureManifest } from "@minix/feature-feedback";
import { createMinuteEnglishSearchFeedState, feedFeatureManifest } from "@minix/feature-feed";
import {
  createMinuteEnglishOverviewPageModel,
  createMinuteEnglishPracticePlanPageModel,
  itemsFeatureManifest,
} from "@minix/feature-items";
import { createDefaultMediaToolsState, mediaToolsFeatureManifest } from "@minix/feature-media-tools";
import { createDefaultMessagesState, messagesFeatureManifest } from "@minix/feature-messages";
import { createMinuteEnglishSettingsPageModel, settingsFeatureManifest } from "@minix/feature-settings";
import { createInitialSubscriptionState, subscriptionFeatureManifest } from "@minix/feature-subscription";

async function reportWechatAuthError(kernel: AppKernel, message: string) {
  await kernel.ui.toast({
    title: message,
    icon: "error",
  });
}

export const hostWechatFeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

function authenticatedPage(name: string) {
  return createAuthenticatedGuardPolicy(`authenticated-${name}`);
}

export const hostWechatPageDefinitions = defineHostPageDefinitions({
  login: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.login,
    routePath: "/pages/login/index",
    pageData: createInitialAuthPageState("wechat"),
    controller: {
      successRouteId: APP_ROUTE_IDS.login,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    miniprogramPage: "pages/login/index",
    registrationModule: "../../../src/registrations/wechat/pages/login",
    navigationBarTitleText: "Home",
    shellTemplate: "login",
    shellStyle: "login",
  },
  identityUpgrade: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityUpgrade,
    routePath: "/pages/identityUpgrade/index",
    pageData: createAuthIdentityPageState("wechat", "identity-upgrade"),
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-upgrade"),
    featureConfig: {
      surface: "identity-upgrade",
    },
    ...createWechatShellConfig({
      page: "identityUpgrade",
      navigationBarTitleText: "Upgrade Account",
      shellTemplate: "generic",
      shellStyle: "generic",
    }),
  },
  identityBindPhone: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityBindPhone,
    routePath: "/pages/identityBindPhone/index",
    pageData: createAuthIdentityPageState("wechat", "identity-bind-phone"),
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-bind-phone"),
    featureConfig: {
      surface: "identity-bind-phone",
    },
    ...createWechatShellConfig({
      page: "identityBindPhone",
      navigationBarTitleText: "Bind Phone",
      shellTemplate: "generic",
      shellStyle: "generic",
    }),
  },
  identityMerge: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityMerge,
    routePath: "/pages/identityMerge/index",
    pageData: createAuthIdentityPageState("wechat", "identity-merge"),
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-merge"),
    featureConfig: {
      surface: "identity-merge",
    },
    ...createWechatShellConfig({
      page: "identityMerge",
      navigationBarTitleText: "Merge Accounts",
      shellTemplate: "generic",
      shellStyle: "generic",
    }),
  },
  overview: {
    feature: itemsFeatureManifest,
    routeId: APP_ROUTE_IDS.overview,
    routePath: "/pages/overview/index",
    pageData: createMinuteEnglishOverviewPageModel(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "overview",
    },
    guardPolicy: authenticatedPage("overview"),
    requiredCapabilities: [{ capability: "device" }],
    featureConfig: {
      landingVariant: "overview",
    },
    miniprogramPage: "pages/overview/index",
    registrationModule: "../../../src/registrations/wechat/pages/overview",
    navigationBarTitleText: "Overview",
    shellTemplate: "overview",
    shellStyle: "overview",
  },
  items: {
    feature: itemsFeatureManifest,
    routeId: APP_ROUTE_IDS.items,
    routePath: "/pages/items/index",
    pageData: createMinuteEnglishPracticePlanPageModel(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      overviewRouteId: APP_ROUTE_IDS.overview,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "plan",
    },
    guardPolicy: authenticatedPage("plan"),
    requiredCapabilities: [{ capability: "device" }],
    featureConfig: {
      experience: "daily-plan",
      showCompletionSummary: true,
    },
    miniprogramPage: "pages/items/index",
    registrationModule: "../../../src/registrations/wechat/pages/items",
    navigationBarTitleText: "Today's Plan",
    enablePullDownRefresh: true,
    shellTemplate: "items",
    shellStyle: "items",
  },
  feed: {
    feature: feedFeatureManifest,
    routeId: APP_ROUTE_IDS.feed,
    routePath: "/pages/feed/index",
    pageData: createMinuteEnglishSearchFeedState(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      feedRouteId: APP_ROUTE_IDS.feed,
      detailRouteId: APP_ROUTE_IDS.overview,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "feed",
    },
    guardPolicy: authenticatedPage("feed"),
    featureConfig: {
      surface: "search",
    },
    miniprogramPage: "pages/feed/index",
    registrationModule: "../../../src/registrations/wechat/pages/feed",
    navigationBarTitleText: "Discover",
    enablePullDownRefresh: true,
    shellTemplate: "feed-basic",
    shellStyle: "generic",
  },
  feedback: {
    feature: feedbackFeatureManifest,
    routeId: APP_ROUTE_IDS.feedback,
    routePath: "/pages/feedback/index",
    pageData: createDefaultFeedbackState({
      title: "Feedback",
      subtitle: "Issue reports, suggestions, complaints, abuse reports, and satisfaction tickets share one reusable ticket model here.",
    }),
    controller: {
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      messagesRouteId: APP_ROUTE_IDS.messages,
      cancelRouteId: APP_ROUTE_IDS.account,
      authRedirectSource: "feedback",
    },
    guardPolicy: authenticatedPage("feedback"),
    featureConfig: {
      surface: "feedback",
      template: "form",
    },
    miniprogramPage: "pages/feedback/index",
    registrationModule: "../../../src/registrations/wechat/pages/feedback",
    navigationBarTitleText: "Feedback",
    shellTemplate: "feedback-basic",
    shellStyle: "generic",
  },
  messages: {
    feature: messagesFeatureManifest,
    routeId: APP_ROUTE_IDS.messages,
    routePath: "/pages/messages/index",
    pageData: createDefaultMessagesState({
      title: "Inbox",
      subtitle: "System notices, business updates, reserved conversation threads, and unread badge state live here.",
      pageSize: 6,
      emptyText: "No inbox activity is available yet.",
    }),
    controller: {
      messagesRouteId: APP_ROUTE_IDS.messages,
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "messages",
    },
    guardPolicy: authenticatedPage("messages"),
    featureConfig: {
      surface: "messages",
    },
    miniprogramPage: "pages/messages/index",
    registrationModule: "../../../src/registrations/wechat/pages/messages",
    navigationBarTitleText: "Inbox",
    enablePullDownRefresh: true,
    shellTemplate: "messages-basic",
    shellStyle: "generic",
  },
  mediaTools: {
    feature: mediaToolsFeatureManifest,
    routeId: APP_ROUTE_IDS.mediaTools,
    routePath: "/pages/mediaTools/index",
    pageData: createDefaultMediaToolsState({
      title: "Media Tools",
      subtitle: "Minimal upload and share workspace proving the shared contracts through capability adapters.",
      primaryActionLabel: "Select Upload Asset",
      secondaryActionLabel: "Dispatch Share Payload",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    guardPolicy: authenticatedPage("media-tools"),
    requiredCapabilities: [
      { capability: "upload", required: false },
      { capability: "share", required: false },
    ],
    featureConfig: {
      surface: "media-tools",
      template: "workspace",
    },
    miniprogramPage: "pages/mediaTools/index",
    registrationModule: "../../../src/registrations/wechat/pages/mediaTools",
    navigationBarTitleText: "Media Tools",
    shellTemplate: "media-tools-basic",
    shellStyle: "generic",
  },
  membership: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.membership,
    routePath: "/pages/membership/index",
    pageData: createInitialSubscriptionState({
      title: "Commerce Center",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.feed,
      membershipRouteId: APP_ROUTE_IDS.membership,
      ordersRouteId: APP_ROUTE_IDS.orders,
    },
    guardPolicy: authenticatedPage("membership"),
    requiredCapabilities: [{ capability: "payment", required: false }],
    miniprogramPage: "pages/membership/index",
    registrationModule: "../../../src/registrations/wechat/pages/membership",
    navigationBarTitleText: "Commerce Center",
    shellTemplate: "membership-basic",
    shellStyle: "generic",
  },
  orders: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.orders,
    routePath: "/pages/orders/index",
    pageData: createInitialSubscriptionState({
      title: "Order Center",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.feed,
      membershipRouteId: APP_ROUTE_IDS.membership,
      ordersRouteId: APP_ROUTE_IDS.orders,
    },
    guardPolicy: authenticatedPage("orders"),
    requiredCapabilities: [{ capability: "payment", required: false }],
    miniprogramPage: "pages/orders/index",
    registrationModule: "../../../src/registrations/wechat/pages/orders",
    navigationBarTitleText: "Order Center",
    shellTemplate: "orders-basic",
    shellStyle: "generic",
  },
  settings: {
    feature: settingsFeatureManifest,
    routeId: APP_ROUTE_IDS.settings,
    routePath: "/pages/settings/index",
    pageData: createMinuteEnglishSettingsPageModel(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      itemsRouteId: APP_ROUTE_IDS.items,
      overviewRouteId: APP_ROUTE_IDS.overview,
      accountRouteId: APP_ROUTE_IDS.account,
      membershipRouteId: APP_ROUTE_IDS.membership,
      ordersRouteId: APP_ROUTE_IDS.orders,
      feedRouteId: APP_ROUTE_IDS.feed,
      messagesRouteId: APP_ROUTE_IDS.messages,
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      mediaToolsRouteId: APP_ROUTE_IDS.mediaTools,
      authRedirectSource: "preferences",
      confirmLogout: {
        title: "Sign out",
        content: "Do you want to pause learning on this device?",
        confirmText: "Sign out",
        cancelText: "Stay here",
      },
      successToast: {
        title: "Signed out",
        icon: "success",
      },
      showErrorToast: true,
    },
    guardPolicy: authenticatedPage("settings"),
    requiredCapabilities: [{ capability: "clipboard" }],
    featureConfig: {
      sectionDensity: "comfortable",
    },
    miniprogramPage: "pages/settings/index",
    registrationModule: "../../../src/registrations/wechat/pages/settings",
    navigationBarTitleText: "Preferences",
    shellTemplate: "settings",
    shellStyle: "settings",
  },
  account: {
    feature: accountFeatureManifest,
    routeId: APP_ROUTE_IDS.account,
    routePath: "/pages/account/index",
    pageData: createDefaultAccountState({
      title: "Account Center",
      subtitle: "Profile, bindings, account placeholders, and support-facing session context.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.overview,
      identityUpgradeRouteId: APP_ROUTE_IDS.identityUpgrade,
      identityBindPhoneRouteId: APP_ROUTE_IDS.identityBindPhone,
      identityMergeRouteId: APP_ROUTE_IDS.identityMerge,
      authRedirectSource: "account",
    },
    guardPolicy: authenticatedPage("account"),
    requiredCapabilities: [{ capability: "clipboard", required: false }],
    featureConfig: {
      surface: "account",
    },
    miniprogramPage: "pages/account/index",
    registrationModule: "../../../src/registrations/wechat/pages/account",
    navigationBarTitleText: "Account",
    enablePullDownRefresh: true,
    shellTemplate: "account-basic",
    shellStyle: "generic",
  },
});
