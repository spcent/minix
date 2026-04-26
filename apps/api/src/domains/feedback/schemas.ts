import { FEEDBACK_PRIORITIES, FEEDBACK_TICKET_STATES, FEEDBACK_TYPES } from "@minix/contracts";
import { z } from "zod";

import { normalizeUploadAsset, uploadAssetSchema } from "../uploads/schemas";
import {
  apiActorContextSchema,
  apiPaginationQueryShape,
  apiSourceContextSchema,
  normalizeApiActorContext,
  normalizeApiSourceContext,
} from "../schema-helpers";

const FEEDBACK_TICKET_STATE_FILTERS = [...FEEDBACK_TICKET_STATES, "all"] as const;

export const feedbackTicketIdQuerySchema = z.object({
  ticketId: z.string().min(1),
});

export const feedbackTicketListQuerySchema = z.object({
  ...apiPaginationQueryShape,
  state: z.enum(FEEDBACK_TICKET_STATE_FILTERS).optional(),
  categoryKey: z.string().min(1).optional(),
  keyword: z.string().min(1).optional(),
});

const feedbackContextSchema = z.object({
  sourcePage: z.string().min(1),
  sourceRouteId: z.string().min(1).optional(),
  sourceLabel: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  platform: z.string().min(1),
  appVersion: z.string().min(1),
  deviceSummary: z.string().min(1).optional(),
  sourceContext: apiSourceContextSchema.optional(),
  actorContext: apiActorContextSchema.optional(),
  screenshotAssets: z.array(uploadAssetSchema),
  attachmentAssets: z.array(uploadAssetSchema),
});

export const submitFeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  categoryKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(FEEDBACK_PRIORITIES).optional(),
  labels: z.array(z.string().min(1)).optional(),
  revisitRequested: z.boolean().optional(),
  satisfactionScore: z.number().min(1).max(5).optional(),
  context: feedbackContextSchema,
});

export const revisitFeedbackSchema = z.object({
  ticketId: z.string().min(1),
  userMessage: z.string().min(1).optional(),
});

const feedbackTicketAssigneeSchema = z.object({
  userId: z.string().min(1),
  label: z.string().min(1),
  teamLabel: z.string().min(1).optional(),
  assignedAt: z.string().min(1).optional(),
});

const feedbackTicketSlaSchema = z.object({
  policyKey: z.string().min(1),
  label: z.string().min(1),
  deadlineAt: z.string().min(1),
  breached: z.boolean(),
  updatedAt: z.string().min(1).optional(),
});

export const feedbackTicketActionSchema = z.object({
  ticketId: z.string().min(1),
  state: z.enum(["triaged", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
  priority: z.enum(FEEDBACK_PRIORITIES).optional(),
  labels: z.array(z.string().min(1)).optional(),
  assignee: feedbackTicketAssigneeSchema.optional(),
  queueKey: z.string().min(1).optional(),
  queueLabel: z.string().min(1).optional(),
  sla: feedbackTicketSlaSchema.optional(),
  note: z.string().min(1).optional(),
  supportReply: z.string().min(1).optional(),
});

export function normalizeSubmitFeedbackRequest(payload: z.infer<typeof submitFeedbackSchema>) {
  const sourceContext = normalizeApiSourceContext(payload.context.sourceContext);
  const actorContext = normalizeApiActorContext(payload.context.actorContext);

  return {
    type: payload.type,
    categoryKey: payload.categoryKey,
    title: payload.title,
    description: payload.description,
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.labels !== undefined ? { labels: payload.labels } : {}),
    ...(payload.revisitRequested !== undefined ? { revisitRequested: payload.revisitRequested } : {}),
    ...(payload.satisfactionScore !== undefined ? { satisfactionScore: payload.satisfactionScore } : {}),
    context: {
      sourcePage: payload.context.sourcePage,
      ...(payload.context.sourceRouteId !== undefined ? { sourceRouteId: payload.context.sourceRouteId } : {}),
      ...(payload.context.sourceLabel !== undefined ? { sourceLabel: payload.context.sourceLabel } : {}),
      ...(payload.context.userId !== undefined ? { userId: payload.context.userId } : {}),
      platform: payload.context.platform,
      appVersion: payload.context.appVersion,
      ...(payload.context.deviceSummary !== undefined ? { deviceSummary: payload.context.deviceSummary } : {}),
      ...(sourceContext !== undefined ? { sourceContext } : {}),
      ...(actorContext !== undefined ? { actorContext } : {}),
      screenshotAssets: payload.context.screenshotAssets.map(normalizeUploadAsset),
      attachmentAssets: payload.context.attachmentAssets.map(normalizeUploadAsset),
    },
  };
}

export function normalizeFeedbackTicketActionRequest(payload: z.infer<typeof feedbackTicketActionSchema>) {
  return {
    ticketId: payload.ticketId,
    ...(payload.state !== undefined ? { state: payload.state } : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.labels !== undefined ? { labels: payload.labels } : {}),
    ...(payload.assignee !== undefined
      ? {
          assignee: {
            userId: payload.assignee.userId,
            label: payload.assignee.label,
            ...(payload.assignee.teamLabel !== undefined ? { teamLabel: payload.assignee.teamLabel } : {}),
            ...(payload.assignee.assignedAt !== undefined ? { assignedAt: payload.assignee.assignedAt } : {}),
          },
        }
      : {}),
    ...(payload.queueKey !== undefined ? { queueKey: payload.queueKey } : {}),
    ...(payload.queueLabel !== undefined ? { queueLabel: payload.queueLabel } : {}),
    ...(payload.sla !== undefined
      ? {
          sla: {
            policyKey: payload.sla.policyKey,
            label: payload.sla.label,
            deadlineAt: payload.sla.deadlineAt,
            breached: payload.sla.breached,
            ...(payload.sla.updatedAt !== undefined ? { updatedAt: payload.sla.updatedAt } : {}),
          },
        }
      : {}),
    ...(payload.note !== undefined ? { note: payload.note } : {}),
    ...(payload.supportReply !== undefined ? { supportReply: payload.supportReply } : {}),
  };
}
