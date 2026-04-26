import assert from "node:assert/strict";
import test from "node:test";

import {
  cloneMessageBodyItem,
  cloneMessageItems,
  cloneMessageThread,
  cloneStoredMessageThreadRecord,
  cloneThreadMembers,
} from "./snapshots";

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

test("message body item snapshot helper clones delivery fields and touchpoints", () => {
  const message = {
    messageId: "msg_1",
    threadId: "thread_1",
    direction: "outbound" as const,
    senderRole: "self" as const,
    senderLabel: "You",
    body: "Can you check this?",
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:01:00.000Z",
    deliveryStatus: "failed" as const,
    deliveredAt: "2026-04-26T00:00:02.000Z",
    readAt: "2026-04-26T00:00:05.000Z",
    failureCode: "provider_unavailable",
    failureMessage: "Provider unavailable",
    attemptCount: 2,
    retryable: true,
    touchpoints: [],
  };

  const snapshot = cloneMessageBodyItem(message);

  assert.deepEqual(snapshot, message);
  assert.notEqual(snapshot.touchpoints, message.touchpoints);
});

test("message item array snapshot helper returns new message items", () => {
  const messages = [
    {
      messageId: "msg_1",
      threadId: "thread_1",
      direction: "inbound" as const,
      senderRole: "support" as const,
      senderLabel: "Support",
      body: "We are checking.",
      createdAt: "2026-04-26T00:00:00.000Z",
      deliveryStatus: "read" as const,
      attemptCount: 1,
      retryable: false,
      touchpoints: [],
    },
  ];

  const snapshot = cloneMessageItems(messages);

  assert.deepEqual(snapshot, messages);
  assert.notEqual(snapshot, messages);
  assert.notEqual(snapshot[0], messages[0]);
  assert.notEqual(snapshot[0]?.touchpoints, messages[0]?.touchpoints);
});

test("stored message thread record snapshot helper clones thread and messages", () => {
  const record = {
    thread: {
      threadId: "thread_1",
      type: "customer_service" as const,
      title: "Support",
      participantLabels: ["You", "Support"],
      pinned: false,
      doNotDisturb: false,
      unreadCount: 0,
      lastMessagePreview: "We are checking.",
      lastMessageAt: "2026-04-26T00:00:00.000Z",
      reserved: false,
      touchpoints: [],
      members: [
        {
          userId: "self",
          label: "You",
          role: "customer" as const,
          active: true,
          canReply: true,
        },
      ],
    },
    messages: [
      {
        messageId: "msg_1",
        threadId: "thread_1",
        direction: "inbound" as const,
        senderRole: "support" as const,
        senderLabel: "Support",
        body: "We are checking.",
        createdAt: "2026-04-26T00:00:00.000Z",
        deliveryStatus: "read" as const,
        attemptCount: 1,
        retryable: false,
        touchpoints: [],
      },
    ],
    syncCursor: "cursor_1",
    updatedAt: "2026-04-26T00:01:00.000Z",
  };

  const snapshot = cloneStoredMessageThreadRecord(record);

  assert.deepEqual(snapshot, record);
  assert.notEqual(snapshot.thread, record.thread);
  assert.notEqual(snapshot.thread.participantLabels, record.thread.participantLabels);
  assert.notEqual(snapshot.thread.members, record.thread.members);
  assert.notEqual(snapshot.messages, record.messages);
  assert.notEqual(snapshot.messages[0], record.messages[0]);
  assert.equal(snapshot.syncCursor, record.syncCursor);
  assert.equal(snapshot.updatedAt, record.updatedAt);
});
