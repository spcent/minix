import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type AppKernel, type SettingsPageModel } from "@minix/core";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { createDefaultItemsPageModel, itemsFeatureManifest } from "@minix/feature-items";
import { settingsFeatureManifest } from "@minix/feature-settings";

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
    pageData: createInitialAuthPageState(),
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
  settings: {
    feature: settingsFeatureManifest,
    routeId: APP_ROUTE_IDS.settings,
    routePath: "/pages/settings/index",
    pageData: createMinuteEnglishSettingsPageModel(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      itemsRouteId: APP_ROUTE_IDS.items,
      overviewRouteId: APP_ROUTE_IDS.overview,
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
});
