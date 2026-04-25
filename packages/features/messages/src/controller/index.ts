import {
  createAuthRedirectParams,
  createDetailStatus,
  createListStatus,
  cloneStateSnapshot,
  cloneStateSnapshotArray,
  createStore,
  ok,
  type AppKernel,
  type Result,
} from "@minix/core";
import type {
  AppRouteId,
  CreateMessageThreadRequest,
  CreateMessageThreadResponse,
  ListMessageThreadsRequest,
  MarkNotificationsReadResponse,
  MarkThreadReadRequest,
  MessageThreadListResponse,
  MessageThreadResponse,
  NotificationListResponse,
  NotificationType,
  RetryMessageRequest,
  RetryMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
  SyncMessageThreadRequest,
} from "@minix/contracts";

import { createDefaultMessagesState, type MessagesState } from "../model";

export interface CreateMessagesControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<MessagesState>;
  messagesRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  requestPath?: string;
  markReadPath?: string;
  threadListPath?: string;
  threadPath?: string;
  markThreadReadPath?: string;
  sendMessagePath?: string;
  retryMessagePath?: string;
  syncThreadPath?: string;
  createThreadPath?: string;
  authRedirectSource?: string;
}

type FailedMessagesResult = Extract<Result<NotificationListResponse>, { ok: false }>;
type FailedMarkReadResult = Extract<Result<MarkNotificationsReadResponse>, { ok: false }>;
type FailedThreadResult =
  | Extract<Result<MessageThreadResponse>, { ok: false }>
  | Extract<Result<SendMessageResponse>, { ok: false }>
  | Extract<Result<RetryMessageResponse>, { ok: false }>
  | Extract<Result<MessageThreadListResponse>, { ok: false }>
  | Extract<Result<CreateMessageThreadResponse>, { ok: false }>;

function cloneState(state: MessagesState): MessagesState {
  return {
    ...state,
    items: cloneStateSnapshotArray(state.items),
    filters: cloneStateSnapshotArray(state.filters),
    groups: cloneStateSnapshotArray(state.groups),
    unreadBadge: cloneStateSnapshot(state.unreadBadge),
    reservedThreads: cloneStateSnapshotArray(state.reservedThreads),
    ...(state.detailData ? { detailData: cloneStateSnapshot(state.detailData) } : {}),
    detailStatus: cloneStateSnapshot(state.detailStatus),
    ...(state.messageThread ? { messageThread: cloneStateSnapshot(state.messageThread) } : {}),
    messageItems: cloneStateSnapshotArray(state.messageItems),
    ...(state.detailActions ? { detailActions: cloneStateSnapshot(state.detailActions) } : {}),
    ...(state.deliveryPosture ? { deliveryPosture: cloneStateSnapshot(state.deliveryPosture) } : {}),
    searchFilters: cloneStateSnapshotArray(state.searchFilters),
    query: cloneStateSnapshot(state.query),
    composerText: state.composerText,
  };
}

function createRouteParams(state: MessagesState): Record<string, string | number | boolean> | undefined {
  const params: Record<string, string | number | boolean> = {};

  if (state.activeType !== "all") {
    params.type = state.activeType;
  }

  if (state.activeGroupKey !== "all") {
    params.groupKey = state.activeGroupKey;
  }

  if (state.onlyUnread) {
    params.onlyUnread = true;
  }

  if (state.selectedThreadId) {
    params.threadId = state.selectedThreadId;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

function createLastActionMessage(updatedCount: number): string | undefined {
  if (updatedCount <= 0) {
    return undefined;
  }

  return updatedCount === 1 ? "1 notification marked read." : `${updatedCount} notifications marked read.`;
}

function createSelection(selectedItemId: string | undefined): MessagesState["selection"] {
  return {
    ...(selectedItemId !== undefined ? { selectedItemId } : {}),
    selectedItemIds: selectedItemId ? [selectedItemId] : [],
    batchSelectable: false,
  };
}

export function createMessagesController(options: CreateMessagesControllerOptions) {
  const {
    kernel,
    initialState,
    messagesRouteId,
    loginRouteId,
    settingsRouteId,
    requestPath = "/notifications",
    markReadPath = "/notifications/mark-read",
    threadListPath = "/messages/threads",
    threadPath = "/messages/thread",
    markThreadReadPath = "/messages/thread/read",
    sendMessagePath = "/messages/thread/send",
    retryMessagePath = "/messages/thread/retry",
    syncThreadPath = "/messages/thread/sync",
    createThreadPath = "/messages/thread/create",
    authRedirectSource = "messages",
  } = options;
  const store = createStore<MessagesState>({
    ...cloneState(createDefaultMessagesState()),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(routeId, params);
  }

  async function routeToLogin() {
    if (!loginRouteId) {
      return ok(undefined);
    }

    const current = kernel.router.current();
    return kernel.router.replaceRoute(
      loginRouteId,
      createAuthRedirectParams({
        ...(current.ok && current.value?.path ? { path: current.value.path } : {}),
        ...(current.ok && current.value?.params ? { params: current.value.params } : {}),
        ...(authRedirectSource ? { source: authRedirectSource } : {}),
        reason: "auth-required",
      }),
    );
  }

  function hydrateStateFromRoute() {
    const current = kernel.router.current();
    if (!current.ok || !current.value?.params) {
      return;
    }

    const type =
      typeof current.value.params.type === "string" &&
      (current.value.params.type === "all" ||
        current.value.params.type === "system" ||
        current.value.params.type === "business" ||
        current.value.params.type === "campaign" ||
        current.value.params.type === "review")
        ? (current.value.params.type as NotificationType | "all")
        : store.getState().activeType;
    const groupKey =
      typeof current.value.params.groupKey === "string" ? current.value.params.groupKey : store.getState().activeGroupKey;
    const onlyUnread =
      current.value.params.onlyUnread === true || current.value.params.onlyUnread === "true"
        ? true
        : store.getState().onlyUnread;
    const threadId =
      typeof current.value.params.threadId === "string" ? current.value.params.threadId : store.getState().selectedThreadId;

    store.setState({
      activeType: type,
      activeGroupKey: groupKey,
      onlyUnread,
      ...(threadId ? { selectedThreadId: threadId } : {}),
      status: createListStatus(store.getState().status.loadState, {
        firstLoaded: store.getState().status.firstLoaded,
        restoredFromRoute: Boolean(current.value.params.type || current.value.params.groupKey || current.value.params.onlyUnread || threadId),
        restoredQueryKeys: [
          ...(current.value.params.type ? ["type"] : []),
          ...(current.value.params.groupKey ? ["groupKey"] : []),
          ...(current.value.params.onlyUnread ? ["onlyUnread"] : []),
        ],
        ...(threadId ? { restoredSelectionId: threadId } : {}),
      }),
      detailStatus: createDetailStatus(threadId ? "loading" : store.getState().detailStatus.loadState, {
        entryContext: threadId ? "deep_link" : store.getState().detailStatus.entryContext,
        recoveredFromLink: Boolean(threadId),
        ...(threadId ? { requestedDetailId: threadId } : {}),
      }),
    });
  }

  function createRequestQuery(pageOverride?: number) {
    const current = store.getState();
    return {
      page: pageOverride ?? current.query.page,
      pageSize: current.query.pageSize,
      ...(current.activeType !== "all" ? { type: current.activeType } : {}),
      ...(current.activeGroupKey !== "all" ? { groupKey: current.activeGroupKey } : {}),
      ...(current.onlyUnread ? { onlyUnread: true } : {}),
    };
  }

  function applyThreadResponse(response: MessageThreadResponse) {
    const threads = response.threadList?.items ?? store.getState().reservedThreads;
    store.setState({
      loading: false,
      refreshing: false,
      errorText: undefined,
      errorCode: undefined,
      detailData: response.messageThread,
      detailStatus: createDetailStatus("ready", {
        entryContext: store.getState().detailStatus.recoveredFromLink ? "deep_link" : "list",
        recoveredFromLink: store.getState().detailStatus.recoveredFromLink,
        ...(store.getState().detailStatus.requestedDetailId
          ? { requestedDetailId: store.getState().detailStatus.requestedDetailId }
          : {}),
      }),
      messageThread: response.messageThread,
      messageItems: response.messageItems,
      detailActions: response.detailActions,
      deliveryPosture: response.deliveryPosture ?? store.getState().deliveryPosture,
      unreadBadge: response.unreadBadge,
      reservedThreads: threads,
      selectedThreadId: response.messageThread.threadId,
    });
  }

  function applyResponse(response: NotificationListResponse, mode: "replace" | "append") {
    const current = store.getState();
    const threads = response.threadList?.items ?? response.reservedThreads;
    const nextItems =
      mode === "append"
        ? [...current.items, ...response.notificationList.items.filter((item) => !current.items.some((entry) => entry.id === item.id))]
        : response.notificationList.items;
    const selectedThreadId =
      current.selectedThreadId && threads.some((thread) => thread.threadId === current.selectedThreadId)
        ? current.selectedThreadId
        : response.messageThread?.threadId ?? threads[0]?.threadId;
    const selectedItemId =
      nextItems.find((item) => item.id === current.selectedItemId)?.id ??
      response.notificationList.selectedNotificationId ??
      nextItems[0]?.id;

    store.setState({
      ready: true,
      loading: false,
      refreshing: false,
      errorText: undefined,
      errorCode: undefined,
      items: nextItems,
      total: response.notificationList.total,
      hasMore: response.notificationList.hasMore,
      pagination: {
        page: response.notificationList.page,
        pageSize: response.notificationList.pageSize,
        hasMore: response.notificationList.hasMore,
        ...(response.notificationList.total !== undefined ? { total: response.notificationList.total } : {}),
      },
      filters: response.notificationList.filters,
      groups: response.notificationList.groups,
      unreadBadge: response.unreadBadge,
      deliveryPosture: response.deliveryPosture ?? current.deliveryPosture,
      reservedThreads: threads,
      selectedThreadId,
      messageThread:
        selectedThreadId && threads.some((thread) => thread.threadId === selectedThreadId)
          ? current.messageThread
          : undefined,
      messageItems:
        current.messageThread && current.messageThread.threadId === selectedThreadId ? current.messageItems : [],
      detailActions:
        current.messageThread && current.messageThread.threadId === selectedThreadId ? current.detailActions : undefined,
      selectedItemId,
      selection: createSelection(selectedItemId),
      query: {
        ...current.query,
        page: response.notificationList.page,
        pageSize: response.notificationList.pageSize,
      },
      lastActionMessage: current.lastActionMessage,
      status: createListStatus(nextItems.length > 0 ? "ready" : "empty", {
        firstLoaded: nextItems.length > 0,
        restoredFromRoute: current.status.restoredFromRoute,
        ...(current.status.restoredQueryKeys ? { restoredQueryKeys: current.status.restoredQueryKeys } : {}),
        ...(current.status.restoredSelectionId ? { restoredSelectionId: current.status.restoredSelectionId } : {}),
      }),
    });
  }

  async function handleLoadFailure(result: FailedMessagesResult | FailedMarkReadResult | FailedThreadResult) {
    const current = store.getState();
    store.setState({
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      errorCode: result.error.code,
      ready: true,
      status: createListStatus("error", {
        firstLoaded: current.items.length > 0,
        partialData: current.items.length > 0,
        staleData: current.items.length > 0,
        restoredFromRoute: current.status.restoredFromRoute,
        ...(current.status.restoredQueryKeys ? { restoredQueryKeys: current.status.restoredQueryKeys } : {}),
        ...(current.status.restoredSelectionId ? { restoredSelectionId: current.status.restoredSelectionId } : {}),
      }),
      detailStatus: createDetailStatus(
        result.error.code === "NOT_FOUND"
          ? "unavailable"
          : result.error.code === "FORBIDDEN"
            ? "forbidden"
            : result.error.code === "NETWORK_ERROR"
              ? "offline"
              : "error",
        {
          entryContext: current.detailStatus.entryContext,
          recoveredFromLink: current.detailStatus.recoveredFromLink,
          ...(current.detailStatus.requestedDetailId
            ? { requestedDetailId: current.detailStatus.requestedDetailId }
            : {}),
        },
      ),
    });

    if (result.error.code === "UNAUTHORIZED") {
      await routeToLogin();
    }

    return result;
  }

  async function loadThread(threadId: string) {
    const result = await kernel.request.get<MessageThreadResponse>(threadPath, { threadId });
    if (!result.ok) {
      return handleLoadFailure(result);
    }

    applyThreadResponse(result.value);
    return result;
  }

  async function loadThreadList(query: ListMessageThreadsRequest = {}) {
    const requestQuery: Record<string, unknown> = {
      ...(query.page !== undefined ? { page: query.page } : {}),
      ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.onlyUnread !== undefined ? { onlyUnread: query.onlyUnread } : {}),
      ...(query.sort !== undefined ? { sort: query.sort } : {}),
      ...(query.sourceTicketId !== undefined ? { sourceTicketId: query.sourceTicketId } : {}),
    };
    const result = await kernel.request.get<MessageThreadListResponse>(threadListPath, requestQuery);
    if (!result.ok) {
      return handleLoadFailure(result);
    }

    const current = store.getState();
    const nextSelectedThreadId =
      current.selectedThreadId && result.value.threadList.items.some((thread) => thread.threadId === current.selectedThreadId)
        ? current.selectedThreadId
        : result.value.threadList.selectedThreadId ?? result.value.threadList.items[0]?.threadId;

    store.setState({
      reservedThreads: result.value.threadList.items,
      selectedThreadId: nextSelectedThreadId,
      unreadBadge: result.value.unreadBadge,
      deliveryPosture: result.value.deliveryPosture ?? current.deliveryPosture,
    });

    return result;
  }

  async function loadPage(mode: "replace" | "append", page: number) {
    const result = await kernel.request.get<NotificationListResponse>(requestPath, createRequestQuery(page));
    if (!result.ok) {
      return handleLoadFailure(result);
    }

    applyResponse(result.value, mode);
    if (mode === "replace") {
      const selectedThreadId = store.getState().selectedThreadId;
      if (selectedThreadId) {
        await loadThread(selectedThreadId);
      }
    }
    return result;
  }

  async function syncRoute() {
    if (!messagesRouteId) {
      return ok(undefined);
    }

    return kernel.router.toRoute(messagesRouteId, createRouteParams(store.getState()));
  }

  async function markNotifications(notificationIds: string[]) {
    if (notificationIds.length === 0) {
      return ok(undefined);
    }

    const current = store.getState();
    const result = await kernel.request.post<MarkNotificationsReadResponse>(markReadPath, {
      notificationIds,
      page: current.query.page,
      pageSize: current.query.pageSize,
      type: current.activeType,
      groupKey: current.activeGroupKey === "all" ? undefined : current.activeGroupKey,
      onlyUnread: current.onlyUnread,
    });

    if (!result.ok) {
      return handleLoadFailure(result);
    }

    const selectedItemId =
      current.selectedItemId && result.value.notificationList.items.some((item) => item.id === current.selectedItemId)
        ? current.selectedItemId
        : result.value.notificationList.selectedNotificationId ?? result.value.notificationList.items[0]?.id;

    store.setState({
      ready: true,
      loading: false,
      refreshing: false,
      errorText: undefined,
      errorCode: undefined,
      items: result.value.notificationList.items,
      total: result.value.notificationList.total,
      hasMore: result.value.notificationList.hasMore,
      pagination: {
        page: result.value.notificationList.page,
        pageSize: result.value.notificationList.pageSize,
        hasMore: result.value.notificationList.hasMore,
        ...(result.value.notificationList.total !== undefined ? { total: result.value.notificationList.total } : {}),
      },
      filters: result.value.notificationList.filters,
      groups: result.value.notificationList.groups,
      unreadBadge: result.value.unreadBadge,
      selectedItemId,
      selection: createSelection(selectedItemId),
      lastActionMessage: createLastActionMessage(result.value.updatedIds.length),
      query: {
        ...current.query,
        page: result.value.notificationList.page,
        pageSize: result.value.notificationList.pageSize,
      },
      status: createListStatus(result.value.notificationList.items.length > 0 ? "ready" : "empty", {
        firstLoaded: true,
      }),
    });

    return result;
  }

  return {
    store,

    async loadInitial() {
      hydrateStateFromRoute();
      store.setState({
        loading: true,
        errorText: undefined,
        errorCode: undefined,
        lastActionMessage: undefined,
        status: createListStatus("loading", {
          firstLoaded: store.getState().items.length > 0,
          restoredFromRoute: store.getState().status.restoredFromRoute,
          ...(store.getState().status.restoredQueryKeys ? { restoredQueryKeys: store.getState().status.restoredQueryKeys } : {}),
          ...(store.getState().status.restoredSelectionId ? { restoredSelectionId: store.getState().status.restoredSelectionId } : {}),
        }),
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      return loadPage("replace", 1);
    },

    async refresh() {
      store.setState({
        refreshing: true,
        errorText: undefined,
        errorCode: undefined,
        lastActionMessage: undefined,
        status: createListStatus("refreshing", {
          firstLoaded: store.getState().items.length > 0,
          staleData: store.getState().items.length > 0,
        }),
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      return loadPage("replace", 1);
    },

    async loadMore() {
      const current = store.getState();
      if (!current.hasMore || current.loading) {
        return ok(undefined);
      }

      store.setState({
        loading: true,
        lastActionMessage: undefined,
        status: createListStatus("partial", {
          firstLoaded: current.items.length > 0,
          partialData: current.items.length > 0,
          staleData: current.items.length > 0,
        }),
      });
      return loadPage("append", current.query.page + 1);
    },

    selectItem(itemId: string) {
      store.setState({
        selectedItemId: itemId,
        selection: createSelection(itemId),
      });
    },

    selectThread(threadId: string) {
      store.setState({
        selectedThreadId: threadId,
        detailStatus: createDetailStatus("loading", {
          entryContext: "list",
          requestedDetailId: threadId,
        }),
      });
      return loadThread(threadId);
    },

    updateComposerText(value: string) {
      store.setState({
        composerText: value,
      });
    },

    async markThreadRead(threadId?: string) {
      const targetThreadId = threadId ?? store.getState().selectedThreadId;
      if (!targetThreadId) {
        return ok(undefined);
      }

      const request: MarkThreadReadRequest = {
        threadId: targetThreadId,
      };
      const result = await kernel.request.post<MessageThreadResponse>(markThreadReadPath, request);
      if (!result.ok) {
        return handleLoadFailure(result);
      }

      applyThreadResponse(result.value);
      return result;
    },

    async sendMessage(body?: string) {
      const targetThreadId = store.getState().selectedThreadId;
      const nextBody = body ?? store.getState().composerText;
      if (!targetThreadId || !nextBody.trim()) {
        return ok(undefined);
      }

      const request: SendMessageRequest = {
        threadId: targetThreadId,
        body: nextBody.trim(),
      };
      const result = await kernel.request.post<SendMessageResponse>(sendMessagePath, request);
      if (!result.ok) {
        return handleLoadFailure(result);
      }

      store.setState({
        composerText: "",
      });
      applyThreadResponse({
        messageThread: result.value.messageThread,
        messageItems: [...store.getState().messageItems, result.value.messageItem],
        detailActions: result.value.detailActions,
        unreadBadge: result.value.unreadBadge,
        ...(result.value.threadList ? { threadList: result.value.threadList } : {}),
      });
      return result;
    },

    async retryMessage(messageId: string, threadId?: string) {
      const targetThreadId = threadId ?? store.getState().selectedThreadId;
      if (!targetThreadId) {
        return ok(undefined);
      }

      const request: RetryMessageRequest = {
        threadId: targetThreadId,
        messageId,
      };
      const result = await kernel.request.post<RetryMessageResponse>(retryMessagePath, request);
      if (!result.ok) {
        return handleLoadFailure(result);
      }

      const currentItems = store.getState().messageItems.filter((item) => item.messageId !== result.value.messageItem.messageId);
      applyThreadResponse({
        messageThread: result.value.messageThread,
        messageItems: [...currentItems, result.value.messageItem],
        detailActions: result.value.detailActions,
        unreadBadge: result.value.unreadBadge,
        ...(result.value.threadList ? { threadList: result.value.threadList } : {}),
      });
      return result;
    },

    async syncThread(threadId?: string, cursor?: string) {
      const targetThreadId = threadId ?? store.getState().selectedThreadId;
      if (!targetThreadId) {
        return ok(undefined);
      }

      const request: SyncMessageThreadRequest = {
        threadId: targetThreadId,
        ...(cursor ? { cursor } : {}),
      };
      const result = await kernel.request.get<MessageThreadResponse>(syncThreadPath, {
        threadId: request.threadId,
        ...(request.cursor ? { cursor: request.cursor } : {}),
      });
      if (!result.ok) {
        return handleLoadFailure(result);
      }

      if (result.value.changed !== false) {
        applyThreadResponse(result.value);
      } else {
        store.setState({
          unreadBadge: result.value.unreadBadge,
          deliveryPosture: result.value.deliveryPosture ?? store.getState().deliveryPosture,
          reservedThreads: result.value.threadList?.items ?? store.getState().reservedThreads,
        });
      }
      return result;
    },

    async createThread(request: CreateMessageThreadRequest) {
      const result = await kernel.request.post<CreateMessageThreadResponse>(createThreadPath, request);
      if (!result.ok) {
        return handleLoadFailure(result);
      }

      store.setState({
        reservedThreads: result.value.threadList.items,
        unreadBadge: result.value.unreadBadge,
        deliveryPosture: result.value.deliveryPosture ?? store.getState().deliveryPosture,
        selectedThreadId: result.value.messageThread.threadId,
        composerText: "",
      });
      await loadThread(result.value.messageThread.threadId);
      return result;
    },

    async refreshThreadList(query: ListMessageThreadsRequest = {}) {
      return loadThreadList(query);
    },

    async loadSupportThreadByTicket(ticketId: string) {
      const listResult = await loadThreadList({
        type: "customer_service",
        sourceTicketId: ticketId,
      });
      if (!listResult.ok) {
        return listResult;
      }

      const targetThreadId = listResult.value.threadList.items[0]?.threadId;
      if (!targetThreadId) {
        return ok(undefined);
      }
      return loadThread(targetThreadId);
    },

    async applyType(type: NotificationType | "all") {
      store.setState({
        activeType: type,
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      await syncRoute();
      return this.loadInitial();
    },

    async applyGroup(groupKey: string) {
      store.setState({
        activeGroupKey: groupKey,
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      await syncRoute();
      return this.loadInitial();
    },

    async toggleUnreadOnly() {
      store.setState({
        onlyUnread: !store.getState().onlyUnread,
        query: {
          ...store.getState().query,
          page: 1,
        },
      });
      await syncRoute();
      return this.loadInitial();
    },

    async markSelectedRead() {
      const selectedItemId = store.getState().selectedItemId;
      return markNotifications(selectedItemId ? [selectedItemId] : []);
    },

    async markVisibleRead() {
      return markNotifications(
        store
          .getState()
          .items.filter((item) => !item.receipt.read)
          .map((item) => item.id),
      );
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
