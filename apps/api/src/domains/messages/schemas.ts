import { z } from "zod";

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  type: z.enum(["system", "business", "campaign", "review", "all"]).optional(),
  groupKey: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  onlyUnread: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const threadIdQuerySchema = z.object({
  threadId: z.string().min(1),
  cursor: z.string().min(1).optional(),
});

export const messageThreadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  type: z.enum(["private", "consultation", "customer_service", "group", "all"]).optional(),
  onlyUnread: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: z.enum(["activity", "unread"]).optional(),
  sourceTicketId: z.string().min(1).optional(),
});

export const sendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1),
});

export const createMessageThreadSchema = z.object({
  type: z.enum(["private", "consultation", "customer_service", "group"]),
  title: z.string().min(1).optional(),
  participantUserIds: z.array(z.string().min(1)).optional(),
  sourceTicketId: z.string().min(1).optional(),
  sourceContext: z
    .object({
      pagePath: z.string().min(1).optional(),
      routeId: z.string().min(1).optional(),
      label: z.string().min(1).optional(),
      params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    })
    .optional(),
  actorContext: z
    .object({
      userId: z.string().min(1).optional(),
      platform: z.string().min(1).optional(),
      appVersion: z.string().min(1).optional(),
      deviceSummary: z.string().min(1).optional(),
    })
    .optional(),
  replyPolicy: z.enum(["open", "members_only", "support_only", "readonly"]).optional(),
});

export const markThreadReadSchema = z.object({
  threadId: z.string().min(1),
});

export const retryMessageSchema = z.object({
  threadId: z.string().min(1),
  messageId: z.string().min(1),
});

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  type: z.enum(["system", "business", "campaign", "review", "all"]).optional(),
  groupKey: z.string().min(1).optional(),
  onlyUnread: z.boolean().optional(),
});
