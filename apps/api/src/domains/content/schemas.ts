import {
  CONTENT_ACTOR_ROLES,
  CONTENT_LIFECYCLE_ACTIONS,
  CONTENT_MODELS,
  CONTENT_PUBLICATION_STATES,
  CONTENT_VISIBILITIES,
  SEARCH_DOMAINS,
  SEARCH_MODES,
} from "@minix/contracts";
import { z } from "zod";

import { apiPaginationQueryShape } from "../schema-helpers";

const CONTENT_PUBLICATION_STATE_FILTERS = [...CONTENT_PUBLICATION_STATES, "all"] as const;

export const feedQuerySchema = z.object({
  ...apiPaginationQueryShape,
  keyword: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  mode: z.enum(SEARCH_MODES).optional(),
  domain: z.enum(SEARCH_DOMAINS).optional(),
  sort: z.string().min(1).optional(),
});

export const contentActorRoleSchema = z.enum(CONTENT_ACTOR_ROLES);

export const contentIdQuerySchema = z.object({
  contentId: z.string().min(1),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentReviewQueueQuerySchema = z.object({
  ...apiPaginationQueryShape,
  state: z.enum(CONTENT_PUBLICATION_STATE_FILTERS).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentLifecycleMutationSchema = z.object({
  contentId: z.string().min(1),
  action: z.enum(CONTENT_LIFECYCLE_ACTIONS),
  visibility: z.enum(CONTENT_VISIBILITIES).optional(),
  reviewMessage: z.string().min(1).max(280).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentDraftSaveSchema = z.object({
  contentId: z.string().min(1).optional(),
  model: z.enum(CONTENT_MODELS),
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(280),
  bodyPreview: z.string().min(1).max(2000).optional(),
  visibility: z.enum(CONTENT_VISIBILITIES),
  categoryKey: z.string().min(1).max(64),
  categoryLabel: z.string().min(1).max(64),
  tags: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).min(1),
  coverAssetId: z.string().min(1).optional(),
  attachmentAssetIds: z.array(z.string().min(1)).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const novelsQuerySchema = z.object({
  ...apiPaginationQueryShape,
  keyword: z.string().min(1).optional(),
  categoryKey: z.string().min(1).optional(),
  status: z.enum(["serializing", "completed", "paused", "all"]).optional(),
  sort: z.enum(["recommended", "updatedAt", "popular", "wordCount"]).optional(),
});

export const novelIdQuerySchema = z.object({
  novelId: z.string().min(1),
});

export const chapterIdQuerySchema = z.object({
  chapterId: z.string().min(1),
});

export const bookshelfMutationSchema = z.object({
  novelId: z.string().min(1),
});

export const saveReadingProgressSchema = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().min(1),
  progressPercent: z.number().min(0).max(1),
  scrollOffset: z.number().min(0).optional(),
  pageIndex: z.number().int().min(0).optional(),
});
