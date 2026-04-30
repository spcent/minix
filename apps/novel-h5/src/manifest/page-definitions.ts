import { APP_ROUTE_IDS } from "@minix/contracts";
import { createAuthenticatedGuardPolicy, defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags } from "@minix/core";
import { accountFeatureManifest, createDefaultAccountState } from "@minix/feature-account";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { bookshelfFeatureManifest, createInitialBookshelfState } from "@minix/feature-bookshelf";
import { catalogFeatureManifest, createInitialCatalogState } from "@minix/feature-catalog";
import { createDefaultFeedbackState, feedbackFeatureManifest } from "@minix/feature-feedback";
import { createDefaultFeedState, feedFeatureManifest } from "@minix/feature-feed";
import { createDefaultMessagesState, messagesFeatureManifest } from "@minix/feature-messages";
import { createDefaultMediaToolsState, mediaToolsFeatureManifest } from "@minix/feature-media-tools";
import { createInitialNovelDetailState, novelDetailFeatureManifest } from "@minix/feature-novel-detail";
import { createInitialReaderState, readerFeatureManifest } from "@minix/feature-reader";
import { createNovelReadingSettingsPageModel, settingsFeatureManifest } from "@minix/feature-settings";
import { createInitialSubscriptionState, subscriptionFeatureManifest } from "@minix/feature-subscription";
import { createInitialTocState, tocFeatureManifest } from "@minix/feature-toc";

const DEFAULT_NOVEL_ID = "novel_lantern";
const DEFAULT_CHAPTER_ID = "lantern_ch_01";

const NOVEL_H5_SETTINGS_PAGE_DATA = createNovelReadingSettingsPageModel("h5");

export const novelH5FeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

function authenticatedPage(name: string) {
  return createAuthenticatedGuardPolicy(`authenticated-${name}`);
}

export const novelH5PageDefinitions = defineHostPageDefinitions({
  home: {
    feature: catalogFeatureManifest,
    routeId: APP_ROUTE_IDS.home,
    routePath: "/",
    pageData: createInitialCatalogState({
      title: "Quiet Frontlist",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      detailRouteId: APP_ROUTE_IDS.novelDetail,
      readerRouteId: APP_ROUTE_IDS.reader,
      tocRouteId: APP_ROUTE_IDS.toc,
      bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    renderMode: "custom",
  },
  login: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.login,
    routePath: "/login",
    pageData: createInitialAuthPageState("h5"),
    controller: {
      successRouteId: APP_ROUTE_IDS.home,
      overviewRouteId: APP_ROUTE_IDS.home,
      planRouteId: APP_ROUTE_IDS.bookshelf,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    renderMode: "custom",
  },
  catalog: {
    feature: catalogFeatureManifest,
    routeId: APP_ROUTE_IDS.catalog,
    routePath: "/books",
    pageData: createInitialCatalogState({
      title: "Library",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      detailRouteId: APP_ROUTE_IDS.novelDetail,
      readerRouteId: APP_ROUTE_IDS.reader,
      tocRouteId: APP_ROUTE_IDS.toc,
      bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    renderMode: "custom",
  },
  feed: {
    feature: feedFeatureManifest,
    routeId: APP_ROUTE_IDS.feed,
    routePath: "/discover",
    pageData: createDefaultFeedState({
      title: "Editorial Discover",
      subtitle: "Shared discovery and managed-content entry for editorial content, recommendations, and lifecycle review.",
      surface: "feed",
      pageSize: 6,
      emptyText: "No editorial discover results are available yet.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      feedRouteId: APP_ROUTE_IDS.feed,
      settingsRouteId: APP_ROUTE_IDS.settings,
      authRedirectSource: "feed",
    },
    guardPolicy: authenticatedPage("feed"),
    renderMode: "custom",
  },
  account: {
    feature: accountFeatureManifest,
    routeId: APP_ROUTE_IDS.account,
    routePath: "/account",
    pageData: createDefaultAccountState({
      title: "Reader Account",
      subtitle: "Profile, bindings, recovery posture, and shared session context for the current reading identity.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.home,
      authRedirectSource: "account",
    },
    guardPolicy: authenticatedPage("account"),
    requiredCapabilities: [{ capability: "clipboard", required: false }],
    featureConfig: {
      surface: "account",
    },
    renderMode: "custom",
  },
  feedback: {
    feature: feedbackFeatureManifest,
    routeId: APP_ROUTE_IDS.feedback,
    routePath: "/feedback",
    pageData: createDefaultFeedbackState({
      title: "Reader Feedback",
      subtitle: "Issue reports, support follow-up, and product suggestions stay available without leaving the novel host.",
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
    renderMode: "custom",
  },
  messages: {
    feature: messagesFeatureManifest,
    routeId: APP_ROUTE_IDS.messages,
    routePath: "/inbox",
    pageData: createDefaultMessagesState({
      title: "Reader Inbox",
      subtitle: "Shared notifications and support-adjacent message threads stay visible without leaving the novel host.",
      pageSize: 6,
      emptyText: "No inbox activity is available for this reader session yet.",
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
      title: "Reader Media Tools",
      subtitle: "Shared upload and share workflows for screenshots, invite payloads, and reader-facing attachments.",
      primaryActionLabel: "Select Reader Asset",
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
  novelDetail: {
    feature: novelDetailFeatureManifest,
    routeId: APP_ROUTE_IDS.novelDetail,
    routePath: "/novel/detail",
    pageData: createInitialNovelDetailState({
      novelId: DEFAULT_NOVEL_ID,
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      tocRouteId: APP_ROUTE_IDS.toc,
      readerRouteId: APP_ROUTE_IDS.reader,
      bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
      membershipRouteId: APP_ROUTE_IDS.membership,
    },
    guardPolicy: authenticatedPage("novel-detail"),
    renderMode: "custom",
  },
  toc: {
    feature: tocFeatureManifest,
    routeId: APP_ROUTE_IDS.toc,
    routePath: "/novel/toc",
    pageData: createInitialTocState({
      novelId: DEFAULT_NOVEL_ID,
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
      readerRouteId: APP_ROUTE_IDS.reader,
      membershipRouteId: APP_ROUTE_IDS.membership,
    },
    guardPolicy: authenticatedPage("toc"),
    renderMode: "custom",
  },
  reader: {
    feature: readerFeatureManifest,
    routeId: APP_ROUTE_IDS.reader,
    routePath: "/reader",
    pageData: createInitialReaderState({
      novelId: DEFAULT_NOVEL_ID,
      chapterId: DEFAULT_CHAPTER_ID,
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      readerRouteId: APP_ROUTE_IDS.reader,
      novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
      tocRouteId: APP_ROUTE_IDS.toc,
      bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
      membershipRouteId: APP_ROUTE_IDS.membership,
    },
    guardPolicy: authenticatedPage("reader"),
    renderMode: "custom",
  },
  bookshelf: {
    feature: bookshelfFeatureManifest,
    routeId: APP_ROUTE_IDS.bookshelf,
    routePath: "/bookshelf",
    pageData: createInitialBookshelfState({
      title: "Shelf",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
      readerRouteId: APP_ROUTE_IDS.reader,
      tocRouteId: APP_ROUTE_IDS.toc,
      settingsRouteId: APP_ROUTE_IDS.settings,
    },
    guardPolicy: authenticatedPage("bookshelf"),
    renderMode: "custom",
  },
  settings: {
    feature: settingsFeatureManifest,
    routeId: APP_ROUTE_IDS.settings,
    routePath: "/preferences",
    pageData: NOVEL_H5_SETTINGS_PAGE_DATA,
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      overviewRouteId: APP_ROUTE_IDS.home,
      itemsRouteId: APP_ROUTE_IDS.bookshelf,
      accountRouteId: APP_ROUTE_IDS.account,
      feedRouteId: APP_ROUTE_IDS.feed,
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      messagesRouteId: APP_ROUTE_IDS.messages,
      mediaToolsRouteId: APP_ROUTE_IDS.mediaTools,
      readerRouteId: APP_ROUTE_IDS.reader,
      authRedirectSource: "preferences",
      showErrorToast: false,
    },
    guardPolicy: authenticatedPage("settings"),
    renderMode: "custom",
  },
  membership: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.membership,
    routePath: "/membership",
    pageData: createInitialSubscriptionState({
      title: "Membership Center",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      catalogRouteId: APP_ROUTE_IDS.catalog,
      novelDetailRouteId: APP_ROUTE_IDS.novelDetail,
      readerRouteId: APP_ROUTE_IDS.reader,
      tocRouteId: APP_ROUTE_IDS.toc,
      bookshelfRouteId: APP_ROUTE_IDS.bookshelf,
    },
    guardPolicy: authenticatedPage("membership"),
    renderMode: "custom",
  },
});
