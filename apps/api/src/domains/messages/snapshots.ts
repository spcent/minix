import type { MessageThreadMember } from "@minix/contracts";

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
