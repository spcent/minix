import type {
  ContentActorRole,
  ContentModel,
  ContentReviewQueueItem,
  ContentVisibility,
  FeedItem,
  FeedTag,
  SaveContentDraftResponse,
  SearchDomain,
  SearchMode,
} from "@minix/contracts";
import { createDefaultFormPageState, createDefaultListPageState, type FormPageState, type ListPageState } from "@minix/core";

export interface FeedQuery {
  page: number;
  pageSize: number;
  keyword: string;
  mode: SearchMode;
  domain: SearchDomain;
  sortKey: string;
}

export interface ContentDraftFormValues extends Record<string, unknown> {
  contentId?: string;
  model: ContentModel;
  title: string;
  subtitle: string;
  summary: string;
  bodyPreview: string;
  visibility: ContentVisibility;
  categoryKey: string;
  categoryLabel: string;
  tagKeys: string[];
  publishAt: string;
  coverAssetId: string;
  attachmentAssetIds: string[];
  actorRole: ContentActorRole;
}

export type FeedState = ListPageState<FeedItem> & {
  subtitle: string;
  surface: "feed" | "search";
  featuredReason: string | undefined;
  contentTransitionFeedback: string | undefined;
  contentDraftForm: FormPageState<ContentDraftFormValues, SaveContentDraftResponse>;
  reviewQueue: ContentReviewQueueItem[];
  selectedReviewContentId: string | undefined;
  tags: FeedTag[];
  activeTag: string | undefined;
  query: FeedQuery;
  recentKeywords: string[];
};

export interface CreateFeedStateOptions {
  title: string;
  subtitle: string;
  surface?: "feed" | "search";
  pageSize: number;
  emptyText: string;
  tags?: FeedTag[];
}

export interface CreateDefaultFeedStateOptions {
  title?: string;
  subtitle?: string;
  surface?: "feed" | "search";
  pageSize?: number;
  emptyText?: string;
}

function cloneTags(tags: FeedTag[]): FeedTag[] {
  return tags.map((tag) => ({ ...tag }));
}

export function createDefaultContentDraftFormValues(
  values: Partial<ContentDraftFormValues> = {},
): ContentDraftFormValues {
  return {
    ...(values.contentId ? { contentId: values.contentId } : {}),
    model: values.model ?? "article",
    title: values.title ?? "",
    subtitle: values.subtitle ?? "",
    summary: values.summary ?? "",
    bodyPreview: values.bodyPreview ?? "",
    visibility: values.visibility ?? "public",
    categoryKey: values.categoryKey ?? "news",
    categoryLabel: values.categoryLabel ?? "News",
    tagKeys: values.tagKeys ? [...values.tagKeys] : ["news"],
    publishAt: values.publishAt ?? "",
    coverAssetId: values.coverAssetId ?? "",
    attachmentAssetIds: values.attachmentAssetIds ? [...values.attachmentAssetIds] : [],
    actorRole: values.actorRole ?? "author",
  };
}

export function createFeedState(options: CreateFeedStateOptions): FeedState {
  return {
    ...createDefaultListPageState<FeedItem>({
      title: options.title,
      subtitle: options.subtitle,
      pageSize: options.pageSize,
      emptyText: options.emptyText,
    }),
    subtitle: options.subtitle,
    surface: options.surface ?? "feed",
    featuredReason: undefined,
    contentTransitionFeedback: undefined,
    contentDraftForm: createDefaultFormPageState<ContentDraftFormValues, SaveContentDraftResponse>({
      title: "Content Draft",
      subtitle: "Authoring workflow for managed content.",
      values: createDefaultContentDraftFormValues(),
    }),
    reviewQueue: [],
    selectedReviewContentId: undefined,
    tags: cloneTags(options.tags ?? []),
    activeTag: undefined,
    query: {
      page: 1,
      pageSize: options.pageSize,
      keyword: "",
      mode: "global",
      domain: "feed",
      sortKey: "recommended",
    },
    recentKeywords: [],
  };
}

export function createDefaultFeedState(options: CreateDefaultFeedStateOptions = {}): FeedState {
  return createFeedState({
    title: options.title ?? "Search Center",
    subtitle: options.subtitle ?? "A reusable cross-domain search surface with ranking, correction recovery, and quick re-entry.",
    surface: options.surface ?? "search",
    pageSize: options.pageSize ?? 12,
    emptyText: options.emptyText ?? "No feed items are available yet.",
    tags: [
      {
        key: "all",
        label: "All",
      },
    ],
  });
}
