import { APP_ROUTE_IDS, type CapabilityRequirement } from "@minix/contracts";
import {
  createAuthenticatedGuardPolicy,
  defineHostFeatureFlags,
  defineHostPageDefinitions,
  loadFeatureFlags,
} from "@minix/core";
import { accountFeatureManifest, createDefaultAccountState } from "@minix/feature-account";
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

export const hostH5FeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

function authenticatedPage(name: string) {
  return createAuthenticatedGuardPolicy(`authenticated-${name}`);
}

function deviceCapabilities(): CapabilityRequirement[] {
  return [{ capability: "device" }];
}

function createMinuteEnglishPagePreset() {
  return {
    overview: {
      feature: itemsFeatureManifest,
      routeId: APP_ROUTE_IDS.overview,
      routePath: "/overview",
      pageData: createMinuteEnglishOverviewPageModel(),
      controller: {
        loginRouteId: APP_ROUTE_IDS.login,
        planRouteId: APP_ROUTE_IDS.items,
        settingsRouteId: APP_ROUTE_IDS.settings,
        authRedirectSource: "overview",
      },
      guardPolicy: authenticatedPage("overview"),
      requiredCapabilities: deviceCapabilities(),
      featureConfig: {
        landingVariant: "overview",
      },
      renderMode: "custom" as const,
    },
    items: {
      feature: itemsFeatureManifest,
      routeId: APP_ROUTE_IDS.items,
      routePath: "/plan",
      pageData: createMinuteEnglishPracticePlanPageModel(),
      controller: {
        loginRouteId: APP_ROUTE_IDS.login,
        overviewRouteId: APP_ROUTE_IDS.overview,
        settingsRouteId: APP_ROUTE_IDS.settings,
        authRedirectSource: "plan",
      },
      guardPolicy: authenticatedPage("plan"),
      requiredCapabilities: deviceCapabilities(),
      featureConfig: {
        experience: "daily-plan",
        showCompletionSummary: true,
      },
      renderMode: "custom" as const,
    },
    feed: {
      feature: feedFeatureManifest,
      routeId: APP_ROUTE_IDS.feed,
      routePath: "/discover",
      pageData: createMinuteEnglishSearchFeedState(),
      controller: {
        loginRouteId: APP_ROUTE_IDS.login,
        feedRouteId: APP_ROUTE_IDS.feed,
        detailRouteId: APP_ROUTE_IDS.overview,
        settingsRouteId: APP_ROUTE_IDS.settings,
        authRedirectSource: "feed",
      },
      guardPolicy: authenticatedPage("feed"),
      requiredCapabilities: deviceCapabilities(),
      featureConfig: {
        surface: "search",
      },
      renderMode: "custom" as const,
    },
  };
}

export const hostH5PageDefinitions = defineHostPageDefinitions({
  login: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.login,
    routePath: "/",
    pageData: createInitialAuthPageState("h5"),
    controller: {
      successRouteId: APP_ROUTE_IDS.login,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    renderMode: "custom",
  },
  identityUpgrade: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityUpgrade,
    routePath: "/auth/identity/upgrade",
    pageData: createAuthIdentityPageState("h5", "identity-upgrade"),
    controller: {
      successRouteId: APP_ROUTE_IDS.account,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-upgrade"),
    featureConfig: {
      surface: "identity-upgrade",
    },
    renderMode: "custom",
  },
  identityBindPhone: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityBindPhone,
    routePath: "/auth/identity/bind-phone",
    pageData: createAuthIdentityPageState("h5", "identity-bind-phone"),
    controller: {
      successRouteId: APP_ROUTE_IDS.account,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-bind-phone"),
    featureConfig: {
      surface: "identity-bind-phone",
    },
    renderMode: "custom",
  },
  identityMerge: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.identityMerge,
    routePath: "/auth/identity/merge",
    pageData: createAuthIdentityPageState("h5", "identity-merge"),
    controller: {
      successRouteId: APP_ROUTE_IDS.account,
      stayOnSuccess: true,
      overviewRouteId: APP_ROUTE_IDS.overview,
      planRouteId: APP_ROUTE_IDS.items,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    guardPolicy: createAuthenticatedGuardPolicy("authenticated-identity-merge"),
    featureConfig: {
      surface: "identity-merge",
    },
    renderMode: "custom",
  },
  ...createMinuteEnglishPagePreset(),
  feedback: {
    feature: feedbackFeatureManifest,
    routeId: APP_ROUTE_IDS.feedback,
    routePath: "/feedback",
    pageData: createDefaultFeedbackState({
      title: "Feedback",
      subtitle: "Issue reports, suggestions, complaints, abuse reports, and satisfaction tickets share one reusable ticket model here.",
    }),
    controller: {
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      cancelRouteId: APP_ROUTE_IDS.account,
      authRedirectSource: "feedback",
    },
    guardPolicy: authenticatedPage("feedback"),
    featureConfig: {
      surface: "feedback",
      template: "form",
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
    guardPolicy: authenticatedPage("messages"),
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
    guardPolicy: authenticatedPage("media-tools"),
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
      membershipRouteId: APP_ROUTE_IDS.membership,
      ordersRouteId: APP_ROUTE_IDS.orders,
      authRedirectSource: "preferences",
      showErrorToast: false,
    },
    guardPolicy: authenticatedPage("settings"),
    requiredCapabilities: [{ capability: "clipboard" }],
    featureConfig: {
      sectionDensity: "comfortable",
    },
    renderMode: "custom",
  },
  membership: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.membership,
    routePath: "/membership",
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
    renderMode: "custom",
  },
  orders: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.orders,
    routePath: "/orders",
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
    renderMode: "custom",
  },
});
