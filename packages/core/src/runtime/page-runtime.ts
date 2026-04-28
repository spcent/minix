import type { Store } from "../store/state";

export interface StoreBackedPage {
  store: Store<unknown>;
}

export interface ShowablePageEntry {
  onShow(): Promise<unknown> | unknown;
}

export function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function resolvePageKeyFromRouteMap<TKey extends string>(
  pathname: string,
  routes: Record<TKey, string>,
  fallbackKey: TKey,
): TKey {
  const normalizedPath = normalizeRoutePath(pathname);
  const pageEntry = Object.entries(routes).find(([, routePath]) => normalizeRoutePath(routePath as string) === normalizedPath);

  return (pageEntry?.[0] ?? fallbackKey) as TKey;
}

export function isStoreBackedPage(value: unknown): value is StoreBackedPage {
  return Boolean(value) && typeof (value as StoreBackedPage).store?.subscribe === "function";
}

export function isShowablePageEntry(value: unknown): value is ShowablePageEntry {
  return Boolean(value) && typeof (value as ShowablePageEntry).onShow === "function";
}

export async function activateShowablePageEntry(entry: unknown): Promise<void> {
  if (!isShowablePageEntry(entry)) {
    return;
  }

  await entry.onShow();
}

export function subscribeStoreBackedPages(pages: Iterable<unknown>, sync: () => void): Array<() => void> {
  return Array.from(pages)
    .filter(isStoreBackedPage)
    .map((page) => page.store.subscribe(() => sync()));
}
