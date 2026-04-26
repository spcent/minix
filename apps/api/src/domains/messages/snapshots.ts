import type { MessageThread, MessageThreadMember } from "@minix/contracts";

import type { UserState } from "../../types";
import type { NotificationChannelProviderRuntimeEnv } from "../settings/state";
import { cloneDomainSnapshot } from "../snapshot";
import { cloneTouchpoints } from "./touchpoints";

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
