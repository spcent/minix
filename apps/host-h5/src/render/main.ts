import { bootstrapHostH5Runtime } from "../manifest/app.manifest";
import { createHostH5PageEntry } from "../registrations/page-entries";
import {
  activateHostH5Page,
  renderHostH5Page,
  resolveHostH5PageKey,
  subscribeHostH5Pages,
  type HostH5PageEntry,
  type HostH5PageKey,
} from "./page-registry";

async function main() {
  const rootElement = document.getElementById("app");
  if (!rootElement) {
    return;
  }
  const root = rootElement;
  const runtime = await bootstrapHostH5Runtime();
  let activePageKey: HostH5PageKey | null = null;
  let activeEntry: HostH5PageEntry | null = null;
  let syncQueue = Promise.resolve();

  async function syncCurrentPage() {
    const pageKey = resolveHostH5PageKey(window.location.pathname);
    if (activePageKey !== pageKey || !activeEntry) {
      activePageKey = pageKey;
      activeEntry = createHostH5PageEntry(runtime, pageKey);
      await activateHostH5Page(activeEntry);
    }

    if (!activeEntry) {
      return;
    }

    renderHostH5Page({
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

  subscribeHostH5Pages(runtime, requestSync);
  window.addEventListener("popstate", requestSync);

  requestSync();
  await syncQueue;
}

void main();
