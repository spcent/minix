import { ok, type AppKernel } from "@minix/core";
import {
  APP_ROUTE_IDS,
  type ContentReviewQueueResponse,
  type FeedListResponse,
  type SaveContentDraftResponse,
  type SearchDomain,
  type SearchMode,
} from "@minix/contracts";

export function createKernelStub() {
  const requestCalls: Array<Record<string, unknown>> = [];
  const postCalls: Array<{ path: string; body?: unknown }> = [];
  const routeCalls: Array<{ routeId: string; params?: Record<string, string | number | boolean> }> = [];
  const storageValues = new Map<string, unknown>();
  let requestMode: "success" | "unauthorized" = "success";
  let currentRoute: { path: string; params?: Record<string, string | number | boolean> } = { path: "/feed" };

  const kernel: AppKernel = {
    env: {
      appId: "test",
      appName: "test",
      apiBaseUrl: "https://mock.minix.local",
      debug: true,
      platform: "h5",
      version: "1.0.0",
    },
    features: {
      enableAutoLogin: false,
      enableRouteGuard: false,
    },
    storage: {
      async get<T>(key: string) {
        return ok((storageValues.get(key) as T | undefined) ?? null);
      },
      async set<T>(key: string, value: T) {
        storageValues.set(key, value);
        return ok(undefined);
      },
      async remove(key: string) {
        storageValues.delete(key);
        return ok(undefined);
      },
      async clear() {
        storageValues.clear();
        return ok(undefined);
      },
    },
    session: {} as AppKernel["session"],
    request: {
      async get<T>(_url: string, query?: Record<string, unknown>) {
        if (_url === "/content/review-queue") {
          return ok({
            reviewQueue: {
              items: [
                {
                  contentId: "story-1",
                  model: "article",
                  title: "Story 1",
                  lifecycleState: "under_review",
                  visibility: "member_only",
                  authorLabel: "Editorial",
                  queueLabel: "Review queue",
                  attachmentsCount: 2,
                  submittedAt: "2026-04-08T08:00:00.000Z",
                  reviewerLabel: "Reviewer Mina",
                  moderationSummary: "Moderation posture is queued in the shared editorial review workflow.",
                  selected: true,
                },
              ],
              page: Number(query?.page ?? 1),
              pageSize: Number(query?.pageSize ?? 10),
              total: 1,
              hasMore: false,
              selectedContentId: "story-1",
            },
            governanceSummary: {
              reviewQueueSummary: "1 content item(s) are currently queued for editorial review.",
              lifecycleSummary: "Review queue output stays normalized across draft, under-review, and rejected lifecycle states.",
              attachmentGovernanceSummary: "2 attachment reference(s) are visible through content review metadata.",
              laneGovernanceSummary: "Editorial and lifecycle lanes remain inside the shared content domain.",
              auditSummary: "Authoring audit history remains attached to each managed content detail.",
              accessSummary: "Review queue visibility is limited to authorized content roles.",
            },
          } as T);
        }

        requestCalls.push(query ?? {});
        if (requestMode === "unauthorized") {
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Feed session expired",
              recoverable: true,
            },
          } as const;
        }

        const page = Number(query?.page ?? 1);
        const mode: SearchMode =
          query?.mode === "global" || query?.mode === "content" || query?.mode === "user" || query?.mode === "domain"
            ? query.mode
            : "global";
        const domain: SearchDomain =
          query?.domain === "all" || query?.domain === "content" || query?.domain === "user" || query?.domain === "novel" || query?.domain === "feed"
            ? query.domain
            : "feed";
        const keyword = typeof query?.keyword === "string" ? query.keyword : "";
        const sortKey = typeof query?.sort === "string" ? query.sort : "recommended";
        const typoSearch = keyword === "travle";
        const searchResponse: FeedListResponse = {
          items:
            typoSearch
              ? []
              : mode === "user" || domain === "user"
              ? [
                  {
                    id: "user-mentor",
                    title: "MiniX Mentor",
                    subtitle: "Suggested user",
                    eyebrow: "User",
                    tag: "user",
                    recommendedReason: "Shared relation surface sample result",
                    routeTarget: {
                      routeId: APP_ROUTE_IDS.account,
                      params: {
                        targetUserId: "user-mentor",
                      },
                    },
                  },
                ]
              : page === 1
              ? [
                  {
                    id: "story-1",
                    title: "Story 1",
                    tag: "news",
                    recommendedReason: "Lead story for the current lane.",
                    contentCard: {
                      contentId: "story-1",
                      model: "article",
                      title: "Story 1",
                      summary: "Lead story summary",
                      authorLabel: "Editorial",
                      display: {
                        category: { key: "news", label: "News" },
                        tags: [{ key: "news", label: "News" }],
                        topics: [{ key: "news", label: "News" }],
                        recommendationSummary: "This item stays in the managed editorial lane for discover-first surfaces.",
                        laneGovernanceSummary:
                          "Editorial lane governance keeps published managed content pinned to shared frontlist surfaces.",
                        pinned: true,
                        featured: true,
                      },
                      lifecycle: {
                        state: "draft",
                        availableActions: ["publish", "change_visibility"],
                        moderationSummary: "Moderation posture remains in draft and can be promoted through the shared review workflow.",
                      },
                      moderationSummary: "Moderation posture remains in draft and can be promoted through the shared review workflow.",
                    },
                    contentAccess: {
                      visibility: "public",
                      accessible: true,
                      previewAvailable: true,
                      requiresLogin: false,
                      requiresMembership: false,
                      requiresPurchase: false,
                      summaryLabel: "Visible to everyone.",
                    },
                  },
                ]
              : [
                  {
                    id: "story-2",
                    title: "Story 2",
                    tag: "news",
                    updatedAt: "2026-04-10T10:00:00.000Z",
                  },
                ],
          hasMore: page === 1,
          page,
          pageSize: Number(query?.pageSize ?? 12),
          tags: [
            { key: "all", label: "All" },
            { key: "news", label: "News" },
            { key: "user", label: "User" },
          ],
          searchQuery: {
            keyword,
            mode,
            domain,
            page,
            pageSize: Number(query?.pageSize ?? 12),
            ...(sortKey !== "recommended" ? { sortKey } : {}),
          },
          searchFilters: [
            {
              key: "domain",
              label: "Search domain",
              selectedKeys: domain !== "feed" ? [domain] : [],
              persistenceScope: "route",
              reloadBehavior: "restore",
              options: [
                { key: "all", label: "All", count: 3 },
                { key: "feed", label: "Feed", count: 2 },
                { key: "user", label: "User", count: 1 },
              ],
            },
            {
              key: "tag",
              label: "Content type",
              selectedKeys: [],
              persistenceScope: "route",
              reloadBehavior: "restore",
              options: [
                { key: "all", label: "All", count: 2 },
                { key: "news", label: "News", count: 2 },
              ],
            },
          ],
          searchResults: {
            items:
              typoSearch
                ? []
                : mode === "user" || domain === "user"
                ? [
                    {
                      id: "user-mentor",
                      title: "MiniX Mentor",
                      subtitle: "Suggested user",
                      eyebrow: "User",
                      tag: "user",
                      recommendedReason: "Shared relation surface sample result",
                      routeTarget: {
                        routeId: APP_ROUTE_IDS.account,
                        params: {
                          targetUserId: "user-mentor",
                        },
                      },
                    },
                  ]
                : page === 1
                ? [
                    {
                      id: "story-1",
                      title: "Story 1",
                      tag: "news",
                      recommendedReason: "Lead story for the current lane.",
                      contentCard: {
                        contentId: "story-1",
                        model: "article",
                        title: "Story 1",
                        summary: "Lead story summary",
                        authorLabel: "Editorial",
                        display: {
                          category: { key: "news", label: "News" },
                          tags: [{ key: "news", label: "News" }],
                          topics: [{ key: "news", label: "News" }],
                          pinned: true,
                          featured: true,
                        },
                        lifecycle: {
                          state: "draft",
                          availableActions: ["publish", "change_visibility"],
                        },
                      },
                      contentAccess: {
                        visibility: "public",
                        accessible: true,
                        previewAvailable: true,
                        requiresLogin: false,
                        requiresMembership: false,
                        requiresPurchase: false,
                        summaryLabel: "Visible to everyone.",
                      },
                    },
                  ]
                : [
                    {
                      id: "story-2",
                      title: "Story 2",
                      tag: "news",
                      updatedAt: "2026-04-10T10:00:00.000Z",
                    },
                  ],
            total: typoSearch ? 0 : mode === "user" || domain === "user" ? 1 : 2,
            hasMore: typoSearch ? false : mode === "user" || domain === "user" ? false : page === 1,
            emptyText: typoSearch ? 'No feed results matched "travle".' : "No feed items are available yet.",
            ...(mode === "user" || domain === "user"
              ? { featuredReason: "Shared relation surface sample result" }
              : page === 1
                ? { featuredReason: "Lead story for the current lane." }
                : {}),
            suggestionTerms: ["travel", "review"],
            hotKeywords: ["travel", "review"],
            recentKeywords: [],
            sortOptions: [
              { key: "recommended", label: "Recommended" },
              { key: "updatedAt", label: "Latest" },
              { key: "popular", label: "Popular" },
            ],
            activeSortKey: sortKey,
            ...(typoSearch ? { correctionKeyword: "travel", correctionReason: 'No exact feed matches for "travle".' } : {}),
            recoverySuggestions: [
              { keyword: "travel", label: "Try travel", reason: "Correction term derived from the current search keyword." },
              { keyword: "review", label: "Search review", reason: "Hot or reusable query from the shared search center." },
            ],
            ranking: {
              strategy: sortKey,
              appliedSortKey: sortKey,
              label: sortKey === "updatedAt" ? "Results ranked by freshness." : "Results ranked by recommendation relevance.",
            },
            grouping:
              mode === "user" || domain === "user"
                ? {
                    strategy: "flat",
                    activeGroupCount: 1,
                    label: "Search results stay scoped to one shared discover group.",
                  }
                : {
                    strategy: "flat",
                    activeGroupCount: 1,
                    label: "Search results stay scoped to one shared discover group.",
                  },
            activeDomain: domain,
            zeroResultGuidance: typoSearch
              ? {
                  state: "corrected",
                  label: 'No exact matches for "travle". Try the bounded correction or reuse a hot query.',
                  suggestedAction: "Apply the correction term or switch to another shared domain tab.",
                  suggestedKeyword: "travel",
                }
              : {
                  state: "results",
                  label: "Search quality signals are active for the current discover scope.",
                  suggestedAction: "Use domain tabs, grouped results, or recent queries to refine the current search.",
                },
            domainTabs: [
              { domain: "all", label: "All", total: 3, active: domain === "all" },
              { domain: "feed", label: "Feed", total: 2, active: domain === "feed" },
              { domain: "user", label: "User", total: 1, active: domain === "user" },
            ],
            resultGroups:
              mode === "user" || domain === "user"
                ? [
                    {
                      domain: "user",
                      label: "Users",
                      total: 1,
                      items: [
                        {
                          id: "user-mentor",
                          title: "MiniX Mentor",
                          subtitle: "Suggested user",
                          eyebrow: "User",
                          tag: "user",
                          recommendedReason: "Shared relation surface sample result",
                          routeTarget: {
                            routeId: APP_ROUTE_IDS.account,
                            params: {
                              targetUserId: "user-mentor",
                            },
                          },
                        },
                      ],
                      featuredReason: "Shared relation surface sample result",
                    },
                  ]
                : [
                    {
                      domain: "feed",
                      label: "Feed",
                      total: page === 1 ? 1 : 2,
                      items:
                        page === 1
                          ? [
                              {
                                id: "story-1",
                                title: "Story 1",
                                tag: "news",
                                recommendedReason: "Lead story for the current lane.",
                                contentCard: {
                                  contentId: "story-1",
                                  model: "article",
                                  title: "Story 1",
                                  summary: "Lead story summary",
                                  authorLabel: "Editorial",
                                  display: {
                                    category: { key: "news", label: "News" },
                                    tags: [{ key: "news", label: "News" }],
                                    topics: [{ key: "news", label: "News" }],
                                    pinned: true,
                                    featured: true,
                                  },
                                  lifecycle: {
                                    state: "draft",
                                    availableActions: ["publish", "change_visibility"],
                                  },
                                },
                                contentAccess: {
                                  visibility: "public",
                                  accessible: true,
                                  previewAvailable: true,
                                  requiresLogin: false,
                                  requiresMembership: false,
                                  requiresPurchase: false,
                                  summaryLabel: "Visible to everyone.",
                                },
                              },
                            ]
                          : [
                              {
                                id: "story-1",
                                title: "Story 1",
                                tag: "news",
                                recommendedReason: "Lead story for the current lane.",
                              },
                              {
                                id: "story-2",
                                title: "Story 2",
                                tag: "news",
                                updatedAt: "2026-04-10T10:00:00.000Z",
                              },
                            ],
                      featuredReason: "Lead story for the current lane.",
                    },
                  ],
          },
        };
        return ok(searchResponse as T);
      },
      async post<T>(path: string, body?: unknown) {
        postCalls.push({ path, body });
        if (path === "/content/save-draft") {
          return ok({
            contentCard: {
              contentId: "story-1",
              model: "article",
              title: "Story 1 Draft",
              subtitle: "Saved draft",
              summary: "Draft summary",
              coverUrl: "https://mock.minix.local/uploads/assets/asset-cover",
              authorLabel: "Editorial",
              display: {
                category: { key: "news", label: "News" },
                tags: [{ key: "news", label: "News" }],
                topics: [{ key: "news", label: "News" }],
                pinned: false,
                featured: false,
              },
              lifecycle: {
                state: "draft",
                availableActions: ["publish", "update", "submit_review", "delete", "change_visibility"],
              },
              reviewRecord: {
                reviewId: "review_story_1",
                status: "not_requested",
                queueLabel: "Draft workspace",
              },
            },
            contentDetail: {
              contentId: "story-1",
              model: "article",
              title: "Story 1 Draft",
              subtitle: "Saved draft",
              summary: "Draft summary",
              coverUrl: "https://mock.minix.local/uploads/assets/asset-cover",
              authorLabel: "Editorial",
              display: {
                category: { key: "news", label: "News" },
                tags: [{ key: "news", label: "News" }],
                topics: [{ key: "news", label: "News" }],
                recommendationSummary:
                  "This item stays visible through lifecycle-aware recommendation lanes until publication posture changes.",
                laneGovernanceSummary:
                  "Lifecycle lane governance keeps draft and review-state content discoverable for authorized workflows only.",
                pinned: false,
                featured: false,
              },
              lifecycle: {
                state: "draft",
                availableActions: ["publish", "update", "submit_review", "delete", "change_visibility"],
                moderationSummary: "Moderation posture remains in draft and can be promoted through the shared review workflow.",
              },
              moderationSummary: "Moderation posture remains in draft and can be promoted through the shared review workflow.",
              attachmentSummary:
                "1 attachment reference stays inside the shared content envelope, with derived asset posture exposed additively.",
              recommendationReason: "Lifecycle status: draft.",
              authoring: {
                title: "Story 1 Draft",
                subtitle: "Saved draft",
                summary: "Draft summary",
                bodyPreview: "Draft body preview",
                visibility: "login_required",
                category: { key: "news", label: "News" },
                tags: [{ key: "news", label: "News" }],
                coverAssetId: "asset-cover",
                attachmentAssetIds: ["asset-attachment-1"],
              },
              attachments: [
                {
                  assetId: "asset-attachment-1",
                  kind: "attachment",
                  label: "story-1 attachment 1",
                  url: "https://mock.minix.local/uploads/assets/asset-attachment-1",
                  assetSummary: "Asset is bound to content story-1 as attachment.",
                  derivedAssetSummary: "Primary asset metadata is file-level only.",
                },
              ],
              reviewRecord: {
                reviewId: "review_story_1",
                status: "not_requested",
                queueLabel: "Draft workspace",
                moderationSummary: "Moderation posture remains in draft and can be promoted through the shared review workflow.",
              },
              permissions: {
                actorRole: "author",
                canEdit: true,
                canSaveDraft: true,
                canSubmitReview: true,
                canApproveReview: false,
                canRejectReview: false,
                canArchive: false,
                canDelete: true,
                canRestore: false,
                canChangeVisibility: true,
                canManageAttachments: true,
                canViewAuditHistory: true,
              },
              auditHistory: [],
            },
            contentAccess: {
              visibility: "login_required",
              accessible: true,
              previewAvailable: true,
              requiresLogin: true,
              requiresMembership: false,
              requiresPurchase: false,
              summaryLabel: "Visible after sign-in.",
              gateLabel: "Access is gated by the current visibility rule.",
            },
            transitionMessage: "Content draft saved.",
          } as T);
        }
        return ok({
          contentCard: {
            contentId: "story-1",
            model: "article",
            title: "Story 1",
            summary: "Lead story summary",
            authorLabel: "Editorial",
            display: {
              category: { key: "news", label: "News" },
              tags: [{ key: "news", label: "News" }],
              topics: [{ key: "news", label: "News" }],
              recommendationSummary: "This item stays in the managed editorial lane for discover-first surfaces.",
              laneGovernanceSummary:
                "Editorial lane governance keeps published managed content pinned to shared frontlist surfaces.",
              pinned: true,
              featured: false,
            },
            lifecycle: {
              state: "published",
              availableActions: ["archive", "delete", "change_visibility"],
              moderationSummary: "Moderation posture is approved and the item can stay in the managed recommendation lanes.",
            },
            moderationSummary: "Moderation posture is approved and the item can stay in the managed recommendation lanes.",
          },
          contentDetail: {
            contentId: "story-1",
            model: "article",
            title: "Story 1",
            summary: "Lead story summary",
            authorLabel: "Editorial",
            display: {
              category: { key: "news", label: "News" },
              tags: [{ key: "news", label: "News" }],
              topics: [{ key: "news", label: "News" }],
              recommendationSummary: "This item stays in the managed editorial lane for discover-first surfaces.",
              laneGovernanceSummary:
                "Editorial lane governance keeps published managed content pinned to shared frontlist surfaces.",
              pinned: true,
              featured: false,
            },
            lifecycle: {
              state: "published",
              availableActions: ["archive", "delete", "change_visibility"],
              moderationSummary: "Moderation posture is approved and the item can stay in the managed recommendation lanes.",
            },
            moderationSummary: "Moderation posture is approved and the item can stay in the managed recommendation lanes.",
            recommendationReason: "Lifecycle status: published.",
          },
          contentAccess: {
            visibility: "member_only",
            accessible: false,
            previewAvailable: true,
            requiresLogin: false,
            requiresMembership: true,
            requiresPurchase: false,
            summaryLabel: "Visible to members only.",
            entitlementLabel: "Membership access",
            gateLabel: "Access is gated by the current visibility rule.",
          },
          transitionMessage: "Content published.",
        } as T);
      },
      async put<T>() {
        return ok({} as T);
      },
      async patch<T>() {
        return ok({} as T);
      },
      async delete<T>() {
        return ok({} as T);
      },
    },
    auth: {} as AppKernel["auth"],
    router: {
      async to() {
        return ok(undefined);
      },
      async replace() {
        return ok(undefined);
      },
      async toRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        currentRoute = {
          path: typeof routeId === "string" ? routeId : currentRoute.path,
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      async replaceRoute(routeId, params) {
        routeCalls.push({ routeId, ...(params ? { params } : {}) });
        currentRoute = {
          path: typeof routeId === "string" ? routeId : currentRoute.path,
          ...(params ? { params } : {}),
        };
        return ok(undefined);
      },
      resolve() {
        return ok("/feed");
      },
      async back() {
        return ok(undefined);
      },
      current() {
        return ok(currentRoute);
      },
    },
    ui: {} as AppKernel["ui"],
  };

  return {
    kernel,
    requestCalls,
    routeCalls,
    postCalls,
    storageValues,
    setRequestMode(mode: "success" | "unauthorized") {
      requestMode = mode;
    },
    setCurrentRoute(nextRoute: { path: string; params?: Record<string, string | number | boolean> }) {
      currentRoute = nextRoute;
    },
  };
}
