import { z } from "zod";

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  keyword: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  mode: z.enum(["global", "content", "user", "domain"]).optional(),
  domain: z.enum(["all", "content", "user", "novel", "feed"]).optional(),
  sort: z.string().min(1).optional(),
});

export const contentActorRoleSchema = z.enum(["author", "reviewer", "admin", "reader"]);

export const contentIdQuerySchema = z.object({
  contentId: z.string().min(1),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentReviewQueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  state: z.enum(["draft", "published", "offline", "under_review", "review_rejected", "deleted", "all"]).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentLifecycleMutationSchema = z.object({
  contentId: z.string().min(1),
  action: z.enum([
    "publish",
    "update",
    "archive",
    "delete",
    "restore",
    "submit_review",
    "approve_review",
    "reject_review",
    "change_visibility",
  ]),
  visibility: z.enum(["public", "login_required", "member_only", "purchased_only"]).optional(),
  reviewMessage: z.string().min(1).max(280).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const contentDraftSaveSchema = z.object({
  contentId: z.string().min(1).optional(),
  model: z.enum(["article", "course", "consultation_service", "tool_config", "post", "event", "novel_story"]),
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(280),
  bodyPreview: z.string().min(1).max(2000).optional(),
  visibility: z.enum(["public", "login_required", "member_only", "purchased_only"]),
  categoryKey: z.string().min(1).max(64),
  categoryLabel: z.string().min(1).max(64),
  tags: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).min(1),
  coverAssetId: z.string().min(1).optional(),
  attachmentAssetIds: z.array(z.string().min(1)).optional(),
  actorRole: contentActorRoleSchema.optional(),
});

export const novelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
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
