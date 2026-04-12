import { APP_ROUTE_IDS } from "@minix/contracts";
import { defineHostFeatureFlags, defineHostPageDefinitions, loadFeatureFlags, type SettingsPageModel } from "@minix/core";
import { authFeatureManifest, createInitialAuthPageState } from "@minix/feature-auth";
import { bookshelfFeatureManifest, createInitialBookshelfState } from "@minix/feature-bookshelf";
import { catalogFeatureManifest, createInitialCatalogState } from "@minix/feature-catalog";
import { createDefaultFeedState, feedFeatureManifest } from "@minix/feature-feed";
import { createInitialNovelDetailState, novelDetailFeatureManifest } from "@minix/feature-novel-detail";
import { createInitialReaderState, readerFeatureManifest } from "@minix/feature-reader";
import { settingsFeatureManifest } from "@minix/feature-settings";
import { createInitialSubscriptionState, subscriptionFeatureManifest } from "@minix/feature-subscription";
import { createInitialTocState, tocFeatureManifest } from "@minix/feature-toc";

const DEFAULT_NOVEL_ID = "novel_lantern";
const DEFAULT_CHAPTER_ID = "lantern_ch_01";

const NOVEL_H5_SETTINGS_PAGE_DATA: SettingsPageModel = {
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
          value: "Quarterly cadence for premium serial continuity",
        },
        {
          key: "focus",
          label: "Current Focus",
          type: "text",
          value: "Mystery, court drama, and slow-burn frontlist titles",
        },
        {
          key: "session-goal",
          label: "Session Goal",
          type: "text",
          value: "25 minutes each evening with one active title in focus",
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
          value: "Paper with warm contrast",
        },
        {
          key: "mode",
          label: "Reading Mode",
          type: "text",
          value: "Scroll for archive browsing, page mode for focused sessions",
        },
        {
          key: "font-scale",
          label: "Font Scale",
          type: "text",
          value: "Comfort reading at 110%",
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
          value: "Always reopen the latest saved chapter before showing the title page",
        },
        {
          key: "shelf-order",
          label: "Shelf Priority",
          type: "text",
          value: "Recent reading first, then active updates, then completed titles",
        },
        {
          key: "digest",
          label: "Release Digest",
          type: "text",
          value: "Quiet weekly roundup for followed serials",
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
          value: "Signed in on this browser",
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

export const novelH5FeatureFlags = defineHostFeatureFlags({
  ...loadFeatureFlags(),
  enableAutoLogin: false,
  enableRouteGuard: true,
});

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
    guardPolicy: {
      name: "authenticated-feed",
      requirements: {
        authenticated: true,
      },
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
    guardPolicy: {
      name: "authenticated-novel-detail",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-toc",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-reader",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-bookshelf",
      requirements: {
        authenticated: true,
      },
    },
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
      feedRouteId: APP_ROUTE_IDS.feed,
      readerRouteId: APP_ROUTE_IDS.reader,
      authRedirectSource: "preferences",
      showErrorToast: false,
    },
    guardPolicy: {
      name: "authenticated-settings",
      requirements: {
        authenticated: true,
      },
    },
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
    guardPolicy: {
      name: "authenticated-membership",
      requirements: {
        authenticated: true,
      },
    },
    renderMode: "custom",
  },
});
