import type { SettingsPageModel, Store } from "@minix/core";
import type { AuthPageState } from "@minix/feature-auth";
import type { BookshelfState } from "@minix/feature-bookshelf";
import type { CatalogState } from "@minix/feature-catalog";
import type { FeedState } from "@minix/feature-feed";
import type { NovelDetailState } from "@minix/feature-novel-detail";
import type { ReaderState } from "@minix/feature-reader";
import type { SubscriptionState } from "@minix/feature-subscription";
import type { TocState } from "@minix/feature-toc";

import type { NovelH5Runtime } from "../manifest/app.manifest";

export type NovelH5PageKey = keyof NovelH5Runtime["registry"];
export type NovelH5PageEntry = ReturnType<NovelH5Runtime["registry"][NovelH5PageKey]["createEntry"]>;

export interface NovelH5PageRenderContext {
  root: HTMLElement;
  runtime: NovelH5Runtime;
  pageKey: NovelH5PageKey;
  entry: NovelH5PageEntry;
  sync(): void;
}

export interface PageWithStore {
  store: Store<unknown>;
}

export interface PageEntryWithShow {
  onShow(): Promise<unknown>;
}

export type NovelH5PageState =
  | AuthPageState
  | BookshelfState
  | CatalogState
  | FeedState
  | NovelDetailState
  | ReaderState
  | SettingsPageModel
  | SubscriptionState
  | TocState;

export function getEntryState(entry: NovelH5PageEntry): NovelH5PageState {
  const maybeStore = entry.controller as Partial<PageWithStore>;
  if (maybeStore.store) {
    return maybeStore.store.getState() as NovelH5PageState;
  }

  return {} as NovelH5PageState;
}
