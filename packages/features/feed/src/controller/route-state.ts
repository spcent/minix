import {
  createListStatus,
  resolveSearchDomainParam,
  resolveSearchModeParam,
  type AppKernel,
  type Store,
} from "@minix/core";
import type { SearchDomain, SearchMode } from "@minix/contracts";

import type { FeedState } from "../model";
import { createFeedSelection } from "./projection";

export function hydrateFeedStateFromRoute(kernel: AppKernel, store: Store<FeedState>) {
  const current = kernel.router.current();
  if (!current.ok || !current.value?.params) {
    return;
  }

  const keyword = typeof current.value.params.keyword === "string" ? current.value.params.keyword : store.getState().query.keyword;
  const tag = typeof current.value.params.tag === "string" ? current.value.params.tag : store.getState().activeTag;
  const mode = resolveSearchModeParam(current.value.params.mode, store.getState().query.mode);
  const domain = resolveSearchDomainParam(current.value.params.domain, store.getState().query.domain);
  const sortKey =
    typeof current.value.params.sort === "string" && current.value.params.sort.length > 0
      ? current.value.params.sort
      : store.getState().query.sortKey;
  const selectedItemId =
    typeof current.value.params.selectedItemId === "string"
      ? current.value.params.selectedItemId
      : store.getState().selectedItemId;

  store.setState({
    query: {
      ...store.getState().query,
      keyword,
      mode,
      domain,
      sortKey,
    },
    activeTag: tag,
    selectedItemId,
    selection: createFeedSelection(selectedItemId),
    status: createListStatus(store.getState().status.loadState, {
      firstLoaded: store.getState().status.firstLoaded,
      restoredFromRoute: Boolean(keyword || (tag && tag !== "all") || mode !== store.getState().query.mode || domain !== store.getState().query.domain || sortKey !== store.getState().query.sortKey || selectedItemId),
      restoredQueryKeys: [
        ...(keyword ? ["keyword"] : []),
        ...(tag && tag !== "all" ? ["tag"] : []),
        ...(mode !== "global" ? ["mode"] : []),
        ...(domain !== "feed" ? ["domain"] : []),
        ...(sortKey !== "recommended" ? ["sort"] : []),
      ],
      ...(selectedItemId ? { restoredSelectionId: selectedItemId } : {}),
    }),
  });
}

export function createFeedRequestQuery(state: FeedState, page = state.query.page) {
  return {
    page,
    pageSize: state.query.pageSize,
    ...(state.query.keyword ? { keyword: state.query.keyword } : {}),
    ...(state.query.mode !== "global" ? { mode: state.query.mode } : {}),
    ...(state.query.domain !== "feed" ? { domain: state.query.domain } : {}),
    ...(state.query.sortKey !== "recommended" ? { sort: state.query.sortKey } : {}),
    ...(state.activeTag && state.activeTag !== "all" ? { tag: state.activeTag } : {}),
  };
}

export function createFeedRouteParams(overrides: {
  keyword: string | undefined;
  tag: string | undefined;
  mode: SearchMode | undefined;
  domain: SearchDomain | undefined;
  sortKey: string | undefined;
  selectedItemId: string | undefined;
}): Record<string, string | number | boolean> | undefined {
  const params: Record<string, string | number | boolean> = {};

  if (overrides.keyword) {
    params.keyword = overrides.keyword;
  }

  if (overrides.tag && overrides.tag !== "all") {
    params.tag = overrides.tag;
  }

  if (overrides.mode && overrides.mode !== "global") {
    params.mode = overrides.mode;
  }

  if (overrides.domain && overrides.domain !== "feed") {
    params.domain = overrides.domain;
  }

  if (overrides.sortKey && overrides.sortKey !== "recommended") {
    params.sort = overrides.sortKey;
  }

  if (overrides.selectedItemId) {
    params.selectedItemId = overrides.selectedItemId;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}
