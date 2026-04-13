import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type AppKernel, type SettingsPageModel } from "@minix/core";
import { accountFeatureManifest, createDefaultAccountState } from "@minix/feature-account";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { bookshelfFeatureManifest, createInitialBookshelfState } from "@minix/feature-bookshelf";
import { catalogFeatureManifest, createInitialCatalogState } from "@minix/feature-catalog";
import { createDefaultFeedbackState, feedbackFeatureManifest } from "@minix/feature-feedback";
import { createDefaultFeedState, feedFeatureManifest } from "@minix/feature-feed";
import { createDefaultMediaToolsState, mediaToolsFeatureManifest } from "@minix/feature-media-tools";
import { createInitialNovelDetailState, novelDetailFeatureManifest } from "@minix/feature-novel-detail";
import { createInitialReaderState, readerFeatureManifest } from "@minix/feature-reader";
import { settingsFeatureManifest } from "@minix/feature-settings";
import { createInitialSubscriptionState, subscriptionFeatureManifest } from "@minix/feature-subscription";
import { createInitialTocState, tocFeatureManifest } from "@minix/feature-toc";

const DEFAULT_NOVEL_ID = "novel_lantern";
const DEFAULT_CHAPTER_ID = "lantern_ch_01";

const NOVEL_WECHAT_SETTINGS_PAGE_DATA: SettingsPageModel = {
  title: "Reading Center",
  sections: [
    {
      key: "reading-profile",
      title: "Reading Profile",
      items: [
        {
          key: "membership",
          label: "Membership Rhythm",
          type: "text",
          value: "Quarterly cadence for following premium serials",
        },
        {
          key: "focus",
          label: "Current Focus",
          type: "text",
          value: "Mystery, court drama, and one active frontlist title",
        },
        {
          key: "session-goal",
          label: "Session Goal",
          type: "text",
          value: "One short evening session with resume-first navigation",
        },
      ],
    },
    {
      key: "display-defaults",
      title: "Display Defaults",
      items: [
        {
          key: "theme",
          label: "Reader Theme",
          type: "text",
          value: "Paper contrast for calmer long reading",
        },
        {
          key: "mode",
          label: "Reading Mode",
          type: "text",
          value: "Scroll for browsing, page mode for focused chapters",
        },
        {
          key: "font-scale",
          label: "Font Scale",
          type: "text",
          value: "Comfort size at 110%",
        },
        {
          key: "night-mode-default",
          label: "Night Mode Default",
          type: "text",
          value: "Keep night mode manual so the stored reader theme stays in charge",
        },
      ],
    },
    {
      key: "continuity",
      title: "Reading Continuity",
      items: [
        {
          key: "resume",
          label: "Resume Point",
          type: "text",
          value: "Return to the last saved chapter before reopening the catalog trail",
        },
        {
          key: "shelf-order",
          label: "Shelf Priority",
          type: "text",
          value: "Recent reading first, then update queue, then completed runs",
        },
        {
          key: "digest",
          label: "Release Digest",
          type: "text",
          value: "Quiet weekly recap for followed stories",
        },
        {
          key: "reminders",
          label: "Reading Reminders",
          type: "text",
          value: "Send a quiet nightly reminder when an active reading session is still open",
        },
      ],
    },
    {
      key: "account",
      title: "Account & Sync",
      items: [
        {
          key: "session",
          label: "Session",
          type: "text",
          value: "Signed in on this device",
        },
        {
          key: "sync",
          label: "Sync",
          type: "text",
          value: "Reading progress and shelf state stay aligned across novel hosts",
        },
        {
          key: "signout",
          label: "Sign-Out Action",
          type: "text",
          value: "Clear the local session and return to home",
        },
      ],
    },
  ],
};

async function reportNovelWechatAuthError(kernel: AppKernel, message: string) {
  await kernel.ui.toast({
    title: message,
    icon: "error",
  });
}

export const novelWechatFeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

export const novelWechatPageDefinitions = defineHostPageDefinitions({
  login: {
    feature: authFeatureManifest,
    routeId: APP_ROUTE_IDS.login,
    routePath: "/pages/login/index",
    pageData: createInitialAuthPageState("wechat"),
    controller: {
      successRouteId: APP_ROUTE_IDS.catalog,
      overviewRouteId: APP_ROUTE_IDS.catalog,
      planRouteId: APP_ROUTE_IDS.bookshelf,
      settingsRouteId: APP_ROUTE_IDS.settings,
      reportError: reportNovelWechatAuthError,
    },
    miniprogramPage: "pages/login/index",
    registrationModule: "../../../src/registrations/wechat/pages/login",
    navigationBarTitleText: "Novel Login",
    shellTemplate: "auth-basic",
    shellStyle: "generic",
  },
  catalog: {
    feature: catalogFeatureManifest,
    routeId: APP_ROUTE_IDS.catalog,
    routePath: "/pages/catalog/index",
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
    miniprogramPage: "pages/catalog/index",
    registrationModule: "../../../src/registrations/wechat/pages/catalog",
    navigationBarTitleText: "Book Catalog",
    shellStyle: "novel",
    shellTemplate: "novel-catalog",
  },
  feed: {
    feature: feedFeatureManifest,
    routeId: APP_ROUTE_IDS.feed,
    routePath: "/pages/feed/index",
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
    guardPolicy: {
      name: "authenticated-feed",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/feed/index",
    registrationModule: "../../../src/registrations/wechat/pages/feed",
    navigationBarTitleText: "Discover",
    shellTemplate: "novel-feed",
    shellStyle: "novel",
  },
  account: {
    feature: accountFeatureManifest,
    routeId: APP_ROUTE_IDS.account,
    routePath: "/pages/account/index",
    pageData: createDefaultAccountState({
      title: "Reader Account",
      subtitle: "Profile, bindings, recovery posture, and shared session context for the current reading identity.",
    }),
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
      overviewRouteId: APP_ROUTE_IDS.catalog,
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
  feedback: {
    feature: feedbackFeatureManifest,
    routeId: APP_ROUTE_IDS.feedback,
    routePath: "/pages/feedback/index",
    pageData: createDefaultFeedbackState({
      title: "Reader Feedback",
      subtitle: "Issue reports, support follow-up, and product suggestions stay available without leaving the novel host.",
      values: {
        platform: "wechat",
      },
    }),
    controller: {
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      loginRouteId: APP_ROUTE_IDS.login,
      settingsRouteId: APP_ROUTE_IDS.settings,
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
    navigationBarTitleText: "Support",
    shellTemplate: "feedback-basic",
    shellStyle: "generic",
  },
  mediaTools: {
    feature: mediaToolsFeatureManifest,
    routeId: APP_ROUTE_IDS.mediaTools,
    routePath: "/pages/mediaTools/index",
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
  novelDetail: {
    feature: novelDetailFeatureManifest,
    routeId: APP_ROUTE_IDS.novelDetail,
    routePath: "/pages/novelDetail/index",
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
    guardPolicy: {
      name: "authenticated-novel-detail",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/novelDetail/index",
    registrationModule: "../../../src/registrations/wechat/pages/novelDetail",
    navigationBarTitleText: "Novel Detail",
    shellTemplate: "novel-detail",
    shellStyle: "novel",
  },
  toc: {
    feature: tocFeatureManifest,
    routeId: APP_ROUTE_IDS.toc,
    routePath: "/pages/toc/index",
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
    guardPolicy: {
      name: "authenticated-toc",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/toc/index",
    registrationModule: "../../../src/registrations/wechat/pages/toc",
    navigationBarTitleText: "Chapter List",
    shellTemplate: "novel-toc",
    shellStyle: "novel",
  },
  reader: {
    feature: readerFeatureManifest,
    routeId: APP_ROUTE_IDS.reader,
    routePath: "/pages/reader/index",
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
    guardPolicy: {
      name: "authenticated-reader",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/reader/index",
    registrationModule: "../../../src/registrations/wechat/pages/reader",
    navigationBarTitleText: "Reader",
    shellTemplate: "novel-reader",
    shellStyle: "novel",
  },
  bookshelf: {
    feature: bookshelfFeatureManifest,
    routeId: APP_ROUTE_IDS.bookshelf,
    routePath: "/pages/bookshelf/index",
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
    guardPolicy: {
      name: "authenticated-bookshelf",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/bookshelf/index",
    registrationModule: "../../../src/registrations/wechat/pages/bookshelf",
    navigationBarTitleText: "Bookshelf",
    shellTemplate: "novel-bookshelf",
    shellStyle: "novel",
  },
  settings: {
    feature: settingsFeatureManifest,
    routeId: APP_ROUTE_IDS.settings,
    routePath: "/pages/settings/index",
    pageData: NOVEL_WECHAT_SETTINGS_PAGE_DATA,
    controller: {
      loginRouteId: APP_ROUTE_IDS.login,
      itemsRouteId: APP_ROUTE_IDS.bookshelf,
      overviewRouteId: APP_ROUTE_IDS.catalog,
      accountRouteId: APP_ROUTE_IDS.account,
      feedRouteId: APP_ROUTE_IDS.feed,
      feedbackRouteId: APP_ROUTE_IDS.feedback,
      mediaToolsRouteId: APP_ROUTE_IDS.mediaTools,
      readerRouteId: APP_ROUTE_IDS.reader,
      authRedirectSource: "preferences",
      confirmLogout: {
        title: "Sign out",
        content: "Do you want to clear the bootstrap session on this device?",
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
    miniprogramPage: "pages/settings/index",
    registrationModule: "../../../src/registrations/wechat/pages/settings",
    navigationBarTitleText: "Settings",
    shellTemplate: "novel-settings",
    shellStyle: "novel",
  },
  membership: {
    feature: subscriptionFeatureManifest,
    routeId: APP_ROUTE_IDS.membership,
    routePath: "/pages/membership/index",
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
    guardPolicy: {
      name: "authenticated-membership",
      requirements: {
        authenticated: true,
      },
    },
    miniprogramPage: "pages/membership/index",
    registrationModule: "../../../src/registrations/wechat/pages/membership",
    navigationBarTitleText: "Membership",
    shellTemplate: "novel-membership",
    shellStyle: "novel",
  },
});
