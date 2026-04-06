import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type SettingsPageModel } from "@minix/core";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { createDefaultItemsPageModel, itemsFeatureManifest } from "@minix/feature-items";
import { settingsFeatureManifest } from "@minix/feature-settings";

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

export const hostH5FeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
});

export const hostH5PageDefinitions = defineHostPageDefinitions({
  login: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.login,
    routePath: "/",
    pageData: createInitialAuthPageState(),
    controller: {
      successRouteId: APP_ROUTE_IDS.login,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    renderMode: "custom",
  },
  overview: {
    feature: itemsFeatureManifest,
    routeId: APP_ROUTE_IDS.overview,
    routePath: "/overview",
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
    renderMode: "custom",
  },
  items: {
    feature: itemsFeatureManifest,
    routeId: APP_ROUTE_IDS.items,
    routePath: "/plan",
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
    renderMode: "custom",
  },
  settings: {
    feature: settingsFeatureManifest,
    routeId: APP_ROUTE_IDS.settings,
    routePath: "/preferences",
    pageData: createMinuteEnglishSettingsPageModel(),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      overviewRouteId: APP_ROUTE_IDS.overview,
      authRedirectSource: "preferences",
      showErrorToast: false,
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
    renderMode: "custom",
  },
});
