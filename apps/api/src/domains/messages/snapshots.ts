import type { MessageBodyItem, MessageThread, MessageThreadMember } from "@minix/contracts";

import type { UserState } from "../../types";
import type { NotificationChannelProviderRuntimeEnv } from "../settings/state";
import { cloneDomainSnapshot } from "../snapshot";
import { cloneMessageTouchpointsForItem, cloneTouchpoints } from "./touchpoints";

export function cloneThreadMembers(members: MessageThreadMember[]): MessageThreadMember[] {
  return members.map((member) => ({
    userId: member.userId,
    label: member.label,
    role: member.role,
    active: member.active,
    canReply: member.canReply,
    ...(member.joinedAt !== undefined ? { joinedAt: member.joinedAt } : {}),
  }));
}

export function cloneMessageThread(
  thread: MessageThread,
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageThread {
  return {
    ...thread,
    participantLabels: [...thread.participantLabels],
    touchpoints: cloneTouchpoints(thread.touchpoints, userState, {
      resourceId: `thread:${thread.threadId}`,
      resourceLabel: `thread.${thread.type}`,
      ...(thread.lastMessageAt !== undefined ? { createdAt: thread.lastMessageAt } : {}),
    }, runtimeEnv),
    ...(thread.replyPolicy !== undefined ? { replyPolicy: thread.replyPolicy } : {}),
    ...(thread.members !== undefined ? { members: cloneThreadMembers(thread.members) } : {}),
    ...(thread.assignment !== undefined ? { assignment: cloneDomainSnapshot(thread.assignment) } : {}),
    ...(thread.consultationProgress !== undefined
      ? { consultationProgress: cloneDomainSnapshot(thread.consultationProgress) }
      : {}),
    ...(thread.supportProgress !== undefined ? { supportProgress: cloneDomainSnapshot(thread.supportProgress) } : {}),
    ...(thread.groupState !== undefined ? { groupState: cloneDomainSnapshot(thread.groupState) } : {}),
    ...(thread.syncState !== undefined ? { syncState: cloneDomainSnapshot(thread.syncState) } : {}),
  };
}

export function cloneMessageBodyItem(
  message: MessageBodyItem,
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageBodyItem {
  return {
    ...message,
    ...(message.updatedAt !== undefined ? { updatedAt: message.updatedAt } : {}),
    ...(message.readAt !== undefined ? { readAt: message.readAt } : {}),
    ...(message.deliveredAt !== undefined ? { deliveredAt: message.deliveredAt } : {}),
    ...(message.failureCode !== undefined ? { failureCode: message.failureCode } : {}),
    ...(message.failureMessage !== undefined ? { failureMessage: message.failureMessage } : {}),
    touchpoints: cloneMessageTouchpointsForItem(message, userState, runtimeEnv),
  };
}

export function cloneMessageItems(
  messages: MessageBodyItem[],
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageBodyItem[] {
  return messages.map((message) => cloneMessageBodyItem(message, userState, runtimeEnv));
}
