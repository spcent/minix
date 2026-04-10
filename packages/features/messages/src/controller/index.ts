import {
  createAuthRedirectParams,
  createStore,
  ok,
  type AppKernel,
  type Result,
} from "@minix/core";
import type {
  AppRouteId,
  MarkNotificationsReadResponse,
  MarkThreadReadRequest,
  MessageThreadResponse,
  NotificationListResponse,
  NotificationType,
  SendMessageRequest,
  SendMessageResponse,
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
  threadPath?: string;
  markThreadReadPath?: string;
  sendMessagePath?: string;
  authRedirectSource?: string;
}

type FailedMessagesResult = Extract<Result<NotificationListResponse>, { ok: false }>;
type FailedMarkReadResult = Extract<Result<MarkNotificationsReadResponse>, { ok: false }>;
type FailedThreadResult = Extract<Result<MessageThreadResponse>, { ok: false }> | Extract<Result<SendMessageResponse>, { ok: false }>;

function cloneState(state: MessagesState): MessagesState {
  return {
    ...state,
    items: state.items.map((item) => structuredClone(item)),
    filters: state.filters.map((group) => structuredClone(group)),
    groups: state.groups.map((group) => ({ ...group })),
    unreadBadge: structuredClone(state.unreadBadge),
    reservedThreads: state.reservedThreads.map((thread) => structuredClone(thread)),
    ...(state.detailData ? { detailData: structuredClone(state.detailData) } : {}),
    detailStatus: { ...state.detailStatus },
    ...(state.messageThread ? { messageThread: structuredClone(state.messageThread) } : {}),
    messageItems: state.messageItems.map((item) => structuredClone(item)),
    ...(state.detailActions ? { detailActions: { ...state.detailActions } } : {}),
    searchFilters: state.searchFilters.map((group) => structuredClone(group)),
    query: { ...state.query },
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

function createListStatus(loadState: MessagesState["status"]["loadState"], hasItems: boolean): MessagesState["status"] {
  return {
    loadState,
    firstLoaded: hasItems,
    retryable: true,
    partialData: false,
    stickyHeaderEnabled: false,
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
    threadPath = "/messages/thread",
    markThreadReadPath = "/messages/thread/read",
    sendMessagePath = "/messages/thread/send",
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

    store.setState({
      activeType: type,
      activeGroupKey: groupKey,
      onlyUnread,
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
    store.setState({
      loading: false,
      refreshing: false,
      errorText: undefined,
      errorCode: undefined,
      detailData: response.messageThread,
      detailStatus: {
        ...store.getState().detailStatus,
        loadState: "ready",
        entryContext: "list",
        refreshable: true,
      },
      messageThread: response.messageThread,
      messageItems: response.messageItems,
      detailActions: response.detailActions,
      unreadBadge: response.unreadBadge,
      selectedThreadId: response.messageThread.threadId,
    });
  }

  function applyResponse(response: NotificationListResponse, mode: "replace" | "append") {
    const current = store.getState();
    const nextItems =
      mode === "append"
        ? [...current.items, ...response.notificationList.items.filter((item) => !current.items.some((entry) => entry.id === item.id))]
        : response.notificationList.items;
    const selectedThreadId =
      current.selectedThreadId && response.reservedThreads.some((thread) => thread.threadId === current.selectedThreadId)
        ? current.selectedThreadId
        : response.messageThread?.threadId ?? response.reservedThreads[0]?.threadId;
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
      reservedThreads: response.reservedThreads,
      selectedThreadId,
      messageThread:
        selectedThreadId && response.reservedThreads.some((thread) => thread.threadId === selectedThreadId)
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
      status: createListStatus(nextItems.length > 0 ? "ready" : "empty", nextItems.length > 0),
    });
  }

  async function handleLoadFailure(result: FailedMessagesResult | FailedMarkReadResult | FailedThreadResult) {
    store.setState({
      loading: false,
      refreshing: false,
      errorText: result.error.message,
      errorCode: result.error.code,
      ready: true,
      status: createListStatus("error", store.getState().items.length > 0),
      detailStatus: {
        ...store.getState().detailStatus,
        loadState: "error",
      },
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
      status: createListStatus(result.value.notificationList.items.length > 0 ? "ready" : "empty", result.value.notificationList.items.length > 0),
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
        status: createListStatus("loading", store.getState().items.length > 0),
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
        status: createListStatus("refreshing", store.getState().items.length > 0),
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
        status: createListStatus("appending", current.items.length > 0),
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
        detailStatus: {
          ...store.getState().detailStatus,
          loadState: "loading",
          entryContext: "list",
        },
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
      });
      return result;
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
