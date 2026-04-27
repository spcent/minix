import type { MessageBodyItem, MessageThread, MessageThreadMember } from "@minix/contracts";

import type { StoredMessageThreadRecord, UserState } from "../../types";
import type { NotificationChannelProviderRuntimeEnv } from "../settings/state";
import { cloneDefinedDomainFields } from "../snapshot";
import { cloneMessageTouchpointsForItem, cloneTouchpoints } from "./touchpoints";

export function cloneThreadMembers(members: MessageThreadMember[]): MessageThreadMember[] {
  return members.map((member) => ({
    userId: member.userId,
    label: member.label,
    role: member.role,
    active: member.active,
    canReply: member.canReply,
    ...cloneDefinedDomainFields(member, ["joinedAt"]),
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
      ...cloneDefinedDomainFields({ createdAt: thread.lastMessageAt }, ["createdAt"]),
    }, runtimeEnv),
    ...cloneDefinedDomainFields(thread, ["replyPolicy"]),
    ...(thread.members !== undefined ? { members: cloneThreadMembers(thread.members) } : {}),
    ...cloneDefinedDomainFields(thread, [
      "assignment",
      "consultationProgress",
      "supportProgress",
      "groupState",
      "syncState",
    ]),
  };
}

export function cloneMessageBodyItem(
  message: MessageBodyItem,
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): MessageBodyItem {
  return {
    ...message,
    ...cloneDefinedDomainFields(message, [
      "updatedAt",
      "readAt",
      "deliveredAt",
      "failureCode",
      "failureMessage",
    ]),
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

export function cloneStoredMessageThreadRecord(
  record: StoredMessageThreadRecord,
  userState?: UserState,
  runtimeEnv?: NotificationChannelProviderRuntimeEnv,
): StoredMessageThreadRecord {
  return {
    thread: cloneMessageThread(record.thread, userState, runtimeEnv),
    messages: cloneMessageItems(record.messages, userState, runtimeEnv),
    syncCursor: record.syncCursor,
    updatedAt: record.updatedAt,
  };
}
