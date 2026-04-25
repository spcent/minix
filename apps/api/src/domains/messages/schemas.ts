import {
  MESSAGE_REPLY_POLICIES,
  MESSAGE_THREAD_LIST_SORTS,
  MESSAGE_THREAD_TYPES,
  NOTIFICATION_TYPES,
} from "@minix/contracts";
import { z } from "zod";

import { apiActorContextSchema, apiPaginationQueryShape, apiQueryBooleanSchema, apiSourceContextSchema } from "../schema-helpers";

const NOTIFICATION_TYPE_FILTERS = [...NOTIFICATION_TYPES, "all"] as const;
const MESSAGE_THREAD_TYPE_FILTERS = [...MESSAGE_THREAD_TYPES, "all"] as const;

export const notificationsQuerySchema = z.object({
  ...apiPaginationQueryShape,
  type: z.enum(NOTIFICATION_TYPE_FILTERS).optional(),
  groupKey: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  onlyUnread: apiQueryBooleanSchema.optional(),
});

export const threadIdQuerySchema = z.object({
  threadId: z.string().min(1),
  cursor: z.string().min(1).optional(),
});

export const messageThreadListQuerySchema = z.object({
  ...apiPaginationQueryShape,
  type: z.enum(MESSAGE_THREAD_TYPE_FILTERS).optional(),
  onlyUnread: apiQueryBooleanSchema.optional(),
  sort: z.enum(MESSAGE_THREAD_LIST_SORTS).optional(),
  sourceTicketId: z.string().min(1).optional(),
});

export const sendMessageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1),
});

export const createMessageThreadSchema = z.object({
  type: z.enum(MESSAGE_THREAD_TYPES),
  title: z.string().min(1).optional(),
  participantUserIds: z.array(z.string().min(1)).optional(),
  sourceTicketId: z.string().min(1).optional(),
  sourceContext: apiSourceContextSchema.optional(),
  actorContext: apiActorContextSchema.optional(),
  replyPolicy: z.enum(MESSAGE_REPLY_POLICIES).optional(),
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
  type: z.enum(NOTIFICATION_TYPE_FILTERS).optional(),
  groupKey: z.string().min(1).optional(),
  onlyUnread: z.boolean().optional(),
});
