import { bootstrapNovelH5Runtime } from "../manifest/app.manifest";
import { createNovelH5PageEntry } from "../registrations/page-entries";
import {
  activateNovelH5Page,
  renderNovelH5Page,
  resolveNovelH5PageKey,
  subscribeNovelH5Pages,
  type NovelH5PageEntry,
  type NovelH5PageKey,
} from "./page-registry";

async function main() {
  const rootElement = document.getElementById("app");
  if (!rootElement) {
    return;
  }

  const root = rootElement;
  const runtime = await bootstrapNovelH5Runtime();
  let activePageKey: NovelH5PageKey | null = null;
  let activeRouteSignature: string | null = null;
  let activeEntry: NovelH5PageEntry | null = null;
  let syncQueue = Promise.resolve();

  function resolveRouteSignature(): string {
    const current = runtime.kernel.router.current();
    if (!current.ok || !current.value) {
      return `${window.location.pathname}${window.location.search}`;
    }

    return JSON.stringify({
      path: current.value.path,
      params: current.value.params ?? null,
    });
  }

  async function syncCurrentPage() {
    const pageKey = resolveNovelH5PageKey(window.location.pathname);
    const routeSignature = resolveRouteSignature();

    if (activePageKey !== pageKey || activeRouteSignature !== routeSignature || !activeEntry) {
      activePageKey = pageKey;
      activeRouteSignature = routeSignature;
      activeEntry = createNovelH5PageEntry(runtime, pageKey);
      await activateNovelH5Page(activeEntry);
    }

    if (!activeEntry) {
      return;
    }

    renderNovelH5Page({
      root,
      runtime,
      pageKey,
      entry: activeEntry,
      sync: requestSync,
    });
  }

  function requestSync() {
    syncQueue = syncQueue
      .catch((error: unknown) => {
        console.error(error);
      })
      .then(syncCurrentPage);
  }

  subscribeNovelH5Pages(runtime, requestSync);
  window.addEventListener("popstate", requestSync);

  requestSync();
  await syncQueue;
}

void main();
