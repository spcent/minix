import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type AppKernel, type SettingsPageModel } from "@minix/core";
import { createDefaultAccountState, accountFeatureManifest } from "@minix/feature-account";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { createDefaultFeedbackState, feedbackFeatureManifest } from "@minix/feature-feedback";
import { createDefaultFeedState, feedFeatureManifest } from "@minix/feature-feed";
import { createDefaultItemsPageModel, itemsFeatureManifest } from "@minix/feature-items";
import { createDefaultMediaToolsState, mediaToolsFeatureManifest } from "@minix/feature-media-tools";
import { createDefaultMessagesState, messagesFeatureManifest } from "@minix/feature-messages";
import { settingsFeatureManifest } from "@minix/feature-settings";
import { createInitialSubscriptionState, subscriptionFeatureManifest } from "@minix/feature-subscription";

async function reportWechatAuthError(kernel: AppKernel, message: string) {
  await kernel.ui.toast({
    title: message,
    icon: "error",
  });
}

function createMinuteEnglishSettingsPageModel(): SettingsPageModel {
  return {
    title: "Learning Preferences",
    sections: [
      {
        key: "study-profile",
        title: "Study Profile",
        items: [
          {
            key: "level",
            label: "Level",
            type: "text",
            value: "A2 to B1",
          },
          {
            key: "goal",
            label: "Goal",
            type: "text",
            value: "Speak confidently in daily situations",
          },
          {
            key: "plan",
            label: "Plan",
            type: "text",
            value: "10 minutes every weekday",
          },
          {
            key: "focus",
            label: "Focus",
            type: "text",
            value: "Vocabulary, listening, and speaking",
          },
        ],
      },
      {
        key: "account",
        title: "Account",
        items: [
          {
            key: "session",
            label: "Session",
            type: "text",
            value: "Protected pages unlock after sign-in on this device",
          },
          {
            key: "progress",
            label: "Progress",
            type: "text",
            value: "Saved on this device and restored when you return",
          },
        ],
      },
    ],
  };
}

export const hostWechatFeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

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
    pageData: {
      ...createInitialAuthPageState("wechat"),
      selectedLoginMethod: "phone_code",
      noticeMessage: "Upgrade a guest session with phone verification or password credentials.",
    },
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: {
      name: "authenticated-identity-upgrade",
      requirements: {
        authenticated: true,
      },
    },
    featureConfig: {
      surface: "identity-upgrade",
    },
    miniprogramPage: "pages/identityUpgrade/index",
    registrationModule: "../../../src/registrations/wechat/pages/identityUpgrade",
    navigationBarTitleText: "Upgrade Account",
    shellTemplate: "generic",
    shellStyle: "generic",
  },
  identityBindPhone: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityBindPhone,
    routePath: "/pages/identityBindPhone/index",
    pageData: {
      ...createInitialAuthPageState("wechat"),
      selectedLoginMethod: "phone_code",
      noticeMessage: "Bind a verified phone to the current WeChat account and resolve merge conflicts before completion.",
    },
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: {
      name: "authenticated-identity-bind-phone",
      requirements: {
        authenticated: true,
      },
    },
    featureConfig: {
      surface: "identity-bind-phone",
    },
    miniprogramPage: "pages/identityBindPhone/index",
    registrationModule: "../../../src/registrations/wechat/pages/identityBindPhone",
    navigationBarTitleText: "Bind Phone",
    shellTemplate: "generic",
    shellStyle: "generic",
  },
  identityMerge: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityMerge,
    routePath: "/pages/identityMerge/index",
    pageData: {
      ...createInitialAuthPageState("wechat"),
      noticeMessage: "Review account merge impact, confirm explicitly, or cancel without changing account data.",
    },
    controller: {
      successRouteId: APP_ROUTE_IDS.settings,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportWechatAuthError,
    },
    guardPolicy: {
      name: "authenticated-identity-merge",
      requirements: {
        authenticated: true,
      },
    },
    featureConfig: {
      surface: "identity-merge",
    },
    miniprogramPage: "pages/identityMerge/index",
    registrationModule: "../../../src/registrations/wechat/pages/identityMerge",
    navigationBarTitleText: "Merge Accounts",
    shellTemplate: "generic",
    shellStyle: "generic",
  },
  overview: {
    feature: itemsFeatureManifest,
    routeId: APP_ROUTE_IDS.overview,
    routePath: "/pages/overview/index",
    pageData: createDefaultItemsPageModel({
      title: "Your Daily English Overview",
      pageSize: 3,
      emptyText: "No overview tasks yet. Please come back later.",
      featuredReason: "Start with overview to understand today's focus before opening the full lesson plan.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "overview",
    },
    guardPolicy: {
      name: "authenticated-overview",
      requirements: {
        authenticated: true,
      },
    },
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
    pageData: createDefaultItemsPageModel({
      title: "Today's English Practice",
      pageSize: 6,
      emptyText: "No lesson tasks yet. Please come back later.",
      featuredReason: "Today's plan is balanced to move from vocabulary to listening and then active speaking.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      overviewRouteId: APP_ROUTE_IDS.overview,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "plan",
    },
    guardPolicy: {
      name: "authenticated-plan",
      requirements: {
        authenticated: true,
      },
    },
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
    pageData: createDefaultFeedState({
      title: "Search Center",
      subtitle: "Cross-domain search with ranking, hot terms, typo recovery, and filterable result lanes.",
      surface: "search",
      pageSize: 6,
      emptyText: "No discovery results are available yet.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      feedRouteId: APP_ROUTE_IDS.feed,
      detailRouteId: APP_ROUTE_IDS.overview,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "feed",
    },
    guardPolicy: {
      name: "authenticated-feed",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-feedback",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-messages",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-media-tools",
      requirements: {
        authenticated: true,
      },
    },
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
    },
    guardPolicy: {
      name: "authenticated-membership",
      requirements: {
        authenticated: true,
      },
    },
    requiredCapabilities: [{ capability: "payment", required: false }],
    miniprogramPage: "pages/membership/index",
    registrationModule: "../../../src/registrations/wechat/pages/membership",
    navigationBarTitleText: "Commerce Center",
    shellTemplate: "membership-basic",
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
    guardPolicy: {
      name: "authenticated-settings",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-account",
      requirements: {
        authenticated: true,
      },
    },
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
