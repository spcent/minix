export const APP_ROUTE_IDS = {
  home: "home.index",
  login: "auth.login",
  overview: "overview.index",
  items: "items.list",
  account: "account.index",
  feed: "feed.index",
  mediaTools: "media-tools.workspace",
  messages: "messages.index",
  catalog: "catalog.index",
  novelDetail: "novel.detail",
  toc: "toc.index",
  reader: "reader.chapter",
  bookshelf: "bookshelf.index",
  membership: "membership.center",
  settings: "settings.index",
} as const;

export type AppRouteId = typeof APP_ROUTE_IDS[keyof typeof APP_ROUTE_IDS];

export type AppRouteMap = Record<AppRouteId, string>;

export function resolveAppRoute(routeMap: AppRouteMap, routeId: AppRouteId): string {
  return routeMap[routeId];
}
