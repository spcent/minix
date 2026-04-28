import type { ChapterListResponse } from "@minix/contracts";
import {
  activateShowablePageEntry,
  resolvePageKeyFromRouteMap,
  subscribeStoreBackedPages,
  type SettingsPageModel,
} from "@minix/core";
import type { AccountState } from "@minix/feature-account";
import type { AuthPageState } from "@minix/feature-auth";
import type { BookshelfState } from "@minix/feature-bookshelf";
import type { CatalogState } from "@minix/feature-catalog";
import type { FeedbackState } from "@minix/feature-feedback";
import type { FeedState } from "@minix/feature-feed";
import type { MessagesState } from "@minix/feature-messages";
import type { MediaToolsState } from "@minix/feature-media-tools";
import type { NovelDetailState } from "@minix/feature-novel-detail";
import type { ReaderState } from "@minix/feature-reader";
import type { SubscriptionState } from "@minix/feature-subscription";
import type { TocState } from "@minix/feature-toc";

import type { NovelH5Runtime } from "../manifest/app.manifest";
import { NOVEL_H5_ROUTES } from "../manifest/routes";
import { renderAccountPage } from "./pages/account";
import { renderBookshelfPage } from "./pages/bookshelf";
import { renderCatalogPage } from "./pages/catalog";
import { renderFeedbackPage } from "./pages/feedback";
import { renderFeedPage } from "./pages/feed";
import { renderHomePage } from "./pages/home";
import { renderLoginPage } from "./pages/login";
import { renderMediaToolsPage } from "./pages/media-tools";
import { renderMembershipPage } from "./pages/membership";
import { renderMessagesPage } from "./pages/messages";
import { renderNovelDetailPage } from "./pages/novel-detail";
import { renderReaderPage } from "./pages/reader";
import { renderSettingsPage } from "./pages/settings";
import { renderTocPage } from "./pages/toc";
import { renderReaderTocPanelBody } from "./components/reader-panels";
import { bindClicks, bindInputValue, queryElement, readDataValue } from "./dom-bindings";
import { ensureNovelH5Styles } from "./theme/styles";
import {
  getEntryState,
  type NovelH5PageEntry,
  type NovelH5PageKey,
  type NovelH5PageRenderContext,
} from "./types";

export type { NovelH5PageEntry, NovelH5PageKey } from "./types";

interface NovelH5PageRenderer {
  render(context: NovelH5PageRenderContext): void;
}

type ReaderPanelKey = "toc" | "display" | "access";

const readerUiState: {
  openPanel: ReaderPanelKey | null;
  tocCache: Map<string, ChapterListResponse>;
} = {
  openPanel: null,
  tocCache: new Map<string, ChapterListResponse>(),
};

function renderByPageKey(context: NovelH5PageRenderContext): string {
  const state = getEntryState(context.entry);

  switch (context.pageKey) {
    case "home":
      return renderHomePage(context, state as CatalogState);
    case "login":
      return renderLoginPage(state as AuthPageState);
    case "catalog":
      return renderCatalogPage(context, state as CatalogState);
    case "feed":
      return renderFeedPage(state as FeedState);
    case "account":
      return renderAccountPage(state as AccountState);
    case "feedback":
      return renderFeedbackPage(state as FeedbackState);
    case "messages":
      return renderMessagesPage(state as MessagesState);
    case "mediaTools":
      return renderMediaToolsPage(state as MediaToolsState);
    case "novelDetail":
      return renderNovelDetailPage(context, state as NovelDetailState);
    case "toc":
      return renderTocPage(context, state as TocState);
    case "reader":
      return renderReaderPage(context, state as ReaderState);
    case "bookshelf":
      return renderBookshelfPage(context, state as BookshelfState);
    case "membership":
      return renderMembershipPage(context, state as SubscriptionState);
    case "settings":
      return renderSettingsPage(state as SettingsPageModel);
    default:
      return renderHomePage(context, state as CatalogState);
  }
}

async function invokeAction(context: NovelH5PageRenderContext, target: "entry" | "controller", action: string, value?: string) {
  const receiver = target === "entry" ? (context.entry as Record<string, unknown>) : (context.entry.controller as Record<string, unknown>);
  const handler = receiver[action];

  if (typeof handler !== "function") {
    return;
  }

  if (value !== undefined) {
    await (handler as (arg: string) => Promise<unknown>)(value);
    return;
  }

  await (handler as () => Promise<unknown>)();
}

function bindRouteLinks(context: NovelH5PageRenderContext) {
  bindClicks(context.root, "[data-route-path]", async (element, event) => {
    event.preventDefault();
    const routePath = readDataValue(element, "routePath");
    if (!routePath) {
      return;
    }

    await context.runtime.kernel.router.to(routePath);
    context.sync();
  });
}

function bindActionButtons(context: NovelH5PageRenderContext, scope: ParentNode = context.root) {
  bindClicks<HTMLButtonElement>(scope, "[data-target][data-action]", async (button) => {
    const target = readDataValue(button, "target");
    const action = readDataValue(button, "action");

    if ((target !== "entry" && target !== "controller") || !action) {
      return;
    }

    await invokeAction(context, target, action, readDataValue(button, "value"));
    context.sync();
  });
}

function closeReaderPanels(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-ui-panel]").forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
}

function openReaderPanel(root: HTMLElement, panelKey: ReaderPanelKey) {
  closeReaderPanels(root);
  const panel = queryElement<HTMLElement>(root, `[data-ui-panel="${panelKey}"]`);
  if (!panel) {
    return;
  }

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
}

async function loadReaderTocPanel(context: NovelH5PageRenderContext, state: ReaderState) {
  const novelId = state.novelId ?? state.chapter?.novelId;
  const body = queryElement<HTMLElement>(context.root, "[data-reader-panel-body='toc']");
  if (!novelId || !body) {
    return;
  }

  const cached = readerUiState.tocCache.get(novelId);
  if (cached) {
    body.innerHTML = renderReaderTocPanelBody(cached, state);
    bindActionButtons(context, body);
  }

  if (!cached) {
    body.innerHTML = `<div class="nh-reader-panel-loading">Loading chapter list...</div>`;
  }
  const result = await context.runtime.kernel.request.get<ChapterListResponse>("/chapters", { novelId });
  if (!result.ok) {
    if (!cached) {
      body.innerHTML = `<div class="nh-reader-panel-loading">${result.error.message}</div>`;
    }
    return;
  }

  readerUiState.tocCache.set(novelId, result.value);
  body.innerHTML = renderReaderTocPanelBody(result.value, state);
  bindActionButtons(context, body);
}

function bindReaderProgressInput(context: NovelH5PageRenderContext) {
  bindInputValue<HTMLInputElement>(context.root, "[data-input='reader-progress']", (rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    void invokeAction(context, "controller", "setProgress", String(value / 100));
  });
}

function bindReaderPanels(context: NovelH5PageRenderContext) {
  if (context.pageKey !== "reader") {
    readerUiState.openPanel = null;
    return;
  }

  const state = getEntryState(context.entry) as ReaderState;

  bindClicks(context.root, "[data-ui-open]", async (button) => {
    const panelKey = readDataValue(button, "uiOpen") as ReaderPanelKey | undefined;
    if (!panelKey) {
      return;
    }

    readerUiState.openPanel = panelKey;
    openReaderPanel(context.root, panelKey);

    if (panelKey === "toc") {
      await loadReaderTocPanel(context, state);
    }
  });

  bindClicks(context.root, "[data-ui-close]", () => {
    readerUiState.openPanel = null;
    closeReaderPanels(context.root);
  });

  bindClicks(context.root, "[data-ui-panel]", (panel, event) => {
    if (event.target !== panel) {
      return;
    }

    readerUiState.openPanel = null;
    closeReaderPanels(context.root);
  });

  bindReaderProgressInput(context);

  if (readerUiState.openPanel) {
    openReaderPanel(context.root, readerUiState.openPanel);
    if (readerUiState.openPanel === "toc") {
      void loadReaderTocPanel(context, state);
    }
  }
}

function bindCatalogKeywordInput(context: NovelH5PageRenderContext) {
  const input = bindInputValue<HTMLInputElement>(context.root, "[data-input='catalog-keyword']", (value) => {
    void invokeAction(context, "controller", "setKeyword", value);
  });
  if (!input) {
    return;
  }

  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    await invokeAction(context, "controller", "submitSearch");
    context.sync();
  });
}

function bindFeedbackDraftInputs(context: NovelH5PageRenderContext) {
  if (context.pageKey !== "feedback") {
    return;
  }

  const titleInput = queryElement<HTMLInputElement>(context.root, "[data-feedback-input='title']");
  const descriptionInput = queryElement<HTMLTextAreaElement>(context.root, "[data-feedback-input='description']");
  if (!titleInput || !descriptionInput) {
    return;
  }

  const applyDraftValues = () => {
    context.runtime.pages.feedback.updateValues({
      title: titleInput.value,
      description: descriptionInput.value,
    });
  };

  titleInput.addEventListener("input", applyDraftValues);
  descriptionInput.addEventListener("input", applyDraftValues);
}

export function resolveNovelH5PageKey(pathname: string): NovelH5PageKey {
  return resolvePageKeyFromRouteMap(pathname, NOVEL_H5_ROUTES, "home") as NovelH5PageKey;
}

export async function activateNovelH5Page(entry: NovelH5PageEntry) {
  await activateShowablePageEntry(entry);
}

export function subscribeNovelH5Pages(runtime: NovelH5Runtime, sync: () => void) {
  return subscribeStoreBackedPages(Object.values(runtime.pages), sync);
}

export function renderNovelH5Page(context: NovelH5PageRenderContext) {
  ensureNovelH5Styles();
  context.root.innerHTML = renderByPageKey(context);
  bindRouteLinks(context);
  bindActionButtons(context);
  bindCatalogKeywordInput(context);
  bindFeedbackDraftInputs(context);
  bindReaderPanels(context);
}

export const novelH5PageRenderers: Record<NovelH5PageKey, NovelH5PageRenderer> = {
  home: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  login: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  catalog: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  feed: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  account: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  feedback: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  messages: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  mediaTools: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  novelDetail: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  toc: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  reader: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  bookshelf: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  membership: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
  settings: {
    render(context) {
      renderNovelH5Page(context);
    },
  },
};
