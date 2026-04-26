import assert from "node:assert/strict";
import test from "node:test";

import { cloneMessageThread, cloneThreadMembers } from "./snapshots";

test("message thread member snapshot helper clones member arrays", () => {
  const members = [
    {
      userId: "user_1",
      label: "User One",
      role: "customer" as const,
      active: true,
      canReply: true,
      joinedAt: "2026-04-26T00:00:00.000Z",
    },
  ];

  const snapshot = cloneThreadMembers(members);

  assert.deepEqual(snapshot, members);
  assert.notEqual(snapshot, members);
  assert.notEqual(snapshot[0], members[0]);
});

test("message thread snapshot helper clones nested arrays and objects", () => {
  const thread = {
    threadId: "thread_1",
    type: "customer_service" as const,
    title: "Support",
    subtitle: "Ticket follow-up",
    participantLabels: ["You", "Support"],
    pinned: false,
    doNotDisturb: false,
    unreadCount: 1,
    lastMessagePreview: "Latest reply",
    lastMessageAt: "2026-04-26T00:00:00.000Z",
    reserved: false,
    touchpoints: [],
    replyPolicy: "open" as const,
    members: [
      {
        userId: "self",
        label: "You",
        role: "customer" as const,
        active: true,
        canReply: true,
      },
    ],
    assignment: {
      assigneeUserId: "support_1",
      assigneeLabel: "Support One",
    },
    supportProgress: {
      state: "assigned" as const,
      ticketId: "ticket_1",
      queueLabel: "General Support",
    },
    syncState: {
      mode: "polling" as const,
      cursor: "cursor_1",
      recommendedPollIntervalMs: 5_000,
      recoverable: true,
    },
  };

  const snapshot = cloneMessageThread(thread);

  assert.deepEqual(snapshot, thread);
  assert.notEqual(snapshot.participantLabels, thread.participantLabels);
  assert.notEqual(snapshot.touchpoints, thread.touchpoints);
  assert.notEqual(snapshot.members, thread.members);
  assert.notEqual(snapshot.members?.[0], thread.members[0]);
  assert.notEqual(snapshot.assignment, thread.assignment);
  assert.notEqual(snapshot.supportProgress, thread.supportProgress);
  assert.notEqual(snapshot.syncState, thread.syncState);
});
