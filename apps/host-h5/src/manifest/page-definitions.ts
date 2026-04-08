import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type SettingsPageModel } from "@minix/core";
import { accountFeatureManifest, createDefaultAccountState } from "@minix/feature-account";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { createDefaultFeedState, feedFeatureManifest } from "@minix/feature-feed";
import { createDefaultItemsPageModel, itemsFeatureManifest } from "@minix/feature-items";
import { createDefaultMediaToolsState, mediaToolsFeatureManifest } from "@minix/feature-media-tools";
import { createDefaultMessagesState, messagesFeatureManifest } from "@minix/feature-messages";
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
  enableRouteGuard: true,
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
  feed: {
    feature: feedFeatureManifest,
    routeId: APP_ROUTE_IDS.feed,
    routePath: "/discover",
    pageData: createDefaultFeedState({
      title: "Discovery Feed",
      subtitle: "Reusable search and discovery surface with keyword recall, hot searches, and filterable content lanes.",
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
    requiredCapabilities: [{ capability: "device" }],
    featureConfig: {
      surface: "feed",
    },
    renderMode: "custom",
  },
  messages: {
    feature: messagesFeatureManifest,
    routeId: APP_ROUTE_IDS.messages,
    routePath: "/inbox",
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
    renderMode: "custom",
  },
  mediaTools: {
    feature: mediaToolsFeatureManifest,
    routeId: APP_ROUTE_IDS.mediaTools,
    routePath: "/media-tools",
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
  account: {
    feature: accountFeatureManifest,
    routeId: APP_ROUTE_IDS.account,
    routePath: "/account",
    pageData: createDefaultAccountState({
      title: "Account Center",
      subtitle: "Profile, bindings, account placeholders, and support-facing session context.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.overview,
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
    renderMode: "custom",
  },
});
