import type { FeedItem, FeedTag } from "@minix/contracts";
import { createDefaultListPageState, type ListPageState } from "@minix/core";

export interface FeedQuery {
  page: number;
  pageSize: number;
  keyword: string;
}

export type FeedState = ListPageState<FeedItem> & {
  subtitle: string;
  featuredReason: string | undefined;
  tags: FeedTag[];
  activeTag: string | undefined;
  query: FeedQuery;
  recentKeywords: string[];
};

export interface CreateFeedStateOptions {
  title: string;
  subtitle: string;
  pageSize: number;
  emptyText: string;
  tags?: FeedTag[];
}

export interface CreateDefaultFeedStateOptions {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
}

function cloneTags(tags: FeedTag[]): FeedTag[] {
  return tags.map((tag) => ({ ...tag }));
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
    featuredReason: undefined,
    tags: cloneTags(options.tags ?? []),
    activeTag: undefined,
    query: {
      page: 1,
      pageSize: options.pageSize,
      keyword: "",
    },
    recentKeywords: [],
  };
}

export function createDefaultFeedState(options: CreateDefaultFeedStateOptions = {}): FeedState {
  return createFeedState({
    title: options.title ?? "Feed",
    subtitle: options.subtitle ?? "A reusable discovery surface for ranked content, recommendations, and quick re-entry.",
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
