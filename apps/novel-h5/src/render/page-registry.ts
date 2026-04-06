import type { ChapterListResponse } from "@minix/contracts";
import type { SettingsPageModel } from "@minix/core";
import type { AuthPageState } from "@minix/feature-auth";
import type { BookshelfState } from "@minix/feature-bookshelf";
import type { CatalogState } from "@minix/feature-catalog";
import type { NovelDetailState } from "@minix/feature-novel-detail";
import type { ReaderState } from "@minix/feature-reader";
import type { SubscriptionState } from "@minix/feature-subscription";
import type { TocState } from "@minix/feature-toc";

import type { NovelH5Runtime } from "../manifest/app.manifest";
import { NOVEL_H5_ROUTES } from "../manifest/routes";
import { renderBookshelfPage } from "./pages/bookshelf";
import { renderCatalogPage } from "./pages/catalog";
import { renderHomePage } from "./pages/home";
import { renderLoginPage } from "./pages/login";
import { renderMembershipPage } from "./pages/membership";
import { renderNovelDetailPage } from "./pages/novel-detail";
import { renderReaderPage } from "./pages/reader";
import { renderSettingsPage } from "./pages/settings";
import { renderTocPage } from "./pages/toc";
import { renderReaderTocPanelBody } from "./components/reader-panels";
import { ensureNovelH5Styles } from "./theme/styles";
import {
  getEntryState,
  type NovelH5PageEntry,
  type NovelH5PageKey,
  type NovelH5PageRenderContext,
  type PageEntryWithShow,
  type PageWithStore,
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

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isStoreBackedPage(value: unknown): value is PageWithStore {
  return typeof value === "object" && value !== null && "store" in value;
}

function isShowableEntry(value: unknown): value is PageEntryWithShow {
  return typeof value === "object" && value !== null && "onShow" in value && typeof value.onShow === "function";
}

function renderByPageKey(context: NovelH5PageRenderContext): string {
  const state = getEntryState(context.entry);

  switch (context.pageKey) {
    case "home":
      return renderHomePage(context, state as CatalogState);
    case "login":
      return renderLoginPage(state as AuthPageState);
    case "catalog":
      return renderCatalogPage(context, state as CatalogState);
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
  context.root.querySelectorAll<HTMLElement>("[data-route-path]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      const routePath = element.dataset.routePath;
      if (!routePath) {
        return;
      }

      await context.runtime.kernel.router.to(routePath);
      context.sync();
    });
  });
}

function bindActionButtons(context: NovelH5PageRenderContext, scope: ParentNode = context.root) {
  scope.querySelectorAll<HTMLButtonElement>("[data-target][data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.target;
      const action = button.dataset.action;

      if ((target !== "entry" && target !== "controller") || !action) {
        return;
      }

      await invokeAction(context, target, action, button.dataset.value);
      context.sync();
    });
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
  const panel = root.querySelector<HTMLElement>(`[data-ui-panel="${panelKey}"]`);
  if (!panel) {
    return;
  }

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
}

async function loadReaderTocPanel(context: NovelH5PageRenderContext, state: ReaderState) {
  const novelId = state.novelId ?? state.chapter?.novelId;
  const body = context.root.querySelector<HTMLElement>("[data-reader-panel-body='toc']");
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
  const input = context.root.querySelector<HTMLInputElement>("[data-input='reader-progress']");
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    const value = Number(input.value);
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

  context.root.querySelectorAll<HTMLElement>("[data-ui-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      const panelKey = button.dataset.uiOpen as ReaderPanelKey | undefined;
      if (!panelKey) {
        return;
      }

      readerUiState.openPanel = panelKey;
      openReaderPanel(context.root, panelKey);

      if (panelKey === "toc") {
        await loadReaderTocPanel(context, state);
      }
    });
  });

  context.root.querySelectorAll<HTMLElement>("[data-ui-close]").forEach((button) => {
    button.addEventListener("click", () => {
      readerUiState.openPanel = null;
      closeReaderPanels(context.root);
    });
  });

  context.root.querySelectorAll<HTMLElement>("[data-ui-panel]").forEach((panel) => {
    panel.addEventListener("click", (event) => {
      if (event.target !== panel) {
        return;
      }

      readerUiState.openPanel = null;
      closeReaderPanels(context.root);
    });
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
  const input = context.root.querySelector<HTMLInputElement>("[data-input='catalog-keyword']");
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    void invokeAction(context, "controller", "setKeyword", input.value);
  });

  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    await invokeAction(context, "controller", "submitSearch");
    context.sync();
  });
}

export function resolveNovelH5PageKey(pathname: string): NovelH5PageKey {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === NOVEL_H5_ROUTES.home) {
    return "home";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.login) {
    return "login";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.catalog) {
    return "catalog";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.novelDetail) {
    return "novelDetail";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.toc) {
    return "toc";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.reader) {
    return "reader";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.bookshelf) {
    return "bookshelf";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.membership) {
    return "membership";
  }

  if (normalizedPath === NOVEL_H5_ROUTES.settings) {
    return "settings";
  }

  return "home";
}

export async function activateNovelH5Page(entry: NovelH5PageEntry) {
  if (!isShowableEntry(entry)) {
    return;
  }

  await entry.onShow();
}

export function subscribeNovelH5Pages(runtime: NovelH5Runtime, sync: () => void) {
  return Object.values(runtime.pages)
    .filter(isStoreBackedPage)
    .map((page) => page.store.subscribe(sync));
}

export function renderNovelH5Page(context: NovelH5PageRenderContext) {
  ensureNovelH5Styles();
  context.root.innerHTML = renderByPageKey(context);
  bindRouteLinks(context);
  bindActionButtons(context);
  bindCatalogKeywordInput(context);
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
